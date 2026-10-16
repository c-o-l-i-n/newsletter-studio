// The only path from a file the author picked or dropped to an image id:
// decode HEIC if needed, encode for print, store.

import { encodeForPrint } from './image-optimize';
import { putImage } from './image-store';

export const IMAGE_ACCEPT = 'image/*,.heic,.heif';

const HEIF_EXT = /\.(heic|heif)$/i;

// Chrome on macOS can report a HEIC file with an empty type.
const isHeif = (file: File) =>
  /^image\/hei[cf]/.test(file.type) || HEIF_EXT.test(file.name);

export const isImageFile = (file: File) =>
  file.type.startsWith('image/') || HEIF_EXT.test(file.name);

/** A blob the browser can display and decode. */
async function toDecodable(file: File): Promise<Blob> {
  if (!isHeif(file)) return file;
  try {
    (await createImageBitmap(file)).close();
    return file;
  } catch {
    // Chromium has no HEIC decoder. PNG keeps the intermediate lossless, so
    // the JPEG encode in encodeForPrint is the only lossy pass.
    const { heicTo } = await import('heic-to');
    return heicTo({ blob: file, type: 'image/png' });
  }
}

async function importImage(file: File): Promise<string | null> {
  try {
    return putImage(await encodeForPrint(await toDecodable(file)));
  } catch (e) {
    console.error(e);
    alert(`Could not add ${file.name}: ${(e as Error).message ?? e}`);
    return null;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Import files one at a time, in order. Non-image files and images that fail
 * or are cancelled are left out of the result. Overlapping calls wait their turn.
 */
export function importImages(files: File[]): Promise<string[]> {
  const run = queue.then(async () => {
    const ids: string[] = [];
    for (const file of files.filter(isImageFile)) {
      const id = await importImage(file);
      if (id) ids.push(id);
    }
    return ids;
  });
  queue = run.catch(() => {});
  return run;
}

/** Open the OS file chooser for images. Resolves to [] if the author cancels. */
export function pickImageFiles({ multiple }: { multiple: boolean }) {
  return new Promise<File[]>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = IMAGE_ACCEPT;
    input.multiple = multiple;
    input.onchange = () => resolve([...(input.files ?? [])]);
    input.oncancel = () => resolve([]);
    input.click();
  });
}
