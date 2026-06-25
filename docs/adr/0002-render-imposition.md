# 0002 — Render and imposition engine: HTML/CSS + Paged.js + PDF export

Blocks render to styled HTML with print CSS. **Paged.js** paginates that HTML into
discrete, addressable page boxes in the DOM; we then run our own **imposition** pass
(reorder / rotate / 2-up) per Format so the printed-and-folded result reads correctly.
The same HTML renderer powers the live preview, and output is produced via the browser's
print / Save-as-PDF path.

We chose this over **@react-pdf/renderer**, which produces deterministic, identical-
everywhere PDFs but lacks float text-wrap, needs manual column balancing, and would force
a _second_ renderer separate from the HTML preview (two code paths to keep in sync). We
also rejected **native CSS print only** (no Paged.js): the browser does not expose
individual page boxes, making trifold/booklet imposition nearly impossible and page-break
control weak.

## Consequences

- Imposition is our code, not the browser's — it must be implemented and tested per Format
  (trifold panel order, saddle-stitch booklet ordering, etc.).
- Paged.js fragmentation has known edge cases; expect to tune break rules.
- Full CSS is available for the vintage aesthetic (multicolumn, justification, drop caps,
  rules, float-wrap).
