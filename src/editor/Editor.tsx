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
} from "../types";
import { BLOCK_LABELS, newId } from "../types";
import { imageUrl, putImage } from "../imageStore";
import { ArticleBody } from "./ArticleEditor";

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

const input =
  "w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400";
const label = "block text-xs font-medium uppercase tracking-wide text-stone-500";

export interface EditorProps {
  newsletter: Newsletter;
  onPublication: (patch: Partial<Publication>) => void;
  onAdd: (type: BlockType) => void;
  onUpdate: (id: string, patch: BlockPatch) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export function Editor({
  newsletter,
  onPublication,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: EditorProps) {
  const { publication: p, blocks } = newsletter;
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Masthead */}
      <section className="rounded-lg border border-stone-300 bg-stone-50 p-3">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">
          Masthead
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2">
            <span className={label}>Publication name</span>
            <input
              className={input}
              value={p.name}
              onChange={(e) => onPublication({ name: e.target.value })}
            />
          </label>
          <label className="col-span-2">
            <span className={label}>Tagline</span>
            <input
              className={input}
              value={p.tagline}
              onChange={(e) => onPublication({ tagline: e.target.value })}
            />
          </label>
          <label>
            <span className={label}>Issue</span>
            <input
              className={input}
              value={p.issueLabel}
              onChange={(e) => onPublication({ issueLabel: e.target.value })}
            />
          </label>
          <label>
            <span className={label}>Date</span>
            <input
              className={input}
              value={p.date}
              onChange={(e) => onPublication({ date: e.target.value })}
            />
          </label>
        </div>
      </section>

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
      <section className="rounded-lg border border-dashed border-stone-400 p-3">
        <h2 className={label}>Add a block</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
            <button
              key={t}
              onClick={() => onAdd(t)}
              className="rounded-md bg-stone-800 px-3 py-1 text-sm text-white hover:bg-stone-700"
            >
              + {BLOCK_LABELS[t]}
            </button>
          ))}
        </div>
      </section>
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
    <section className="rounded-lg border border-stone-300 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-stone-200 px-3 py-1.5">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex gap-1">
          <IconBtn disabled={first} onClick={() => onMove(block.id, -1)}>
            ↑
          </IconBtn>
          <IconBtn disabled={last} onClick={() => onMove(block.id, 1)}>
            ↓
          </IconBtn>
          <IconBtn onClick={() => onRemove(block.id)} danger>
            ✕
          </IconBtn>
        </div>
      </header>
      <div className="flex flex-col gap-2 p-3">
        <BlockFields block={block} onUpdate={onUpdate} />
      </div>
    </section>
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
          <input
            className={`${input} text-base font-semibold`}
            placeholder="Headline"
            value={block.headline}
            onChange={(e) => onUpdate(block.id, { headline: e.target.value })}
          />
          <input
            className={input}
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
      <input
        className={input}
        placeholder="Column title"
        value={block.title}
        onChange={(e) => onUpdate(block.id, { title: e.target.value })}
      />
      {block.items.map((it, idx) => (
        <div key={it.id} className="rounded-md bg-stone-50 p-2">
          <input
            className={`${input} mb-1`}
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
          <textarea
            className={input}
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
          <button
            className="mt-1 text-xs text-red-600 hover:underline"
            onClick={() => setItems(block.items.filter((x) => x.id !== it.id))}
          >
            remove Q&A {idx + 1}
          </button>
        </div>
      ))}
      <button
        className="self-start rounded bg-stone-200 px-2 py-1 text-sm hover:bg-stone-300"
        onClick={() =>
          setItems([
            ...block.items,
            { id: Math.random().toString(36).slice(2), question: "", answer: "" },
          ])
        }
      >
        + add Q&A
      </button>
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
            <input
              className={input}
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
            <button
              className="mt-1 text-xs text-red-600 hover:underline"
              onClick={() =>
                setPhotos(block.photos.filter((x) => x.id !== ph.id))
              }
            >
              remove photo
            </button>
          </div>
        </div>
      ))}
      <button
        className="self-start rounded bg-stone-200 px-2 py-1 text-sm hover:bg-stone-300"
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
      </button>
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
      <input
        className={input}
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
      <input
        className={input}
        placeholder="Puzzle title (e.g. This Month's Crossword)"
        value={block.title}
        onChange={(e) => onUpdate(block.id, { title: e.target.value })}
      />
      <ImageField
        imageId={block.imageId}
        onChange={(imageId) => onUpdate(block.id, { imageId })}
      />
      <input
        className={input}
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
      <button
        className="rounded bg-stone-200 px-2 py-1 text-sm hover:bg-stone-300"
        onClick={() => pickImageFile((file) => onChange(putImage(file)))}
      >
        {imageId ? "replace" : "add"} image
      </button>
      {imageId && (
        <button
          className="text-xs text-red-600 hover:underline"
          onClick={() => onChange(null)}
        >
          clear
        </button>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-6 w-6 rounded text-sm ${
        disabled
          ? "cursor-not-allowed text-stone-300"
          : danger
          ? "text-red-600 hover:bg-red-50"
          : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}
