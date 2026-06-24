import StarterKit from "@tiptap/starter-kit";
import { generateHTML } from "@tiptap/html";
import type { Extensions, JSONContent } from "@tiptap/react";

// Constrained, semantic-only editing (ADR 0001 / editor decision): bold,
// italic, a single "subhead" level (h3), pull-quote (blockquote), and bullet
// lists. No headings h1/h2, no code, no strike, no horizontal rules, no design
// knobs — the Theme styles these marks.
export const articleExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [3] },
    code: false,
    codeBlock: false,
    strike: false,
    horizontalRule: false,
  }),
];

export const emptyDoc: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** Render an article body (ProseMirror JSON) to HTML for the print pipeline. */
export function articleBodyToHTML(doc: JSONContent): string {
  if (!doc || !doc.content || doc.content.length === 0) return "";
  return generateHTML(doc, articleExtensions);
}
