# 0003 — Persistence: single bundled `.newsletter` file via File System Access

Each newsletter is one portable file with a custom `.newsletter` extension — a zip
container holding `manifest.json` (blocks, order, metadata) plus the original images under
`images/`. The app opens and saves it directly through the **File System Access API**
(Chromium on macOS/Windows is assumed) with autosave back to the same file handle. **OPFS**
holds a silent, crash-safe working cache, but the file on disk is the source of truth.

We chose this over an **OPFS/IndexedDB-primary in-app library** (issues invisible in
Finder, weaker "a file per newsletter on my computer" feel) and over a **folder per
newsletter** (clutter; not "a file"). The single-file model matches the author's mental
model: issues are objects they can see, move, copy, and back up in Finder.

## Consequences

- Targets Chromium browsers; Safari (no File System Access) is explicitly out of scope.
- Original images are stored (not just processed versions), keeping the file self-contained
  and re-editable, at the cost of file size.
- The zip layout and `manifest.json` schema are a compatibility surface — version the
  manifest from day one (`formatVersion`, currently 1).

## Amendment — Brave disables File System Access (discovered in the editor build)

The primary browser (Brave) **disables the File System Access API by default**, so
`showOpenFilePicker`/`showSaveFilePicker` are absent even though Brave is Chromium. The
zip `.newsletter` format is unchanged, but the I/O mechanism now has two paths, chosen at
runtime by feature detection:

- **FSA available** (Chrome/Edge, or Brave with the flag enabled): open/save a real file
  handle with debounced **autosave** back to it.
- **FSA absent** (Brave default): **download** to save, **file input** to open. No
  autosave-to-file; the **OPFS crash cache** is the safety net for unsaved work.

OPFS (`navigator.storage.getDirectory`) is available in Brave, so the crash cache works in
both paths. Persisting the file handle across reloads (IndexedDB) remains a possible
enhancement for the FSA path only.
