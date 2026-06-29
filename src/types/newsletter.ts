import type { JSONContent } from '@tiptap/react';
import type { FormatId } from './formats';

export type BlockId = string;

export interface ArticleBlock {
  id: BlockId;
  type: 'article';
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
  type: 'advice';
  title: string;
  items: AdviceItem[];
}

export type ImageBorder = 'none' | 'single' | 'double' | 'dashed';

export interface ImageItem {
  id: string;
  /** key into the image store; bytes are persisted in the .newsletter file */
  imageId: string | null;
  caption: string;
  border: ImageBorder;
}
export interface ImageSetBlock {
  id: BlockId;
  type: 'imageset';
  images: ImageItem[];
}

export type Block = ArticleBlock | AdviceBlock | ImageSetBlock;

export type BlockType = Block['type'];

// Partial<Block> over a union keeps only common keys (id, type). We want a
// per-variant partial so block-specific field patches typecheck.
export type BlockPatch =
  | Partial<ArticleBlock>
  | Partial<AdviceBlock>
  | Partial<ImageSetBlock>;

export interface Publication {
  name: string;
  location: string;
  issueLabel: string;
  date: string;
}

export type PaperSize = 'letter' | 'a4';

export interface NewsletterSettings {
  formatId: FormatId;
  paperSize: PaperSize;
  colorImages: boolean;
}

export const DEFAULT_SETTINGS: NewsletterSettings = {
  formatId: 'booklet',
  paperSize: 'letter',
  colorImages: false,
};

export interface Newsletter {
  publication: Publication;
  blocks: Block[];
  settings: NewsletterSettings;
}
