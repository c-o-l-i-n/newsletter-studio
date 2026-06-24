import { useEffect, useMemo, useRef, useState } from "react";
import {
  FORMATS,
  type FormatId,
  type ImposeOptions,
  type Sheet,
} from "./formats";
import { paginate } from "./paginate";
import { newsletterToHTML } from "./render";
import type { Newsletter } from "./types";

export interface PreviewStats {
  pageCount: number;
  overset: number;
  busy: boolean;
}

function useDebounced<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

export function Preview({
  newsletter,
  formatId,
  imposeOpts,
  showGuides,
  zoom,
  onStats,
}: {
  newsletter: Newsletter;
  formatId: FormatId;
  imposeOpts: ImposeOptions;
  showGuides: boolean;
  zoom: number;
  onStats?: (s: PreviewStats) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [panels, setPanels] = useState<string[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);

  const fmt = FORMATS[formatId];
  const contentHTML = useMemo(() => newsletterToHTML(newsletter), [newsletter]);
  const debouncedHTML = useDebounced(contentHTML, 350);

  // Keep the print @page in sync with the format's sheet size.
  useEffect(() => {
    let el = document.getElementById("page-size") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "page-size";
      document.head.appendChild(el);
    }
    el.textContent = `@media print { @page { size: ${fmt.sheetWidthIn}in ${fmt.sheetHeightIn}in; margin: 0; } }`;
  }, [fmt]);

  // Serialized pagination: Paged.js mutates a shared host + <head> styles, so
  // overlapping runs corrupt each other. Only the latest request applies.
  const seqRef = useRef(0);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const { backReversed, rotateBack } = imposeOpts;

  useEffect(() => {
    const myId = ++seqRef.current;
    onStats?.({ pageCount: 0, overset: 0, busy: true });
    chainRef.current = chainRef.current.then(async () => {
      if (myId !== seqRef.current || !hostRef.current) return;
      try {
        const { panels, pageCount } = await paginate({
          contentHTML: debouncedHTML,
          pageWidthIn: fmt.pageWidthIn,
          pageHeightIn: fmt.pageHeightIn,
          marginIn: fmt.pageMarginIn,
          columns: fmt.columns,
          host: hostRef.current,
        });
        if (myId !== seqRef.current) return;
        const { sheets, oversetPages } = fmt.impose(pageCount, {
          backReversed,
          rotateBack,
        });
        setPanels(panels);
        setSheets(sheets);
        onStats?.({ pageCount, overset: oversetPages, busy: false });
      } catch {
        if (myId === seqRef.current)
          onStats?.({ pageCount: 0, overset: 0, busy: false });
      }
    });
    // onStats intentionally omitted from deps (parent passes a stable setter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedHTML, fmt, backReversed, rotateBack]);

  return (
    <>
      <div id="print-scaler" style={{ transform: `scale(${zoom})` }}>
        <div id="print-root">
          {sheets.map((sheet, si) => (
            <SheetView
              key={si}
              sheet={sheet}
              panels={panels}
              columns={fmt.columns}
              showGuides={showGuides}
            />
          ))}
        </div>
      </div>
      <div ref={hostRef} className="paginator-host" />
    </>
  );
}

function SheetView({
  sheet,
  panels,
  columns,
  showGuides,
}: {
  sheet: Sheet;
  panels: string[];
  columns: number;
  showGuides: boolean;
}) {
  return (
    <div
      className="sheet"
      style={{ width: `${sheet.widthIn}in`, height: `${sheet.heightIn}in` }}
    >
      {sheet.slots.map((slot, idx) => {
        const html =
          slot.panelIndex != null ? panels[slot.panelIndex] : undefined;
        return (
          <div
            key={idx}
            className="slot"
            style={{
              left: `${slot.leftIn}in`,
              top: `${slot.topIn}in`,
              width: `${slot.widthIn}in`,
              height: `${slot.heightIn}in`,
              transform: slot.rotate180 ? "rotate(180deg)" : undefined,
              transformOrigin: "center center",
            }}
          >
            {showGuides && slot.readingNo != null && (
              <span className="panel-badge">▶ {slot.readingNo}</span>
            )}
            {html != null ? (
              <div
                className="nl-content"
                style={{
                  height: "100%",
                  columnCount: columns,
                  columnGap: "0.22in",
                  columnFill: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="blank-panel">(blank panel)</div>
            )}
          </div>
        );
      })}
      {showGuides &&
        sheet.foldGuidesX.map((x, i) => (
          <div key={`f${i}`} className="fold-guide" style={{ left: `${x}in` }} />
        ))}
    </div>
  );
}
