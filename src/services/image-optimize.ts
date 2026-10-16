// The one place that decides how image bytes are stored. Every blob in the
// image store has been through encodeForPrint, so a saved file never carries
// camera-resolution originals (see docs/adr/0003-file-format.md).
//
// MAX_EDGE_PX = 2000 gives 420+ ppi for a full-width booklet image (at most
// ~4.75in on its long edge) and ~270 ppi for the widest panorama on a full
// Letter page. A 600 dpi printer can't show photographic detail beyond that.
export const MAX_EDGE_PX = 2000;
export const JPEG_QUALITY = 0.8;

/** A rectangle in source pixels, measured on the EXIF-oriented image. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A blob that already meets the print policy; the image store holds only these. */
export type PrintBlob = Blob & { readonly __print: unique symbol };

/** Trust bytes that were optimized before, e.g. a manifest entry marked `optimized`. */
export const asPrintBlob = (blob: Blob) => blob as PrintBlob;

async function decode(blob: Blob): Promise<ImageBitmap> {
  // 'from-image' bakes in EXIF orientation so rotated phone photos stay
  // upright once we drop the metadata on re-encode.
  if (blob.type !== 'image/svg+xml')
    return createImageBitmap(blob, { imageOrientation: 'from-image' });
  // Chromium's createImageBitmap rejects SVG blobs; an <img> rasterizes them.
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Crop (if given), cap the long edge at MAX_EDGE_PX, flatten onto white, and
 * encode as JPEG. Without a crop the input is kept unless the output is under
 * 90% of its size, so a second pass over an encoded image is a no-op.
 */
export async function encodeForPrint(
  blob: Blob,
  crop?: CropRect,
): Promise<PrintBlob> {
  const isRaster =
    blob.type.startsWith('image/') && blob.type !== 'image/svg+xml';
  if (!crop && !isRaster) return asPrintBlob(blob);

  let bitmap: ImageBitmap;
  try {
    bitmap = await decode(blob);
  } catch {
    return asPrintBlob(blob); // undecodable in this browser; leave it untouched
  }

  try {
    const src = crop ?? {
      x: 0,
      y: 0,
      width: bitmap.width,
      height: bitmap.height,
    };
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(src.width, src.height));
    const w = Math.max(1, Math.round(src.width * scale));
    const h = Math.max(1, Math.round(src.height * scale));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    // JPEG has no alpha; without this, transparent pixels encode as black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, src.x, src.y, src.width, src.height, 0, 0, w, h);
    const out = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: JPEG_QUALITY,
    });
    return asPrintBlob(crop || out.size < blob.size * 0.9 ? out : blob);
  } finally {
    bitmap.close();
  }
}
