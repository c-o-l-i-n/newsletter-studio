import { Component, createRef, useState } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BombIcon,
  QuillScrollIcon,
} from '@/components/icons';
import type {
  AdviceBlock,
  Block,
  BlockPatch,
  BlockType,
  ImageBorder,
  ImageSetBlock,
  Newsletter,
  Publication,
} from '@/types';
import { BLOCK_LABELS } from '@/constants';
import { newId } from '@/utils/ids.ts';
import { imageUrl, putImage } from '@/services/image-store.ts';
import { boomAt } from '@/services/boom';
import { ArticleBody } from '../article-body';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

function pickImageFile(cb: (file: File) => void) {
  const i = document.createElement('input');
  i.type = 'file';
  i.accept = 'image/*';
  i.onchange = () => {
    const f = i.files?.[0];
    if (f) cb(f);
  };
  i.click();
}

const fieldLabel =
  'flex-col items-start gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground';

export interface BlockEditorProps {
  newsletter: Newsletter;
  onPublication: (patch: Partial<Publication>) => void;
  onAdd: (type: BlockType) => void;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export class BlockEditor extends Component<BlockEditorProps> {
  private scrollRef = createRef<HTMLDivElement>();

  componentDidUpdate(prevProps: BlockEditorProps) {
    if (
      this.props.newsletter.blocks.length > prevProps.newsletter.blocks.length
    ) {
      this.scrollRef.current?.scrollTo({
        top: this.scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  render() {
    let { newsletter, onPublication, onAdd, onUpdate, onRemove, onMove } =
      this.props;
    const { publication: p, blocks, settings } = newsletter;
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto" ref={this.scrollRef}>
          <div className="flex flex-col gap-3 p-3">
            {/* ── Masthead ─────────────────────────────────────────────── */}
            <Card size="sm">
              <CardHeader className="border-border border-b pb-2">
                <CardTitle className="text-muted-foreground font-semibold tracking-widest uppercase">
                  Masthead
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Label className={`col-span-2 ${fieldLabel}`}>
                    Publication name
                    <Input
                      className="font-bold tracking-normal"
                      value={p.name}
                      onChange={(e) => onPublication({ name: e.target.value })}
                    />
                  </Label>
                  <Label className={fieldLabel}>
                    Issue
                    <Input
                      className="font-normal tracking-normal"
                      value={p.issueLabel}
                      onChange={(e) =>
                        onPublication({ issueLabel: e.target.value })
                      }
                    />
                  </Label>
                  <Label className={fieldLabel}>
                    Date
                    <Input
                      className="font-normal tracking-normal"
                      value={p.date}
                      onChange={(e) => onPublication({ date: e.target.value })}
                    />
                  </Label>
                  <Label className={`col-span-2 ${fieldLabel}`}>
                    Location
                    <Input
                      className="font-normal tracking-normal"
                      value={p.location}
                      onChange={(e) =>
                        onPublication({ location: e.target.value })
                      }
                    />
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* ── Blocks ───────────────────────────────────────────────── */}
            {blocks.map((block, i) => (
              <BlockCard
                key={block.id}
                block={block}
                first={i === 0}
                last={i === blocks.length - 1}
                colorImages={settings.colorImages}
                onUpdate={onUpdate}
                onRemove={onRemove}
                onMove={onMove}
              />
            ))}

            {blocks.length === 0 && (
              <div className="text-muted-foreground anim-flicker flex flex-col items-center gap-2 py-8 text-center">
                <QuillScrollIcon size={40} className="text-primary/70" />
                <p className="font-heading text-[13px]">
                  Thy parchment awaits — add a block below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky add-block footer ───────────────────────────────── */}
        <div className="tex-wood shrink-0 border-t border-[oklch(0.58_0.1_76)] px-3 py-2.5 shadow-[0_-3px_10px_oklch(0_0_0_/_0.4)]">
          <p className="text-primary font-heading mb-2 text-[14px] font-semibold tracking-wide">
            Add a block
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant="secondary"
                sfx="add"
                className="h-7 text-[11px]"
                onClick={() => onAdd(t)}
              >
                + {BLOCK_LABELS[t]}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

function BlockCard({
  block,
  first,
  last,
  colorImages,
  onUpdate,
  onRemove,
  onMove,
}: {
  block: Block;
  first: boolean;
  last: boolean;
  colorImages: boolean;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const [pendingRemove, setPendingRemove] = useState(false);
  return (
    <Card size="sm" className="anim-wobble-in">
      <CardHeader className="border-border items-center border-b">
        <CardTitle className="text-muted-foreground font-semibold tracking-widest uppercase">
          {BLOCK_LABELS[block.type]}
        </CardTitle>
        <CardAction className="flex items-center gap-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            disabled={first}
            onClick={() => onMove(block.id, -1)}
          >
            <ArrowUpIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            disabled={last}
            onClick={() => onMove(block.id, 1)}
          >
            <ArrowDownIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            onClick={() => setPendingRemove(true)}
          >
            <BombIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <BlockFields
          block={block}
          onUpdate={onUpdate}
          colorImages={colorImages}
        />
      </CardContent>

      <AlertDialog
        open={pendingRemove}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(false);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this block?</AlertDialogTitle>
            <AlertDialogDescription>
              The {BLOCK_LABELS[block.type].toLowerCase()} block and all its
              content will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              sfx="delete"
              onClick={(e) => {
                boomAt(e.currentTarget);
                setPendingRemove(false);
                onRemove(block.id);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function BlockFields({
  block,
  onUpdate,
  colorImages,
}: {
  block: Block;
  onUpdate: (id: string, patch: BlockPatch) => void;
  colorImages: boolean;
}) {
  switch (block.type) {
    case 'article':
      return (
        <>
          <Input
            className="font-semibold"
            placeholder="Headline"
            value={block.headline}
            onChange={(e) => onUpdate(block.id, { headline: e.target.value })}
          />
          <Input
            placeholder="Byline (optional)"
            value={block.byline}
            onChange={(e) => onUpdate(block.id, { byline: e.target.value })}
          />
          <ArticleBody
            value={block.body}
            onChange={(body) => onUpdate(block.id, { body })}
          />
        </>
      );
    case 'advice':
      return <AdviceFields block={block} onUpdate={onUpdate} />;
    case 'imageset':
      return (
        <ImageSetFields
          block={block}
          onUpdate={onUpdate}
          colorImages={colorImages}
        />
      );
  }
}

function AdviceFields({
  block,
  onUpdate,
}: {
  block: AdviceBlock;
  onUpdate: (id: string, patch: BlockPatch) => void;
}) {
  const [pendingAdviceId, setPendingAdviceId] = useState<string | null>(null);
  const setItems = (items: AdviceBlock['items']) =>
    onUpdate(block.id, { items });
  return (
    <>
      <Input
        placeholder="Column title"
        value={block.title}
        onChange={(e) => onUpdate(block.id, { title: e.target.value })}
      />
      {block.items.map((it, idx) => (
        <div key={it.id} className="bg-muted/50 rounded-lg p-2.5">
          <Input
            className="mb-1.5"
            placeholder="Question"
            value={it.question}
            onChange={(e) =>
              setItems(
                block.items.map((x) =>
                  x.id === it.id ? { ...x, question: e.target.value } : x,
                ),
              )
            }
          />
          <Textarea
            rows={2}
            placeholder="Answer"
            value={it.answer}
            onChange={(e) =>
              setItems(
                block.items.map((x) =>
                  x.id === it.id ? { ...x, answer: e.target.value } : x,
                ),
              )
            }
          />
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-destructive mt-1 h-6 text-[11px]"
            onClick={() => setPendingAdviceId(it.id)}
          >
            remove Q&A {idx + 1}
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        sfx="add"
        className="self-start text-[11px]"
        onClick={() =>
          setItems([
            ...block.items,
            {
              id: Math.random().toString(36).slice(2),
              question: '',
              answer: '',
            },
          ])
        }
      >
        + Add Q&A
      </Button>

      <AlertDialog
        open={pendingAdviceId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAdviceId(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this Q&amp;A item?</AlertDialogTitle>
            <AlertDialogDescription>
              This question and answer will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              sfx="delete"
              onClick={(e) => {
                boomAt(e.currentTarget);
                if (pendingAdviceId) {
                  setItems(block.items.filter((x) => x.id !== pendingAdviceId));
                }
                setPendingAdviceId(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const BORDER_LABELS: Record<ImageBorder, string> = {
  none: 'No border',
  single: 'Single border',
  double: 'Double border',
  dashed: 'Dashed border',
};

function ImageSetFields({
  block,
  onUpdate,
  colorImages,
}: {
  block: ImageSetBlock;
  onUpdate: (id: string, patch: BlockPatch) => void;
  colorImages: boolean;
}) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const setImages = (images: ImageSetBlock['images']) =>
    onUpdate(block.id, { images });
  const updateImage = (
    id: string,
    patch: Partial<ImageSetBlock['images'][number]>,
  ) =>
    setImages(
      block.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    );
  const moveImage = (id: string, dir: -1 | 1) => {
    const i = block.images.findIndex((img) => img.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= block.images.length) return;
    const images = [...block.images];
    [images[i], images[j]] = [images[j], images[i]];
    setImages(images);
  };

  return (
    <>
      {block.images.map((img, idx) => {
        const url = imageUrl(img.imageId);
        return (
          <div key={img.id} className="bg-muted/50 flex gap-2 rounded-lg p-2">
            {/* Thumbnail — click to replace */}
            <button
              type="button"
              title={url ? 'Click to replace image' : 'Click to add image'}
              className="border-border text-muted-foreground flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed text-[10px] hover:opacity-80"
              onClick={() =>
                pickImageFile((file) =>
                  updateImage(img.id, { imageId: putImage(file) }),
                )
              }
            >
              {url ? (
                <img
                  src={url}
                  alt=""
                  className={`h-full w-full object-cover${colorImages ? '' : 'grayscale'}`}
                />
              ) : (
                <span>add</span>
              )}
            </button>

            {/* Caption + border + remove */}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Input
                placeholder="Caption"
                value={img.caption}
                onChange={(e) =>
                  updateImage(img.id, { caption: e.target.value })
                }
              />
              <div className="flex items-center gap-1.5">
                <Select
                  value={img.border}
                  onValueChange={(v) =>
                    v && updateImage(img.id, { border: v as ImageBorder })
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="h-6 w-30 text-xs focus-visible:ring-0"
                  >
                    {BORDER_LABELS[img.border]}
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BORDER_LABELS) as ImageBorder[]).map((b) => (
                      <SelectItem key={b} value={b} className="text-xs">
                        {BORDER_LABELS[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:bg-destructive/20 hover:text-destructive ml-auto size-6"
                  onClick={() => setPendingRemoveId(img.id)}
                >
                  <BombIcon size={13} />
                </Button>
              </div>
            </div>

            {/* Move up/down */}
            <div className="flex shrink-0 flex-col justify-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground size-6 disabled:opacity-30"
                disabled={idx === 0}
                onClick={() => moveImage(img.id, -1)}
              >
                <ArrowUpIcon size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground size-6 disabled:opacity-30"
                disabled={idx === block.images.length - 1}
                onClick={() => moveImage(img.id, 1)}
              >
                <ArrowDownIcon size={13} />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        variant="secondary"
        size="sm"
        sfx="add"
        className="self-start text-[11px]"
        onClick={() =>
          pickImageFile((file) =>
            setImages([
              ...block.images,
              {
                id: newId('img'),
                imageId: putImage(file),
                caption: '',
                border: 'single',
              },
            ]),
          )
        }
      >
        + Add image
      </Button>

      <AlertDialog
        open={pendingRemoveId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this image?</AlertDialogTitle>
            <AlertDialogDescription>
              The image and its caption will be removed from this block.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              sfx="delete"
              onClick={(e) => {
                boomAt(e.currentTarget);
                if (pendingRemoveId) {
                  setImages(
                    block.images.filter((x) => x.id !== pendingRemoveId),
                  );
                }
                setPendingRemoveId(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
