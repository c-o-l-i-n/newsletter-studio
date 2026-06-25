import { useState } from 'react';
import type {
  FormatId,
  ImposeOptions,
  BlockPatch,
  BlockType,
  Newsletter,
  NewsletterSettings,
  Publication,
} from '@/types';
import { FORMATS } from '@/utils/formats.ts';
import { BlockEditor } from './components/block-editor';
import { Preview, type PreviewStats } from './components/preview';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  FileAddIcon,
  FolderOpenIcon,
  FloppyDiskIcon,
  PrinterIcon,
  Tick01Icon,
  Files01Icon,
  News01Icon,
  SearchAddIcon,
  SearchMinusIcon,
  AlertCircleIcon,
  RecordIcon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

export type PendingAction =
  | { type: 'new' }
  | { type: 'open' }
  | { type: 'restore-crash'; cache: Newsletter };

export interface EditorUIProps {
  newsletter: Newsletter;
  formatId: FormatId;
  zoom: number;
  stats: PreviewStats;
  fileName: string | null;
  saveState: SaveState;
  fsaSupported: boolean;
  hasSaveHandle: boolean;
  imposeOpts: ImposeOptions;
  fullness: string;
  pendingAction: PendingAction | null;
  onFormatChange: (id: FormatId) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onPublication: (patch: Partial<Publication>) => void;
  onSettings: (patch: Partial<NewsletterSettings>) => void;
  onAdd: (type: BlockType) => void;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onStats: (s: PreviewStats) => void;
  onConfirmPending: () => void;
  onCancelPending: () => void;
}

const tb = 'h-7 text-[12px] focus-visible:ring-0';

export function EditorUI({
  newsletter,
  formatId,
  zoom,
  stats,
  fileName,
  saveState,
  fsaSupported,
  hasSaveHandle,
  imposeOpts,
  fullness,
  pendingAction,
  onFormatChange,
  onZoomIn,
  onZoomOut,
  onNew,
  onOpen,
  onSave,
  onPublication,
  onSettings,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onStats,
  onConfirmPending,
  onCancelPending,
}: EditorUIProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  return (
    <div className="bg-background flex h-screen flex-col">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="no-print bg-background flex h-10 shrink-0 items-center gap-0.5 border-b px-3">
        {/* Brand */}
        <span className="mr-2 flex items-center gap-1.5 text-[13px] font-semibold tracking-tight select-none">
          <News01Icon size={15} className="text-primary" />
          Newsletter Studio
        </span>

        <Separator orientation="vertical" className="mx-1.5" />

        {/* File ops */}
        <Button
          variant="ghost"
          size="sm"
          className={`${tb} gap-1.5`}
          onClick={onNew}
        >
          <FileAddIcon size={13} />
          New
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`${tb} gap-1.5`}
          onClick={onOpen}
        >
          <FolderOpenIcon size={13} />
          Open…
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`${tb} gap-1.5`}
          onClick={onSave}
          title={
            fsaSupported
              ? ''
              : 'Brave disables File System Access — saving downloads a file'
          }
        >
          <FloppyDiskIcon size={13} />
          {hasSaveHandle ? 'Save' : fsaSupported ? 'Save As…' : 'Download'}
        </Button>

        <Separator orientation="vertical" className="mx-1.5" />

        {/* Format selector */}
        <Select
          value={formatId}
          onValueChange={(v) => v && onFormatChange(v as FormatId)}
        >
          <SelectTrigger
            id="format-select"
            size="sm"
            className="h-7 w-40 text-[12px] focus-visible:ring-0"
          >
            {/* Render label directly — base-ui SelectValue renders the raw
                value string rather than the item's display text */}
            <span className="flex-1 truncate text-left">
              {FORMATS[formatId].label}
            </span>
          </SelectTrigger>
          <SelectContent>
            {Object.values(FORMATS).map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="mx-1.5" />

        {/* Paper size */}
        <SegmentedControl
          value={newsletter.settings.paperSize}
          options={[
            { value: 'letter', label: 'Letter' },
            { value: 'a4', label: 'A4' },
          ]}
          onChange={(v) => onSettings({ paperSize: v as 'letter' | 'a4' })}
        />

        {/* Image color mode */}
        <SegmentedControl
          value={newsletter.settings.colorImages ? 'color' : 'bw'}
          options={[
            { value: 'bw', label: 'B&W' },
            { value: 'color', label: 'Color' },
          ]}
          onChange={(v) => onSettings({ colorImages: v === 'color' })}
        />

        {/* Zoom */}
        <div className="ml-1.5 flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            className={tb}
            onClick={onZoomOut}
          >
            <SearchMinusIcon size={14} />
          </Button>
          <span className="text-muted-foreground w-9 text-center text-[11px] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className={tb}
            onClick={onZoomIn}
          >
            <SearchAddIcon size={14} />
          </Button>
        </div>

        {/* Status — right side */}
        <div className="ml-auto flex items-center gap-3 text-[11px]">
          <span className="text-muted-foreground">
            {fileName ?? 'new file'} · <SaveBadge state={saveState} />
          </span>
          {stats.busy && (
            <span className="text-muted-foreground">flowing…</span>
          )}
          {!stats.busy && FORMATS[formatId].capacity != null ? (
            <FullnessGauge
              used={Math.min(stats.pageCount, FORMATS[formatId].capacity!)}
              capacity={FORMATS[formatId].capacity!}
              overset={stats.overset}
            />
          ) : !stats.busy ? (
            <span className="text-muted-foreground">{fullness}</span>
          ) : null}
        </div>

        {/* Print CTA */}
        <Button
          size="sm"
          className="ml-3 h-7 shrink-0 gap-1.5 text-[12px] font-semibold"
          onClick={() => setShowPrintDialog(true)}
        >
          <PrinterIcon size={13} />
          Print / PDF
        </Button>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="app-main flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="no-print bg-background flex w-[400px] shrink-0 flex-col overflow-hidden border-r">
          <BlockEditor
            newsletter={newsletter}
            onPublication={onPublication}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onMove={onMove}
          />
        </div>

        {/* Preview — the desk surface */}
        <div className="preview-pane bg-muted flex-1 overflow-auto p-8">
          <Preview
            newsletter={newsletter}
            formatId={formatId}
            imposeOpts={imposeOpts}
            showGuides={true}
            zoom={zoom}
            onStats={onStats}
          />
        </div>
      </div>

      <ConfirmDialog
        pendingAction={pendingAction}
        onConfirm={onConfirmPending}
        onCancel={onCancelPending}
      />
      <PrintInstructionsDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        formatId={formatId}
        paperSize={newsletter.settings.paperSize}
      />
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex h-7 overflow-hidden rounded-md border">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 text-[11px] font-medium transition-colors',
            i > 0 && 'border-l',
            value === opt.value
              ? 'bg-foreground text-background'
              : 'bg-background text-muted-foreground hover:bg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FullnessGauge({
  used,
  capacity,
  overset,
}: {
  used: number;
  capacity: number;
  overset: number;
}) {
  const isOver = overset > 0;
  return (
    <div
      className={cn('flex items-center gap-1.5', isOver && 'text-destructive')}
    >
      <div className="flex gap-[3px]">
        {Array.from({ length: capacity }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-[9px] w-[5px] rounded-[2px] transition-colors',
              i < used
                ? isOver
                  ? 'bg-destructive'
                  : 'bg-foreground/60'
                : 'bg-border',
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          'text-[11px] tabular-nums',
          isOver ? 'text-destructive font-semibold' : 'text-muted-foreground',
        )}
      >
        {used}/{capacity} panels{isOver ? ` · ${overset} overset` : ''}
      </span>
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'saved')
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <RecordIcon size={8} />
        saved
      </span>
    );
  if (state === 'dirty')
    return (
      <span className="inline-flex items-center gap-1 text-amber-500">
        <RecordIcon size={8} />
        unsaved
      </span>
    );
  if (state === 'saving')
    return <span className="text-muted-foreground">saving…</span>;
  return (
    <span className="text-destructive inline-flex items-center gap-1">
      <AlertCircleIcon size={10} />
      failed
    </span>
  );
}

const CONFIRM_CONTENT: Record<
  PendingAction['type'],
  {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
    destructive: boolean;
  }
> = {
  new: {
    title: 'Start a new newsletter?',
    description: 'Your unsaved changes will be lost.',
    cancel: 'Keep editing',
    confirm: 'Discard & start new',
    destructive: true,
  },
  open: {
    title: 'Open a different file?',
    description: 'Your unsaved changes will be lost.',
    cancel: 'Keep editing',
    confirm: 'Discard & open…',
    destructive: true,
  },
  'restore-crash': {
    title: 'Restore unsaved work?',
    description:
      'A draft from your last session was found. Restore it or start fresh.',
    cancel: 'Start fresh',
    confirm: 'Restore draft',
    destructive: false,
  },
};

const PAPER_LABEL: Record<string, string> = {
  letter: 'Letter',
  a4: 'A4',
};

function PrintInstructionsDialog({
  open,
  onOpenChange,
  formatId,
  paperSize,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatId: FormatId;
  paperSize: string;
}) {
  const fmt = FORMATS[formatId];
  const isDuplex = fmt.duplex;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrinterIcon size={18} className="text-primary" />
            How to Print
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground mb-3 text-[13px]">
            Use these settings in your print dialog:
          </p>
          <PrintRow
            label="Paper size"
            value={PAPER_LABEL[paperSize] ?? paperSize}
          />
          <PrintRow label="Pages per sheet" value="1" />
          <PrintRow label="Margins" value="None" />
          <PrintRow label="Scale" value="100%" />
        </div>

        {isDuplex && (
          <div className="bg-muted/50 rounded-lg border p-3 text-[13px]">
            <div className="flex items-start gap-2">
              <Files01Icon
                size={16}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <div>
                <p className="font-medium">Double-sided printing</p>
                <p className="text-muted-foreground mt-0.5">
                  Set duplex to{' '}
                  <span className="text-foreground font-semibold">
                    Flip on Short Edge
                  </span>{' '}
                  so the back prints upright when folded.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Cancel
          </DialogClose>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onOpenChange(false);
              // Wait for the dialog close animation before printing
              setTimeout(() => window.print(), 150);
            }}
          >
            <PrinterIcon size={13} />
            Print Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Tick01Icon size={14} className="shrink-0 text-emerald-600" />
      <span className="text-muted-foreground w-24 text-[12px] font-medium">
        {label}
      </span>
      <span className="text-[13px] font-semibold">{value}</span>
    </div>
  );
}

function ConfirmDialog({
  pendingAction,
  onConfirm,
  onCancel,
}: {
  pendingAction: PendingAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const content = pendingAction ? CONFIRM_CONTENT[pendingAction.type] : null;
  return (
    <AlertDialog
      open={!!pendingAction}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{content?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {content?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{content?.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant={content?.destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {content?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
