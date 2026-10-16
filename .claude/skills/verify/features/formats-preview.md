# Formats and preview

The author picks a printed Format and paper size. The app flows the same blocks into that Format's panels or pages and shows them in the preview in reading order. Fixed-capacity formats (Trifold has 6 panels, Bifold has 4) show a panel gauge. Content that does not fit is Overset: it is never printed, and the gauge turns red.

## Sub-features

- `format-switch` re-flows the newsletter into `Stapled Portrait`, `Trifold`, `Stapled Landscape`, `Bifold`, or `Booklet (saddle-stitch)`.
- `paper-size` switches `Letter` and `A4`, which changes the sheet size in the preview and in print.
- `fullness` shows `N pages` for variable formats and `N/6 panels` or `N/4 panels` for fixed ones.
- `overset` adds ` · K overset` to the gauge in red when a fixed format overflows.
- `zoom` steps the preview zoom by 10%, between 30% and 100%. The default is 70%.
- `sheet-labels` labels each preview sheet with its fold position, such as `FRONT COVER` or `PAGES 2–3`.

## How to get to it (user POV)

- Use the format select in the titlebar. It shows the current format's name.
- Use the `Letter` and `A4` segmented control.
- Use the zoom-out and zoom-in icon buttons on either side of the `70%` readout.
- Press `Ctrl`/`Cmd` with `=` or `+` to zoom in, `-` to zoom out, and `0` to reset to 70%.

## Driving it with ns

Preconditions:

- A run exists in any `--fs` mode and `ns doctor` passes.
- The seed newsletter is loaded. `ns settle` ends with `3 pages`.

- **Switch to Trifold.** Run `ns select --css "#format-select" --option Trifold`, then `ns settle`. The output contains `Trifold` and `4/6 panels`. `ns snapshot formats-trifold --css "#reading-root"` shows the panel labels.
- **Every format.** Repeat with `--option "Stapled Portrait"`, `"Stapled Landscape"`, `Bifold`, and `"Booklet (saddle-stitch)"`. After `ns settle`, the variable formats show `N pages` and Bifold shows `N/4 panels`.
- **Overset.** Switch to Bifold and overfill it. Run `ns select --css "#format-select" --option Bifold`, then `ns type --css ".ProseMirror" --nth 0 --end --value "$(bun -e 'console.log("The bunnies gathered at dawn to discuss the lettuce shortage. ".repeat(120))')"`, then `ns settle`. The output contains `4/4 panels · 2 overset`, give or take the K. `ns shot formats-overset --css header.titlebar` shows the red gauge.
- **Paper size.** Run `ns click --role button --name A4`, then `ns settle`. For the Booklet, `ns eval 'document.getElementById("page-size").textContent'` changes from `@page { size: 11in 8.5in; margin: 0; }` to `@page { size: 11.693in 8.268in; margin: 0; }`. The preview sheets resize (`ns shot formats-a4`).
- **Zoom.** Run `ns click --css 'header.titlebar button:has(+ span:text("%"))'` for zoom out. `ns text --css 'header.titlebar span:text-matches("^[0-9]+%$")'` reads `60%`. `ns press ControlOrMeta+0` resets it to `70%`, and `ns press ControlOrMeta+=` moves it to `80%`.
- **Proof.** For each format you claim, capture `ns shot formats-<id>` and the `ns settle` line.

## Gotchas

- The format select's visible label is the format name, not its id. Pass `--option` the exact label, for example `Booklet (saddle-stitch)`.
- Overset is shown only in the titlebar gauge. The preview has no panel for the overflow and does not mark it, which differs from the "flagged overflow" wording in `CONTEXT.md`. Prove overset from the gauge text. To prove the overflow content is missing, check the text of the last block, such as the seed caption `Installing the app in Chrome/Edge/Brave`. The text you just typed into the first article is not the overflow.
- Always pass `--end` when you type into an existing body. Without it, the text lands where the click put the caret.
- `flowing…` replaces the gauge while the app paginates. Reading the titlebar without `ns settle` can catch it mid-flow.
- The default format is `Booklet (saddle-stitch)`, not Trifold. A prior run's choice does not carry over, because every run has a fresh profile and the seed sets the format.
- Format and paper size are saved in the file's `settings`. They change the save badge to `unsaved` like any other edit.
