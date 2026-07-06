import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Link as LinkIcon,
  List,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/** Rich-text field for the resume summary: bold/italic/underline, a bullet
 *  list, links, and paragraph alignment. Stores its value as HTML. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextAlign.configure({
        types: ["paragraph", "heading"],
        defaultAlignment: "left",
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "rte-content min-h-40 px-3 py-2 text-sm text-text focus:outline-none",
      },
    },
  });

  // keep the editor in sync when `value` changes from outside (e.g. AI rewrite)
  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as
      | string
      | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-bg focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-colors",
        className,
      )}
    >
      <Toolbar editor={editor} onSetLink={setLink} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  onSetLink,
}: {
  editor: Editor;
  onSetLink: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-line">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <span className="text-sm font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <span className="text-sm italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <span className="text-sm underline">U</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Bullet list"
      >
        <List size={16} strokeWidth={2} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={onSetLink}
        label="Link"
      >
        <LinkIcon size={16} strokeWidth={2} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        label="Align left"
        icon={AlignLeft}
      />
      <ToolbarButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        label="Align center"
        icon={AlignCenter}
      />
      <ToolbarButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        label="Align right"
        icon={AlignRight}
      />
      <ToolbarButton
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        label="Align justify"
        icon={AlignJustify}
      />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "size-8 rounded-md inline-flex items-center justify-center transition-colors",
        active
          ? "bg-brand text-white"
          : "text-text-secondary hover:bg-surface-2 hover:text-text",
      )}
    >
      {Icon ? <Icon size={16} strokeWidth={2} /> : children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-line mx-1" aria-hidden />;
}
