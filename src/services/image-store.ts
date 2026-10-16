import { newId } from '@/utils/ids';
import type { PrintBlob } from './image-optimize';

interface Entry {
  blob: PrintBlob;
  url: string;
}

const store = new Map<string, Entry>();

/** Add a new image, returns its generated id. */
export function putImage(blob: PrintBlob): string {
  const id = newId('img');
  store.set(id, { blob, url: URL.createObjectURL(blob) });
  return id;
}

/** Restore an image under a known id (used when loading a file). */
export function putImageWithId(id: string, blob: PrintBlob): void {
  const existing = store.get(id);
  if (existing) URL.revokeObjectURL(existing.url);
  store.set(id, { blob, url: URL.createObjectURL(blob) });
}

export function imageUrl(id: string | null | undefined): string | undefined {
  return id ? store.get(id)?.url : undefined;
}

export function imageBlob(id: string): PrintBlob | undefined {
  return store.get(id)?.blob;
}

/** Revoke all object URLs and empty the store (used before loading a file). */
export function clearImages(): void {
  for (const { url } of store.values()) URL.revokeObjectURL(url);
  store.clear();
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export function extForMime(mime: string): string {
  return MIME_EXT[mime] ?? 'bin';
}
