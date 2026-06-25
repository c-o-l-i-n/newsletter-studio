# 0001 — Content model: semantic blocks flowed by format templates

A Newsletter is a flat, ordered list of typed **Blocks** (Article, Advice Column, Photo
Set, Ad, Puzzle). Each **Format** is a template that _flows_ those blocks into its
panels/pages; the author edits content only and never lays out a page by hand. Switching
Format re-flows the same blocks.

We chose this over two alternatives. A **freeform per-format canvas** (Canva/Publisher
style) gives pixel control but forces the author to re-do layout for every format and
contradicts the core goals "don't think about formatting" and "switch format mid-edit and
it still looks nice." A **full typesetting engine** (column balancing, image float, jump
continuations) would be the most magical but is a deep, finicky system to build and debug.
The block-and-template model is the smallest thing that delivers layout-agnostic content.

## Consequences

- Text Blocks paginate/split across pages; Media Blocks are atomic (never split). See
  [CONTEXT.md](../../CONTEXT.md).
- On-page order strictly follows list order (no newspaper "jumps"/backfill) — see
  [0004](./0004-capacity-policy.md) and the flow decision.
- Vintage-newspaper charm must come from typography (fonts, columns, rules, drop caps),
  not from dense jump-style imposition of content.
