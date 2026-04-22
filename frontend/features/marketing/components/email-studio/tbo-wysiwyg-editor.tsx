"use client";

/**
 * Editor WYSIWYG para newsletters TBO.
 *
 * Renderiza o e-mail visualmente idêntico ao template `buildTboEmailHtml`, permitindo
 * editar diretamente no preview: clica num parágrafo → edita ali mesmo. Seleciona texto
 * → bubble menu com Bold/Italic/Link. Botão fixo embaixo insere imagem (upload inline
 * via `uploadEmailAsset`, bucket `email-assets`).
 *
 * Usa Tiptap (já instalado) com StarterKit + Image + Link + Placeholder. Markdown
 * entra via `markdownToTiptapHtml` e sai via `tiptapDocToMarkdown` (serializer próprio),
 * mantendo round-trip compatível com o template TBO.
 */

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TboSectionDivider } from "../../lib/tiptap-extensions/tbo-section-divider";
import { TboVideoCard } from "../../lib/tiptap-extensions/tbo-video-card";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconBold,
  IconItalic,
  IconLink,
  IconPhoto,
  IconLinkOff,
  IconReplace,
  IconTrash,
  IconTextCaption,
  IconSeparatorHorizontal,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { uploadEmailAsset } from "@/features/comercial/hooks/use-upload-email-asset";
import {
  tiptapDocToMarkdown,
  markdownToTiptapHtml,
} from "../../lib/tbo-tiptap-serializer";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────────
// Helper: texto contentEditable controlado sem quebrar cursor
// ──────────────────────────────────────────────────────────────────

interface ContentEditableTextProps {
  tag: "div" | "h1" | "h2" | "h3" | "p";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

function ContentEditableText({
  tag: Tag,
  value,
  onChange,
  placeholder,
  className,
  style,
}: ContentEditableTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  // Sincroniza externo → DOM só quando o valor divergiu (preserva cursor)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      data-empty={!value ? "true" : undefined}
      spellCheck={false}
      className={`tbo-ce ${className ?? ""}`}
      style={style}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.innerText.trim();
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" && Tag !== "p") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    />
  );
}

interface Props {
  body: string;
  onBodyChange: (md: string) => void;
  subject: string;
  onSubjectChange?: (s: string) => void;
  preheader?: string;
  eyebrow?: string;
  onEyebrowChange?: (s: string) => void;
}

export function TboWysiwygEditor({
  body,
  onBodyChange,
  subject,
  onSubjectChange,
  eyebrow,
  onEyebrowChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Dialog genérico de input (substitui window.prompt, que navegadores bloqueiam)
  const [inputDialog, setInputDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    label?: string;
    placeholder?: string;
    defaultValue: string;
    confirmLabel?: string;
    allowEmpty?: boolean;
    emptyHint?: string;
    onConfirm: (value: string) => void;
  } | null>(null);
  const [inputDialogValue, setInputDialogValue] = useState("");

  function openInput(
    opts: Omit<NonNullable<typeof inputDialog>, "open"> & {
      defaultValue?: string;
    },
  ) {
    setInputDialogValue(opts.defaultValue ?? "");
    setInputDialog({ ...opts, open: true, defaultValue: opts.defaultValue ?? "" });
  }

  function closeInputDialog() {
    setInputDialog(null);
    setInputDialogValue("");
  }

  function confirmInputDialog() {
    if (!inputDialog) return;
    inputDialog.onConfirm(inputDialogValue);
    closeInputDialog();
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "tbo-email-img" },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener",
          class: "tbo-email-link",
        },
      }),
      Placeholder.configure({
        placeholder: "Escreva sua newsletter aqui…",
        emptyEditorClass: "is-editor-empty",
      }),
      TboSectionDivider,
      TboVideoCard,
    ],
    content: markdownToTiptapHtml(body),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tbo-email-editor-body focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const md = tiptapDocToMarkdown(editor.getJSON() as never);
      onBodyChange(md);
    },
  });

  // Sync externo → editor (quando abre outro draft)
  useEffect(() => {
    if (!editor) return;
    const currentMd = tiptapDocToMarkdown(editor.getJSON() as never);
    if (body !== currentMd) {
      editor.commands.setContent(markdownToTiptapHtml(body), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, editor]);

  async function handleImageUpload(file: File) {
    try {
      const uploaded = await uploadEmailAsset(file);
      editor?.chain().focus().setImage({
        src: uploaded.url,
        alt: file.name.replace(/\.[^.]+$/, ""),
      }).run();
      toast.success("Imagem inserida");
    } catch (err) {
      toast.error("Falha no upload", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  }

  async function handleImageReplace(file: File) {
    if (!editor) return;
    try {
      const uploaded = await uploadEmailAsset(file);
      const prevAlt = String(editor.getAttributes("image").alt ?? "");
      editor.chain().focus().updateAttributes("image", {
        src: uploaded.url,
        alt: prevAlt || file.name.replace(/\.[^.]+$/, ""),
      }).run();
      toast.success("Imagem trocada");
    } catch (err) {
      toast.error("Falha no upload", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    }
  }

  function handleEditAlt() {
    if (!editor) return;
    const current = String(editor.getAttributes("image").alt ?? "");
    openInput({
      title: "Texto alternativo (alt)",
      description:
        "Descrição curta da imagem — lida por leitores de tela e exibida quando a imagem não carrega.",
      label: "Alt",
      placeholder: "Ex: Fachada do empreendimento",
      defaultValue: current,
      allowEmpty: true,
      confirmLabel: "Salvar",
      onConfirm: (next) => {
        editor.chain().focus().updateAttributes("image", { alt: next }).run();
      },
    });
  }

  function handleImageLink() {
    if (!editor) return;
    const current = String(editor.getAttributes("link").href ?? "");
    openInput({
      title: "Link da imagem",
      description:
        "A imagem vira clicável e leva pra essa URL. Útil pra thumb de vídeo, CTA, etc.",
      label: "URL",
      placeholder: "https://…",
      defaultValue: current,
      allowEmpty: true,
      emptyHint: "Deixe vazio pra remover o link",
      confirmLabel: "Aplicar",
      onConfirm: (url) => {
        if (url.trim() === "") {
          editor.chain().focus().unsetLink().run();
        } else {
          editor.chain().focus().setLink({ href: url.trim() }).run();
        }
      },
    });
  }

  function handleDeleteImage() {
    if (!editor) return;
    editor.chain().focus().deleteSelection().run();
  }

  function handleInsertVideo() {
    if (!editor) return;
    openInput({
      title: "Adicionar vídeo do YouTube",
      description:
        "Cola a URL do YouTube — a thumbnail é puxada automaticamente e o card vira clicável no e-mail.",
      label: "URL do vídeo",
      placeholder: "https://www.youtube.com/watch?v=… ou https://youtu.be/…",
      defaultValue: "",
      confirmLabel: "Inserir",
      onConfirm: (url) => {
        if (!url.trim()) return;
        editor
          .chain()
          .focus()
          .insertVideoCard({ url: url.trim(), label: "Assistir o vídeo" })
          .run();
      },
    });
  }

  function handleInsertDivider() {
    if (!editor) return;
    openInput({
      title: "Divisor de seção",
      description:
        "Texto opcional centralizado entre duas linhas finas. Deixe vazio pra uma linha simples.",
      label: "Texto",
      placeholder: "Ex: FICHA TÉCNICA",
      defaultValue: "FICHA TÉCNICA",
      allowEmpty: true,
      emptyHint: "Vazio = linha simples sem texto",
      confirmLabel: "Inserir",
      onConfirm: (label) => {
        editor
          .chain()
          .focus()
          .insertSectionDivider(label.trim().toUpperCase())
          .run();
      },
    });
  }

  function handleSetLink() {
    if (!editor) return;
    const prev = String(editor.getAttributes("link").href ?? "");
    openInput({
      title: "Link",
      description: "URL que o texto selecionado vai abrir.",
      label: "URL",
      placeholder: "https://…",
      defaultValue: prev,
      allowEmpty: true,
      emptyHint: "Deixe vazio pra remover o link",
      confirmLabel: "Aplicar",
      onConfirm: (url) => {
        if (url.trim() === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url.trim() })
            .run();
        }
      },
    });
  }

  return (
    <div className="relative bg-zinc-100 dark:bg-zinc-950 h-full overflow-y-auto">
      <div className="py-8 px-4">
        {/* Email canvas — 600px igual inbox */}
        <div
          className="mx-auto bg-white max-w-[600px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-sm overflow-hidden"
          style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
        >
          {/* Header fixo: logo TBO */}
          <div className="px-10 pt-8 pb-6 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://os.wearetbo.com.br/logo-tbo.png"
              alt="TBO"
              width={72}
              height={28}
              style={{ display: "block", width: 72, height: 28 }}
            />
          </div>
          <div className="mx-10 h-px bg-[#eaeaea]" />

          {/* Eyebrow + H1 — editáveis inline no canvas */}
          <div className="px-10 pt-12 pb-5 bg-white">
            <ContentEditableText
              tag="div"
              value={eyebrow ?? ""}
              onChange={(v) => onEyebrowChange?.(v)}
              placeholder="EYEBROW OPCIONAL · ex: CASE · 04/2026"
              style={{
                fontFamily:
                  "'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "#e85102",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 12,
                outline: "none",
                minHeight: 16,
              }}
            />
            <ContentEditableText
              tag="h1"
              value={subject}
              onChange={(v) => onSubjectChange?.(v)}
              placeholder="Assunto do e-mail…"
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.15,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "#0a0a0a",
                outline: "none",
                minHeight: 36,
              }}
            />
          </div>

          {/* Body editável */}
          <div className="px-10 pb-12 bg-white tbo-email-editor-wrapper">
            <EditorContent editor={editor} />
          </div>

          {/* Footer fixo */}
          <div
            className="px-10 pt-12 pb-10 bg-[#fafafa] border-t border-[#eaeaea]"
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://os.wearetbo.com.br/logo-tbo.png"
              alt="TBO"
              width={72}
              height={28}
              style={{ display: "block", width: 72, height: 28, marginBottom: 32 }}
            />
            <p
              style={{
                margin: "0 0 32px 0",
                fontSize: 14,
                lineHeight: 1.5,
                color: "#525252",
              }}
            >
              Ecossistema de soluções para lançamentos imobiliários.
              <br />
              Direção criativa, Digital 3D, Branding, Marketing, Audiovisual e
              Plataforma Interativa.
            </p>
            <div
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.6,
                color: "#737373",
              }}
            >
              TBO, think, build, own.
              <br />
              Curitiba, PR · Brasil
              <br />
              marco@agenciatbo.com.br · +55 41 99669-6918
              <br />
              wearetbo.com.br
            </div>
          </div>
        </div>
      </div>

      {/* Bubble menu de TEXTO — aparece ao selecionar texto (não imagem) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          pluginKey="textBubbleMenu"
          shouldShow={({ editor, from, to }) =>
            !editor.isActive("image") && from !== to
          }
          className="flex items-center gap-0.5 rounded-md bg-black text-white shadow-lg px-1 py-1"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("bold") ? "text-[#e85102]" : "text-white"}`}
            title="Negrito"
          >
            <IconBold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("italic") ? "text-[#e85102]" : "text-white"}`}
            title="Itálico"
          >
            <IconItalic className="size-3.5" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={handleSetLink}
            className={`p-1.5 rounded hover:bg-white/10 ${editor.isActive("link") ? "text-[#e85102]" : "text-white"}`}
            title="Link"
          >
            <IconLink className="size-3.5" />
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded hover:bg-white/10 text-white"
              title="Remover link"
            >
              <IconLinkOff className="size-3.5" />
            </button>
          )}
        </BubbleMenu>
      )}

      {/* Bubble menu de IMAGEM — aparece ao clicar numa imagem */}
      {editor && (
        <BubbleMenu
          editor={editor}
          pluginKey="imageBubbleMenu"
          shouldShow={({ editor }) => editor.isActive("image")}
          className="flex items-center gap-0.5 rounded-lg bg-black text-white shadow-xl px-1.5 py-1"
        >
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium hover:bg-white/10 text-white"
            title="Substituir imagem (upload)"
          >
            <IconReplace className="size-3.5" />
            Trocar
          </button>
          <button
            type="button"
            onClick={handleEditAlt}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium hover:bg-white/10 text-white"
            title="Editar texto alternativo (alt)"
          >
            <IconTextCaption className="size-3.5" />
            Alt
          </button>
          <button
            type="button"
            onClick={handleImageLink}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium hover:bg-white/10 ${editor.isActive("link") ? "text-[#e85102]" : "text-white"}`}
            title="Tornar clicável (link)"
          >
            <IconLink className="size-3.5" />
            Link
          </button>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={handleDeleteImage}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium hover:bg-red-500/20 text-red-300 hover:text-red-200"
            title="Remover imagem"
          >
            <IconTrash className="size-3.5" />
            Remover
          </button>
        </BubbleMenu>
      )}

      {/* Input hidden pra substituição (acionado pelo menu de imagem) */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageReplace(file);
          if (replaceInputRef.current) replaceInputRef.current.value = "";
        }}
      />

      {/* Toolbar fixa — adicionar imagem */}
      <div className="sticky bottom-4 flex justify-center pointer-events-none">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <div className="flex gap-2 pointer-events-auto">
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 shadow-lg"
          >
            <IconPhoto className="size-3.5" />
            Imagem
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleInsertVideo}
            className="gap-1.5 shadow-lg bg-white"
          >
            <IconBrandYoutube className="size-3.5" />
            Vídeo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleInsertDivider}
            className="gap-1.5 shadow-lg bg-white"
          >
            <IconSeparatorHorizontal className="size-3.5" />
            Divisor
          </Button>
        </div>
      </div>

      {/* CSS global pra replicar template TBO */}
      <style jsx global>{`
        .tbo-email-editor-wrapper .ProseMirror {
          outline: none;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.65;
          color: #171717;
          min-height: 200px;
        }
        .tbo-email-editor-wrapper .ProseMirror > *:first-child {
          margin-top: 0;
        }
        .tbo-email-editor-wrapper .ProseMirror p {
          margin: 0 0 16px 0;
        }
        .tbo-email-editor-wrapper .ProseMirror h2 {
          font-family: "SF Mono", Menlo, Monaco, Consolas, "Courier New",
            monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: #e85102;
          font-weight: 700;
          text-transform: uppercase;
          margin: 28px 0 12px 0;
        }
        .tbo-email-editor-wrapper .ProseMirror h3 {
          font-family: "SF Mono", Menlo, Monaco, Consolas, "Courier New",
            monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: #e85102;
          font-weight: 700;
          text-transform: uppercase;
          margin: 24px 0 12px 0;
        }
        .tbo-email-editor-wrapper .ProseMirror strong {
          font-weight: 700;
          color: #0a0a0a;
        }
        .tbo-email-editor-wrapper .ProseMirror em {
          font-style: italic;
          color: #171717;
        }
        .tbo-email-editor-wrapper .ProseMirror a.tbo-email-link,
        .tbo-email-editor-wrapper .ProseMirror a {
          color: #e85102;
          text-decoration: underline;
          cursor: text;
        }
        .tbo-email-editor-wrapper .ProseMirror blockquote {
          border-left: 3px solid #e85102;
          padding: 4px 0 4px 16px;
          margin: 20px 0;
          color: #262626;
          font-size: 15px;
          line-height: 1.6;
        }
        .tbo-email-editor-wrapper .ProseMirror blockquote p {
          margin: 0;
        }
        .tbo-email-editor-wrapper .ProseMirror hr {
          border: 0;
          border-top: 1px solid #eaeaea;
          margin: 24px 0;
        }
        .tbo-email-editor-wrapper .ProseMirror ul {
          margin: 16px 0;
          padding-left: 24px;
        }
        .tbo-email-editor-wrapper .ProseMirror ul li {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.55;
          color: #262626;
        }
        .tbo-email-editor-wrapper .ProseMirror ul li p {
          margin: 0;
        }
        .tbo-email-editor-wrapper .ProseMirror img.tbo-email-img,
        .tbo-email-editor-wrapper .ProseMirror img {
          display: block;
          width: 100%;
          max-width: 520px;
          height: auto;
          margin: 16px auto;
          border: 0;
          cursor: pointer;
          transition: outline 0.15s ease, opacity 0.15s ease;
        }
        .tbo-email-editor-wrapper .ProseMirror img:hover {
          opacity: 0.88;
          outline: 2px solid #e85102;
          outline-offset: 4px;
        }
        .tbo-email-editor-wrapper .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #e85102;
          outline-offset: 4px;
        }
        .tbo-email-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #a3a3a3;
          pointer-events: none;
          height: 0;
        }
        .tbo-ce {
          cursor: text;
          transition: background-color 0.15s ease;
          border-radius: 2px;
        }
        .tbo-ce:hover {
          background-color: rgba(232, 81, 2, 0.04);
        }
        .tbo-ce:focus {
          background-color: rgba(232, 81, 2, 0.06);
          outline: none;
        }
        .tbo-ce[data-empty="true"]::before {
          content: attr(data-placeholder);
          opacity: 0.4;
          pointer-events: none;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-section-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 40px 0;
          user-select: none;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-section-divider-line {
          flex: 1;
          height: 1px;
          background-color: #e5e5e5;
          display: block;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-section-divider-label {
          font-family: "SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace;
          font-size: 10px;
          letter-spacing: 0.35em;
          color: #737373;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-section-divider.ProseMirror-selectednode {
          outline: 2px solid #e85102;
          outline-offset: 8px;
          border-radius: 2px;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-video-card {
          display: block;
          margin: 16px auto;
          max-width: 520px;
          background: #0a0a0a;
          overflow: hidden;
          cursor: pointer;
          user-select: none;
          transition: outline 0.15s ease, opacity 0.15s ease;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-video-card:hover {
          opacity: 0.92;
          outline: 2px solid #e85102;
          outline-offset: 4px;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-video-card.ProseMirror-selectednode {
          outline: 2px solid #e85102;
          outline-offset: 4px;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-video-thumb {
          display: block;
          width: 100%;
          height: auto;
          margin: 0;
          border: 0;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-video-placeholder {
          padding: 64px 24px;
          text-align: center;
          color: #737373;
          font-size: 12px;
        }
        .tbo-email-editor-wrapper .ProseMirror .tbo-video-caption {
          background: #0a0a0a;
          color: #ffffff;
          padding: 18px 24px;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 600;
          text-align: center;
        }
      `}</style>

      {/* Dialog reutilizável — substitui window.prompt (bloqueado pelo browser) */}
      <Dialog
        open={inputDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) closeInputDialog();
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{inputDialog?.title}</DialogTitle>
            {inputDialog?.description && (
              <DialogDescription>{inputDialog.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-2 py-2">
            {inputDialog?.label && (
              <Label htmlFor="tbo-input-dialog" className="text-xs font-medium">
                {inputDialog.label}
              </Label>
            )}
            <Input
              id="tbo-input-dialog"
              autoFocus
              value={inputDialogValue}
              placeholder={inputDialog?.placeholder}
              onChange={(e) => setInputDialogValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmInputDialog();
                }
              }}
            />
            {inputDialog?.emptyHint && (
              <p className="text-xs text-muted-foreground">
                {inputDialog.emptyHint}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeInputDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmInputDialog}>
              {inputDialog?.confirmLabel ?? "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
