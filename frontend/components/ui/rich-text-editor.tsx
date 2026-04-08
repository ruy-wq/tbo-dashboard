"use client";

import { useMemo, useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import {
  createMentionSuggestion,
  type MentionDataProvider,
} from "@/components/shared/mention-suggestion";
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconH1,
  IconH2,
  IconH3,
  IconCode,
  IconBlockquote,
  IconSeparator,
  IconArrowBackUp,
  IconArrowForwardUp,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex size-6 items-center justify-center rounded transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1.5">
      {/* Undo / Redo */}
      <ToolbarButton
        title="Desfazer"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <IconArrowBackUp className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Refazer"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <IconArrowForwardUp className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border/60" />

      {/* Headings */}
      <ToolbarButton
        title="Título 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
      >
        <IconH1 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Título 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <IconH2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Título 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      >
        <IconH3 className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border/60" />

      {/* Inline formatting */}
      <ToolbarButton
        title="Negrito"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <IconBold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Itálico"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <IconItalic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Tachado"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        <IconStrikethrough className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Código inline"
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
      >
        <IconCode className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border/60" />

      {/* Lists */}
      <ToolbarButton
        title="Lista com marcadores"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <IconList className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <IconListNumbers className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Lista de tarefas"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
      >
        <IconListCheck className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border/60" />

      {/* Block */}
      <ToolbarButton
        title="Citação"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <IconBlockquote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Separador"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <IconSeparator className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  readOnly?: boolean;
  showToolbar?: boolean;
  /** Data provider for @mentions suggestions */
  mentionProvider?: MentionDataProvider;
}

export function RichTextEditor({
  value = "",
  onChange,
  onBlur,
  placeholder = "Escreva algo...",
  className,
  minHeight = 120,
  readOnly = false,
  showToolbar = true,
  mentionProvider,
}: RichTextEditorProps) {
  // Memoize extensions to prevent useEditor from re-creating on every render
  const extensions = useMemo(
    () => [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      ...(mentionProvider
        ? [
            Mention.configure({
              HTMLAttributes: { class: "text-primary font-medium" },
              suggestion: createMentionSuggestion(mentionProvider),
            }),
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placeholder, !!mentionProvider],
  );

  // Stable refs for callbacks to avoid editor recreation
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const editor = useEditor({
    extensions,
    content: value || "",
    editable: !readOnly,
    onUpdate: ({ editor: e }) => {
      onChangeRef.current?.(e.getHTML());
    },
    onBlur: () => {
      onBlurRef.current?.();
    },
    immediatelyRender: false,
  });

  // Sync editable state
  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background transition-colors",
        !readOnly && "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30",
        className,
      )}
    >
      {showToolbar && !readOnly && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none px-3 py-2 text-sm outline-none",
          "[&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_ul[data-type=taskList]]:list-none [&_.ProseMirror_ul[data-type=taskList]]:pl-0",
          "[&_.ProseMirror_li[data-type=taskItem]]:flex [&_.ProseMirror_li[data-type=taskItem]]:items-start [&_.ProseMirror_li[data-type=taskItem]]:gap-2",
          "[&_.ProseMirror_li[data-type=taskItem]_input]:mt-1",
        )}
        style={{ minHeight }}
      />
    </div>
  );
}

// ─── Read-only viewer ─────────────────────────────────────────────────────────

export function RichTextViewer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <RichTextEditor
      value={content}
      readOnly
      showToolbar={false}
      minHeight={0}
      className={cn("border-0 bg-transparent", className)}
    />
  );
}
