---
name: verify
description: Launch and drive Newsletter Studio (React/Vite PWA editor) in a headless Chromium the way an author does, then capture proof (ARIA snapshots, screenshots, saved .newsletter files, print PDFs). Use to confirm a UI change works in the real app, reproduce a bug, or verify editing, formats, image sets, save/open/autosave, or printing.
---

# Verify Newsletter Studio

Newsletter Studio is a single-screen web app. The titlebar holds file ops, format and paper controls, zoom, the save badge, and `Print / PDF`. The left sidebar edits the Masthead and the list of Blocks. The right pane is the live preview. Read the [feature map](features/README.md) and use the matching feature file as the recipe.

The driver is `.claude/skills/verify/scripts/ns`. One run gives you one Vite dev server on a free port and one Bun daemon. The daemon owns a headless Playwright Chromium with a throwaway profile. Every `ns` call talks to the daemon, so browser state (the open newsletter, OPFS, IndexedDB) carries over between shell calls. All examples below run from the repo root.

## Setup (once per checkout)

```sh
bun install                                    # app deps, repo root
(cd .claude/skills/verify && bun install)      # playwright for the driver
(cd .claude/skills/verify && bunx playwright install chromium)
```

Playwright runs under Bun through `launchPersistentContext`. Do not switch the driver to `connectOverCDP`. Bun's websocket client hangs on it.

## Launch

```sh
.claude/skills/verify/scripts/ns up --prod --fs fallback   # prints {"run": ..., "appUrl": ..., "build": ..., "evidenceDir": ...}
export NS_RUN=<run from output>                       # shell state does not persist; prefix each call instead if needed
```

`up` returns only after Vite answers and the app has rendered `Print / PDF` in Chromium. If it fails, it prints the log paths and the `ns down --run <id>` command to clean up.

Flags:

- `--prod` serves a production build of the working tree. It runs `vite build` into the run dir (about 5s), then serves it with `vite preview`. Without it, the run uses the Vite dev server with hot reload. See the dev versus prod section below.
- `--fs native|fallback|stub` picks the File System Access mode. The default is `native`. Read the file mode section below before you verify anything that saves or opens.
- `--run <id>` sets a readable run id. The default is a timestamp.
- `--viewport 1440x900` is the default. The sidebar is 400px wide, so do not go narrower than about 1100px.
- `--headed` shows the browser window. `pdf` needs headless.

### Dev versus prod (`--prod`)

`src/main.tsx` wraps the app in `<StrictMode>`, and in dev React runs every effect twice. In this app that defeats the `firstRun` guard on autosave. A fresh dev load therefore shows `unsaved` before any edit, and about 800ms after every load it writes the current newsletter to the OPFS crash cache. The next reload then prompts `Restore unsaved work?` even when nothing was edited. A prod build has none of this. A fresh load shows `saved`, OPFS stays empty until the first edit, and the PWA service worker registers.

- Use `--prod` for anything about save state, autosave, crash restore, reopen-on-launch, or offline behavior. Both modes build from the working tree, so uncommitted edits are included.
- Use dev (no flag) for fast UI iteration. Hot reload picks up edits without `down` and `up`.
- If a dev run shows a spurious restore prompt or an `unsaved` badge, check it against `--prod` before you call it a bug. If it reproduces only in dev, it is the StrictMode artifact above.

### File mode (`--fs`)

Headless Chromium exposes `showSaveFilePicker`, but its pickers reject at once with `AbortError`. The app treats that as a user cancel, so with `--fs native` nothing is ever saved or opened. Choose a mode by what you are proving:

- `native` is the unmodified browser. Use it for everything except save and open. `Save As…` silently does nothing.
- `fallback` deletes the two FSA pickers before the app loads. The app then takes its real no-FSA path, the one Brave users get. The save button reads `Download`, Save downloads a file, and Open uses `<input type=file>`. There is no autosave to a file in this mode.
- `stub` replaces only the OS file dialog. Save As returns a handle to an OPFS file under `verify-picker/<suggested name>`, and Open returns the file you chose with `ns pick`. Everything after the dialog runs in the real app: writing, autosave to the handle, and reopening the last file on reload. This is a mock at the OS dialog boundary. Say so when you report a stub-mode proof.

## Doctor

Run this first, and again whenever anything looks off:

```sh
.claude/skills/verify/scripts/ns doctor
```

It is read-only and exits non-zero on any `FAIL`. Its last line prints the run id, the `build=dev|prod` mode, the `fs=` mode, and the evidence dir. It checks that the Vite and daemon processes are alive, that the app port is owned by this run's process group, that the page serves `<title>Newsletter Studio</title>` from this checkout, and that git HEAD is unchanged since `up`. It also checks that the page is on this run's URL, the app has rendered, the `--fs` mode is in effect, and there are no uncaught page errors. Vite hot-reloads source edits, so a changed HEAD is a warning to re-check, not proof that the run is stale.

`ns list` shows every run and whether its processes are alive. With several runs alive, every command needs `--run <id>` or `NS_RUN`.

Never drive a server this skill did not start. The user may have their own `bun run dev` on 5173. Leave it alone.

## Drive

Each command prints its result. Errors exit 1 with Playwright's message. Actions are strict: a locator that matches two elements fails with a list of both, so add `--nth`, `--exact`, or `--in`.

Locator flags (pick one): `--role <role> --name <name>`, `--label <text>`, `--placeholder <text>`, `--title <text>`, `--text <text>`, or `--css <playwright selector>`. `--css` accepts full Playwright selector chains (`a >> nth=0 >> b`, `:has()`, `:text-is()`). Modifiers: `--nth <i>` (0-based, -1 for the last match), `--exact`, and `--in <css>` to scope the search.

| Command                                                                      | What it does                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ns click <loc>`                                                             | Click.                                                                                                                                                                                                                                                                                                          |
| `ns fill <loc> --value V`                                                    | Replace an `<input>`/`<textarea>` value.                                                                                                                                                                                                                                                                        |
| `ns type <loc> --value V [--end]`                                            | Click to focus, optionally jump to the end of the document (`--end`), then type keys. Use this for article bodies (`.ProseMirror`). Without `--end`, text lands wherever the click put the caret, usually mid-paragraph.                                                                                        |
| `ns press <key> [...]`                                                       | Keyboard chords, e.g. `ControlOrMeta+s`, `ControlOrMeta+Shift+s`, `Escape`.                                                                                                                                                                                                                                     |
| `ns select <trigger loc> --option <label>`                                   | Open a base-ui Select and choose an option by its visible label.                                                                                                                                                                                                                                                |
| `ns upload <loc> --file a[,b]`                                               | Click something that opens a native file chooser and supply files.                                                                                                                                                                                                                                              |
| `ns download <loc> [--save rel/path]`                                        | Click, capture the download into the evidence dir, print its path. Pass `--press ControlOrMeta+s` instead of a locator to trigger it with a shortcut. Only use `ns download` for downloads you want to keep: a download from a plain `click` or `press` goes to Playwright's temp dir and is deleted at `down`. |
| `ns text <loc>` / `ns value <loc>` / `ns count <loc>`                        | Read innerText, read an input's value (`text` is empty for `<input>`), or count matches.                                                                                                                                                                                                                        |
| `ns wait <loc> [--state visible\|hidden\|attached\|detached] [--timeout ms]` | Wait for a state.                                                                                                                                                                                                                                                                                               |
| `ns settle`                                                                  | Wait out the 350ms preview debounce and 800ms autosave, then until the titlebar shows neither `flowing…` nor `saving…`. Prints the titlebar text.                                                                                                                                                               |
| `ns snapshot [name] [<loc>]`                                                 | ARIA snapshot of the page (or locator). With a name, also saves `<name>.aria.txt`.                                                                                                                                                                                                                              |
| `ns shot <name> [<loc>] [--full]`                                            | PNG screenshot into the evidence dir.                                                                                                                                                                                                                                                                           |
| `ns pdf <name>`                                                              | Render print media to `<name>.pdf`, which is what `Print Now` sends to the printer. To look at page 1, run `qlmanage -t -s 1400 -o <dir> <pdf>` and Read the PNG it writes (`pdftoppm` is not installed).                                                                                                       |
| `ns reload` / `ns goto [--url U]`                                            | Reload, which simulates relaunching the app with the same profile.                                                                                                                                                                                                                                              |
| `ns pick --file <host path>` or `--name <opfs file>`                         | Stub mode only. Choose the file the next Open dialog returns.                                                                                                                                                                                                                                                   |
| `ns opfs-ls` / `ns opfs-get <opfs path> [--save rel]`                        | List or copy out OPFS files: the crash cache `crash-autosave.newsletter` and stub-mode `verify-picker/*`.                                                                                                                                                                                                       |
| `ns eval '<js expression>'`                                                  | Read page state. For observation only. Never use it to set app state.                                                                                                                                                                                                                                           |

Stable handles in this app:

- The titlebar is `header.titlebar`. There are two `banner` roles, the titlebar and the newspaper nameplate, so `--role banner` is always ambiguous.
- The preview is `#reading-root`. The hidden `#print-root` holds the imposed print copy, so scope preview text checks to `#reading-root`, or they match twice.
- The format picker is `--css "#format-select"`. Its options are `Stapled Portrait`, `Trifold`, `Stapled Landscape`, `Bifold`, and `Booklet (saddle-stitch)`.
- Masthead fields are `--label "Publication name"`, `Issue`, `Date`, and `Location`.
- Block fields use placeholders: `Headline`, `Byline (optional)`, `Column title`, `Question`, `Answer`, and `Caption`. Use `--nth` to pick a block.
- Block cards are `[data-slot=card]`. Card 0 is the Masthead. A block's move up, move down, and remove buttons are icon-only buttons 0, 1, and 2 in its `[data-slot=card-action]`.

Example: change the name, wait for the flow, and check the nameplate.

```sh
N=.claude/skills/verify/scripts/ns
$N fill --label "Publication name" --value "The Verify Gazette"
$N settle
$N text --css "#reading-root .nl-nameplate"
```

## Evidence

Everything goes to `/tmp/ns-verify-evidence/<run>/`. That path is outside the run's scratch dir, so `down` never deletes it. It holds:

- `build.log` for `--prod` runs;
- `console.ndjson`, every browser console line and uncaught page error, written by the daemon automatically;
- `*.png`, `*.aria.txt`, and `*.pdf` from `shot`, `snapshot`, and `pdf`;
- `downloads/` and `opfs/`, the saved `.newsletter` files;
- `logs/`, holding `vite.log`, `daemon.log`, and `state.json`, which `down` copies in.

Proof standards:

- Drive the real user path: buttons, fields, shortcuts, and file choosers. `eval` reads state and never sets it. Do not call app internals.
- Capture the action and the result. Take a snapshot or shot before and after, or record the titlebar from `ns settle` after each step.
- Check side effects, not only the screen. A `.newsletter` file is a zip. `unzip -l <file>` lists `manifest.json` and `images/*`, and `unzip -p <file> manifest.json` shows the saved publication and blocks. Autosave lands in OPFS. Read it with `opfs-ls` and `opfs-get`.
- The only mock is `--fs stub`, which stands in for the OS file dialog. Name the mode in your report. A save proven in `fallback` does not prove the FSA `Save`/autosave path, and the reverse also holds.
- Report which entry point you used (button, shortcut, or confirm dialog). The feature map lists all of them. Do not report one as verified because another one worked.

## Cleanup

```sh
.claude/skills/verify/scripts/ns down          # or: ns down --run <id>
```

`down` asks the daemon to close Chromium, then kills the daemon's and Vite's process groups. Those are the groups this run started, by recorded PID. It then kills any Chromium still holding this run's unique profile path, copies the logs into the evidence dir, and deletes `/tmp/ns-verify/runs/<run>/`. It never kills by process name, and it never touches evidence. Run it after every attempt, including failed ones. Use `ns list` to find runs you forgot.

## Helpers

- `scripts/ns` is a `sh` wrapper that runs `bun scripts/ns.ts "$@"`.
- `scripts/ns.ts` contains the CLI, the daemon (`ns serve`, which `up` starts for you), and the `--fs` init scripts. Daemon commands are serialized, so two shell calls never interleave on the page. After you edit `ns.ts`, run `down` and `up` again, because a live daemon keeps running the old code.
