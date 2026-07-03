// Downscale + recompress imported photos so they don't overwhelm the printer.
//
// A high-resolution phone photo (often 12–24 MP, several MB) embedded at full
// resolution forces the print pipeline to hold an enormous bitmap for every
// copy of every page it lays out — that is what triggers the printer's
// out-of-memory error after only a few copies. We cap the longest edge and
// re-encode as JPEG.
//
// MAX_EDGE_PX = 3000 spans a full Letter/A4 page (~10in of printable width) at
// roughly 300 ppi. Photographic images are already indistinguishable at 300 ppi
// on a 600 dpi printer — the printer dithers finer detail than a photo actually
// carries — so prints stay crisp while the byte count drops by an order of
// magnitude. Images placed in a column or half-page (the common case) end up at
// 600+ ppi, comfortably matching the printer's full resolution.
const MAX_EDGE_PX = 3000;
const JPEG_QUALITY = 0.82;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
  });
}

/**
 * Return a print-optimized version of an image blob: capped to MAX_EDGE_PX on
 * its longest side and re-encoded as JPEG. If the image is already small and
 * already a JPEG (so re-encoding would only shed quality), or if optimizing
 * fails or wouldn't shrink it, the original blob is returned unchanged.
 */
export async function downscaleForPrint(blob: Blob): Promise<Blob> {
  // Vector art and non-images have no pixel resolution to reduce.
  if (!blob.type.startsWith('image/') || blob.type === 'image/svg+xml') {
    return blob;
  }

  let bitmap: ImageBitmap;
  try {
    // 'from-image' bakes in EXIF orientation so rotated phone photos stay
    // upright once we drop the metadata on re-encode.
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    return blob; // undecodable in this browser — leave it untouched
  }

  try {
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    const scale = longest > MAX_EDGE_PX ? MAX_EDGE_PX / longest : 1;

    // Already within budget and already JPEG: recompressing would only degrade
    // it (and repeated passes would compound), so keep the original bytes.
    if (scale === 1 && blob.type === 'image/jpeg') return blob;

    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;

    ctx.imageSmoothingQuality = 'high';
    // JPEG has no alpha, so flatten transparency onto white first — the page is
    // white paper, and without this transparent pixels would encode as black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    const out = await canvasToBlob(canvas, JPEG_QUALITY);
    // Never inflate an already-lean image (e.g. a small optimized PNG).
    return out && out.size < blob.size ? out : blob;
  } finally {
    bitmap.close();
  }
}
