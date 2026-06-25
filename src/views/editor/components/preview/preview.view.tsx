import { useEffect, useMemo, useRef, useState } from 'react';
import type { ImposeOptions, Newsletter, FormatId } from '@/types';
import { getFormats } from '@/utils/formats.ts';
import { newsletterToHTML } from '@/utils/render.ts';
import { paginate } from '@/services/paginate.ts';
import { useDebounced } from '@/hooks/use-debounced.ts';
import { PreviewUI } from './preview.ui';

export interface PreviewStats {
  pageCount: number;
  overset: number;
  busy: boolean;
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
  const paperSize = newsletter.settings.paperSize;
  const fmt = useMemo(
    () => getFormats(paperSize)[formatId],
    [paperSize, formatId],
  );
  const [readingSheets, setReadingSheets] = useState(
    () => fmt.readingView(0).sheets,
  );
  const [imposedSheets, setImposedSheets] = useState(
    () => fmt.impose(0, imposeOpts).sheets,
  );
  const contentHTML = useMemo(() => newsletterToHTML(newsletter), [newsletter]);
  const debouncedHTML = useDebounced(contentHTML, 350);

  // Keep the print @page in sync with the format's sheet size.
  useEffect(() => {
    let el = document.getElementById('page-size') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'page-size';
      document.head.appendChild(el);
    }
    el.textContent = `@page { size: ${fmt.sheetWidthIn}in ${fmt.sheetHeightIn}in; margin: 0; }`;
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
        setImposedSheets(sheets);
        setReadingSheets(fmt.readingView(pageCount).sheets);
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
    <PreviewUI
      readingSheets={readingSheets}
      imposedSheets={imposedSheets}
      panels={panels}
      columns={fmt.columns}
      showGuides={showGuides}
      zoom={zoom}
      hostRef={hostRef}
      colorImages={newsletter.settings.colorImages}
    />
  );
}
