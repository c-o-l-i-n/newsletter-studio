import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { articleExtensions } from "@/utils/tiptap.ts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-1">
        <ToolbarBtn
          title="Bold"
          active={editor.isActive("bold")}
          onActivate={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive("italic")}
          onActivate={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </ToolbarBtn>
        <ToolbarBtn
          title="Subhead"
          active={editor.isActive("heading", { level: 3 })}
          onActivate={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          Subhead
        </ToolbarBtn>
        <ToolbarBtn
          title="Pull-quote"
          active={editor.isActive("blockquote")}
          onActivate={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝ Quote
        </ToolbarBtn>
        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onActivate={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onActivate={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  onActivate,
  active,
  children,
  title,
}: {
  onActivate: () => void;
  active: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      title={title}
      variant="ghost"
      size="sm"
      onMouseDown={(e) => {
        e.preventDefault();
        onActivate();
      }}
      className={cn(
        "h-7 min-w-7",
        active
          ? "bg-stone-800 text-white hover:bg-stone-700 hover:text-white"
          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
      )}
    >
      {children}
    </Button>
  );
}
