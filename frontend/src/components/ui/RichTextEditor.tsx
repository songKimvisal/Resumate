import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Check,
  Link as LinkIcon,
  List,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

function normalizeUrl(raw: string) {
  const url = raw.trim();
  if (!url) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  return `https://${url}`;
}
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  id,
}: RichTextEditorProps) {
  const placeholderRef = useRef(placeholder);
  placeholderRef.current = placeholder;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      TextAlign.configure({
        types: ["paragraph", "heading"],
        defaultAlignment: "left",
      }),
      Placeholder.configure({ placeholder: () => placeholderRef.current ?? "" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "rte-content min-h-40 px-3 py-2 text-sm text-text focus:outline-none",
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dispatch(editor.state.tr);
  }, [placeholder, editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-bg focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-colors",
        className,
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-line">
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
      <LinkControl editor={editor} />

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

function LinkControl({ editor }: { editor: Editor }) {
  const { t } = useTranslation();
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const selectionRef = useRef<{ from: number; to: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openPopover = () => {
    selectionRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setOpen((v) => !v);
  };

  const restoreSelection = () => {
    const sel = selectionRef.current;
    const chain = editor.chain().focus();
    if (sel) chain.setTextSelection(sel);
    return chain;
  };

  const applyLink = () => {
    const href = normalizeUrl(url);
    const sel = selectionRef.current;
    const empty = !sel || sel.from === sel.to;
    const chain = restoreSelection();

    if (!href) {
      chain.extendMarkRange("link").unsetLink().run();
      setOpen(false);
      return;
    }

    if (empty && !editor.isActive("link")) {
      const label = href.replace(/^https?:\/\//i, "");
      chain
        .insertContent({
          type: "text",
          text: label,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      chain.extendMarkRange("link").setLink({ href }).run();
    }
    setOpen(false);
  };

  const removeLink = () => {
    restoreSelection().extendMarkRange("link").unsetLink().run();
    setUrl("");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <ToolbarButton
        active={open || editor.isActive("link")}
        onClick={openPopover}
        label="Link"
      >
        <LinkIcon size={16} strokeWidth={2} />
      </ToolbarButton>
      {open && (
        <div className="absolute z-20 left-0 top-[calc(100%+0.5rem)] w-[min(18rem,calc(100vw-2rem))] bg-bg border border-line rounded-xl shadow-lg p-3 space-y-1.5">
          <p className="text-xs font-medium text-text-secondary">
            {t("builder.personal.linkUrl")}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="url"
              autoFocus
              value={url}
              placeholder="https://"
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === "Escape") setOpen(false);
              }}
              className="flex-1 h-9 px-3 rounded-lg border border-line bg-bg text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
            />
            <button
              type="button"
              onClick={applyLink}
              className="size-9 shrink-0 rounded-lg bg-emerald-600 text-white inline-flex items-center justify-center hover:bg-emerald-700 transition-colors"
              aria-label={t("builder.confirm")}
            >
              <Check size={16} />
            </button>
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={removeLink}
                className="size-9 shrink-0 rounded-lg border border-line text-destructive inline-flex items-center justify-center hover:bg-surface-2 transition-colors"
                aria-label={t("builder.personal.removeField")}
              >
                <Unlink size={16} />
              </button>
            )}
          </div>
        </div>
      )}
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
      onMouseDown={(e) => e.preventDefault()}
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
