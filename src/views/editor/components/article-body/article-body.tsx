import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import { articleExtensions } from '@/utils/tiptap.ts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  TextBoldIcon,
  TextItalicIcon,
  Heading03Icon,
  QuoteUpIcon,
  LeftToRightListDashIcon,
  LeftToRightListNumberIcon,
} from 'hugeicons-react';

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
          'prose-editor min-h-[6rem] rounded-b-md border-x border-b bg-background px-3 py-2 text-[14px] leading-relaxed text-foreground focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return (
    <div>
      {/* Formatting toolbar */}
      <div className="bg-muted flex flex-wrap gap-0.5 rounded-t-md border px-1.5 py-1">
        <ToolbarBtn
          title="Bold"
          active={editor.isActive('bold')}
          onActivate={() => editor.chain().focus().toggleBold().run()}
        >
          <TextBoldIcon size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive('italic')}
          onActivate={() => editor.chain().focus().toggleItalic().run()}
        >
          <TextItalicIcon size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Subhead"
          active={editor.isActive('heading', { level: 3 })}
          onActivate={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading03Icon size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Pull-quote"
          active={editor.isActive('blockquote')}
          onActivate={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteUpIcon size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onActivate={() => editor.chain().focus().toggleBulletList().run()}
        >
          <LeftToRightListDashIcon size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onActivate={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <LeftToRightListNumberIcon size={13} />
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
        'h-6 min-w-6 px-1.5 text-[11px]',
        active
          ? 'bg-foreground text-background hover:bg-foreground/80'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </Button>
  );
}
