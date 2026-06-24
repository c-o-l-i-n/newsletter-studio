// Serialize a Newsletter to / from the .newsletter container: a zip holding
// manifest.json (publication + blocks, with imageId references) plus the
// original image bytes under images/. See docs/adr/0003-file-format.md.

import JSZip from "jszip";
import type { Block, ImageBorder, Newsletter, Publication } from "@/types";
import { newId } from "@/utils/ids";
import {
  clearImages,
  extForMime,
  imageBlob,
  putImageWithId,
} from "./image-store";

const FORMAT_VERSION = 1;

interface ImageEntry {
  id: string;
  path: string;
  mime: string;
}
interface Manifest {
  formatVersion: number;
  publication: Publication;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[];
  images: ImageEntry[];
}

/** Collect every imageId referenced by the newsletter's blocks. */
function usedImageIds(nl: Newsletter): string[] {
  const ids = new Set<string>();
  for (const b of nl.blocks) {
    if (b.type === "imageset") b.images.forEach((i) => { if (i.imageId) ids.add(i.imageId); });
  }
  return [...ids];
}

/**
 * Convert blocks written by old versions of the app (photoset, ad, puzzle)
 * to the current imageset type. Safe to call on already-migrated data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateBlocks(rawBlocks: any[]): Block[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rawBlocks.map((b: any): Block => {
    if (b.type === "photoset") {
      return {
        id: b.id,
        type: "imageset",
        images: (b.photos ?? []).map((p: { id: string; imageId: string; caption: string }) => ({
          id: p.id,
          imageId: p.imageId ?? null,
          caption: p.caption ?? "",
          border: "single" as ImageBorder,
        })),
      };
    }
    if (b.type === "ad") {
      return {
        id: b.id,
        type: "imageset",
        images: [{
          id: newId("img"),
          imageId: b.imageId ?? null,
          caption: b.caption ?? "",
          border: "double" as ImageBorder,
        }],
      };
    }
    if (b.type === "puzzle") {
      const caption = [b.title, b.caption].filter(Boolean).join(" — ");
      return {
        id: b.id,
        type: "imageset",
        images: [{
          id: newId("img"),
          imageId: b.imageId ?? null,
          caption,
          border: "single" as ImageBorder,
        }],
      };
    }
    return b as Block;
  });
}

export async function newsletterToZipBlob(nl: Newsletter): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder("images")!;
  const images: ImageEntry[] = [];

  for (const id of usedImageIds(nl)) {
    const blob = imageBlob(id);
    if (!blob) continue; // referenced but missing bytes — skip defensively
    const ext = extForMime(blob.type);
    const filename = `${id}.${ext}`;
    folder.file(filename, blob);
    images.push({ id, path: `images/${filename}`, mime: blob.type });
  }

  const manifest: Manifest = {
    formatVersion: FORMAT_VERSION,
    publication: nl.publication,
    blocks: nl.blocks,
    images,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: "blob" });
}

/**
 * Parse a .newsletter blob. Repopulates the image store (clearing it first),
 * so it has the side effect of replacing the session's images.
 */
export async function zipBlobToNewsletter(blob: Blob): Promise<Newsletter> {
  const zip = await JSZip.loadAsync(blob);
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile)
    throw new Error("Not a .newsletter file (manifest.json missing).");

  const manifest = JSON.parse(await manifestFile.async("string")) as Manifest;
  if (manifest.formatVersion > FORMAT_VERSION)
    throw new Error(
      `This file was made by a newer version (format ${manifest.formatVersion}).`
    );

  clearImages();
  for (const img of manifest.images ?? []) {
    const f = zip.file(img.path);
    if (!f) continue;
    const raw = await f.async("blob");
    const typed = raw.type
      ? raw
      : new Blob([await raw.arrayBuffer()], { type: img.mime });
    putImageWithId(img.id, typed);
  }

  return { publication: manifest.publication, blocks: migrateBlocks(manifest.blocks) };
}
