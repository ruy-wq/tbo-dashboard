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
import { useEffect, useRef } from "react";
import {
  IconBold,
  IconItalic,
  IconLink,
  IconPhoto,
  IconLinkOff,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { uploadEmailAsset } from "@/features/comercial/hooks/use-upload-email-asset";
import {
  tiptapDocToMarkdown,
  markdownToTiptapHtml,
} from "../../lib/tbo-tiptap-serializer";
import { toast } from "sonner";

interface Props {
  body: string;
  onBodyChange: (md: string) => void;
  subject: string;
  preheader?: string;
  eyebrow?: string;
}

export function TboWysiwygEditor({
  body,
  onBodyChange,
  subject,
  eyebrow,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleSetLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL do link:", String(prev));
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
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

          {/* Eyebrow + H1 (ligados aos inputs laterais, não editáveis no canvas) */}
          <div className="px-10 pt-12 pb-5 bg-white">
            {eyebrow && (
              <div
                style={{
                  fontFamily:
                    "'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  color: "#e85102",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {eyebrow}
              </div>
            )}
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.15,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "#0a0a0a",
              }}
            >
              {subject || (
                <span className="text-muted-foreground">
                  Assunto do e-mail…
                </span>
              )}
            </h1>
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

      {/* Bubble menu — aparece ao selecionar texto */}
      {editor && (
        <BubbleMenu
          editor={editor}
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
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5 shadow-lg pointer-events-auto"
        >
          <IconPhoto className="size-3.5" />
          Adicionar imagem
        </Button>
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
      `}</style>
    </div>
  );
}
