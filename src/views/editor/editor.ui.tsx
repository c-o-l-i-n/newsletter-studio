import { useEffect, useRef, useState } from 'react';
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
  SearchAddIcon,
  SearchMinusIcon,
  AlertCircleIcon,
  RecordIcon,
  VolumeHighIcon,
  VolumeOffIcon,
  QuillWrite02Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useMuted } from '@/hooks/use-sound';
import { sound } from '@/services/sound';

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
  imageRevision: number;
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
  imageRevision,
}: EditorUIProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // A clang when a save goes wrong.
  const prevSaveRef = useRef(saveState);
  useEffect(() => {
    if (saveState === 'error' && prevSaveRef.current !== 'error')
      sound.play('error');
    prevSaveRef.current = saveState;
  }, [saveState]);

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="titlebar no-print tex-leather flex shrink-0 items-center gap-0.5 border-b-2 border-[oklch(0.58_0.1_76)] pr-3 shadow-[0_3px_10px_oklch(0_0_0_/_0.55)]">
        {/* Wordmark */}
        <span className="font-display text-primary anim-flicker mr-1 hidden items-center gap-1.5 pr-2 pl-1 text-[15px] tracking-wide select-none lg:flex">
          <QuillWrite02Icon size={16} />
          Newsletter Studio
        </span>
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
          sfx="save"
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
        <div className="font-reading ml-auto flex items-center gap-3 text-[11px]">
          <MuteToggle />
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
          sfx="print"
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
        <div className="no-print tex-leather flex w-[400px] shrink-0 flex-col overflow-hidden border-r-2 border-[oklch(0.58_0.1_76)] shadow-[inset_-6px_0_14px_oklch(0_0_0_/_0.35)]">
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
        <div className="preview-pane tex-wood flex-1 overflow-auto p-8 shadow-[inset_0_10px_28px_oklch(0_0_0_/_0.55)]">
          <Preview
            newsletter={newsletter}
            formatId={formatId}
            imposeOpts={imposeOpts}
            showGuides={true}
            zoom={zoom}
            onStats={onStats}
            imageRevision={imageRevision}
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
    <div className="tex-wood flex h-7 overflow-hidden rounded-[calc(var(--radius)*0.55)] border-2 border-[oklch(0.5_0.07_72)] shadow-[inset_0_1px_3px_oklch(0_0_0_/_0.45)]">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            sound.play('click');
            onChange(opt.value);
          }}
          onMouseEnter={() => sound.play('hover')}
          className={cn(
            'px-2.5 font-sans text-[11px] font-medium transition-all',
            i > 0 && 'border-l border-[oklch(0.5_0.07_72)]',
            value === opt.value
              ? 'bg-gradient-to-b from-[oklch(0.86_0.13_88)] to-[oklch(0.66_0.12_72)] text-[oklch(0.22_0.05_50)] shadow-[inset_0_1px_0_oklch(1_0_0_/_0.4)]'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MuteToggle() {
  const [muted, toggle] = useMuted();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      sfx={null}
      hoverSound={false}
      onClick={toggle}
      title={muted ? 'Sound off — click for tavern noise' : 'Sound on'}
      className="text-primary h-7"
    >
      {muted ? <VolumeOffIcon size={15} /> : <VolumeHighIcon size={15} />}
    </Button>
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
              'h-[12px] w-[6px] rounded-[2px] border border-[oklch(0.45_0.06_68)] transition-all',
              i < used
                ? isOver
                  ? 'bg-gradient-to-t from-[oklch(0.42_0.16_26)] to-[oklch(0.62_0.17_28)] shadow-[0_0_4px_oklch(0.6_0.17_28_/_0.7)]'
                  : 'bg-gradient-to-t from-[oklch(0.5_0.09_148)] to-[oklch(0.72_0.12_150)] shadow-[0_0_3px_oklch(0.7_0.12_150_/_0.6)]'
                : 'bg-[oklch(0.2_0.02_55)] shadow-[inset_0_1px_2px_oklch(0_0_0_/_0.55)]',
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
    title: 'Begin a fresh scroll?',
    description: 'Any unsaved scribblings will be lost to the ages.',
    cancel: 'Keep scribbling',
    confirm: 'Toss it in the fire 🔥',
    destructive: true,
  },
  open: {
    title: 'Unfurl a different scroll?',
    description: 'Any unsaved scribblings will be lost to the ages.',
    cancel: 'Keep scribbling',
    confirm: 'Abandon & open…',
    destructive: true,
  },
  'restore-crash': {
    title: 'Recover a lost manuscript?',
    description:
      'A draft from your last session was found in the cellar. Restore it, or start anew.',
    cancel: 'Start anew',
    confirm: 'Recover it!',
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
            To the Printing Press
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
            sfx="print"
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
            sfx={content?.destructive ? 'delete' : 'add'}
            onClick={onConfirm}
          >
            {content?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
