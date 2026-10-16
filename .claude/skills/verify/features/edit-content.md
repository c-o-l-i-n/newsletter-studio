# Edit content

The author edits the Masthead and a flat, ordered list of Blocks in the left sidebar. The preview on the right re-flows after each change. The three block types are Article (headline, byline, and a rich-text body), Advice Column (a title plus question-and-answer pairs), and Image Set (see [image-sets.md](./image-sets.md)).

## Sub-features

- `masthead-edit` changes the publication name, issue, date, and location, and the preview nameplate shows them.
- `block-add` appends an Article, Advice Column, or Image Set from the `Add a block` footer and scrolls to it.
- `block-move` moves a block up or down. Up is disabled on the first block and down on the last.
- `block-remove` removes a block after a `Remove this block?` confirmation. Cancel keeps it.
- `article-text` edits the headline, byline, and body with Bold, Italic, Subhead, Pull-quote, Bullet list, and Numbered list.
- `advice-items` sets the column title, edits Q&A pairs, adds a pair, and removes a pair after confirmation.
- `empty-state` shows `Thy parchment awaits — add a block below.` when no blocks remain.

## How to get to it (user POV)

- Type in the `Masthead` card fields `Publication name`, `Issue`, `Date`, and `Location`.
- Click `+ Article`, `+ Advice Column`, or `+ Image Set` in the sidebar footer.
- Use the up-arrow, down-arrow, and bomb icon buttons in the top-right corner of each block card.
- Use the formatting toolbar above an article body, or type Markdown-style input such as `**bold**`, which the editor converts.
- In an Advice Column card, use `+ Add Q&A` and `remove Q&A <n>`.

## Driving it with ns

Preconditions:

- A run exists in any `--fs` mode and `ns doctor` passes.
- The seed newsletter is loaded with 7 blocks. Card index 0 is the Masthead, so block `i` is card `i+1`.

- **Masthead.** Rename the publication. Run `ns fill --label "Publication name" --value "The Verify Gazette"`, then `ns settle`. `ns text --css "#reading-root .nl-nameplate"` starts with `The Verify Gazette`. The same works for `--label Issue`, `--label Date`, and `--label Location`, all shown on the nameplate's second line.
- **Add an article.** Click `+ Article`. Run `ns click --role button --name "+ Article"`. `ns count --placeholder Headline` goes from 4 to 5.
- **Write the article.** Fill the new headline and body. Run `ns fill --placeholder Headline --nth -1 --value "Bunny census results"` and `ns type --css ".ProseMirror" --nth -1 --value "Seventeen bunnies on the morning walk."`, then `ns settle`. `ns wait --in "#reading-root" --text "Bunny census results"` and `ns wait --in "#reading-root" --text "Seventeen bunnies"` both print `ok`.
- **Format text.** With the caret in a body, click a toolbar button. Run `ns type --css ".ProseMirror" --nth -1 --end --value " Huge news."`, then `ns click --role button --name "Bold" --nth -1` and `ns type --css ".ProseMirror" --nth -1 --end --value "Bold bit"`. `ns count --css "#reading-root strong:text('Bold bit')"` is 1. The `Subhead` button makes an h3, and `Pull-quote` makes a blockquote.
- **Move a block.** Move the last block up. Run `ns click --css "[data-slot=card] >> nth=-1 >> [data-slot=card-action] button >> nth=0"`, then `ns settle`. The new last card's title (`ns text --css "[data-slot=card] >> nth=-1 >> [data-slot=card-title]"`) is the type of the old second-to-last block.
- **Remove a block, cancel.** Click a block's bomb, then cancel. Run `ns click --css "[data-slot=card] >> nth=-1 >> [data-slot=card-action] button >> nth=2"`, then `ns text --role alertdialog` (shows `Remove this block?`), then `ns click --role button --name Cancel`. The card count (`ns count --css "[data-slot=card]"`) is unchanged.
- **Remove a block, confirm.** Repeat, then confirm. Run the same bomb click, then `ns click --role button --name Remove --exact`. The card count drops by 1, and the block's text leaves `#reading-root`.
- **Advice column.** Add one and fill it. Run `ns click --role button --name "+ Advice Column"`, `ns fill --placeholder Question --nth -1 --value "Should I adopt a bunny?"`, and `ns fill --placeholder Answer --nth -1 --value "Yes."`, then `ns settle`. `ns wait --in "#reading-root" --text "Ask the Editor"` and `ns wait --in "#reading-root" --text "Should I adopt a bunny?"` both print `ok`. Then run `ns click --role button --name "+ Add Q&A"`, and `ns count --placeholder Question` rises by 1. `remove Q&A <n>` asks `Remove this Q&A item?` before it removes the pair.
- **Proof.** Capture the edited state. Run `ns shot edit-content` and `ns snapshot edit-content-sidebar --css "[data-slot=card] >> nth=-1"`.

## Gotchas

- The remove-confirm button is `Remove`. Use `--exact`, or the locator also matches `remove Q&A 1`.
- The `Bold`, `Italic`, and other toolbar buttons repeat once per article. Always pass `--nth`.
- Toolbar buttons act on mouse-down and keep the editor's selection. Type into the body first so the caret is in the right editor.
- `ns fill` does not work on `.ProseMirror`, which is contenteditable. Use `ns type`.
- A new Article has an empty headline, so `--placeholder Headline --nth -1` is the newest one. The placeholder text shows only while the field is empty, but Playwright still matches it after you type.
- Preview text only appears after flow. Run `ns settle` before you assert, or the read can see the previous layout.
