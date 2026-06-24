import type { FormatId, FormatDef, ImposeOptions } from "../../types/formats";
import type { BlockPatch, BlockType, Newsletter, Publication } from "../../types/newsletter";
import { FORMATS } from "../../utils/formats";
import { BlockEditor } from "./components/block-editor";
import { Preview, type PreviewStats } from "./components/preview";

export type SaveState = "saved" | "dirty" | "saving" | "error";

export interface EditorUIProps {
  newsletter: Newsletter;
  formatId: FormatId;
  fmt: FormatDef;
  backReversed: boolean;
  rotateBack: boolean;
  showGuides: boolean;
  zoom: number;
  stats: PreviewStats;
  fileName: string | null;
  saveState: SaveState;
  fsaSupported: boolean;
  hasSaveHandle: boolean;
  imposeOpts: ImposeOptions;
  fullness: string;
  onFormatChange: (id: FormatId) => void;
  onBackReversedChange: (v: boolean) => void;
  onRotateBackChange: (v: boolean) => void;
  onShowGuidesChange: (v: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onPublication: (patch: Partial<Publication>) => void;
  onAdd: (type: BlockType) => void;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onStats: (s: PreviewStats) => void;
}

export function EditorUI({
  newsletter,
  formatId,
  fmt,
  backReversed,
  rotateBack,
  showGuides,
  zoom,
  stats,
  fileName,
  saveState,
  fsaSupported,
  hasSaveHandle,
  imposeOpts,
  fullness,
  onFormatChange,
  onBackReversedChange,
  onRotateBackChange,
  onShowGuidesChange,
  onZoomIn,
  onZoomOut,
  onNew,
  onOpen,
  onSave,
  onPublication,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onStats,
}: EditorUIProps) {
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
            onChange={(e) => onFormatChange(e.target.value as FormatId)}
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
                onChange={(e) => onBackReversedChange(e.target.checked)}
              />
              back cols reversed
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={rotateBack}
                onChange={(e) => onRotateBackChange(e.target.checked)}
              />
              rotate back 180°
            </label>
          </>
        )}

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showGuides}
            onChange={(e) => onShowGuidesChange(e.target.checked)}
          />
          guides
        </label>

        <span className="flex items-center gap-1">
          zoom
          <button className="rounded bg-stone-800 px-2" onClick={onZoomOut}>
            −
          </button>
          <button className="rounded bg-stone-800 px-2" onClick={onZoomIn}>
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
          {hasSaveHandle ? "Save" : fsaSupported ? "Save As…" : "Download"}
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
          <BlockEditor
            newsletter={newsletter}
            onPublication={onPublication}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onMove={onMove}
          />
        </div>
        <div className="preview-pane flex-1 overflow-auto p-6">
          <Preview
            newsletter={newsletter}
            formatId={formatId}
            imposeOpts={imposeOpts}
            showGuides={showGuides}
            zoom={zoom}
            onStats={onStats}
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
