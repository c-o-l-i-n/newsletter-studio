import type { Newsletter, Block } from '@/types';
import { articleBodyToHTML } from './tiptap';
import { imageUrl } from '@/services/image-store';

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function renderBlock(block: Block): string {
  switch (block.type) {
    case 'article': {
      const hasHeadline = block.headline.trim().length > 0;
      const hasByline = block.byline.trim().length > 0;
      const hasHeader = hasHeadline || hasByline;
      const headline = hasHeadline
        ? `<h2 class="headline">${esc(block.headline)}</h2>`
        : '';
      const byline = hasByline
        ? `<p class="byline">${esc(block.byline)}</p>`
        : '';
      // The header wrapper carries the dividing rule and is present whenever
      // there is a headline or byline; its presence also enables the drop cap.
      const header = hasHeader
        ? `<div class="nl-article-head">${headline}${byline}</div>`
        : '';
      // Mark only the true first <p> so the drop cap doesn't re-fire on
      // continuation panels after Paged.js splits the article.
      const rawBody = articleBodyToHTML(block.body);
      const body = rawBody.replace('<p>', '<p class="lede">');
      const bodyClass = hasHeader ? 'article-body has-header' : 'article-body';
      return `<article class="nl-article">${header}<div class="${bodyClass}">${body}</div></article>`;
    }
    case 'advice': {
      const title = block.title.trim() || 'Ask the Editor';
      const items = block.items
        .map(
          (it) =>
            `<p class="q">Q. ${esc(it.question)}</p><p class="a">A. ${esc(it.answer)}</p>`,
        )
        .join('');
      return `<section class="nl-advice"><h2 class="dept">${esc(title)}</h2>${items}</section>`;
    }
    case 'imageset': {
      const figures = block.images
        .map((item) => {
          const url = imageUrl(item.imageId);
          const inner = url
            ? `<img class="nl-img" src="${url}" alt="" />`
            : `<div class="nl-img-missing">no image</div>`;
          const framed =
            item.border === 'none'
              ? inner
              : `<div class="nl-img-frame nl-img-frame--${item.border}">${inner}</div>`;
          const cap = item.caption.trim()
            ? `<figcaption>${esc(item.caption)}</figcaption>`
            : '';
          return `<figure class="nl-media nl-imageset-item">${framed}${cap}</figure>`;
        })
        .join('');
      // Two columns only makes sense with more than one image.
      const twoCol = block.columns === 2 && block.images.length > 1;
      return twoCol
        ? `<div class="nl-imageset nl-imageset--2col">${figures}</div>`
        : figures;
    }
  }
}

export function newsletterToHTML(nl: Newsletter): string {
  const { publication: p } = nl;
  const nameplate = `
    <header class="nl-nameplate">
      <p class="title">${esc(p.name || 'Untitled')}</p>
      <p class="dateline">${[p.issueLabel, p.date, p.location]
        .filter((s) => s && s.trim())
        .map(esc)
        .join(' &nbsp;&bull;&nbsp; ')}</p>
    </header>`;
  const body = nl.blocks.map(renderBlock).join('\n');
  return `<div class="nl-content">${nameplate}${body}</div>`;
}
