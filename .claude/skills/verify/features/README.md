# Newsletter Studio verification map

This directory is the maintained source for verifying what an author can do in Newsletter Studio. Read this index before you drive the app, then follow the matching feature file as the recipe. If a feature has several entry points, prove each one you claim. Driving one convenient path does not verify the others.

## Baseline preconditions

- Start a run with `.claude/skills/verify/scripts/ns up [--prod] --fs <mode>` and export `NS_RUN` from its output. Each feature file says which `--fs` mode it needs and whether it needs `--prod`.
- `ns doctor` exits 0. Each run gets a fresh Chromium profile, so OPFS, IndexedDB, and localStorage start empty.
- A fresh profile opens on the seed newsletter. Its Masthead reads `Newsletter Studio`, `Iss. I, Vol. 1`, the current month and year, and `Your Town`. It has 7 blocks in order: Article, Image Set, Article, Image Set, Article, Article, Image Set. The format is `Booklet (saddle-stitch)` on `Letter` paper with `B&W` images. The titlebar shows `new file` and `3 pages`. The badge reads `saved` in a `--prod` run and `unsaved` in a dev run. That difference is a dev-only StrictMode artifact described in `SKILL.md`. The 3 seed images load just after first paint, so wait until `ns count --css "#reading-root img"` reports 3.
- Never drive an instance this run did not start. The user's own dev server, usually on 5173, is off limits.

## Driving conventions

- Every command below is `ns`, short for `.claude/skills/verify/scripts/ns`, run from the repo root.
- Run `ns settle` after any edit before you assert on the preview, the page count, or the save badge. Flow and autosave are debounced, and a fixed sleep is not a substitute.
- Scope titlebar reads to `--css header.titlebar` and preview reads to `--in "#reading-root"`. Two `banner` roles exist, and the hidden `#print-root` duplicates every preview string.
- Icon-only buttons have no accessible names. These are block move and remove, image move and remove, and zoom. Reach them through the `--css` chains given in each file.
- Confirm dialogs are `alertdialog` roles. Read them with `ns text --role alertdialog` before you choose a button.

## Proof and skip reporting

- Capture the action and the resulting state. Save a snapshot or screenshot before and after, plus the `ns settle` titlebar line.
- UI proof is a `shot` with the titlebar visible plus a `snapshot` or `text` read of the changed region.
- Any proof that writes a file also needs a read-only second view of the stored bytes. Use `unzip -p <file> manifest.json` on a download or an `opfs-get` copy.
- Record the feature ID, the entry point, and the `--fs` mode with every artifact. A stub-mode proof must say that the OS file dialog was stubbed.
- If an entry point cannot be reached headless (`Print Now`, a double-clicked `.newsletter` file, PWA install), report it as skipped. Include the reason. Do not substitute another path.
- Evidence lives in `/tmp/ns-verify-evidence/<run>/` and survives `ns down`.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph that describes the user-visible behavior. Four H2 sections follow, in this order:

1. `Sub-features` gives each behavior a short ID and one line.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with ns` starts with `Preconditions:`. Each labeled bullet pairs a user action with an exact command and an observable result.
4. `Gotchas` lists traps that can waste or invalidate a run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Edit content](./edit-content.md) covers Masthead fields, adding, moving, and removing blocks, article rich text, and the advice column.
- [Image sets](./image-sets.md) covers adding and replacing images, captions, borders, two-column layout, B&W versus color, and print downscaling.
- [Formats and preview](./formats-preview.md) covers format switching, paper size, the panel gauge and overset, and zoom.
- [Save, open, and recovery](./save-open.md) covers New, Open, Save, Save As, Download, autosave, reopening the last file, crash restore, and shortcuts.
- [Print](./print.md) covers the print-instructions dialog and the imposed print output as a PDF.
