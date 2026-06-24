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
};

const trifold: FormatDef = {
  id: "trifold",
  label: "Trifold",
  blurb:
    "One landscape sheet, 6 panels, letter-folded. Real imposition + duplex. Fixed capacity (6 panels).",
  // panel cell = (11 - 2*0.25 outer) / 3 wide, (8.5 - 2*0.25) tall
  pageWidthIn: (LETTER_LONG - 0.5) / 3, // 3.5
  pageHeightIn: LETTER_SHORT - 0.5, // 8.0
  pageMarginIn: 0.18,
  columns: 1,
  sheetWidthIn: LETTER_LONG, // landscape
  sheetHeightIn: LETTER_SHORT,
  capacity: 6,
  duplex: true,
  impose(pageCount, opts) {
    const outer = 0.25;
    const cellW = this.pageWidthIn; // 3.5
    const cellH = this.pageHeightIn; // 8.0
    const cellTop = outer;
    const m = this.pageMarginIn;
    const cols = [0, 1, 2];

    const cell = (col: number, panelIndex: number, rotate: boolean): Slot =>
      contentSlot(
        outer + col * cellW,
        cellTop,
        cellW,
        cellH,
        m,
        panelIndex < pageCount ? panelIndex : null,
        rotate,
        panelIndex + 1
      );

    const foldGuidesX = [outer + cellW, outer + 2 * cellW]; // 3.75, 7.25

    // Front (outside of paper): panels 1,2,3 in columns L,M,R.
    const front = {
      label: "Sheet — FRONT (outside)",
      widthIn: this.sheetWidthIn,
      heightIn: this.sheetHeightIn,
      foldGuidesX,
      slots: cols.map((c) => cell(c, c, false)),
    };

    // Back (inside): panels 4,5,6. Column order + rotation depend on the
    // printer's duplex mode. VERIFIED on a Brother HL-L2340DW (long-edge
    // duplex): rotateBack=true, backReversed=false folds into 1→6 order.
    const backPanels = opts.backReversed ? [5, 4, 3] : [3, 4, 5];
    const back = {
      label: "Sheet — BACK (inside)",
      widthIn: this.sheetWidthIn,
      heightIn: this.sheetHeightIn,
      foldGuidesX,
      slots: cols.map((c) => cell(c, backPanels[c], opts.rotateBack)),
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
};

export const FORMATS: Record<FormatId, FormatDef> = {
  "stapled-portrait": stapledPortrait,
  "stapled-landscape": stapledLandscape,
  trifold,
  bifold,
  booklet,
};
