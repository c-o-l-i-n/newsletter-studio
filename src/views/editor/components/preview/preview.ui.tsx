import type { Sheet } from '@/types';

function SheetView({
  sheet,
  panels,
  columns,
  showGuides,
  showLabel,
}: {
  sheet: Sheet;
  panels: string[];
  columns: number;
  showGuides: boolean;
  showLabel: boolean;
}) {
  return (
    <div className="sheet-group">
      {showLabel && <div className="sheet-label">{sheet.label}</div>}
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
                transform: slot.rotate180 ? 'rotate(180deg)' : undefined,
                transformOrigin: 'center center',
              }}
            >
              {html != null ? (
                <div
                  className="nl-content"
                  style={{
                    height: '100%',
                    columnCount: columns,
                    columnGap: '0.35in',
                    columnFill: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="blank-panel">{slot.blankLabel ?? null}</div>
              )}
            </div>
          );
        })}
        {showGuides &&
          sheet.foldGuidesX.map((x, i) => (
            <div
              key={`f${i}`}
              className="fold-guide"
              style={{ left: `${x}in` }}
            />
          ))}
      </div>
    </div>
  );
}

export interface PreviewUIProps {
  readingSheets: Sheet[];
  imposedSheets: Sheet[];
  panels: string[];
  columns: number;
  showGuides: boolean;
  zoom: number;
  hostRef: React.RefObject<HTMLDivElement>;
  colorImages: boolean;
}

export function PreviewUI({
  readingSheets,
  imposedSheets,
  panels,
  columns,
  showGuides,
  zoom,
  hostRef,
  colorImages,
}: PreviewUIProps) {
  const colorClass = colorImages ? 'nl-color-images' : undefined;
  return (
    <>
      {/* Screen reading view — shows panels in reading/fold order with labels */}
      <div id="reading-root" style={{ zoom }} className={colorClass}>
        {readingSheets.map((sheet, si) => (
          <SheetView
            key={si}
            sheet={sheet}
            panels={panels}
            columns={columns}
            showGuides={showGuides}
            showLabel={true}
          />
        ))}
      </div>

      {/* Print-ready imposed view — hidden on screen, used when printing */}
      <div id="print-root" className={colorClass}>
        {imposedSheets.map((sheet, si) => (
          <SheetView
            key={si}
            sheet={sheet}
            panels={panels}
            columns={columns}
            showGuides={false}
            showLabel={false}
          />
        ))}
      </div>

      <div ref={hostRef} className="paginator-host" />
    </>
  );
}
