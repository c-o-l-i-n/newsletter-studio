# Image sets

An Image Set block holds one or more framed images, each with an optional caption and border. The block is placed whole and never split across a page. Every image the author adds, by file chooser or by dragging files in from Finder, opens a crop dialog first and is then stored print-ready: at most 2000px on its long edge, as a JPEG. iPhone HEIC photos are accepted. A set that reaches two images switches to two columns. Images print in black and white unless the author picks `Color`.

## Sub-features

- `image-add` adds one or more images to a set through the file chooser. Several files run through the crop dialog one at a time.
- `image-replace` replaces an image by clicking its thumbnail.
- `image-heic` accepts `.heic` and `.heif` files and stores them as JPEG.
- `image-crop` opens `Crop the Picture` for every added image. Presets are `Freeform`, `Original`, `Square`, `4:3`, `3:2`, and `16:9`, with `Landscape` and `Portrait` for the non-square ratios. `Done` or Enter places the image, and `Cancel` (or `Skip` in a batch, or Escape) leaves it out.
- `image-recrop` crops an image already in a set with the row's `Crop image` button.
- `image-drop` takes files dragged in from Finder. A drop on a set card appends, a drop on a thumbnail replaces that image, and a drop anywhere else creates a new Image Set at the end. Non-image files are ignored.
- `image-caption` sets a caption that prints under the image.
- `image-border` picks `No border`, `Single border`, `Double border`, or `Dashed border`.
- `image-layout` switches a set with 2 or more images between `One column` and `Two columns`. A set that grows from fewer than 2 images to 2 or more switches to `Two columns` by itself, and the author's later choice sticks.
- `image-move-remove` reorders images within a set, or removes one after `Remove this image?`.
- `image-color` toggles the titlebar `B&W` and `Color` control for every image in the preview and print.
- `image-compress` stores each image at most 2000px on its long edge as a JPEG at quality 0.8. Opening a file saved by an older version compresses its images, and the next save writes them with `optimized: true` in the manifest.

## How to get to it (user POV)

- Click `+ Image Set` in the sidebar footer, then `+ Add image` in the new card. The chooser accepts several files.
- Click a thumbnail (title `Click to replace image`) to replace that image.
- Click the crop icon (`Crop image`) in an image row to crop it again.
- Drag image files from Finder onto a set card, a thumbnail, or anywhere else in the window. The target gets a gold ring while the files hover over it. Over the rest of the window, a dashed frame reads `Drop to add a new Image Set`.
- Use the `Caption` field, the border select, and the icon buttons in an image row.
- Use the `Layout` select, which appears in the card once the set has 2 or more images.
- Use the `B&W` and `Color` segmented control in the titlebar.

## Driving it with ns

Preconditions:

- A run exists in any `--fs` mode and `ns doctor` passes. Use `--fs fallback` if you also want to prove the image lands in a saved file.
- Test images exist on disk. The repo has `src/assets/zucc.webp` and `src/assets/crossword.webp`. Make a large photo with `magick -size 4000x3000 plasma: /tmp/ns-verify-evidence/$NS_RUN/big.jpg` and a HEIC copy with `sips -s format heic /tmp/ns-verify-evidence/$NS_RUN/big.jpg --out /tmp/ns-verify-evidence/$NS_RUN/big.heic`.

- **Add a set and an image.** Run `ns click --role button --name "+ Image Set"`, then `ns upload --role button --name "+ Add image" --nth -1 --file src/assets/zucc.webp`. `ns wait --role dialog` prints `ok`. Then run `ns wait --css "[role=dialog] button:has-text('Done'):not([disabled])"`, then `ns press Enter`, then `ns settle`. `ns count --css "#reading-root img"` goes from 3 to 4, and the new card shows a `Click to replace image` thumbnail.
- **Cancel.** Upload a file the same way, then run `ns click --role button --name Cancel`. No thumbnail is added, and `ns count --css "[role=dialog]"` is 0.
- **Square crop.** Upload a non-square image, then run `ns click --role button --name Square --exact`, then `ns press Enter`. Save the file (fallback: `ns download --role button --name Download`). The new `images/<id>.jpg` in the zip has equal width and height under `sips -g pixelWidth -g pixelHeight`.
- **Freeform crop.** Upload an image, then drag a corner handle with `ns drag --css ".ReactCrop__drag-handle.ord-se" --dx -150 --dy -60`, then `ns press Enter`. To predict the result, first run `ns drag --css ".ReactCrop__drag-handle.ord-nw"`, which prints the handle center without moving it. The on-screen image width is the se x minus the nw x. The saved width is about `(1 - 150 / onscreen width) * source width`, and the height works the same way.
- **Portrait ratio.** On a portrait image the ratio buttons read `3:4`, `2:3`, and `9:16`, and `Portrait` starts pressed. `ns snapshot --role dialog` shows which buttons are `[pressed]`.
- **Re-crop.** Run `ns click --role button --name "Crop image" --nth <i>`, where `i` counts image rows across the whole sidebar, seed sets included. Choose a preset, then `ns press Enter`. The saved image for that row has a new id and the new size. Escape or `Cancel` leaves the image unchanged.
- **HEIC.** Upload `big.heic` through `+ Add image` and confirm the dialog. The saved image is `images/<id>.jpg`, and `sips` reports `format: jpeg` at 2000 x 1500.
- **Drop on a set.** Run `ns drop --css "[data-slot=card] >> nth=<i> >> [data-slot=card-header]" --file <a.jpg> --shot drop-hover-card`, then confirm the dialog. That set's `Click to replace image` count goes up by 1, and `drop-hover-card.png` shows the card's gold ring.
- **Drop on a thumbnail.** Run `ns drop --css "[data-slot=card] >> nth=<i> >> [title='Click to replace image'] >> nth=0" --file <a.png>,<b.jpg>`, then confirm the dialog. Only the first file is used, so the dialog shows no `Image 1 of 2`. The thumbnail count is unchanged, and the saved file has a new image for that row.
- **Drop elsewhere.** Run `ns drop --css ".preview-pane" --file <a.png>,<notes.txt>,<b.jpg> --shot drop-hover-preview`. The dialog reads `Image 1 of 2`, because the text file is skipped. Confirm both images (wait for `Image 2 of 2` and an enabled `Done` before the second Enter). `ns count --css "[data-slot=card]"` goes up by 1, and the new last card has 2 thumbnails and a `Two columns` layout.
- **Drop a non-image.** Run `ns drop --css ".preview-pane" --file <notes.txt>`. `ns count --css "[role=dialog]"` is 0, the card count is unchanged, and the `url` that `ns drop` prints is still the app URL.
- **Two-column flip.** In a set with one image, add a second. The first `select-trigger` in the card reads `Two columns`. Run `ns select --css "[data-slot=card] >> nth=<i> >> [data-slot=select-trigger] >> nth=0" --option "One column"`, then add a third image. The trigger still reads `One column`.
- **Caption.** Run `ns fill --placeholder Caption --nth -1 --value "Bunny at dawn"`, then `ns settle`. `ns wait --in "#reading-root" --text "Bunny at dawn"` prints `ok`.
- **Border.** Run `ns select --css "[data-slot=card] >> nth=-1 >> [data-slot=select-trigger]" --option "Double border"`. The trigger text (`ns text --css "[data-slot=card] >> nth=-1 >> [data-slot=select-trigger]"`) reads `Double border`, and the preview frame changes (`ns shot image-border --css "#reading-root"`).
- **Remove an image.** Click the image row's bomb, then confirm. Run `ns click --css "[data-slot=card] >> nth=-1 >> div:has(> [data-slot=select-trigger]) > [data-slot=button]:not([aria-label='Crop image']) >> nth=0"`. Here `nth=0` is the first image row. Then run `ns text --role alertdialog` (shows `Remove this image?`), then `ns click --role button --name Remove --exact`. The preview image count drops by 1.
- **Color.** Run `ns click --role button --name Color`, then `ns settle`. `ns count --css "#reading-root.nl-color-images"` is 1. `B&W` sets it back to 0.
- **Compress on open.** Copy an old `.newsletter` file to the evidence dir, then open it (fallback: `ns upload --role button --name "Open…" --file <copy>`) and download it. In the download's `manifest.json`, every image entry has `optimized: true`, and the image bytes are smaller. Open the download and download it again. Every image is byte-identical between the two downloads.
- **Offline HEIC decoder.** In a `--prod` run, `ns cache-ls --match heic-to` lists the `heic-to-*.js` chunk in the service worker precache. An empty list right after `up` means the service worker has not finished installing. Run it again after `ns settle`.
- **Proof.** Capture `ns shot image-sets` and `ns snapshot image-sets-card --css "[data-slot=card] >> nth=-1"`.

## Gotchas

- A new Image Set starts with zero images, and an empty set renders nothing in the preview.
- `+ Add image` opens the chooser right away, and `ns upload` must be the command that clicks it. A separate `ns click` loses the chooser.
- Every add, replace, and drop waits in the crop dialog. Nothing reaches the set until you confirm it, so wait for the dialog to close before you count thumbnails.
- `Done` stays disabled until the dialog's image has loaded, and Enter does nothing before then. Wait for `[role=dialog] button:has-text('Done'):not([disabled])` before `ns press Enter`, especially for HEIC and for the second image of a batch.
- `ns wait --role dialog --text ...` ignores `--text`. Use `ns wait --text "Image 2 of 2"` to wait for the next image of a batch.
- Ratio button names follow the image's orientation. On a portrait image `3:2` is named `2:3`.
- `ns drop` sends trusted drag events through Chromium's drag pipeline (CDP `Input.dispatchDragEvent`) with real host files. It starts at the window boundary, not in Finder. It scrolls the target into view and drops at the center of its visible part, so a target hidden under the sidebar footer gets the footer's drop instead.
- Headless Chromium never navigates on an unhandled file drop, so a run cannot show the lost-document failure that the window drop guard prevents. A non-image drop proves only that the app ignores it.
- The `Layout` select is the card's first `select-trigger` only when the set has 2 or more images. With one image, the first trigger is the border select.
- The image-row icon buttons other than `Crop image` have no names. The bomb is the unnamed `[data-slot=button]` next to the row's border select. Image move up and down are the two icon buttons at the far right of the row.
- The seed images load asynchronously after first paint. Wait for `ns count --css "#reading-root img"` to report 3 before you count changes.
- `B&W` is a CSS grayscale filter. The saved image bytes stay in color, so prove `image-color` from the preview or the PDF, not from the file.
- `.newsletter` zips restamp file dates on every save, so compare image bytes inside the zip, not the zip file itself.
