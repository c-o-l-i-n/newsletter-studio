# 0004 — Capacity policy: honest fit, never distort

Variable-capacity Formats (Stapled Portrait, Stapled Landscape, Booklet) grow by adding
sheets; the Booklet pads to a multiple of 4 pages with a decorative end page. Fixed-
capacity Formats (Trifold = 6 panels, Bifold = 4 panels) show a live fullness gauge, and
any content beyond capacity becomes flagged **Overset** in the preview with a clear warning.
Overset is never printed, never silently dropped, and content is never auto-shrunk to
force a fit.

We chose this over **auto-fit** (shrink fonts/images to cram content in — produces
unreadable text and wrecks the vintage aesthetic) and over a **hard cap** that blocks
editing once a fixed format is full (couples content to the current format and surprises
the author mid-sentence). Honest fit keeps content layout-agnostic and protects layout
integrity, putting the trim-or-switch decision in the author's hands.

## Consequences

- The preview must visibly distinguish placed content from Overset and surface a fullness
  indicator for fixed formats.
- "Looks nice in every format automatically" is true only within a format's capacity;
  beyond it, the author must act. This is an intentional, communicated limit.
