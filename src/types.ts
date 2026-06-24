// The real content model (replaces the spike's hardcoded sample).
// A Newsletter is a flat, ordered list of typed Blocks. See CONTEXT.md and
// docs/adr/0001-content-model.md. Text Blocks (Article, Advice) flow + split;
// Media Blocks (PhotoSet, Ad, Puzzle) are atomic.

import type { JSONContent } from "@tiptap/react";

export type BlockId = string;

export interface ArticleBlock {
  id: BlockId;
  type: "article";
  headline: string;
  byline: string;
  /** TipTap/ProseMirror document JSON — constrained marks only */
  body: JSONContent;
}

export interface AdviceItem {
  id: string;
  question: string;
  answer: string;
}
export interface AdviceBlock {
  id: BlockId;
  type: "advice";
  title: string;
  items: AdviceItem[];
}

export interface Photo {
  id: string;
  /** key into the image store; bytes are persisted in the .newsletter file */
  imageId: string;
  caption: string;
}
export interface PhotoSetBlock {
  id: BlockId;
  type: "photoset";
  photos: Photo[];
}

export interface AdBlock {
  id: BlockId;
  type: "ad";
  imageId: string | null;
  caption: string;
}

export interface PuzzleBlock {
  id: BlockId;
  type: "puzzle";
  title: string;
  imageId: string | null;
  caption: string;
}

export type Block =
  | ArticleBlock
  | AdviceBlock
  | PhotoSetBlock
  | AdBlock
  | PuzzleBlock;

export type BlockType = Block["type"];

// Partial<Block> over a union keeps only common keys (id, type). We want a
// per-variant partial so block-specific field patches typecheck.
export type BlockPatch =
  | Partial<ArticleBlock>
  | Partial<AdviceBlock>
  | Partial<PhotoSetBlock>
  | Partial<AdBlock>
  | Partial<PuzzleBlock>;

export interface Publication {
  name: string;
  tagline: string;
  issueLabel: string;
  date: string;
}

export interface Newsletter {
  publication: Publication;
  blocks: Block[];
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  article: "Article",
  advice: "Advice Column",
  photoset: "Photo Set",
  ad: "Advertisement",
  puzzle: "Puzzle",
};

let counter = 0;
export const newId = (prefix = "b"): string =>
  `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;
