export type FormatId =
  | "stapled-portrait"
  | "stapled-landscape"
  | "trifold"
  | "bifold"
  | "booklet";

export interface Slot {
  /** index into the paginated panels array, or null for a blank panel */
  panelIndex: number | null;
  leftIn: number;
  topIn: number;
  widthIn: number;
  heightIn: number;
  /** rotate 180deg for duplex back-side correction */
  rotate180?: boolean;
  /** reading-order number to show on the panel badge (1-based) */
  readingNo?: number | null;
}

export interface Sheet {
  label: string;
  widthIn: number;
  heightIn: number;
  slots: Slot[];
  /** x positions (inches) of vertical fold lines, for on-paper guides */
  foldGuidesX: number[];
}

export interface ImposeOptions {
  /** reverse the column order of the back sheet (short-edge duplex) */
  backReversed: boolean;
  /** rotate back-sheet panels 180deg (long-edge duplex) */
  rotateBack: boolean;
}

export interface FormatDef {
  id: FormatId;
  label: string;
  blurb: string;
  pageWidthIn: number;
  pageHeightIn: number;
  pageMarginIn: number;
  columns: number;
  sheetWidthIn: number;
  sheetHeightIn: number;
  /** fixed panel capacity, or null for unbounded (grows by adding sheets) */
  capacity: number | null;
  /** true if the format needs duplex + imposition (shows the duplex toggles) */
  duplex: boolean;
  impose(pageCount: number, opts: ImposeOptions): {
    sheets: Sheet[];
    oversetPages: number;
  };
}
