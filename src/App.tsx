import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FORMATS, type FormatId } from "./formats";
import { Preview, type PreviewStats } from "./Preview";
import { Editor } from "./editor/Editor";
import { emptyDoc } from "./tiptap";
import { clearImages } from "./imageStore";
import {
  clearCrashCache,
  downloadNewsletter,
  hasCrashCache,
  isAbortError,
  isFileSystemAccessSupported,
  openNewsletterFile,
  pickNewsletterFile,
  readCrashCache,
  saveNewsletterAs,
  writeCrashCache,
  writeToHandle,
} from "./fileio";
import {
  newId,
  type Block,
  type BlockPatch,
  type BlockType,
  type Newsletter,
  type Publication,
} from "./types";

type SaveState = "saved" | "dirty" | "saving" | "error";

function makeBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "article":
      return { id, type, headline: "", byline: "", body: emptyDoc };
    case "advice":
      return {
        id,
        type,
        title: "Ask the Editor",
        items: [{ id: newId("i"), question: "", answer: "" }],
      };
    case "photoset":
      return { id, type, photos: [] };
    case "ad":
      return { id, type, imageId: null, caption: "" };
    case "puzzle":
      return { id, type, title: "", imageId: null, caption: "" };
  }
}

const seed: Newsletter = {
  publication: {
    name: "The Ledgerline Letter",
    tagline: "Printed at Home",
    issueLabel: "Vol. I — No. 1",
    date: "June 2026",
  },
  blocks: [
    {
      id: newId(),
      type: "article",
      headline: "A Long Drive Up the Coast",
      byline: "By the Editor",
      body: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "We packed the truck before dawn and drove north along the coast, stopping wherever a hand-painted sign promised pie or a view. The fog burned off by ten and the whole bay went silver.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "I had forgotten how loud a quiet place can be once you stop filling it with a phone. Try the editor toolbar above — bold, italic, a subhead, a pull-quote — and watch the preview reflow.",
              },
            ],
          },
        ],
      },
    },
    { id: newId(), type: "photoset", photos: [] },
  ],
};

function blankNewsletter(): Newsletter {
  return {
    publication: {
      name: "My Newsletter",
      tagline: "",
      issueLabel: "Vol. I — No. 1",
      date: "",
    },
    blocks: [],
  };
}

export default function App() {
  const [nl, setNl] = useState<Newsletter>(seed);
  const [formatId, setFormatId] = useState<FormatId>("trifold");
  const [backReversed, setBackReversed] = useState(false);
  const [rotateBack, setRotateBack] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [zoom, setZoom] = useState(0.6);
  const [stats, setStats] = useState<PreviewStats>({
    pageCount: 0,
    overset: 0,
    busy: false,
  });

  // ---- persistence ----
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const handleRef = useRef<FileSystemFileHandle | null>(null);
  const firstRun = useRef(true);
  const suppressDirty = useRef(false);
  const fsaSupported = isFileSystemAccessSupported();

  // Autosave: debounce changes → crash cache always, and to the open file if
  // one is attached. Programmatic loads set suppressDirty to avoid a redundant
  // write-back marking a freshly-loaded doc dirty.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (suppressDirty.current) {
      suppressDirty.current = false;
      setSaveState(handleRef.current ? "saved" : "dirty");
      return;
    }
    setSaveState("dirty");
    const t = setTimeout(async () => {
      try {
        await writeCrashCache(nl);
        if (handleRef.current) {
          setSaveState("saving");
          await writeToHandle(handleRef.current, nl);
          setSaveState("saved");
        }
      } catch (e) {
        console.error(e);
        setSaveState("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [nl]);

  // On first load, offer to restore an OPFS crash snapshot if present.
  useEffect(() => {
    (async () => {
      if (!(await hasCrashCache())) return;
      if (window.confirm("Restore unsaved work from your last session?")) {
        const cached = await readCrashCache();
        if (cached) {
          suppressDirty.current = true;
          setNl(cached);
        }
      } else {
        await clearCrashCache();
      }
    })();
  }, []);

  const onOpen = useCallback(async () => {
    try {
      if (fsaSupported) {
        const { newsletter, handle, name } = await openNewsletterFile();
        handleRef.current = handle;
        setFileName(name);
        suppressDirty.current = true;
        setNl(newsletter);
      } else {
        const res = await pickNewsletterFile();
        if (!res) return;
        handleRef.current = null;
        setFileName(res.name);
        suppressDirty.current = true;
        setNl(res.newsletter);
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.error(e);
        alert(`Could not open file: ${(e as Error).message}`);
      }
    }
  }, [fsaSupported]);

  const onSave = useCallback(async () => {
    try {
      if (handleRef.current) {
        setSaveState("saving");
        await writeToHandle(handleRef.current, nl);
        setSaveState("saved");
      } else if (fsaSupported) {
        const { handle, name } = await saveNewsletterAs(nl);
        handleRef.current = handle;
        setFileName(name);
        setSaveState("saved");
      } else {
        // no File System Access: export a download
        const name = await downloadNewsletter(nl);
        setFileName(name);
        setSaveState("saved");
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.error(e);
        setSaveState("error");
      }
    }
  }, [nl, fsaSupported]);

  const onNew = useCallback(async () => {
    if (
      saveState !== "saved" &&
      !window.confirm("Discard unsaved changes and start a new newsletter?")
    )
      return;
    clearImages();
    handleRef.current = null;
    setFileName(null);
    suppressDirty.current = true;
    setNl(blankNewsletter());
    await clearCrashCache();
  }, [saveState]);

  const onPublication = useCallback(
    (patch: Partial<Publication>) =>
      setNl((nl) => ({ ...nl, publication: { ...nl.publication, ...patch } })),
    []
  );
  const onAdd = useCallback(
    (type: BlockType) =>
      setNl((nl) => ({ ...nl, blocks: [...nl.blocks, makeBlock(type)] })),
    []
  );
  const onUpdate = useCallback(
    (id: string, patch: BlockPatch) =>
      setNl((nl) => ({
        ...nl,
        blocks: nl.blocks.map((b) =>
          b.id === id ? ({ ...b, ...patch } as Block) : b
        ),
      })),
    []
  );
  const onRemove = useCallback(
    (id: string) =>
      setNl((nl) => ({ ...nl, blocks: nl.blocks.filter((b) => b.id !== id) })),
    []
  );
  const onMove = useCallback(
    (id: string, dir: -1 | 1) =>
      setNl((nl) => {
        const i = nl.blocks.findIndex((b) => b.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= nl.blocks.length) return nl;
        const blocks = [...nl.blocks];
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        return { ...nl, blocks };
      }),
    []
  );

  const imposeOpts = useMemo(
    () => ({ backReversed, rotateBack }),
    [backReversed, rotateBack]
  );
  const fmt = FORMATS[formatId];

  const fullness =
    fmt.capacity == null
      ? `${stats.pageCount} page${stats.pageCount === 1 ? "" : "s"}`
      : `${Math.min(stats.pageCount, fmt.capacity)}/${fmt.capacity} panels`;

  return (
    <div className="flex h-screen flex-col bg-stone-700">
      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center gap-3 bg-stone-900 px-4 py-2 text-sm text-stone-100">
        <strong>Newsletter Studio</strong>
        <label className="flex items-center gap-1">
          Format
          <select
            className="rounded bg-stone-800 px-1 py-0.5"
            value={formatId}
            onChange={(e) => setFormatId(e.target.value as FormatId)}
          >
            {Object.values(FORMATS).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        {fmt.duplex && (
          <>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={backReversed}
                onChange={(e) => setBackReversed(e.target.checked)}
              />
              back cols reversed
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={rotateBack}
                onChange={(e) => setRotateBack(e.target.checked)}
              />
              rotate back 180°
            </label>
          </>
        )}

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showGuides}
            onChange={(e) => setShowGuides(e.target.checked)}
          />
          guides
        </label>

        <span className="flex items-center gap-1">
          zoom
          <button
            className="rounded bg-stone-800 px-2"
            onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}
          >
            −
          </button>
          <button
            className="rounded bg-stone-800 px-2"
            onClick={() => setZoom((z) => Math.min(1, +(z + 0.1).toFixed(2)))}
          >
            +
          </button>
        </span>

        <span className="mx-1 h-4 w-px bg-stone-600" />
        <button className="rounded bg-stone-800 px-2 py-0.5" onClick={onNew}>
          New
        </button>
        <button className="rounded bg-stone-800 px-2 py-0.5" onClick={onOpen}>
          Open…
        </button>
        <button
          className="rounded bg-stone-800 px-2 py-0.5"
          onClick={onSave}
          title={
            fsaSupported
              ? ""
              : "Brave disables File System Access — saving downloads a file"
          }
        >
          {handleRef.current ? "Save" : fsaSupported ? "Save As…" : "Download"}
        </button>
        <button
          className="rounded bg-stone-100 px-3 py-0.5 font-semibold text-stone-900"
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>

        <span className="ml-auto flex items-center gap-3">
          <span className="text-stone-300">
            {fileName ?? "(unsaved file)"} · <SaveBadge state={saveState} />
          </span>
          <span>{stats.busy ? "flowing…" : `flowed: ${fullness}`}</span>
          {stats.overset > 0 && (
            <span className="font-bold text-red-300">
              {" "}
              · ⚠ {stats.overset} OVERSET (won't print)
            </span>
          )}
        </span>
      </div>

      {/* Main: editor | preview */}
      <div className="app-main flex min-h-0 flex-1">
        <div className="no-print w-[440px] shrink-0 overflow-y-auto border-r border-stone-300 bg-stone-100">
          <Editor
            newsletter={nl}
            onPublication={onPublication}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onMove={onMove}
          />
        </div>
        <div className="preview-pane flex-1 overflow-auto p-6">
          <Preview
            newsletter={nl}
            formatId={formatId}
            imposeOpts={imposeOpts}
            showGuides={showGuides}
            zoom={zoom}
            onStats={setStats}
          />
        </div>
      </div>
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const map: Record<SaveState, { text: string; cls: string }> = {
    saved: { text: "● Saved", cls: "text-emerald-300" },
    dirty: { text: "○ Unsaved", cls: "text-amber-300" },
    saving: { text: "Saving…", cls: "text-stone-300" },
    error: { text: "⚠ Save failed", cls: "text-red-300" },
  };
  const { text, cls } = map[state];
  return <span className={cls}>{text}</span>;
}
