// Block model -> flowable HTML for the Paged.js pipeline. The markup/classes
// match the placeholder theme in index.css. This is the seam between the
// content model and the render engine that graduated from the spike.

import type { Newsletter, Block } from "./types";
import { articleBodyToHTML } from "./tiptap";
import { imageUrl } from "./imageStore";

const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function renderBlock(block: Block): string {
  switch (block.type) {
    case "article": {
      const hasHeadline = block.headline.trim().length > 0;
      const hasByline = block.byline.trim().length > 0;
      const hasHeader = hasHeadline || hasByline;
      const headline = hasHeadline
        ? `<h2 class="headline">${esc(block.headline)}</h2>`
        : "";
      const byline = hasByline
        ? `<p class="byline">${esc(block.byline)}</p>`
        : "";
      // The header wrapper carries the dividing rule and is present whenever
      // there is a headline or byline; its presence also enables the drop cap.
      const header = hasHeader
        ? `<div class="nl-article-head">${headline}${byline}</div>`
        : "";
      const body = articleBodyToHTML(block.body);
      const bodyClass = hasHeader ? "article-body has-header" : "article-body";
      return `<article class="nl-article">${header}<div class="${bodyClass}">${body}</div></article>`;
    }
    case "advice": {
      const title = block.title.trim() || "Ask the Editor";
      const items = block.items
        .map(
          (it) =>
            `<p class="q">Q. ${esc(it.question)}</p><p class="a">A. ${esc(
              it.answer
            )}</p>`
        )
        .join("");
      return `<section class="nl-advice"><h2 class="dept">${esc(
        title
      )}</h2>${items}</section>`;
    }
    case "photoset": {
      const figs = block.photos
        .map((p) => {
          const cap = p.caption.trim()
            ? `<figcaption>${esc(p.caption)}</figcaption>`
            : "";
          const url = imageUrl(p.imageId);
          const img = url
            ? `<div class="frame"><img class="nl-img" src="${url}" alt="" /></div>`
            : `<div class="nl-img-missing">no image</div>`;
          return `<figure class="nl-media nl-photo">${img}${cap}</figure>`;
        })
        .join("");
      return figs;
    }
    case "ad": {
      const url = imageUrl(block.imageId);
      const img = url
        ? `<div class="box"><img class="nl-img" src="${url}" alt="" /></div>`
        : `<div class="nl-img-missing">advertisement</div>`;
      const cap = block.caption.trim()
        ? `<p class="cap">${esc(block.caption)}</p>`
        : "";
      return `<aside class="nl-media nl-ad">${img}${cap}</aside>`;
    }
    case "puzzle": {
      const title = block.title.trim()
        ? `<p class="cap" style="font-weight:700">${esc(block.title)}</p>`
        : "";
      const url = imageUrl(block.imageId);
      const img = url
        ? `<div class="frame"><img class="nl-img" src="${url}" alt="" /></div>`
        : `<div class="nl-img-missing">puzzle image</div>`;
      const cap = block.caption.trim()
        ? `<p class="cap">${esc(block.caption)}</p>`
        : "";
      return `<figure class="nl-media nl-puzzle">${title}${img}${cap}</figure>`;
    }
  }
}

export function newsletterToHTML(nl: Newsletter): string {
  const { publication: p } = nl;
  const nameplate = `
    <header class="nl-nameplate">
      <p class="title">${esc(p.name || "Untitled")}</p>
      <p class="dateline">${[p.issueLabel, p.date, p.tagline]
        .filter((s) => s && s.trim())
        .map(esc)
        .join(" &nbsp;&bull;&nbsp; ")}</p>
    </header>`;
  const body = nl.blocks.map(renderBlock).join("\n");
  return `<div class="nl-content">${nameplate}${body}</div>`;
}
