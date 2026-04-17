// ============================================================================
// Template de e-mail TBO (outbound, sem CTA)
// Baseado em design minimalista do wearetbo.com.br — acromático + laranja de
// destaque (#e85102), tipografia Helvetica Neue, header/footer editorial.
//
// Uso: buildTboEmailHtml({ subject, body, label, preheader, unsubscribeUrl })
// ============================================================================

export interface TboEmailOptions {
  /** Assunto do e-mail (também usado como H1 se main_headline não for passado) */
  subject: string;
  /** Corpo do e-mail. Aceita markdown básico (ver parseBodyMarkdown) */
  body: string;
  /** Texto do eyebrow (acima do H1). Default: "TBO" */
  label?: string;
  /** Texto do preheader (visível em inbox preview). Default: primeira frase do body */
  preheader?: string;
  /** URL de unsubscribe. Default: "#" */
  unsubscribeUrl?: string;
  /** URL de preferências. Default: "#" */
  preferencesUrl?: string;
  /** Se true, não renderiza footer completo (útil pra previews inline mais curtos). Default: false */
  compact?: boolean;
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
 *
 * HTML puro no body é escapado (segurança). Só merge tags *|TAG|* são preservadas.
 */
export function parseBodyMarkdown(raw: string): string {
  if (!raw) return "";

  // Divide em parágrafos por linhas em branco duplas
  const paragraphs = raw.split(/\n{2,}/g);

  const htmlParagraphs = paragraphs.map((para) => {
    const trimmed = para.trim();
    if (!trimmed) return "";

    // Divisor
    if (/^[-—]{3,}$/.test(trimmed)) {
      return `<hr style="border:0;border-top:1px solid #eaeaea;margin:24px 0;" />`;
    }

    // Parágrafo que é só uma imagem/vídeo — renderiza standalone sem <p>
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

/**
 * Processa elementos inline (imagens, links) dentro de um parágrafo.
 * Escapa HTML do resto do texto.
 */
function processInline(text: string): string {
  // Primeiro processa mídia inline ![alt](url) e links [text](url), preservando
  // os tokens markdown. Depois escapa o resto e substitui os tokens pelo HTML.
  const tokens: string[] = [];
  const placeholder = (i: number) => `\u0000TOKEN${i}\u0000`;

  // ![alt](url) — imagem
  let work = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    tokens.push(renderMedia(String(alt), String(url)));
    return placeholder(tokens.length - 1);
  });

  // [text](url) — link
  work = work.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, url) => {
    const safeText = escapeHtml(String(t));
    const safeUrl = escapeUrl(String(url));
    tokens.push(
      `<a href="${safeUrl}" target="_blank" rel="noopener" style="color:#e85102;text-decoration:underline;">${safeText}</a>`,
    );
    return placeholder(tokens.length - 1);
  });

  // Escapa o que sobrou (texto puro)
  work = escapeHtml(work);

  // Restaura tokens
  work = work.replace(/\u0000TOKEN(\d+)\u0000/g, (_m, i) => tokens[Number(i)] ?? "");

  return work;
}

function renderMedia(alt: string, url: string): string {
  const safeAlt = escapeHtml(alt);
  const safeUrl = escapeUrl(url);

  // Se URL parece vídeo (termina em .mp4, .mov, .webm ou é YouTube/Vimeo), renderiza como
  // placeholder clicável (e-mail clients não suportam <video>)
  if (isVideoUrl(url)) {
    return `<a href="${safeUrl}" target="_blank" rel="noopener" style="display:block;margin:16px 0;text-align:center;text-decoration:none;">
  <div style="background:#0a0a0a;color:#ffffff;padding:64px 24px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">
    ▶ Assistir vídeo${safeAlt ? ` — ${safeAlt}` : ""}
  </div>
</a>`;
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
    lower.includes("vimeo.com/")
  );
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
  const label = escapeHtml((opts.label || "TBO").toUpperCase());
  const preheader = escapeHtml(opts.preheader || firstSentence(opts.body));
  const bodyHtml = parseBodyMarkdown(opts.body);
  const unsubUrl = escapeUrl(opts.unsubscribeUrl || "#");
  const prefsUrl = escapeUrl(opts.preferencesUrl || "#");

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
                <img src="https://wearetbo.com.br/assets/logo-dark.svg" alt="TBO" width="56" height="24" style="display:block;height:24px;width:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="px-40" style="padding:0 40px;background-color:#ffffff;" bgcolor="#ffffff">
              <div style="height:1px;background-color:#eaeaea;line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td class="px-40" style="padding:48px 40px 12px 40px;background-color:#ffffff;" bgcolor="#ffffff">
              <p style="margin:0;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;line-height:1.4;letter-spacing:0.12em;color:#e85102;text-transform:uppercase;font-weight:500;">${label}</p>
            </td>
          </tr>
          <tr>
            <td class="px-40" style="padding:0 40px 20px 40px;background-color:#ffffff;" bgcolor="#ffffff">
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
      <img src="https://wearetbo.com.br/assets/logo-dark.svg" alt="TBO" width="56" height="24" style="display:block;height:24px;width:auto;border:0;margin-bottom:32px;" />
      <p style="margin:0 0 32px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#525252;">
        Ecossistema de soluções para lançamentos imobiliários.<br />
        Direção criativa, Digital 3D, Branding, Marketing, Audiovisual e Plataforma Interativa.
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
