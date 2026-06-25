import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Block,
  BlockPatch,
  BlockType,
  Newsletter,
  NewsletterSettings,
  Publication,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types/newsletter';
import { FORMATS } from '@/utils/formats.ts';
import { makeBlock } from '@/utils/make-block.ts';
import { clearImages } from '@/services/image-store.ts';
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
} from '@/services/file-io.ts';
import { newId } from '@/utils/ids.ts';
import { emptyDoc } from '@/utils/tiptap.ts';
import { EditorUI, type SaveState, type PendingAction } from './editor.ui';
import type { PreviewStats } from './components/preview';

const CURRENT_MONTH_AND_YEAR = new Date().toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
});

const seed: Newsletter = {
  publication: {
    name: 'Personal Newsletter',
    location: 'New York, NY',
    issueLabel: 'Vol. I, Iss. 1',
    date: CURRENT_MONTH_AND_YEAR,
  },
  settings: DEFAULT_SETTINGS,
  blocks: [
    {
      id: newId(),
      type: 'article',
      headline: 'A Long Drive Up the Coast',
      byline: 'By the Editor',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'We packed the truck before dawn and drove north along the coast, stopping wherever a hand-painted sign promised pie or a view. The fog burned off by ten and the whole bay went silver.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'I had forgotten how loud a quiet place can be once you stop filling it with a phone. Try the editor toolbar above — bold, italic, a subhead, a pull-quote — and watch the preview reflow.',
              },
            ],
          },
        ],
      },
    },
    { id: newId(), type: 'imageset', images: [] },
  ],
};

// Silence unused-import warnings: emptyDoc is used by makeBlock transitively,
// but tiptap must be imported before the editor renders. This re-export keeps
// the import live without lint complaints.
void emptyDoc;

export function EditorView() {
  const [nl, setNl] = useState<Newsletter>(seed);
  const formatId = nl.settings.formatId;
  const [zoom, setZoom] = useState(0.7);
  const [stats, setStats] = useState<PreviewStats>({
    pageCount: 0,
    overset: 0,
    busy: false,
  });

  // ---- persistence ----
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
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
      setSaveState(handleRef.current ? 'saved' : 'dirty');
      return;
    }
    setSaveState('dirty');
    const t = setTimeout(async () => {
      try {
        await writeCrashCache(nl);
        if (handleRef.current) {
          setSaveState('saving');
          await writeToHandle(handleRef.current, nl);
          setSaveState('saved');
        }
      } catch (e) {
        console.error(e);
        setSaveState('error');
      }
    }, 800);
    return () => clearTimeout(t);
  }, [nl]);

  // On first load, show a dialog to restore an OPFS crash snapshot if present.
  useEffect(() => {
    (async () => {
      if (!(await hasCrashCache())) return;
      const cached = await readCrashCache();
      if (cached) {
        setPendingAction({ type: 'restore-crash', cache: cached });
      } else {
        await clearCrashCache();
      }
    })();
  }, []);

  const doNew = useCallback(async () => {
    clearImages();
    handleRef.current = null;
    setFileName(null);
    suppressDirty.current = true;
    setNl((prev) => ({ ...prev, blocks: [] }));
    await clearCrashCache();
  }, []);

  const doOpen = useCallback(async () => {
    try {
      if (isFileSystemAccessSupported()) {
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
  }, []);

  const onNew = useCallback(() => {
    if (saveState !== 'saved') {
      setPendingAction({ type: 'new' });
    } else {
      void doNew();
    }
  }, [saveState, doNew]);

  const onOpen = useCallback(() => {
    if (saveState !== 'saved') {
      setPendingAction({ type: 'open' });
    } else {
      void doOpen();
    }
  }, [saveState, doOpen]);

  const onSave = useCallback(async () => {
    try {
      if (handleRef.current) {
        setSaveState('saving');
        await writeToHandle(handleRef.current, nl);
        setSaveState('saved');
      } else if (fsaSupported) {
        const { handle, name } = await saveNewsletterAs(nl);
        handleRef.current = handle;
        setFileName(name);
        setSaveState('saved');
      } else {
        const name = await downloadNewsletter(nl);
        setFileName(name);
        setSaveState('saved');
      }
    } catch (e) {
      if (!isAbortError(e)) {
        console.error(e);
        setSaveState('error');
      }
    }
  }, [nl, fsaSupported]);

  const onConfirmPending = useCallback(async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.type === 'new') {
      await doNew();
    } else if (action.type === 'open') {
      await doOpen();
    } else if (action.type === 'restore-crash') {
      suppressDirty.current = true;
      setNl(action.cache);
    }
  }, [pendingAction, doNew, doOpen]);

  const onCancelPending = useCallback(async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.type === 'restore-crash') {
      await clearCrashCache();
    }
  }, [pendingAction]);

  const onPublication = useCallback(
    (patch: Partial<Publication>) =>
      setNl((nl) => ({ ...nl, publication: { ...nl.publication, ...patch } })),
    [],
  );
  const onSettings = useCallback(
    (patch: Partial<NewsletterSettings>) =>
      setNl((nl) => ({ ...nl, settings: { ...nl.settings, ...patch } })),
    [],
  );
  const onAdd = useCallback(
    (type: BlockType) =>
      setNl((nl) => ({ ...nl, blocks: [...nl.blocks, makeBlock(type)] })),
    [],
  );
  const onUpdate = useCallback(
    (id: string, patch: BlockPatch) =>
      setNl((nl) => ({
        ...nl,
        blocks: nl.blocks.map((b) =>
          b.id === id ? ({ ...b, ...patch } as Block) : b,
        ),
      })),
    [],
  );
  const onRemove = useCallback(
    (id: string) =>
      setNl((nl) => ({ ...nl, blocks: nl.blocks.filter((b) => b.id !== id) })),
    [],
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
    [],
  );

  const fmt = FORMATS[formatId];

  const fullness =
    fmt.capacity == null
      ? `${stats.pageCount} page${stats.pageCount === 1 ? '' : 's'}`
      : `${Math.min(stats.pageCount, fmt.capacity)}/${fmt.capacity} panels`;

  return (
    <EditorUI
      newsletter={nl}
      formatId={formatId}
      zoom={zoom}
      stats={stats}
      fileName={fileName}
      saveState={saveState}
      fsaSupported={fsaSupported}
      hasSaveHandle={handleRef.current !== null}
      imposeOpts={{ backReversed: false, rotateBack: false }}
      fullness={fullness}
      pendingAction={pendingAction}
      onFormatChange={(id) => onSettings({ formatId: id })}
      onZoomIn={() => setZoom((z) => Math.min(1, +(z + 0.1).toFixed(2)))}
      onZoomOut={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
      onNew={onNew}
      onOpen={onOpen}
      onSave={onSave}
      onPublication={onPublication}
      onSettings={onSettings}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onMove={onMove}
      onStats={setStats}
      onConfirmPending={onConfirmPending}
      onCancelPending={onCancelPending}
    />
  );
}
