import { useEffect, useState } from 'react';
import ReactCrop, { type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { CropRect } from '@/services/image-optimize';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** `crop` is absent when the author keeps the whole image. */
export type CropOutcome = { type: 'place'; crop?: CropRect } | { type: 'skip' };

interface CropRequest {
  url: string;
  index: number;
  total: number;
  resolve: (outcome: CropOutcome) => void;
}

/** Ratios are written landscape-first; the orientation toggle flips them. */
type Ratio = null | 'image' | readonly [number, number];
const PRESETS: readonly { label: string; ratio: Ratio }[] = [
  { label: 'Freeform', ratio: null },
  { label: 'Original', ratio: 'image' },
  { label: 'Square', ratio: [1, 1] },
  { label: '4:3', ratio: [4, 3] },
  { label: '3:2', ratio: [3, 2] },
  { label: '16:9', ratio: [16, 9] },
];

const FULL: PercentCrop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };

const canRotate = (r: Ratio): r is readonly [number, number] =>
  Array.isArray(r) && r[0] !== r[1];

function aspectOf(r: Ratio, portrait: boolean, w: number, h: number) {
  if (r === null) return undefined;
  if (r === 'image') return w / h;
  return portrait ? r[1] / r[0] : r[0] / r[1];
}

function largestCentered(aspect: number, w: number, h: number): PercentCrop {
  const cw = Math.min(w, h * aspect);
  const ch = cw / aspect;
  return {
    unit: '%',
    x: ((w - cw) / 2 / w) * 100,
    y: ((h - ch) / 2 / h) * 100,
    width: (cw / w) * 100,
    height: (ch / h) * 100,
  };
}

function toSourcePixels(c: PercentCrop, w: number, h: number) {
  const x = Math.round((c.x / 100) * w);
  const y = Math.round((c.y / 100) * h);
  const width = Math.min(w - x, Math.round((c.width / 100) * w));
  const height = Math.min(h - y, Math.round((c.height / 100) * h));
  const whole = x === 0 && y === 0 && width === w && height === h;
  return whole || width < 1 || height < 1 ? undefined : { x, y, width, height };
}

let show: ((req: CropRequest) => void) | null = null;

/** Ask the author how to crop an image. Needs <CropDialogHost /> mounted. */
export async function requestCrop(
  blob: Blob,
  progress: { index: number; total: number } = { index: 1, total: 1 },
): Promise<CropOutcome> {
  if (!show) throw new Error('CropDialogHost is not mounted');
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve) => show!({ url, ...progress, resolve }));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CropDialogHost() {
  const [req, setReq] = useState<CropRequest | null>(null);
  useEffect(() => {
    show = setReq;
    return () => {
      show = null;
    };
  }, []);

  const finish = (outcome: CropOutcome) => {
    req?.resolve(outcome);
    setReq(null);
  };

  return (
    <Dialog
      open={req !== null}
      onOpenChange={(open) => {
        if (!open) finish({ type: 'skip' });
      }}
    >
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        {req && <CropBody key={req.url} req={req} onFinish={finish} />}
      </DialogContent>
    </Dialog>
  );
}

function CropBody({
  req,
  onFinish,
}: {
  req: CropRequest;
  onFinish: (outcome: CropOutcome) => void;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [preset, setPreset] = useState(0);
  const [portrait, setPortrait] = useState(false);
  const [crop, setCrop] = useState<PercentCrop>(FULL);
  const ratio = PRESETS[preset].ratio;
  const aspect = size && aspectOf(ratio, portrait, size.w, size.h);

  const choose = (nextPreset: number, nextPortrait: boolean) => {
    setPreset(nextPreset);
    setPortrait(nextPortrait);
    const a =
      size && aspectOf(PRESETS[nextPreset].ratio, nextPortrait, size.w, size.h);
    if (size && a) setCrop(largestCentered(a, size.w, size.h));
  };

  const place = () =>
    onFinish({
      type: 'place',
      crop: size ? toSourcePixels(crop, size.w, size.h) : undefined,
    });
  const skipLabel = req.total > 1 ? 'Skip' : 'Cancel';

  // On the window, not the dialog: between batch images the dialog content
  // remounts and focus falls back to <body>.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const onSkip = (e.target as HTMLElement).dataset?.skip !== undefined;
      if (e.key === 'Enter' && size && !onSkip) {
        e.preventDefault();
        place();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Crop the Picture</DialogTitle>
        <DialogDescription>
          {req.total > 1
            ? `Image ${req.index} of ${req.total}`
            : 'Trim it, or keep the whole thing.'}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p, i) => (
          <Button
            key={p.label}
            size="xs"
            variant={i === preset ? 'default' : 'outline'}
            aria-pressed={i === preset}
            onClick={() => choose(i, portrait)}
          >
            {canRotate(p.ratio) && portrait
              ? `${p.ratio[1]}:${p.ratio[0]}`
              : p.label}
          </Button>
        ))}
        {canRotate(ratio) && (
          <div className="ml-auto flex gap-1">
            {(['Landscape', 'Portrait'] as const).map((o) => (
              <Button
                key={o}
                size="xs"
                variant={
                  (o === 'Portrait') === portrait ? 'default' : 'outline'
                }
                aria-pressed={(o === 'Portrait') === portrait}
                onClick={() => choose(preset, o === 'Portrait')}
              >
                {o}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center rounded-md bg-black/40 p-2 shadow-[inset_0_2px_8px_oklch(0_0_0_/_0.5)]">
        <ReactCrop
          crop={crop}
          aspect={aspect ?? undefined}
          keepSelection
          ruleOfThirds
          onChange={(_, pc) => setCrop(pc)}
          className="max-h-[60vh] [--rc-focus-color:var(--primary)]"
        >
          <img
            src={req.url}
            alt=""
            className="max-h-[60vh]"
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              setSize({ w, h });
              setPortrait(h > w);
            }}
          />
        </ReactCrop>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          size="sm"
          data-skip
          onClick={() => onFinish({ type: 'skip' })}
        >
          {skipLabel}
        </Button>
        <Button size="sm" sfx="add" disabled={!size} onClick={place}>
          Done
        </Button>
      </DialogFooter>
    </>
  );
}
