// ============================================================================
// Template TBO simplificado (Deno-native). Gera HTML do email outbound TBO
// com suporte a: **bold**, *italic*, > blockquote, `. . . .` separador,
// ![alt](url) imagem, [text](url) link, eyebrow caps, saudação humana.
//
// Copiado/adaptado de frontend/lib/email-templates/tbo-outbound.ts pra rodar
// em edge function sem dependência do frontend.
// ============================================================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeUrl(url: string): string {
  const safe = url.trim();
  if (/^javascript:/i.test(safe)) return "#";
  if (/^data:/i.test(safe) && !/^data:image\//i.test(safe)) return "#";
  return safe.replace(/"/g, "%22");
}

function processInline(text: string): string {
  const tokens: string[] = [];
  const placeholder = (i: number) => `\u0000TOKEN${i}\u0000`;

  let work = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    const safeAlt = escapeHtml(String(alt));
    const safeUrl = escapeUrl(String(url));
    tokens.push(
      `<img src="${safeUrl}" alt="${safeAlt}" style="display:block;width:100%;max-width:520px;height:auto;margin:16px auto;border:0;" />`,
    );
    return placeholder(tokens.length - 1);
  });

  work = work.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, url) => {
    const safeText = escapeHtml(String(t));
    const safeUrl = escapeUrl(String(url));
    tokens.push(
      `<a href="${safeUrl}" target="_blank" rel="noopener" style="color:#e85102;text-decoration:underline;">${safeText}</a>`,
    );
    return placeholder(tokens.length - 1);
  });

  work = work.replace(/\*\*([^*\n]{1,200}?)\*\*/g, (_m, inner) => {
    tokens.push(
      `<strong style="font-weight:700;color:#0a0a0a;">${escapeHtml(String(inner))}</strong>`,
    );
    return placeholder(tokens.length - 1);
  });

  work = work.replace(/(?<![*\w])\*([^*\n]{1,200}?)\*(?![*\w])/g, (_m, inner) => {
    tokens.push(
      `<em style="font-style:italic;color:#171717;">${escapeHtml(String(inner))}</em>`,
    );
    return placeholder(tokens.length - 1);
  });

  work = escapeHtml(work);
  work = work.replace(/\u0000TOKEN(\d+)\u0000/g, (_m, i) => tokens[Number(i)] ?? "");
  return work;
}

function parseBody(raw: string): string {
  if (!raw) return "";
  const paragraphs = raw.split(/\n{2,}/g);

  return paragraphs
    .map((para) => {
      const t = para.trim();
      if (!t) return "";

      // Separador decorativo "....  ...."
      if (/^\.(\s*\.){2,}$/.test(t)) {
        return `<div style="text-align:center;margin:32px 0;letter-spacing:0.8em;color:#e85102;font-size:14px;line-height:1;font-weight:700;">&bull;&nbsp;&bull;&nbsp;&bull;&nbsp;&bull;</div>`;
      }

      // Blockquote
      if (/^>\s+/.test(t) && t.split("\n").every((l) => /^>\s+/.test(l) || l.trim() === "")) {
        const inner = t.split("\n").map((l) => l.replace(/^>\s?/, "")).join(" ").trim();
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border-collapse:collapse;">
  <tr>
    <td style="width:3px;background-color:#e85102;padding:0;" bgcolor="#e85102">&nbsp;</td>
    <td style="padding:4px 0 4px 16px;"><p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#262626;">${processInline(inner)}</p></td>
  </tr>
</table>`;
      }

      // Parágrafo comum
      const inline = processInline(t);
      const withBreaks = inline.replace(/\n/g, "<br />");
      return `<p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;font-weight:400;color:#171717;">${withBreaks}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

export function buildEmailHtml(opts: {
  subject: string;
  body: string;
  eyebrow?: string;
  preheader?: string;
}): string {
  const subject = escapeHtml(opts.subject || "");
  const preheader = escapeHtml(opts.preheader || opts.body.replace(/\n+/g, " ").slice(0, 140));
  const eyebrowHtml = opts.eyebrow
    ? `<div style="font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:11px;letter-spacing:0.2em;color:#e85102;font-weight:700;text-transform:uppercase;margin-bottom:12px;">${escapeHtml(opts.eyebrow)}</div>`
    : "";
  const bodyHtml = parseBody(opts.body);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <title>${subject}</title>
  <style type="text/css">
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
  <div style="display:none;font-size:1px;color:#fafafa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;" bgcolor="#fafafa">
    <tr>
      <td align="center" style="padding:0;" bgcolor="#fafafa">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="width:600px;max-width:600px;background-color:#ffffff;" bgcolor="#ffffff">
          <tr>
            <td class="px-40" style="padding:32px 40px 24px 40px;background-color:#ffffff;" bgcolor="#ffffff">
              <a href="https://wearetbo.com.br/pt" target="_blank" style="text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                <span style="display:inline-block;width:10px;height:10px;background-color:#e85102;vertical-align:middle;margin-right:8px;margin-bottom:2px;"></span><span style="font-weight:700;font-size:18px;color:#0a0a0a;letter-spacing:-0.02em;vertical-align:middle;">tbo</span>
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
          <tr>
            <td class="px-40" style="padding:48px 40px 40px 40px;background-color:#fafafa;border-top:1px solid #eaeaea;" bgcolor="#fafafa">
              <div style="margin-bottom:32px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                <span style="display:inline-block;width:10px;height:10px;background-color:#e85102;vertical-align:middle;margin-right:8px;margin-bottom:2px;"></span><span style="font-weight:700;font-size:18px;color:#0a0a0a;letter-spacing:-0.02em;vertical-align:middle;">tbo</span>
              </div>
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
                <a href="*|UNSUB|*" target="_blank" style="color:#737373;text-decoration:underline;">Cancelar inscrição</a> · <a href="*|UPDATE_PROFILE|*" target="_blank" style="color:#737373;text-decoration:underline;">Gerenciar preferências</a> · <a href="https://wearetbo.com.br/pt/privacidade" target="_blank" style="color:#737373;text-decoration:underline;">Política de privacidade</a>
              </p>
              <p style="margin:32px 0 0 0;font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:10px;letter-spacing:0.05em;color:#a3a3a3;">
                © ${new Date().getFullYear()} TBO · Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
