# Save, open, and recovery

The author keeps each newsletter as a `.newsletter` file on disk, a zip of `manifest.json` plus `images/`. In Chromium with File System Access, `Save As…` picks a file, and later edits autosave to it. On the next launch the app reopens that file. Without File System Access, as in Brave, `Download` saves a copy and `Open…` uses a file input. Either way, a silent crash cache in OPFS offers to restore unsaved work on the next launch.

## Sub-features

- `save-download` (no-FSA path) has the `Download` button download `<publication>-<issue>.newsletter` and set the badge to `saved`.
- `save-as` (FSA path) has `Save As…` write the chosen file, rename the button to `Save`, and set the badge to `saved`.
- `autosave` writes edits to the open file about 800ms after typing stops, with the badge going `unsaved`, then `saving…`, then `saved`.
- `open` loads a `.newsletter` file and replaces the blocks, Masthead, settings, and images.
- `reopen-last` reopens the last opened or saved file on launch with no prompt (FSA path).
- `crash-restore` shows `Restore unsaved work?` on launch when unsaved work exists and no file is attached. The choices are `Restore draft` and `Start fresh`.
- `new` clears all blocks and keeps the Masthead. When there are unsaved changes, it first asks `Start a new newsletter?`.
- `dirty-guard` has New and Open on unsaved work ask before discarding, with `Keep editing` or `Discard & …`.
- `shortcuts` maps `Ctrl`/`Cmd` + `S` to Save, `Shift+S` to Save As, `O` to Open, and `N` to New.

## How to get to it (user POV)

- Titlebar buttons `New`, `Open…`, and the save button. The save button reads `Save As…` before a file is attached, `Save` after, and `Download` without File System Access.
- Keyboard shortcuts `Ctrl`/`Cmd` + `S`, `Shift+S`, `O`, and `N`.
- Relaunch the app (`ns reload`) to trigger `reopen-last` or `crash-restore`.
- Double-click a `.newsletter` file in the installed PWA. This cannot be reached headless; report it as skipped.

## Driving it with ns

Preconditions:

- Use `--prod` for every recipe here. In dev, the seed autosaves to the crash cache on load, so the badge and the restore prompt do not match production. See `SKILL.md`.
- For `save-download`, `open`, and `crash-restore`, run `ns up --prod --fs fallback`.
- For `save-as`, `autosave`, and `reopen-last`, run `ns up --prod --fs stub`, and report that the OS file dialog was stubbed.
- `ns doctor` passes and reports `build=prod` and the expected `fs mode`.
- The seed newsletter is loaded, and the titlebar reads `new file · saved`. `ns opfs-ls` prints `[]`.

- **Download (fallback).** Edit, then save. Run `ns fill --label "Publication name" --value "The Verify Gazette"`, then `ns download --role button --name Download`. It prints `savedTo: …/downloads/the-verify-gazette-iss-i-vol-1.newsletter`. `ns settle` shows `the-verify-gazette-iss-i-vol-1.newsletter · | saved`. Then run `unzip -p <savedTo> manifest.json | grep '"name"'`, which shows `"name": "The Verify Gazette"`, and `unzip -l <savedTo>`, which lists `images/seed-*.webp`.
- **Shortcut save (fallback).** Make an edit, then save with the keyboard. Run `ns fill --label Location --value Shortcutville`, then `ns download --press ControlOrMeta+s --save downloads/shortcut.newsletter`. Then `ns settle` shows `saved`, and `unzip -p <savedTo> manifest.json | grep location` shows `Shortcutville`.
- **Open with dirty guard (fallback).** Make an edit, then open the downloaded file. Run `ns fill --label Location --value Elsewhere`, then `ns click --role button --name "Open…"`. `ns text --role alertdialog` shows `Open a different file?`. Then run `ns upload --role button --name "Discard & open" --file <savedTo>`, then `ns settle`. The titlebar shows the file name. `ns value --label Location` is back to `Your Town`, and the nameplate reads `The Verify Gazette`.
- **Crash restore (fallback).** Edit, then relaunch. Run `ns fill --label Location --value Bunnyville`, then `ns settle`. `ns opfs-ls` lists `crash-autosave.newsletter`. Run `ns reload`, then `ns wait --role alertdialog`. `ns text --role alertdialog` shows `Restore unsaved work?`. Run `ns click --role button --name "Restore draft"`, and `ns wait --in "#reading-root" --text Bunnyville` prints `ok`. To prove `Start fresh`, edit and reload again, then click `Start fresh` in the prompt. Then `ns opfs-ls` prints `[]`, and the preview shows the seed.
- **Save As and autosave (stub).** Run `ns click --role button --name "Save As…"`, then `ns settle`. The output shows `Save`, `newsletter-studio-iss-i-vol-1.newsletter`, and `saved`. Edit with `ns fill --label Issue --value "Iss. II, Vol. 1"`, then `ns settle`. Run `ns opfs-get verify-picker/newsletter-studio-iss-i-vol-1.newsletter`, then `unzip -p <copy> manifest.json | grep issueLabel`, which shows `Iss. II, Vol. 1`.
- **Reopen last file (stub).** After Save As, run `ns reload`, then `ns settle`. The titlebar shows the same file name and `saved`, and `ns count --role alertdialog` is 0. `ns value --label Issue` shows the last autosaved value.
- **Open through the picker (stub).** Run `ns pick --file <a host .newsletter path>`, then `ns click --role button --name "Open…"`. If the doc is dirty, also run `ns click --role button --name "Discard & open"`. The titlebar shows that file's name and `saved`, and the button reads `Save`.
- **New.** On a saved doc, run `ns click --role button --name New`. No dialog appears. The sidebar shows `Thy parchment awaits — add a block below.`, and `ns value --label "Publication name"` keeps its value. On a dirty doc, `Start a new newsletter?` appears first. `Keep editing` changes nothing, and `Discard & start new` clears the blocks.
- **Proof.** Keep the downloaded and `opfs-get` files, the `unzip -p` output, `ns shot save-open-<step>`, and the `ns settle` lines.

## Gotchas

- With `--fs native`, `Save As…` and `Open…` do nothing, because headless pickers abort and the app treats that as a cancel. A "Save As did nothing" bug report from a native run is an artifact of the headless browser.
- In fallback mode, an opened file shows `unsaved` immediately, and edits never autosave to it. That is the app's no-FSA behavior, not a bug in the driver.
- A dev run (no `--prod`) writes the seed to the crash cache about 800ms after every load. `Start fresh` clicked within that window gets undone, and the next reload prompts even with no edits. Use `--prod`.
- In fallback mode, the crash prompt appears on every relaunch after an edit, because no file handle is attached. In stub mode after Save As, the reopen path wins and the crash prompt never shows.
- Open on a dirty doc goes through the confirm dialog, so the file chooser opens from `Discard & open`, not from `Open…`. Give `ns upload` the button that actually opens the chooser.
- `New` keeps the Masthead (name, issue, date, and location) and drops only the blocks.
- The stub picker reads its choice from `ns pick`. Without it, Open aborts silently, just as a cancelled dialog does.
