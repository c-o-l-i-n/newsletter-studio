# Newsletter Studio

An offline-first PWA for authoring and printing a personal, monthly, vintage-newspaper-style
newsletter that is mailed on paper to family and friends. The author edits **content**;
the app owns **layout**.

## Language

### Core content

**Newsletter**:
One issue of the publication — an ordered, flat list of **Blocks** plus issue-level
metadata (title, date/issue label). One Newsletter = one mailing.
_Avoid_: Document, page, edition.

**Block**:
A single self-contained unit of content with a known type. The Newsletter is nothing
but an ordered sequence of Blocks. There is no grouping layer between Newsletter and
Block.
_Avoid_: Section (see Flagged ambiguities), element, widget, component.

**Text Block**:
A Block whose content is flowing prose (e.g. **Article**, **Advice Column**). Its text
may break and continue across panels/pages when a Format flows it.

**Media Block**:
A Block that is atomic — placed whole, scaled to fit, and never split across a page
boundary (e.g. **Photo Set**, **Ad**, **Puzzle**).

### Block types

**Article**:
A piece of flowing prose: headline, optional subhead/byline, body, optional pull-quote.
Pure text — an Article does NOT contain photos. To pair a photo with an Article, place a
**Photo Set** Block adjacent to it.

**Image Set**:
A block of one or more images with optional captions.

**Advice Column**:
A single Block holding one or more question-and-answer pairs.

### Layout

**Format**:
A pre-designed physical printed form the author chooses for an issue — e.g. Trifold,
Stapled Portrait, Stapled Landscape. The author picks from a fixed set; they never lay
out a Format by hand. Switching Format re-flows the same Blocks.
_Avoid_: Layout, theme, style, paper type.

**Flow**:
The act of a Format arranging the Newsletter's Blocks into its panels/pages, paginating
Text Blocks and fitting Media Blocks. The author does not control exact placement; the
Format guarantees an acceptable result.

**Fixed-capacity Format**:
A Format with a hard physical limit on space — **Trifold** (6 panels) and **Bifold**
(4 panels), each a single sheet. Cannot grow.

**Variable-capacity Format**:
A Format that grows by adding sheets/pages — **Stapled Portrait**, **Stapled Landscape**,
**Booklet**. (The Booklet grows in multiples of 4 pages.)

**Overset**:
Content that does not fit a Fixed-capacity Format. It is shown in the preview as a
flagged overflow with a warning; it is never printed, silently dropped, or shrunk to
force a fit. The author resolves Overset by trimming content or switching Format.
_Avoid_: Overflow, cutoff.

**Imposition**:
The reordering/rotating/2-up arrangement of pages so that, once printed and folded/
stapled, they read in the correct order. Reading order is not print order.
_Avoid_: Page order, sheet order.

**Theme**:
The single, fixed, opinionated visual styling of a Newsletter — Chomsky nameplate title,
Iowan Old Style body and headlines, column rules, drop caps. There is exactly one Theme
and it is **not customizable** (no presets, no token editing). It is independent of Format:
the one Theme renders in any Format.
_Avoid_: Style, skin, format (Format is the physical form, not the look); themes (plural).

**Masthead / Nameplate**:
The newspaper-style title banner of an issue (publication name, volume/issue, date).
_Avoid_: Header, title bar.

## Relationships

- A **Newsletter** contains an ordered list of **Blocks**
- Every **Block** is either a **Text Block** or a **Media Block**
- **Ad**, **Puzzle**, and **Photo Set** are all Media Blocks rendered as framed
  black-and-white image(s) with an optional caption; they differ by intent and frame style
- A **Theme** styles a Newsletter; a **Format** shapes it; the two are independent
- A **Format** **Flows** a Newsletter's Blocks; the same Newsletter can be Flowed by any Format
- **Text Blocks** split across panels/pages during Flow; **Media Blocks** stay atomic

## Example dialogue

> **Author:** "Put my Maine article and three photos in, then switch it to a trifold."
> **App:** "The Maine **Article** is a **Text Block**, so its prose will **Flow** across
> trifold panels — possibly continuing onto a later panel. The three photos are a
> **Photo Set**, a **Media Block**, so they stay together and scale to fit one panel."
> **Author:** "What about the advice column — is that its own section?"
> **App:** "It's a single **Advice Column** Block holding your Q&A pairs, not a section.
> There are no sections; the Newsletter is a flat list of Blocks."

## Flagged ambiguities

- **"Section"** was used in the original brief to mean both "a single content item"
  (an article) and "a department" (the advice column). Resolved: there are no sections.
  The Newsletter is a flat ordered list of **Blocks**; what looked like departments are
  just Block types (e.g. **Advice Column** is one Block).
