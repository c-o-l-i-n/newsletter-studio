import type { FormatId, FormatDef, ImposeOptions, BlockPatch, BlockType, Newsletter, Publication } from "@/types";
import { FORMATS } from "@/utils/formats.ts";
import { BlockEditor } from "./components/block-editor";
import { Preview, type PreviewStats } from "./components/preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const tbBtn =
  "text-stone-100 hover:bg-stone-800 hover:text-stone-100 active:bg-stone-700";

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

        <div className="flex items-center gap-1.5">
          <Label className="font-normal text-stone-300" htmlFor="format-select">
            Format
          </Label>
          <Select
            value={formatId}
            onValueChange={(v) => v && onFormatChange(v as FormatId)}
          >
            <SelectTrigger
              id="format-select"
              size="sm"
              className="border-stone-600 bg-stone-800 text-stone-100 hover:bg-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(FORMATS).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {fmt.duplex && (
          <>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="back-reversed"
                checked={backReversed}
                onCheckedChange={(v) => onBackReversedChange(v)}
                className="border-stone-500 data-checked:border-stone-400 data-checked:bg-stone-600"
              />
              <Label
                className="cursor-pointer font-normal text-stone-300"
                htmlFor="back-reversed"
              >
                back cols reversed
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="rotate-back"
                checked={rotateBack}
                onCheckedChange={(v) => onRotateBackChange(v)}
                className="border-stone-500 data-checked:border-stone-400 data-checked:bg-stone-600"
              />
              <Label
                className="cursor-pointer font-normal text-stone-300"
                htmlFor="rotate-back"
              >
                rotate back 180°
              </Label>
            </div>
          </>
        )}

        <div className="flex items-center gap-1.5">
          <Checkbox
            id="show-guides"
            checked={showGuides}
            onCheckedChange={(v) => onShowGuidesChange(v)}
            className="border-stone-500 data-checked:border-stone-400 data-checked:bg-stone-600"
          />
          <Label
            className="cursor-pointer font-normal text-stone-300"
            htmlFor="show-guides"
          >
            guides
          </Label>
        </div>

        <div className="flex items-center gap-0.5">
          <span className="mr-1 text-stone-300">zoom</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className={tbBtn}
            onClick={onZoomOut}
          >
            −
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={tbBtn}
            onClick={onZoomIn}
          >
            +
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-0 h-4 bg-stone-600" />

        <Button variant="ghost" size="sm" className={tbBtn} onClick={onNew}>
          New
        </Button>
        <Button variant="ghost" size="sm" className={tbBtn} onClick={onOpen}>
          Open…
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={tbBtn}
          onClick={onSave}
          title={
            fsaSupported
              ? ""
              : "Brave disables File System Access — saving downloads a file"
          }
        >
          {hasSaveHandle ? "Save" : fsaSupported ? "Save As…" : "Download"}
        </Button>
        <Button
          size="sm"
          className="bg-stone-100 text-stone-900 hover:bg-stone-200"
          onClick={() => window.print()}
        >
          Print / Save PDF
        </Button>

        <span className="ml-auto flex items-center gap-3">
          <span className="text-stone-300">
            {fileName ?? "(unsaved file)"} · <SaveBadge state={saveState} />
          </span>
          <span>{stats.busy ? "flowing…" : `flowed: ${fullness}`}</span>
          {stats.overset > 0 && (
            <Badge variant="destructive" className="font-bold">
              ⚠ {stats.overset} OVERSET (won't print)
            </Badge>
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
