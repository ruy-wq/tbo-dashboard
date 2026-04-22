/**
 * Serializer Tiptap ↔ Markdown compatível com o template TBO (`buildTboEmailHtml`).
 *
 * - `markdownToTiptapHtml(md)`: entrada do editor. Converte markdown pra HTML simples
 *   que o Tiptap consegue ingerir (via parseHTML automático).
 * - `tiptapDocToMarkdown(doc)`: saída do editor. Converte a árvore JSON do Tiptap de volta
 *   pra markdown idêntico ao que `parseBodyMarkdown` entende.
 *
 * Suporta: paragraph, heading (h2/h3), bulletList, blockquote, horizontalRule, image,
 * bold, italic, link, hardBreak.
 *
 * Escopo v1: formatação textual básica + imagem + link. Nodes especiais do template
 * (trending section com emoji, ficha técnica, separador decorativo de 4 pontos) são
 * preservados como markdown literal via regras heurísticas.
 */

import { marked } from "marked";

/**
 * Pré-processa extensões TBO no markdown antes de passar pro `marked`.
 *
 * Converte:
 *   `--- FICHA TÉCNICA ---`  →  `<div data-tbo-divider data-label="FICHA TÉCNICA"></div>`
 *   (múltiplos espaços aceitos: `---   FICHA TÉCNICA   ---`)
 */
function preprocessTboMarkdown(md: string): string {
  return md.replace(
    /^---\s+(.+?)\s+---\s*$/gm,
    (_m, label: string) =>
      `<div data-tbo-divider data-label="${escapeAttr(label.trim())}"></div>`,
  );
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function markdownToTiptapHtml(md: string): string {
  if (!md) return "";
  const pre = preprocessTboMarkdown(md);
  return marked.parse(pre, { breaks: false, gfm: true, async: false }) as string;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export function tiptapDocToMarkdown(doc: TiptapNode | null | undefined): string {
  if (!doc || !Array.isArray(doc.content)) return "";
  return doc.content.map(nodeToMarkdown).filter(Boolean).join("\n\n");
}

function nodeToMarkdown(node: TiptapNode): string {
  switch (node.type) {
    case "paragraph":
      return inlineToMd(node.content ?? []);
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return `${"#".repeat(level)} ${inlineToMd(node.content ?? [])}`;
    }
    case "bulletList":
      return (node.content ?? [])
        .map((li) => `- ${listItemInline(li)}`)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((li, i) => `${i + 1}. ${listItemInline(li)}`)
        .join("\n");
    case "blockquote":
      return (node.content ?? [])
        .map((p) => `> ${inlineToMd(p.content ?? [])}`)
        .join("\n");
    case "horizontalRule":
      return "---";
    case "tboSectionDivider": {
      const label = String(node.attrs?.label ?? "").trim();
      return label ? `--- ${label} ---` : "---";
    }
    case "image":
      return `![${String(node.attrs?.alt ?? "")}](${String(node.attrs?.src ?? "")})`;
    default:
      return inlineToMd(node.content ?? []);
  }
}

function listItemInline(li: TiptapNode): string {
  const firstPara = (li.content ?? []).find((c) => c.type === "paragraph");
  return inlineToMd(firstPara?.content ?? []);
}

function inlineToMd(content: TiptapNode[]): string {
  if (!content) return "";
  return content
    .map((n) => {
      if (n.type === "text") {
        let text = n.text ?? "";
        const marks = n.marks ?? [];
        const hasBold = marks.some((m) => m.type === "bold");
        const hasItalic = marks.some((m) => m.type === "italic");
        const linkMark = marks.find((m) => m.type === "link");
        if (hasItalic) text = `*${text}*`;
        if (hasBold) text = `**${text}**`;
        if (linkMark) {
          const href = String(linkMark.attrs?.href ?? "");
          text = `[${text}](${href})`;
        }
        return text;
      }
      if (n.type === "hardBreak") return "\n";
      if (n.type === "image") {
        return `![${String(n.attrs?.alt ?? "")}](${String(n.attrs?.src ?? "")})`;
      }
      return "";
    })
    .join("");
}
