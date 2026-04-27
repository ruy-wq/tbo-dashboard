// ============================================================================
// Template de e-mail TBO (outbound, sem CTA)
// Baseado em design minimalista do wearetbo.com.br — acromático + laranja de
// destaque (#e85102), tipografia Helvetica Neue, header/footer editorial.
//
// Uso: buildTboEmailHtml({ subject, body, label, preheader, unsubscribeUrl })
// ============================================================================

export type PlaceholderMode = "render" | "strip";

export interface TboEmailOptions {
  /** Assunto do e-mail (também usado como H1 se main_headline não for passado) */
  subject: string;
  /** Corpo do e-mail. Aceita markdown básico (ver parseBodyMarkdown) */
  body: string;
  /** Texto do preheader (visível em inbox preview). Default: primeira frase do body */
  preheader?: string;
  /** URL de unsubscribe. Default: "#" */
  unsubscribeUrl?: string;
  /** URL de preferências. Default: "#" */
  preferencesUrl?: string;
  /** Se true, não renderiza footer completo (útil pra previews inline mais curtos). Default: false */
  compact?: boolean;
  /**
   * Como tratar tokens `{{imagem}}`, `{{video}}`, `{{gif}}` no body:
   * - "render" (default): mostra bloco placeholder visual — usar no preview do editor
   * - "strip": remove tokens não preenchidos — usar no envio real pra Mailchimp
   */
  placeholderMode?: PlaceholderMode;
  /**
   * Eyebrow opcional renderizado em caps acima do H1 (ex: "BOA TARDE", "OLÁ",
   * "TRENDING NOW"). Usa laranja TBO.
   */
  eyebrow?: string;
}

/**
 * Regex que casa os tokens de placeholder de mídia.
 * Aceita: {{imagem}}, {{imagem:legenda}}, {{video}}, {{video:legenda}}, {{gif}}, {{gif:legenda}}
 * Case-insensitive no tipo; legenda é qualquer texto até "}}".
 */
const PLACEHOLDER_RE = /\{\{\s*(imagem|image|video|vídeo|gif)\s*(?::\s*([^}]+?))?\s*\}\}/gi;

/**
 * Remove todos os tokens `{{imagem}}`, `{{video}}`, `{{gif}}` do texto.
 * Usado antes de enviar o email real (quando o usuário não preencheu o placeholder
 * com uma mídia de verdade).
 *
 * Também colapsa linhas em branco que sobrem depois da remoção.
 */
export function stripPlaceholderTokens(body: string): string {
  if (!body) return body;
  const withoutTokens = body.replace(PLACEHOLDER_RE, "");
  // Colapsa 3+ quebras de linha em 2 (uma linha em branco)
  return withoutTokens.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Escapa HTML pra evitar injection em conteúdo texto.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Converte markdown simples do body em HTML seguro pra e-mail.
 *
 * Suporta:
 * - Parágrafos separados por \n\n → <p>
 * - Quebras de linha simples dentro de parágrafo → <br>
 * - Imagens/GIFs: ![alt](url) → <img>
 * - Links: [texto](url) → <a>
 * - Vídeos (thumbnail clicável): ![[videoUrl]](thumbnailUrl) → wrap em <a>
 * - Divisor: linha só com "---" → <hr>
 * - Placeholders: {{imagem}}, {{video}}, {{gif}} (com ou sem legenda) →
 *     render: bloco visual "insira sua mídia aqui" (default)
 *     strip: removido completamente
 *
 * HTML puro no body é escapado (segurança). Só merge tags *|TAG|* são preservadas.
 */
export function parseBodyMarkdown(
  raw: string,
  placeholderMode: PlaceholderMode = "render",
): string {
  if (!raw) return "";

  // Se modo strip, remove tokens ANTES de dividir em parágrafos pra não deixar
  // parágrafos inteiros vazios sobrando.
  const source =
    placeholderMode === "strip" ? stripPlaceholderTokens(raw) : raw;

  // Divide em parágrafos por linhas em branco duplas
  const paragraphs = source.split(/\n{2,}/g);

  const htmlParagraphs = paragraphs.map((para) => {
    const trimmed = para.trim();
    if (!trimmed) return "";

    // Divisor decorativo tipo newsletter editorial: linha com 4 pontos
    // (".   .   .   ." ou "...." ou ". . . .")
    if (/^\.(\s*\.){2,}$/.test(trimmed)) {
      return renderDecorativeSeparator();
    }

    // Divisor com label centralizada: `--- LABEL ---`
    const labeledDividerMatch = /^---\s+(.+?)\s+---\s*$/.exec(trimmed);
    if (labeledDividerMatch) {
      return renderLabeledDivider(labeledDividerMatch[1].trim());
    }

    // Divisor simples (---)
    if (/^[-—]{3,}$/.test(trimmed)) {
      return `<hr style="border:0;border-top:1px solid #eaeaea;margin:24px 0;" />`;
    }

    // Seção Trending: "### Trending now" (ou variações) seguido de bullets
    const trendingMatch = matchTrendingSection(trimmed);
    if (trendingMatch) {
      return renderTrendingSection(trendingMatch);
    }

    // Heading standalone H2/H3 — renderiza label SF Mono laranja uppercase
    const headingMatch = /^#{2,3}\s+(.+?)\s*$/.exec(trimmed);
    if (headingMatch && !trimmed.includes("\n")) {
      return `<h3 style="margin:28px 0 12px 0;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#e85102;font-weight:700;text-transform:uppercase;">${escapeHtml(headingMatch[1])}</h3>`;
    }

    // Sub-bloco: "### Heading" na 1ª linha + descrição (texto corrido) nas seguintes.
    // Renderiza heading laranja uppercase + parágrafo padrão na sequência.
    const subBlockMatch = /^(#{2,3})\s+([^\n]+)\n([\s\S]+)$/.exec(trimmed);
    if (subBlockMatch) {
      const subHeadingText = escapeHtml(subBlockMatch[2].trim());
      const descriptionRaw = subBlockMatch[3];
      const descriptionInline = processInline(descriptionRaw);
      const descriptionWithBreaks = descriptionInline.replace(/\n/g, "<br />");
      return `<h3 style="margin:28px 0 8px 0;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#e85102;font-weight:700;text-transform:uppercase;">${subHeadingText}</h3>
<p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;font-weight:400;color:#171717;">${descriptionWithBreaks}</p>`;
    }

    // Blockquote: parágrafo cujas linhas começam com "> "
    if (/^>\s+/.test(trimmed) && trimmed.split("\n").every((l) => /^>\s+/.test(l) || l.trim() === "")) {
      const inner = trimmed
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join(" ")
        .trim();
      return renderBlockquote(inner);
    }

    // Parágrafo que é só um placeholder de mídia → renderiza bloco visual
    // (só acontece em placeholderMode === "render"; em "strip" o token já saiu)
    const singlePlaceholderMatch = matchSinglePlaceholder(trimmed);
    if (singlePlaceholderMatch) {
      return renderPlaceholderBlock(singlePlaceholderMatch);
    }

    // Parágrafo que é só uma imagem/vídeo real — renderiza standalone sem <p>
    const singleMediaMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
    if (singleMediaMatch) {
      return renderMedia(singleMediaMatch[1], singleMediaMatch[2]);
    }

    // Inline: processa markdown dentro do parágrafo
    const inline = processInline(trimmed);

    // Transforma \n simples em <br>
    const withBreaks = inline.replace(/\n/g, "<br />");

    return `<p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;font-weight:400;color:#171717;">${withBreaks}</p>`;
  });

  return htmlParagraphs.filter(Boolean).join("\n");
}

function renderDecorativeSeparator(): string {
  // 4 pontos laranja centralizados, espaçados, estilo newsletter editorial
  return `<div style="text-align:center;margin:32px 0;letter-spacing:0.8em;color:#e85102;font-size:14px;line-height:1;font-weight:700;">
  &bull;&nbsp;&bull;&nbsp;&bull;&nbsp;&bull;
</div>`;
}

function renderLabeledDivider(label: string): string {
  const safeLabel = escapeHtml(label.toUpperCase());
  // Table-based pra compat com Outlook: linha | label | linha
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:40px 0;">
  <tr>
    <td style="border-top:1px solid #e5e5e5;width:40%;height:1px;line-height:1px;font-size:0;">&nbsp;</td>
    <td style="padding:0 16px;white-space:nowrap;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:10px;letter-spacing:0.35em;color:#737373;font-weight:700;text-transform:uppercase;text-align:center;">${safeLabel}</td>
    <td style="border-top:1px solid #e5e5e5;width:40%;height:1px;line-height:1px;font-size:0;">&nbsp;</td>
  </tr>
</table>`;
}

function renderBlockquote(innerText: string): string {
  const inline = processInline(innerText);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border-collapse:collapse;">
  <tr>
    <td style="width:3px;background-color:#e85102;padding:0;" bgcolor="#e85102">&nbsp;</td>
    <td style="padding:4px 0 4px 16px;">
      <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#262626;">${inline}</p>
    </td>
  </tr>
</table>`;
}

interface TrendingItem {
  emoji: string | null;
  label: string | null;
  text: string;
}

interface TrendingSection {
  title: string;
  items: TrendingItem[];
}

/**
 * Detecta uma seção Trending no formato:
 *
 * ### Trending now
 * - 🔍 **PARA LER:** texto do item com [link](url)
 * - 👀 **PARA DESCOBRIR:** outro item
 *
 * O título aceita variações: "Trending now", "Trending", "Giro", "Quick takes".
 */
function matchTrendingSection(text: string): TrendingSection | null {
  const lines = text.split("\n").map((l) => l.trimEnd());
  if (lines.length < 2) return null;
  // Aceita QUALQUER heading H2/H3 seguido de bullets — não só "Em alta"/"Trending"
  const headerMatch = /^#{2,3}\s+(.+?)\s*$/i.exec(lines[0].trim());
  if (!headerMatch) return null;

  const items: TrendingItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    if (!bulletMatch) return null; // se aparecer linha não-bullet, não é trending
    const content = bulletMatch[1];
    // Extrai emoji inicial (se houver) + label em bold + resto
    const parts = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})?\s*(?:\*\*([^*]+?):\*\*\s*)?(.+)$/u.exec(
      content,
    );
    if (parts) {
      items.push({
        emoji: parts[1] ?? null,
        label: parts[2] ?? null,
        text: parts[3],
      });
    } else {
      items.push({ emoji: null, label: null, text: content });
    }
  }

  if (items.length === 0) return null;
  return { title: headerMatch[1], items };
}

function renderTrendingSection(section: TrendingSection): string {
  const titleDisplay = section.title.toUpperCase();
  const itemsHtml = section.items
    .map((it) => {
      const emoji = it.emoji
        ? `<span style="display:inline-block;margin-right:8px;font-size:16px;vertical-align:middle;">${it.emoji}</span>`
        : "";
      const label = it.label
        ? `<strong style="color:#0a0a0a;font-weight:700;letter-spacing:0.01em;">${escapeHtml(it.label.toUpperCase())}:</strong> `
        : "";
      const body = processInline(it.text);
      return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#262626;">
    ${emoji}${label}${body}
  </td>
</tr>`;
    })
    .join("\n");
  return `<div style="margin:28px 0;">
  <div style="font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#e85102;font-weight:700;margin-bottom:12px;">${escapeHtml(titleDisplay)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-top:1px solid #f0f0f0;">
    ${itemsHtml}
  </table>
</div>`;
}

interface PlaceholderInfo {
  kind: "image" | "video" | "gif";
  caption: string | null;
}

function matchSinglePlaceholder(text: string): PlaceholderInfo | null {
  // Só casa se o parágrafo INTEIRO é um único placeholder (ignorando espaços)
  const m = /^\{\{\s*(imagem|image|video|vídeo|gif)\s*(?::\s*([^}]+?))?\s*\}\}$/i.exec(
    text.trim(),
  );
  if (!m) return null;
  const raw = m[1].toLowerCase();
  const kind: PlaceholderInfo["kind"] =
    raw === "video" || raw === "vídeo" ? "video" : raw === "gif" ? "gif" : "image";
  return { kind, caption: m[2]?.trim() || null };
}

function renderPlaceholderBlock(info: PlaceholderInfo): string {
  const label =
    info.kind === "video"
      ? "Arraste um vídeo aqui"
      : info.kind === "gif"
        ? "Arraste um GIF aqui"
        : "Arraste uma imagem aqui";
  const icon = info.kind === "video" ? "▶" : info.kind === "gif" ? "◉" : "▣";
  const captionHtml = info.caption
    ? `<div style="margin-top:8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#737373;font-style:italic;">${escapeHtml(info.caption)}</div>`
    : "";
  return `<div data-tbo-placeholder="${info.kind}" style="margin:20px 0;padding:36px 24px;border:2px dashed #d4d4d4;border-radius:8px;background-color:#fafafa;text-align:center;">
  <div style="font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:22px;color:#a3a3a3;line-height:1;">${icon}</div>
  <div style="margin-top:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.4;color:#525252;font-weight:500;letter-spacing:0.02em;">${label}</div>
  <div style="margin-top:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.4;color:#a3a3a3;">ou clique em ${info.kind === "video" ? "Vídeo" : info.kind === "gif" ? "GIF" : "Imagem"} na toolbar</div>
  ${captionHtml}
</div>`;
}

/**
 * Processa elementos inline dentro de um parágrafo: imagens, links,
 * **bold**, *italic*. Escapa HTML do resto do texto.
 *
 * Estratégia: extrai primeiro os tokens ricos (mídia, link, bold, italic)
 * e substitui por sentinelas. Escapa o texto puro restante. Restaura os
 * tokens. Isso garante que o texto do usuário nunca vira HTML injetado,
 * mas a formatação intencional é preservada.
 */
function processInline(text: string): string {
  const tokens: string[] = [];
  const placeholder = (i: number) => `\u0000TOKEN${i}\u0000`;

  // ![alt](url) — imagem
  let work = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    tokens.push(renderMedia(String(alt), String(url)));
    return placeholder(tokens.length - 1);
  });

  // [text](url) — link
  work = work.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, url) => {
    const safeText = escapeInline(String(t));
    const safeUrl = escapeUrl(String(url));
    tokens.push(
      `<a href="${safeUrl}" target="_blank" rel="noopener" style="color:#e85102;text-decoration:underline;">${safeText}</a>`,
    );
    return placeholder(tokens.length - 1);
  });

  // ==highlight== — bold laranja TBO (ênfase forte, money quote)
  work = work.replace(/==([^=\n]{1,200}?)==/g, (_m, inner) => {
    const safe = escapeInline(String(inner));
    tokens.push(
      `<strong style="font-weight:700;color:#e85102;">${safe}</strong>`,
    );
    return placeholder(tokens.length - 1);
  });

  // **bold** — peso semântico. Usa regex não-greedy com limite de 200 chars
  // pra não atravessar parágrafos quebrados.
  work = work.replace(/\*\*([^*\n]{1,200}?)\*\*/g, (_m, inner) => {
    const safe = escapeInline(String(inner));
    tokens.push(
      `<strong style="font-weight:700;color:#0a0a0a;">${safe}</strong>`,
    );
    return placeholder(tokens.length - 1);
  });

  // *italic* ou _italic_ — ênfase leve. Evita casar com ** (já processado).
  work = work.replace(/(?<![*\w])\*([^*\n]{1,200}?)\*(?![*\w])/g, (_m, inner) => {
    const safe = escapeInline(String(inner));
    tokens.push(`<em style="font-style:italic;color:#171717;">${safe}</em>`);
    return placeholder(tokens.length - 1);
  });

  // Escapa o que sobrou (texto puro)
  work = escapeHtml(work);

  // Restaura tokens
  work = work.replace(/\u0000TOKEN(\d+)\u0000/g, (_m, i) => tokens[Number(i)] ?? "");

  return work;
}

/**
 * Escape mais leve que escapeHtml — preserva caracteres que escapeHtml
 * transforma mas que são seguros dentro de um contexto já controlado
 * (texto dentro de bold/italic/link). Ainda bloqueia < > " ' &.
 */
function escapeInline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMedia(alt: string, url: string): string {
  const safeAlt = escapeHtml(alt);
  const safeUrl = escapeUrl(url);

  // Se URL parece vídeo (termina em .mp4, .mov, .webm ou é YouTube/Vimeo), renderiza card
  // clicável com thumb + botão CTA laranja (e-mail clients não suportam <video>)
  if (isVideoUrl(url)) {
    return renderVideoCard({
      href: safeUrl,
      rawUrl: url,
      label: alt || "Assistir o vídeo",
    });
  }

  // Imagem / GIF normal
  return `<img src="${safeUrl}" alt="${safeAlt}" style="display:block;width:100%;max-width:520px;height:auto;margin:16px auto;border:0;" />`;
}

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".webm") ||
    lower.includes("youtube.com/watch") ||
    lower.includes("youtu.be/") ||
    lower.includes("youtube.com/embed") ||
    lower.includes("youtube.com/shorts") ||
    lower.includes("vimeo.com/")
  );
}

const YOUTUBE_ID_RE =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/;

function extractYouTubeId(url: string): string | null {
  const m = YOUTUBE_ID_RE.exec(url);
  return m ? m[1] : null;
}

/**
 * Card de vídeo: thumbnail do YouTube (maxresdefault) + pill CTA laranja
 * compacto centralizado abaixo, sem wrapper preto. Table-based pra compat
 * com Outlook 2007+. Toda a célula do card é clicável (link externo envolve
 * tudo).
 */
function renderVideoCard(opts: {
  href: string;
  rawUrl: string;
  label: string;
}): string {
  const safeLabel = escapeHtml(opts.label);
  const safeLabelUpper = escapeHtml(opts.label.toUpperCase());
  const ytId = extractYouTubeId(opts.rawUrl);
  const thumbUrl = ytId
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : "";

  const thumbRow = thumbUrl
    ? `<tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <img src="${thumbUrl}" alt="${safeLabel}" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:0;outline:none;text-decoration:none;border-radius:6px;" />
    </td>
  </tr>`
    : `<tr>
    <td style="padding:48px 24px;background:#fafafa;border:1px solid #eaeaea;border-radius:6px;text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#a3a3a3;">Thumbnail indisponível</td>
  </tr>`;

  return `<a href="${opts.href}" target="_blank" rel="noopener" style="display:block;margin:20px auto;text-decoration:none;max-width:520px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;max-width:520px;">
    ${thumbRow}
    <tr>
      <td align="center" style="padding:14px 0 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="background:#e85102;border-radius:9999px;padding:9px 22px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#ffffff;white-space:nowrap;">
              ▶&nbsp;&nbsp;${safeLabelUpper}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</a>`;
}

function escapeUrl(url: string): string {
  const safe = url.trim();
  // Bloqueia javascript: e data: não-imagem
  if (/^javascript:/i.test(safe)) return "#";
  if (/^data:/i.test(safe) && !/^data:image\//i.test(safe)) return "#";
  return safe.replace(/"/g, "%22");
}

function firstSentence(text: string, maxLen = 140): string {
  const clean = text.replace(/\n+/g, " ").trim();
  const sliced = clean.slice(0, maxLen);
  return sliced.length < clean.length ? sliced + "…" : sliced;
}

/**
 * Gera o HTML completo do e-mail TBO com os conteúdos dinâmicos aplicados.
 * Template minimalista, sem CTA.
 */
export function buildTboEmailHtml(opts: TboEmailOptions): string {
  const subject = escapeHtml(opts.subject || "");
  const preheader = escapeHtml(opts.preheader || firstSentence(opts.body));
  const bodyHtml = parseBodyMarkdown(opts.body, opts.placeholderMode ?? "render");
  const unsubUrl = escapeUrl(opts.unsubscribeUrl || "#");
  const prefsUrl = escapeUrl(opts.preferencesUrl || "#");

  const eyebrowHtml = opts.eyebrow
    ? `<div style="font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.2em;color:#e85102;font-weight:700;text-transform:uppercase;margin-bottom:12px;">${escapeHtml(opts.eyebrow)}</div>`
    : "";

  const footer = opts.compact ? "" : buildFooter(unsubUrl, prefsUrl);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    body { margin:0 !important; padding:0 !important; width:100% !important; background-color:#fafafa; }
    a { text-decoration:none; color:#e85102; }
    @media only screen and (max-width:620px) {
      .email-container { width:100% !important; max-width:100% !important; }
      .px-40 { padding-left:24px !important; padding-right:24px !important; }
      .h1 { font-size:28px !important; line-height:1.15 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#fafafa;">
  <div style="display:none;font-size:1px;color:#fafafa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader} &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;" bgcolor="#fafafa">
    <tr>
      <td align="center" style="padding:0;" bgcolor="#fafafa">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="width:600px;max-width:600px;background-color:#ffffff;" bgcolor="#ffffff">
          <tr>
            <td class="px-40" style="padding:32px 40px 24px 40px;background-color:#ffffff;" bgcolor="#ffffff">
              <a href="https://wearetbo.com.br/pt" target="_blank" style="text-decoration:none;">
                <img src="https://os.wearetbo.com.br/logo-tbo.png" alt="TBO" width="72" height="28" style="display:block;width:72px;height:28px;border:0;outline:none;text-decoration:none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="px-40" style="padding:0 40px;background-color:#ffffff;" bgcolor="#ffffff">
              <div style="height:1px;background-color:#eaeaea;line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td class="px-40" style="padding:48px 40px 20px 40px;background-color:#ffffff;" bgcolor="#ffffff">
              ${eyebrowHtml}
              <h1 class="h1" style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:32px;line-height:1.15;font-weight:500;letter-spacing:-0.02em;color:#0a0a0a;">${subject}</h1>
            </td>
          </tr>
          <tr>
            <td class="px-40" style="padding:0 40px 48px 40px;background-color:#ffffff;" bgcolor="#ffffff">
              ${bodyHtml}
            </td>
          </tr>
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildFooter(unsubUrl: string, prefsUrl: string): string {
  return `<tr>
    <td class="px-40" style="padding:48px 40px 40px 40px;background-color:#fafafa;border-top:1px solid #eaeaea;" bgcolor="#fafafa">
      <div style="margin-bottom:32px;">
        <img src="https://os.wearetbo.com.br/logo-tbo.png" alt="TBO" width="72" height="28" style="display:block;width:72px;height:28px;border:0;outline:none;text-decoration:none;" />
      </div>
      <div style="font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#e85102;font-weight:700;text-transform:uppercase;margin-bottom:12px;">Quem somos</div>
      <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#262626;">
        A <strong style="color:#0a0a0a;">TBO</strong> é o ecossistema de soluções para lançamentos imobiliários. Atuamos em cinco frentes integradas: <strong style="color:#0a0a0a;">Digital 3D</strong>, <strong style="color:#0a0a0a;">Branding</strong>, <strong style="color:#0a0a0a;">Marketing</strong>, <strong style="color:#0a0a0a;">Audiovisual</strong> e <strong style="color:#0a0a0a;">Plataforma Interativa</strong>.
      </p>
      <p style="margin:0 0 32px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#525252;">
        Trabalhamos com incorporadoras que precisam transformar empreendimento em narrativa e narrativa em venda.
      </p>
      <div style="margin-bottom:24px;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">
        <a href="https://instagram.com/weare.tbo" target="_blank" style="color:#0a0a0a;text-decoration:none;padding-right:16px;">Instagram</a>
        <a href="https://linkedin.com/company/wearetbo" target="_blank" style="color:#0a0a0a;text-decoration:none;padding-right:16px;">LinkedIn</a>
        <a href="https://youtube.com/@wearetbo" target="_blank" style="color:#0a0a0a;text-decoration:none;padding-right:16px;">YouTube</a>
        <a href="https://behance.net/wearetbo" target="_blank" style="color:#0a0a0a;text-decoration:none;">Behance</a>
      </div>
      <div style="height:1px;background-color:#eaeaea;line-height:1px;font-size:0;margin-bottom:24px;">&nbsp;</div>
      <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#737373;">
        TBO, think, build, own.<br />
        Curitiba, PR · Brasil<br />
        <a href="mailto:contato@agenciatbo.com.br" style="color:#737373;text-decoration:none;">contato@agenciatbo.com.br</a> · <a href="tel:+5541996696918" style="color:#737373;text-decoration:none;">+55 41 99669-6918</a><br />
        <a href="https://wearetbo.com.br" target="_blank" style="color:#737373;text-decoration:none;">wearetbo.com.br</a>
      </p>
      <p style="margin:24px 0 0 0;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:10px;letter-spacing:0.05em;color:#a3a3a3;text-transform:uppercase;">
        <a href="${unsubUrl}" target="_blank" style="color:#737373;text-decoration:underline;">Cancelar inscrição</a> · <a href="${prefsUrl}" target="_blank" style="color:#737373;text-decoration:underline;">Gerenciar preferências</a> · <a href="https://wearetbo.com.br/pt/privacidade" target="_blank" style="color:#737373;text-decoration:underline;">Política de privacidade</a>
      </p>
      <p style="margin:32px 0 0 0;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:10px;letter-spacing:0.05em;color:#a3a3a3;">
        © ${new Date().getFullYear()} TBO · Todos os direitos reservados.
      </p>
    </td>
  </tr>`;
}
