import type { Block, BlockType } from "../types/newsletter";
import { newId } from "./ids";
import { emptyDoc } from "./tiptap";

export function makeBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "article":
      return { id, type, headline: "", byline: "", body: emptyDoc };
    case "advice":
      return {
        id,
        type,
        title: "Ask the Editor",
        items: [{ id: newId("i"), question: "", answer: "" }],
      };
    case "photoset":
      return { id, type, photos: [] };
    case "ad":
      return { id, type, imageId: null, caption: "" };
    case "puzzle":
      return { id, type, title: "", imageId: null, caption: "" };
  }
}
