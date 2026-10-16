import type { Block, BlockType, ImageItem } from '@/types';
import { newId } from './ids';
import { emptyDoc } from './tiptap';

export function makeBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case 'article':
      return { id, type, headline: '', byline: '', body: emptyDoc };
    case 'advice':
      return {
        id,
        type,
        title: 'Ask the Editor',
        items: [{ id: newId('i'), question: '', answer: '' }],
      };
    case 'imageset':
      return { id, type, images: [], columns: 1 };
  }
}

export function makeImageItem(imageId: string): ImageItem {
  return { id: newId('img'), imageId, caption: '', border: 'single' };
}
