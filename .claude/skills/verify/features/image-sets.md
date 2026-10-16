# Image sets

An Image Set block holds one or more framed images, each with an optional caption and border. The block is placed whole and never split across a page. Imported photos are downscaled for printing. Images print in black and white unless the author picks `Color`.

## Sub-features

- `image-add` adds an image to a set through the file chooser.
- `image-replace` replaces an image by clicking its thumbnail.
- `image-caption` sets a caption that prints under the image.
- `image-border` picks `No border`, `Single border`, `Double border`, or `Dashed border`.
- `image-layout` switches a set with 2 or more images between `One column` and `Two columns`.
- `image-move-remove` reorders images within a set, or removes one after `Remove this image?`.
- `image-color` toggles the titlebar `B&W` and `Color` control for every image in the preview and print.
- `image-downscale` re-encodes an imported photo larger than 3000px on its long edge as a JPEG of at most 3000px.

## How to get to it (user POV)

- Click `+ Image Set` in the sidebar footer, then `+ Add image` in the new card.
- Click a thumbnail (title `Click to replace image`) to replace that image.
- Use the `Caption` field, the border select, and the icon buttons in an image row.
- Use the `Layout` select, which appears in the card once the set has 2 or more images.
- Use the `B&W` and `Color` segmented control in the titlebar.

## Driving it with ns

Preconditions:

- A run exists in any `--fs` mode and `ns doctor` passes. Use `--fs fallback` if you also want to prove the image lands in a saved file.
- A test image exists on disk. The repo has `src/assets/zucc.webp`. For downscaling, make a large one with `magick -size 4000x3000 plasma: /tmp/ns-verify-evidence/$NS_RUN/big.png`.

- **Add a set and an image.** Run `ns click --role button --name "+ Image Set"`, then `ns upload --role button --name "+ Add image" --nth -1 --file src/assets/zucc.webp`, then `ns settle`. `ns count --css "#reading-root img"` goes from 3 to 4, and the new card shows a `Click to replace image` thumbnail.
- **Caption.** Run `ns fill --placeholder Caption --nth -1 --value "Bunny at dawn"`, then `ns settle`. `ns wait --in "#reading-root" --text "Bunny at dawn"` prints `ok`.
- **Border.** Run `ns select --css "[data-slot=card] >> nth=-1 >> [data-slot=select-trigger]" --option "Double border"`. The trigger text (`ns text --css "[data-slot=card] >> nth=-1 >> [data-slot=select-trigger]"`) reads `Double border`, and the preview frame changes (`ns shot image-border --css "#reading-root"`).
- **Two columns.** Add a second image, then switch the layout. Run `ns upload --role button --name "+ Add image" --nth -1 --file src/assets/crossword.webp`, then `ns select --css "[data-slot=card] >> nth=-1 >> [data-slot=select-trigger] >> nth=0" --option "Two columns"`, then `ns settle`. The Layout trigger reads `Two columns`, and `ns shot image-two-col --css "#reading-root"` shows the two images side by side.
- **Remove an image.** Click the image row's bomb, then confirm. Run `ns click --css '[data-slot=card] >> nth=-1 >> div:has(> [data-slot=select-trigger]) > [data-slot=button] >> nth=0'`. Here `nth=0` is the first image row, and each row's border select sits beside its bomb button. Then run `ns text --role alertdialog` (shows `Remove this image?`), then `ns click --role button --name Remove --exact`. The preview image count drops by 1.
- **Color.** Run `ns click --role button --name Color`, then `ns settle`. `ns count --css "#reading-root.nl-color-images"` is 1. `B&W` sets it back to 0.
- **Downscale.** Upload the 4000x3000 PNG into a set, then save it (fallback: `ns download --role button --name Download`). `unzip -l <file>` shows the new image as `images/<id>.jpg`. Extract it and run `sips -g pixelWidth -g pixelHeight` on it, which reports 3000 x 2250.
- **Proof.** Capture `ns shot image-sets` and `ns snapshot image-sets-card --css "[data-slot=card] >> nth=-1"`.

## Gotchas

- A new Image Set starts with zero images, and an empty set renders nothing in the preview.
- `+ Add image` opens the chooser right away, and `ns upload` must be the command that clicks it. A separate `ns click` loses the chooser.
- The `Layout` select is the card's first `select-trigger` only when the set has 2 or more images. With one image, the first trigger is the border select.
- The image-row icon buttons have no names. The bomb is the `[data-slot=button]` next to the row's border select. Image move up and down are the two icon buttons at the far right of the row.
- The seed images load asynchronously after first paint. Wait for `ns count --css "#reading-root img"` to report 3 before you count changes.
- `B&W` is a CSS grayscale filter. The saved image bytes stay in color, so prove `image-color` from the preview or the PDF, not from the file.
