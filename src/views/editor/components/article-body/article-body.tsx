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
          'prose-editor bg-parchment text-parchment-ink min-h-[6rem] rounded-b-[calc(var(--radius)*0.5)] border-x-2 border-b-2 border-[oklch(0.5_0.07_72)] px-3 py-2 text-[14px] leading-relaxed shadow-[inset_0_2px_5px_oklch(0_0_0_/_0.2)] focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return (
    <div>
      {/* Formatting toolbar */}
      <div className="tex-wood flex flex-wrap gap-0.5 rounded-t-[calc(var(--radius)*0.5)] border-2 border-[oklch(0.5_0.07_72)] px-1.5 py-1 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.1)]">
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
          ? 'bg-gradient-to-b from-[oklch(0.86_0.13_88)] to-[oklch(0.66_0.12_72)] text-[oklch(0.22_0.05_50)] shadow-[inset_0_1px_0_oklch(1_0_0_/_0.4)]'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Button>
  );
}
