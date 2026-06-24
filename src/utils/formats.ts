import type { FormatDef, FormatId, ImposeOptions, Slot } from "@/types";

const LETTER_LONG = 11;
const LETTER_SHORT = 8.5;

/** content rectangle of a panel, given the panel cell origin + page margin */
function contentSlot(
  cellLeft: number,
  cellTop: number,
  cellW: number,
  cellH: number,
  margin: number,
  panelIndex: number | null,
  rotate180: boolean,
  readingNo: number | null
): Slot {
  return {
    panelIndex,
    leftIn: cellLeft + margin,
    topIn: cellTop + margin,
    widthIn: cellW - 2 * margin,
    heightIn: cellH - 2 * margin,
    rotate180,
    readingNo,
  };
}

const stapledPortrait: FormatDef = {
  id: "stapled-portrait",
  label: "Stapled Portrait",
  blurb:
    "8.5×11 portrait sheets, corner-stapled. Print order = reading order (no imposition). Grows by adding sheets.",
  pageWidthIn: LETTER_SHORT,
  pageHeightIn: LETTER_LONG,
  pageMarginIn: 0.6,
  columns: 2,
  sheetWidthIn: LETTER_SHORT,
  sheetHeightIn: LETTER_LONG,
  capacity: null,
  duplex: false,
  impose(pageCount) {
    const m = this.pageMarginIn;
    const sheets = [];
    for (let i = 0; i < pageCount; i++) {
      sheets.push({
        label: `Page ${i + 1}`,
        widthIn: this.sheetWidthIn,
        heightIn: this.sheetHeightIn,
        foldGuidesX: [],
        slots: [
          contentSlot(0, 0, this.sheetWidthIn, this.sheetHeightIn, m, i, false, i + 1),
        ],
      });
    }
    return { sheets, oversetPages: 0 };
  },
  readingView(pageCount) {
    return { sheets: this.impose(pageCount, { backReversed: false, rotateBack: false }).sheets };
  },
};

const trifold: FormatDef = {
  id: "trifold",
  label: "Trifold",
  blurb:
    "One landscape sheet, 6 panels, letter-folded. Real imposition + duplex. Fixed capacity (6 panels).",
  // Cells span the full sheet (no outer gap). pageMarginIn is the sole margin,
  // so outer-edge and fold-side margins are identical: m on every side.
  // Gutter in flat view = 2×m (one from each adjacent panel). ✓
  pageWidthIn: LETTER_LONG / 3, // ≈ 3.667
  pageHeightIn: LETTER_SHORT,   // 8.5
  pageMarginIn: 0.3,
  columns: 1,
  sheetWidthIn: LETTER_LONG, // landscape
  sheetHeightIn: LETTER_SHORT,
  capacity: 6,
  duplex: true,
  readingView(pageCount) {
    const cellW = this.pageWidthIn;
    const cellH = this.pageHeightIn;
    const m = this.pageMarginIn;
    const cell = (col: number, panelIndex: number): Slot =>
      contentSlot(col * cellW, 0, cellW, cellH, m,
        panelIndex < pageCount ? panelIndex : null, false, panelIndex + 1);
    return {
      sheets: [
        { label: "Front Cover", widthIn: cellW,              heightIn: cellH, foldGuidesX: [],                   slots: [cell(0, 0)] },
        { label: "Inside",       widthIn: this.sheetWidthIn, heightIn: cellH, foldGuidesX: [cellW, 2 * cellW],    slots: [cell(0, 1), cell(1, 2), cell(2, 3)] },
        { label: "Back",         widthIn: 2 * cellW,         heightIn: cellH, foldGuidesX: [cellW],               slots: [cell(0, 4), cell(1, 5)] },
      ],
    };
  },
  impose(pageCount, _opts) {
    const cellW = this.pageWidthIn; // LETTER_LONG / 3
    const cellH = this.pageHeightIn; // LETTER_SHORT
    const m = this.pageMarginIn;

    const cell = (col: number, panelIndex: number): Slot =>
      contentSlot(
        col * cellW,
        0,
        cellW,
        cellH,
        m,
        panelIndex < pageCount ? panelIndex : null,
        false,
        panelIndex + 1
      );

    const foldGuidesX = [cellW, 2 * cellW]; // ≈ 3.667, 7.333

    // C-fold layout (left→right columns on each sheet):
    // Front (outside): [panel 5] [panel 6] [panel 1 / cover]
    // Back  (inside):  [panel 2] [panel 3] [panel 4]
    const front = {
      label: "Sheet — Front (outside)",
      widthIn: this.sheetWidthIn,
      heightIn: this.sheetHeightIn,
      foldGuidesX,
      slots: [cell(0, 4), cell(1, 5), cell(2, 0)],
    };
    const back = {
      label: "Sheet — Back (inside)",
      widthIn: this.sheetWidthIn,
      heightIn: this.sheetHeightIn,
      foldGuidesX,
      slots: [cell(0, 1), cell(1, 2), cell(2, 3)],
    };

    return { sheets: [front, back], oversetPages: Math.max(0, pageCount - 6) };
  },
};

const stapledLandscape: FormatDef = {
  id: "stapled-landscape",
  label: "Stapled Landscape",
  blurb:
    "11×8.5 landscape sheets, corner-stapled. Print order = reading order (no imposition). Grows by adding sheets.",
  pageWidthIn: LETTER_LONG,
  pageHeightIn: LETTER_SHORT,
  pageMarginIn: 0.6,
  columns: 3,
  sheetWidthIn: LETTER_LONG,
  sheetHeightIn: LETTER_SHORT,
  capacity: null,
  duplex: false,
  impose(pageCount) {
    const m = this.pageMarginIn;
    const sheets = [];
    for (let i = 0; i < pageCount; i++) {
      sheets.push({
        label: `Page ${i + 1}`,
        widthIn: this.sheetWidthIn,
        heightIn: this.sheetHeightIn,
        foldGuidesX: [],
        slots: [
          contentSlot(0, 0, this.sheetWidthIn, this.sheetHeightIn, m, i, false, i + 1),
        ],
      });
    }
    return { sheets, oversetPages: 0 };
  },
  readingView(pageCount) {
    return { sheets: this.impose(pageCount, { backReversed: false, rotateBack: false }).sheets };
  },
};

const HALF_LETTER = LETTER_LONG / 2; // 5.5

interface SaddleGeom {
  pageWidthIn: number;
  pageHeightIn: number;
  pageMarginIn: number;
  sheetWidthIn: number;
  sheetHeightIn: number;
}

/**
 * Saddle-stitch imposition for half-letter pages, 2-up on landscape sheets,
 * folded at the centre. Shared by Bifold (fixed 4 pages, one sheet) and Booklet
 * (any multiple of 4). For P padded pages, sheet i carries:
 *   front (outside): left = P-1-2i, right = 2i
 *   back  (inside):  left = 2i+1,   right = P-2-2i        (0-indexed pages)
 * Duplex back handling mirrors the trifold (rotateBack / backReversed toggles).
 */
function imposeSaddleStitch(
  pageCount: number,
  opts: ImposeOptions,
  geom: SaddleGeom,
  fixedFourPanels: boolean
): { sheets: { label: string; widthIn: number; heightIn: number; foldGuidesX: number[]; slots: Slot[] }[]; oversetPages: number } {
  const cellW = geom.pageWidthIn; // 5.5
  const cellH = geom.pageHeightIn; // 8.5
  const m = geom.pageMarginIn;
  const padded = fixedFourPanels
    ? 4
    : Math.max(4, Math.ceil(pageCount / 4) * 4);
  const sheetCount = padded / 4;
  const oversetPages = fixedFourPanels ? Math.max(0, pageCount - 4) : 0;

  const panel = (cellLeft: number, pageIdx: number, rotate: boolean): Slot =>
    contentSlot(
      cellLeft,
      0,
      cellW,
      cellH,
      m,
      pageIdx < pageCount ? pageIdx : null,
      rotate,
      pageIdx + 1
    );

  const sheets = [];
  for (let i = 0; i < sheetCount; i++) {
    const fL = padded - 1 - 2 * i;
    const fR = 2 * i;
    let bL = 2 * i + 1;
    let bR = padded - 2 - 2 * i;
    if (opts.backReversed) [bL, bR] = [bR, bL];
    const suffix = sheetCount > 1 ? ` (sheet ${i + 1}/${sheetCount})` : "";
    sheets.push({
      label: `FRONT (outside)${suffix}`,
      widthIn: geom.sheetWidthIn,
      heightIn: geom.sheetHeightIn,
      foldGuidesX: [cellW],
      slots: [panel(0, fL, false), panel(cellW, fR, false)],
    });
    sheets.push({
      label: `BACK (inside)${suffix}`,
      widthIn: geom.sheetWidthIn,
      heightIn: geom.sheetHeightIn,
      foldGuidesX: [cellW],
      slots: [
        panel(0, bL, opts.rotateBack),
        panel(cellW, bR, opts.rotateBack),
      ],
    });
  }
  return { sheets, oversetPages };
}

const bifold: FormatDef = {
  id: "bifold",
  label: "Bifold",
  blurb:
    "One letter sheet folded once into 4 half-letter panels. Imposition + duplex. Fixed capacity (4 panels).",
  pageWidthIn: HALF_LETTER,
  pageHeightIn: LETTER_SHORT,
  pageMarginIn: 0.5,
  columns: 1,
  sheetWidthIn: LETTER_LONG,
  sheetHeightIn: LETTER_SHORT,
  capacity: 4,
  duplex: true,
  impose(pageCount, opts) {
    return imposeSaddleStitch(pageCount, opts, this, true);
  },
  readingView(pageCount) {
    const cellW = this.pageWidthIn;
    const cellH = this.pageHeightIn;
    const m = this.pageMarginIn;
    const s = (left: number, idx: number): Slot =>
      contentSlot(left, 0, cellW, cellH, m, idx < pageCount ? idx : null, false, idx + 1);
    return {
      sheets: [
        { label: "Front Cover", widthIn: cellW,      heightIn: cellH, foldGuidesX: [],       slots: [s(0, 0)] },
        { label: "Inside",       widthIn: 2 * cellW, heightIn: cellH, foldGuidesX: [cellW], slots: [s(0, 1), s(cellW, 2)] },
        { label: "Back Cover",   widthIn: cellW,      heightIn: cellH, foldGuidesX: [],       slots: [s(0, 3)] },
      ],
    };
  },
};

const booklet: FormatDef = {
  id: "booklet",
  label: "Booklet (saddle-stitch)",
  blurb:
    "Half-letter pages, saddle-stitched in multiples of 4. Imposition + duplex. Grows by 4 pages.",
  pageWidthIn: HALF_LETTER,
  pageHeightIn: LETTER_SHORT,
  pageMarginIn: 0.5,
  columns: 1,
  sheetWidthIn: LETTER_LONG,
  sheetHeightIn: LETTER_SHORT,
  capacity: null,
  duplex: true,
  impose(pageCount, opts) {
    return imposeSaddleStitch(pageCount, opts, this, false);
  },
  readingView(pageCount) {
    const cellW = this.pageWidthIn;
    const cellH = this.pageHeightIn;
    const m = this.pageMarginIn;
    const padded = Math.max(4, Math.ceil(pageCount / 4) * 4);
    const PADDING_BLANK = "Left blank to complete the booklet — pages must come in multiples of 4";
    const slot = (left: number, idx: number): Slot => {
      const s = contentSlot(left, 0, cellW, cellH, m, idx < pageCount ? idx : null, false, idx + 1);
      return idx >= pageCount ? { ...s, blankLabel: PADDING_BLANK } : s;
    };

    const sheets = [];

    // Front cover — page 1 alone
    sheets.push({ label: "Front Cover", widthIn: cellW, heightIn: cellH, foldGuidesX: [] as number[], slots: [slot(0, 0)] });

    // Inside pages as left-right spreads: pages 2-3, 4-5, …
    for (let i = 1; i < padded - 1; i += 2) {
      sheets.push({
        label: `Pages ${i + 1}–${i + 2}`,
        widthIn: 2 * cellW,
        heightIn: cellH,
        foldGuidesX: [cellW],
        slots: [slot(0, i), slot(cellW, i + 1)],
      });
    }

    // Back cover — last page alone
    const last = padded - 1;
    sheets.push({ label: "Back Cover", widthIn: cellW, heightIn: cellH, foldGuidesX: [] as number[], slots: [slot(0, last)] });

    return { sheets };
  },
};

export const FORMATS: Record<FormatId, FormatDef> = {
  "stapled-portrait": stapledPortrait,
  "stapled-landscape": stapledLandscape,
  trifold,
  bifold,
  booklet,
};
