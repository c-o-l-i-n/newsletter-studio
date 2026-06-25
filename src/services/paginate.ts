import { Previewer } from 'pagedjs';

export interface Paginated {
  /** innerHTML of each panel's flowed content, in reading order */
  panels: string[];
  pageCount: number;
}

/**
 * Flow `contentHTML` into panel-sized pages using Paged.js, then extract each
 * panel's laid-out HTML. We deliberately remove Paged.js's injected styles
 * (including its global @page) and clear the offscreen host afterward, so the
 * document is left clean for our own imposed-sheet rendering + printing.
 */
export async function paginate(opts: {
  contentHTML: string;
  pageWidthIn: number;
  pageHeightIn: number;
  marginIn: number;
  columns: number;
  host: HTMLElement;
}): Promise<Paginated> {
  const { contentHTML, pageWidthIn, pageHeightIn, marginIn, columns, host } =
    opts;

  host.innerHTML = '';

  const css = `
    @page {
      size: ${pageWidthIn}in ${pageHeightIn}in;
      margin: ${marginIn}in;
    }
    .nl-content {
      column-count: ${columns};
      column-gap: 0.22in;
      column-fill: auto;
    }
  `;

  const headStylesBefore = new Set(
    Array.from(document.head.querySelectorAll('style')),
  );

  const previewer = new Previewer();
  const flow = await previewer.preview(
    contentHTML,
    [{ 'spike-format.css': css }],
    host,
  );

  const contentEls = Array.from(
    host.querySelectorAll<HTMLElement>('.pagedjs_page_content'),
  );
  // Unwrap the .nl-content wrapper if Paged.js reproduced it per page, so the
  // imposed slot can re-apply a single clean column context.
  const panels = contentEls.map((el) => {
    const inner = el.querySelector<HTMLElement>('.nl-content');
    return (inner ?? el).innerHTML;
  });

  // Clean up Paged.js's footprint so it can't fight our print @page.
  Array.from(document.head.querySelectorAll('style')).forEach((s) => {
    if (!headStylesBefore.has(s)) s.remove();
  });
  host.innerHTML = '';

  const total = (flow as unknown as { total?: number })?.total ?? panels.length;
  return { panels, pageCount: total };
}
