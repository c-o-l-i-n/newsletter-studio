import type { Sheet } from "@/types";

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

export interface PreviewUIProps {
  sheets: Sheet[];
  panels: string[];
  columns: number;
  showGuides: boolean;
  zoom: number;
  hostRef: React.RefObject<HTMLDivElement>;
}

export function PreviewUI({
  sheets,
  panels,
  columns,
  showGuides,
  zoom,
  hostRef,
}: PreviewUIProps) {
  return (
    <>
      <div id="print-scaler" style={{ transform: `scale(${zoom})` }}>
        <div id="print-root">
          {sheets.map((sheet, si) => (
            <SheetView
              key={si}
              sheet={sheet}
              panels={panels}
              columns={columns}
              showGuides={showGuides}
            />
          ))}
        </div>
      </div>
      <div ref={hostRef} className="paginator-host" />
    </>
  );
}
