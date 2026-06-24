import type {
  AdviceBlock,
  AdBlock,
  Block,
  BlockPatch,
  BlockType,
  Newsletter,
  PhotoSetBlock,
  PuzzleBlock,
  Publication,
} from "@/types";
import { BLOCK_LABELS } from "@/constants";
import { newId } from "@/utils/ids.ts";
import { imageUrl, putImage } from "@/services/image-store.ts";
import { ArticleBody } from "../article-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function pickImageFile(cb: (file: File) => void) {
  const i = document.createElement("input");
  i.type = "file";
  i.accept = "image/*";
  i.onchange = () => {
    const f = i.files?.[0];
    if (f) cb(f);
  };
  i.click();
}

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-stone-500";

export interface BlockEditorProps {
  newsletter: Newsletter;
  onPublication: (patch: Partial<Publication>) => void;
  onAdd: (type: BlockType) => void;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export function BlockEditor({
  newsletter,
  onPublication,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: BlockEditorProps) {
  const { publication: p, blocks } = newsletter;
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Masthead */}
      <Card size="sm" className="bg-stone-50">
        <CardHeader className="border-b pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-stone-500">
            Masthead
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Label className={`col-span-2 flex-col items-start gap-1 ${fieldLabel}`}>
              Publication name
              <Input
                value={p.name}
                onChange={(e) => onPublication({ name: e.target.value })}
              />
            </Label>
            <Label className={`col-span-2 flex-col items-start gap-1 ${fieldLabel}`}>
              Tagline
              <Input
                value={p.tagline}
                onChange={(e) => onPublication({ tagline: e.target.value })}
              />
            </Label>
            <Label className={`flex-col items-start gap-1 ${fieldLabel}`}>
              Issue
              <Input
                value={p.issueLabel}
                onChange={(e) => onPublication({ issueLabel: e.target.value })}
              />
            </Label>
            <Label className={`flex-col items-start gap-1 ${fieldLabel}`}>
              Date
              <Input
                value={p.date}
                onChange={(e) => onPublication({ date: e.target.value })}
              />
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Blocks */}
      {blocks.map((block, i) => (
        <BlockCard
          key={block.id}
          block={block}
          first={i === 0}
          last={i === blocks.length - 1}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}

      {blocks.length === 0 && (
        <p className="text-center text-sm text-stone-500">
          No blocks yet. Add one below.
        </p>
      )}

      {/* Add block */}
      <Card size="sm" className="border border-dashed border-stone-400 bg-transparent ring-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Add a block
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
              <Button key={t} size="sm" onClick={() => onAdd(t)}>
                + {BLOCK_LABELS[t]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BlockCard({
  block,
  first,
  last,
  onUpdate,
  onRemove,
  onMove,
}: {
  block: Block;
  first: boolean;
  last: boolean;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b py-1.5">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-stone-500">
          {BLOCK_LABELS[block.type]}
        </CardTitle>
        <CardAction className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={first}
            onClick={() => onMove(block.id, -1)}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={last}
            onClick={() => onMove(block.id, 1)}
          >
            ↓
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-red-600 hover:bg-red-50 hover:text-red-600"
            onClick={() => onRemove(block.id)}
          >
            ✕
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-3">
        <BlockFields block={block} onUpdate={onUpdate} />
      </CardContent>
    </Card>
  );
}

function BlockFields({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (id: string, patch: BlockPatch) => void;
}) {
  switch (block.type) {
    case "article":
      return (
        <>
          <Input
            className="text-base font-semibold"
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
    case "advice":
      return <AdviceFields block={block} onUpdate={onUpdate} />;
    case "photoset":
      return <PhotoSetFields block={block} onUpdate={onUpdate} />;
    case "ad":
      return <AdFields block={block} onUpdate={onUpdate} />;
    case "puzzle":
      return <PuzzleFields block={block} onUpdate={onUpdate} />;
  }
}

function AdviceFields({
  block,
  onUpdate,
}: {
  block: AdviceBlock;
  onUpdate: (id: string, patch: BlockPatch) => void;
}) {
  const setItems = (items: AdviceBlock["items"]) =>
    onUpdate(block.id, { items });
  return (
    <>
      <Input
        placeholder="Column title"
        value={block.title}
        onChange={(e) => onUpdate(block.id, { title: e.target.value })}
      />
      {block.items.map((it, idx) => (
        <div key={it.id} className="rounded-md bg-stone-50 p-2">
          <Input
            className="mb-1"
            placeholder="Question"
            value={it.question}
            onChange={(e) =>
              setItems(
                block.items.map((x) =>
                  x.id === it.id ? { ...x, question: e.target.value } : x
                )
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
                  x.id === it.id ? { ...x, answer: e.target.value } : x
                )
              )
            }
          />
          <Button
            variant="ghost"
            size="xs"
            className="mt-1 text-red-600 hover:bg-red-50 hover:text-red-600"
            onClick={() => setItems(block.items.filter((x) => x.id !== it.id))}
          >
            remove Q&A {idx + 1}
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() =>
          setItems([
            ...block.items,
            { id: Math.random().toString(36).slice(2), question: "", answer: "" },
          ])
        }
      >
        + add Q&A
      </Button>
    </>
  );
}

function PhotoSetFields({
  block,
  onUpdate,
}: {
  block: PhotoSetBlock;
  onUpdate: (id: string, patch: BlockPatch) => void;
}) {
  const setPhotos = (photos: PhotoSetBlock["photos"]) =>
    onUpdate(block.id, { photos });
  return (
    <>
      {block.photos.map((ph) => (
        <div key={ph.id} className="flex gap-2 rounded-md bg-stone-50 p-2">
          <img
            src={imageUrl(ph.imageId)}
            alt=""
            className="h-16 w-16 rounded object-cover grayscale"
          />
          <div className="flex-1">
            <Input
              placeholder="Caption"
              value={ph.caption}
              onChange={(e) =>
                setPhotos(
                  block.photos.map((x) =>
                    x.id === ph.id ? { ...x, caption: e.target.value } : x
                  )
                )
              }
            />
            <Button
              variant="ghost"
              size="xs"
              className="mt-1 text-red-600 hover:bg-red-50 hover:text-red-600"
              onClick={() =>
                setPhotos(block.photos.filter((x) => x.id !== ph.id))
              }
            >
              remove photo
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() =>
          pickImageFile((file) =>
            setPhotos([
              ...block.photos,
              { id: newId("p"), imageId: putImage(file), caption: "" },
            ])
          )
        }
      >
        + add photo
      </Button>
    </>
  );
}

function AdFields({
  block,
  onUpdate,
}: {
  block: AdBlock;
  onUpdate: (id: string, patch: BlockPatch) => void;
}) {
  return (
    <>
      <ImageField
        imageId={block.imageId}
        onChange={(imageId) => onUpdate(block.id, { imageId })}
      />
      <Input
        placeholder="Caption / tagline"
        value={block.caption}
        onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
      />
    </>
  );
}

function PuzzleFields({
  block,
  onUpdate,
}: {
  block: PuzzleBlock;
  onUpdate: (id: string, patch: BlockPatch) => void;
}) {
  return (
    <>
      <Input
        placeholder="Puzzle title (e.g. This Month's Crossword)"
        value={block.title}
        onChange={(e) => onUpdate(block.id, { title: e.target.value })}
      />
      <ImageField
        imageId={block.imageId}
        onChange={(imageId) => onUpdate(block.id, { imageId })}
      />
      <Input
        placeholder="Caption"
        value={block.caption}
        onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
      />
    </>
  );
}

function ImageField({
  imageId,
  onChange,
}: {
  imageId: string | null;
  onChange: (imageId: string | null) => void;
}) {
  const url = imageUrl(imageId);
  return (
    <div className="flex items-center gap-2">
      {url ? (
        <img src={url} alt="" className="h-16 w-16 rounded object-cover grayscale" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-stone-400 text-xs text-stone-400">
          none
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => pickImageFile((file) => onChange(putImage(file)))}
      >
        {imageId ? "replace" : "add"} image
      </Button>
      {imageId && (
        <Button
          variant="ghost"
          size="xs"
          className="text-red-600 hover:bg-red-50 hover:text-red-600"
          onClick={() => onChange(null)}
        >
          clear
        </Button>
      )}
    </div>
  );
}
