# Print

`Print / PDF` opens a `To the Printing Press` dialog that lists the print settings to use. Duplex formats also get a note to flip on the short edge. `Print Now` opens the browser print dialog. Printing uses the hidden imposed copy, which arranges the sheets in print order rather than reading order, so the folded or stapled result reads correctly.

## Sub-features

- `print-dialog` shows `Paper size` (`Letter` or `A4`, matching the titlebar), `Pages per sheet 1`, `Margins None`, and `Scale 100%`.
- `print-duplex-note` shows `Double-sided printing … Flip on Short Edge` for Trifold, Bifold, and Booklet, but not for the stapled formats.
- `print-output` renders the printed sheets at the Format's sheet size in imposed order, with no titlebar or sidebar.
- `print-overset` leaves overset panels out of the printed output.

## How to get to it (user POV)

- Click `Print / PDF` in the titlebar.
- Press `Ctrl`/`Cmd` + `P`. The app opens its own dialog instead of the browser's.
- Click `Print Now` in the dialog to open the browser print dialog. This cannot be reached headless; prove the output with `ns pdf` instead.

## Driving it with ns

Preconditions:

- The run is headless (no `--headed`), in any `--fs` mode, and `ns doctor` passes.
- The seed newsletter is loaded in `Booklet (saddle-stitch)` on `Letter`.

- **Dialog from the button.** Run `ns click --role button --name "Print / PDF"`, then `ns text --role dialog`. It contains `To the Printing Press`, `Paper size`, `Letter`, `Margins`, `None`, and `Double-sided printing`. Capture `ns shot print-dialog`.
- **Dialog from the shortcut.** Run `ns click --role button --name Cancel`, then `ns press ControlOrMeta+p`, then `ns wait --role dialog`. The same dialog appears.
- **No duplex note for stapled.** Close the dialog, then run `ns select --css "#format-select" --option "Stapled Portrait"`. Reopen the dialog, and `ns text --role dialog` no longer contains `Double-sided printing`.
- **Print output.** Close the dialog, then run `ns settle` and `ns pdf print-booklet`. Check the PDF with `bun -e 'const b=await Bun.file(process.argv[1]).text(); console.log((b.match(/\/Type\s*\/Page[^s]/g)||[]).length, b.match(/MediaBox\s*\[[^\]]*\]/)[0])' <pdf path>`. For the seed booklet it reports `2 MediaBox [0 0 792 612]`: one duplex Letter sheet, landscape, front and back. To confirm the order is imposed, run `qlmanage -t -s 1400 -o <evidence dir> <pdf>` and Read the PNG. Page 1 shows the back cover on the left and the front cover, with the nameplate, on the right. For the 3-page seed the back cover is blank, because the booklet pads to a multiple of 4.
- **Overset is not printed.** Overfill Bifold as described in [formats-preview.md](./formats-preview.md), then run `ns settle` and `ns pdf print-bifold-overset`. The PDF still has exactly 2 pages. The last block is the one that overflows, so `ns eval 'document.querySelector("#print-root").innerText.includes("Installing the app in Chrome")'` is `false`.
- **Proof.** Keep the dialog screenshot, the PDF, and the page-count line.

## Gotchas

- Do not click `Print Now` headless. It calls `window.print()`, which opens nothing to drive. Use `ns pdf`, which renders the same print stylesheet and `@page` size.
- `ns pdf` fails in `--headed` runs, because Chromium only renders PDFs headless.
- The dialog has a single `Cancel` button. If a block's remove confirmation is also open, close that one first, or `--name Cancel` matches both.
- Page counts depend on flow. Run `ns settle` before `ns pdf`, or the PDF can come from the previous layout.
