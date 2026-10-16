// The only path from a file the author picked or dropped to an image id:
// decode HEIC if needed, let the author crop, encode for print, store.

import { requestCrop } from '@/components/crop-dialog';
import { encodeForPrint } from './image-optimize';
import { imageBlob, putImage } from './image-store';

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

async function importImage(
  file: File,
  progress: { index: number; total: number },
): Promise<string | null> {
  try {
    const blob = await toDecodable(file);
    const outcome = await requestCrop(blob, progress);
    if (outcome.type === 'skip') return null;
    return putImage(await encodeForPrint(blob, outcome.crop));
  } catch (e) {
    console.error(e);
    alert(`Could not add ${file.name}: ${(e as Error).message ?? e}`);
    return null;
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** Run jobs one at a time, so two imports never share the crop dialog. */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job);
  queue = run.catch(() => {});
  return run;
}

/**
 * Import files in order, each through the crop dialog. Non-image files, and
 * images that fail or that the author skips, are left out of the result.
 */
export function importImages(files: File[]): Promise<string[]> {
  return enqueue(async () => {
    const images = files.filter(isImageFile);
    const ids: string[] = [];
    for (const [i, file] of images.entries()) {
      const id = await importImage(file, {
        index: i + 1,
        total: images.length,
      });
      if (id) ids.push(id);
    }
    return ids;
  });
}

/** Crop a stored image again. Resolves to the new image id, or null if unchanged. */
export function recropImage(imageId: string): Promise<string | null> {
  return enqueue(async () => {
    const blob = imageBlob(imageId);
    if (!blob) return null;
    const outcome = await requestCrop(blob);
    if (outcome.type === 'skip' || !outcome.crop) return null;
    return putImage(await encodeForPrint(blob, outcome.crop));
  });
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
