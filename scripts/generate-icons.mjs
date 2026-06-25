// Generates solid-color PNG icons for the PWA manifest.
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(d.length);
  const crc = Buffer.allocUnsafe(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crc]);
}

function solidPNG(size, r, g, b) {
  const stride = size * 3 + 1; // filter byte + RGB per row
  const raw = Buffer.allocUnsafe(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const off = y * stride + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG sig
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });

// slate-900: #0f172a = rgb(15, 23, 42)
writeFileSync('public/icon-192.png', solidPNG(192, 15, 23, 42));
writeFileSync('public/icon-512.png', solidPNG(512, 15, 23, 42));
writeFileSync('public/apple-touch-icon.png', solidPNG(180, 15, 23, 42));
console.log('Icons written to public/');
