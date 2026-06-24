import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { articleExtensions } from "../../../../utils/tiptap";

// Constrained rich-text body editor. Only semantic marks; no design controls.
export function ArticleBody({
  value,
  onChange,
}: {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
}) {
  const editor = useEditor({
    extensions: articleExtensions,
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[7rem] rounded-md border border-stone-300 bg-white px-3 py-2 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-400",
      },
    },
  });

  if (!editor) return null;

  const Btn = ({
    on,
    active,
    children,
    title,
  }: {
    on: () => void;
    active: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        on();
      }}
      className={`h-7 min-w-7 rounded px-2 text-sm ${
        active
          ? "bg-stone-800 text-white"
          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-1">
        <Btn
          title="Bold"
          active={editor.isActive("bold")}
          on={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </Btn>
        <Btn
          title="Italic"
          active={editor.isActive("italic")}
          on={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </Btn>
        <Btn
          title="Subhead"
          active={editor.isActive("heading", { level: 3 })}
          on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          Subhead
        </Btn>
        <Btn
          title="Pull-quote"
          active={editor.isActive("blockquote")}
          on={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝ Quote
        </Btn>
        <Btn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          on={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Btn>
        <Btn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          on={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
