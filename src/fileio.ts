// File System Access (open/save the .newsletter file directly on disk) plus a
// silent OPFS crash cache. Chromium assumed (ADR 0003).

import type { Newsletter } from "./types";
import { newsletterToZipBlob, zipBlobToNewsletter } from "./newsletterFile";

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}
interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
}
interface SaveFilePickerOptions {
  types?: FilePickerAcceptType[];
  suggestedName?: string;
  excludeAcceptAllOption?: boolean;
}
declare global {
  interface Window {
    showOpenFilePicker(
      options?: OpenFilePickerOptions
    ): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(
      options?: SaveFilePickerOptions
    ): Promise<FileSystemFileHandle>;
  }
}

const PICKER_TYPES: FilePickerAcceptType[] = [
  {
    description: "Newsletter",
    accept: { "application/x-newsletter+zip": [".newsletter"] },
  },
];

export const isFileSystemAccessSupported = (): boolean =>
  typeof window !== "undefined" && "showSaveFilePicker" in window;

export function suggestedFileName(nl: Newsletter): string {
  const base = `${nl.publication.name} ${nl.publication.issueLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "newsletter"}.newsletter`;
}

export async function writeToHandle(
  handle: FileSystemFileHandle,
  nl: Newsletter
): Promise<void> {
  const blob = await newsletterToZipBlob(nl);
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function openNewsletterFile(): Promise<{
  newsletter: Newsletter;
  handle: FileSystemFileHandle;
  name: string;
}> {
  const [handle] = await window.showOpenFilePicker({
    types: PICKER_TYPES,
    multiple: false,
  });
  const file = await handle.getFile();
  const newsletter = await zipBlobToNewsletter(file);
  return { newsletter, handle, name: handle.name };
}

export async function saveNewsletterAs(
  nl: Newsletter
): Promise<{ handle: FileSystemFileHandle; name: string }> {
  const handle = await window.showSaveFilePicker({
    suggestedName: suggestedFileName(nl),
    types: PICKER_TYPES,
  });
  await writeToHandle(handle, nl);
  return { handle, name: handle.name };
}

export const isAbortError = (e: unknown): boolean =>
  e instanceof DOMException && e.name === "AbortError";

// ---- Fallback for browsers without File System Access (e.g. Brave, which
// disables it by default): plain download to save, file input to open. No
// autosave-to-file is possible, so the OPFS crash cache carries the safety net.

export async function downloadNewsletter(nl: Newsletter): Promise<string> {
  const blob = await newsletterToZipBlob(nl);
  const name = suggestedFileName(nl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return name;
}

export function pickNewsletterFile(): Promise<{
  newsletter: Newsletter;
  name: string;
} | null> {
  return new Promise((resolve, reject) => {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = ".newsletter,application/zip";
    i.onchange = async () => {
      const f = i.files?.[0];
      if (!f) {
        resolve(null);
        return;
      }
      try {
        resolve({ newsletter: await zipBlobToNewsletter(f), name: f.name });
      } catch (e) {
        reject(e);
      }
    };
    i.click();
  });
}

// ---- OPFS crash cache: a silent snapshot so unsaved work survives a crash ----

const CRASH_FILE = "crash-autosave.newsletter";

export async function writeCrashCache(nl: Newsletter): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(CRASH_FILE, { create: true });
    const writable = await fh.createWritable();
    await writable.write(await newsletterToZipBlob(nl));
    await writable.close();
  } catch {
    /* best effort */
  }
}

export async function hasCrashCache(): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(CRASH_FILE);
    const file = await fh.getFile();
    return file.size > 0;
  } catch {
    return false;
  }
}

export async function readCrashCache(): Promise<Newsletter | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(CRASH_FILE);
    const file = await fh.getFile();
    if (file.size === 0) return null;
    return await zipBlobToNewsletter(file);
  } catch {
    return null;
  }
}

export async function clearCrashCache(): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(CRASH_FILE);
  } catch {
    /* best effort */
  }
}
