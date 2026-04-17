// ============================================================================
// TBO OS — Edge Function: Test Cadence Send Simulation
//
// Pra cada destinatário: gera conteúdo personalizado via Claude Haiku (Proposta
// em Aberto / variação Case Similar), renderiza HTML com template TBO e envia
// campanha Mailchimp separada.
//
// É uma função de TESTE — não persiste drafts, não atualiza cadência, só dispara.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
//           MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_OUTBOUND_LIST_ID
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts";

import { buildEmailHtml } from "./template.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MC_API_KEY = Deno.env.get("MAILCHIMP_API_KEY") || "";
const MC_SERVER = Deno.env.get("MAILCHIMP_SERVER_PREFIX") || "us21";
const MC_LIST_ID = Deno.env.get("MAILCHIMP_OUTBOUND_LIST_ID") || "3b6d78581f";
const MC_BASE = `https://${MC_SERVER}.api.mailchimp.com/3.0`;
const MC_AUTH = "Basic " + btoa(`anystring:${MC_API_KEY}`);

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

interface Recipient {
  email: string;
  first_name: string;
  company: string;
  deal_scope: string;
  deal_value_brl?: number;
}

interface TestSendRequest {
  recipients?: Recipient[];
}

const DEFAULT_RECIPIENTS: Recipient[] = [
  {
    email: "marco@agenciatbo.com.br",
    first_name: "Marco",
    company: "Habitat Alphaville",
    deal_scope: "Lançamento Completo — Vila Dona Helena",
    deal_value_brl: 120000,
  },
  {
    email: "ruy@agenciatbo.com.br",
    first_name: "Ruy",
    company: "Construtora Luar",
    deal_scope: "Digital 3D — Edifício Mirante",
    deal_value_brl: 65000,
  },
  {
    email: "gustavo@agenciatbo.com.br",
    first_name: "Gustavo",
    company: "Galpão Brasil",
    deal_scope: "Audiovisual + Marketing — Residences Curitiba",
    deal_value_brl: 95000,
  },
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function md5Lower(email: string): string {
  const md5 = new Md5();
  md5.update(email.trim().toLowerCase());
  return md5.toString();
}

async function mcFetch(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${MC_BASE}${path}`, {
    method,
    headers: { Authorization: MC_AUTH, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ──────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — focado em Proposta em Aberto / Case Similar
// Condensa o essencial do prompt outbound TBO em versão enxuta
// ──────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é um executivo comercial sênior da TBO (agência de branding pra lançamentos imobiliários de alto padrão), escrevendo um email 1-a-1 para um lead com proposta em aberto. Tom: direto, denso, executivo pra executivo. Português brasileiro com acentuação correta.

ETAPA DO FUNIL: Proposta em Aberto (lead recebeu orçamento, está avaliando)
VARIAÇÃO: Case Similar (tangibilizar via caso de outro projeto em cenário parecido)

## ESTRUTURA OBRIGATÓRIA

1. **Saudação humana** no primeiro parágrafo com o nome em **bold** (varie: "Olá, **{nome}**! Como vai?" / "Oi, **{nome}** — tudo bem?" / "Fala, **{nome}**. Espero que esteja bem.").

2. **Ponte** de 1-2 linhas retomando o contexto da proposta sem mencionar preço/prazo.

3. **Case similar** — problema → intervenção → resultado, sem citar nome real da incorporadora. Escolha UM cenário entre:
   - Incorporadora que hesitou 60 dias — o que mudou quando o material entrou no ar
   - Projeto com proposta em aberto que virou lançamento âncora da região
   - Lançamento que cortou escopo e pagou mais caro depois
   - Centralização pós-fragmentação — ganho de consistência percebida
   - Projeto que começou pelo digital antes do stand físico e ganhou 3 meses de curva

4. **Placeholder de imagem** \`{{imagem:render do projeto similar}}\` em linha própria, DEPOIS do parágrafo-prova (essa variação tem placeholderHint: recommended).

5. **Pergunta aberta** no fechamento — conectada ao projeto do lead, não retórica.

## TIPOGRAFIA (use conscientemente)

- **bold** em: nomes próprios, dados concretos, conceito central (máx 5 por email)
- *itálico* em termos estrangeiros ou nome de marca (máx 3)
- \`. . . .\` em linha própria entre blocos lógicos (1-2 por email)
- \`> blockquote\` opcional pra UMA frase de peso

## PROIBIÇÕES

- Linguagem de agência ("soluções criativas", "potencializamos"), clichês ("diferencial de mercado"), fórmula "X não é Y, é Z", travessão em uso estilístico de copywriter, CTA explícito ("agende uma call").

## FORMATO DE SAÍDA

Responda APENAS com JSON puro (sem markdown, sem \`\`\`), começando IMEDIATAMENTE com \`{\`:

{
  "subject": "Assunto com capitalização natural (primeira letra maiúscula, resto conforme gramática), sem pontuação final",
  "preheader": "preview ~80-120 chars, capitalização natural",
  "body": "corpo markdown completo seguindo a estrutura acima, máx 180 palavras"
}`;

// ──────────────────────────────────────────────────────────────────────
// Chama Claude Haiku pra 1 destinatário
// ──────────────────────────────────────────────────────────────────────
async function generateForRecipient(
  r: Recipient,
): Promise<{ subject: string; preheader: string; body: string }> {
  const userMessage = [
    `# Contexto do Lead`,
    `**Nome do contato:** ${r.first_name}`,
    `**Empresa (incorporadora):** ${r.company}`,
    `**Escopo do projeto (deal):** ${r.deal_scope}`,
    r.deal_value_brl ? `**Porte do projeto:** R$ ${r.deal_value_brl.toLocaleString("pt-BR")} (alto ticket — use linguagem estratégica)` : "",
    ``,
    `Gere o email de Proposta em Aberto / Case Similar personalizado pra este lead. Siga a estrutura do system prompt. Nome do contato em **bold** na saudação. Inclua UM \`{{imagem:descrição}}\` após o parágrafo-prova do case.`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0.8,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

  // Parser robusto
  const trimmed = text.trim();
  let parsed: { subject: string; preheader: string; body: string } | null = null;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch {
        /* fails below */
      }
    }
  }

  if (!parsed?.subject || !parsed?.body) {
    throw new Error(`Parse fail: ${text.slice(0, 300)}`);
  }

  return parsed;
}

// ──────────────────────────────────────────────────────────────────────
// Remove placeholders {{imagem}} / {{video}} / {{gif}} não preenchidos
// antes do envio real
// ──────────────────────────────────────────────────────────────────────
function stripPlaceholders(body: string): string {
  return body
    .replace(/\{\{\s*(imagem|image|video|vídeo|gif)(?:\s*:\s*[^}]+)?\s*\}\}/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ──────────────────────────────────────────────────────────────────────
// Substitui {{primeiro_nome}} → first_name (merge tag customizada).
// Deixa *|FNAME|* e *|COMPANY|* pro Mailchimp resolver se preferir.
// ──────────────────────────────────────────────────────────────────────
function applyCustomMerges(text: string, r: Recipient): string {
  return text
    .replace(/\{\{\s*primeiro_nome\s*\}\}/g, r.first_name)
    .replace(/\{\{\s*empresa\s*\}\}/g, r.company);
}

// ──────────────────────────────────────────────────────────────────────
// Envia 1 email via Mailchimp pra 1 destinatário
// (cria segmento com só esse email, cria campanha, upload HTML, dispara)
// ──────────────────────────────────────────────────────────────────────
async function sendViaMailchimp(
  r: Recipient,
  subject: string,
  html: string,
  preheader: string,
): Promise<{ mcCampaignId: string; mcWebId: number; mcSegmentId: number }> {
  const email = r.email.trim().toLowerCase();

  // 1. Upsert subscriber
  const hash = md5Lower(email);
  const upsertRes = await mcFetch("PUT", `/lists/${MC_LIST_ID}/members/${hash}`, {
    email_address: email,
    status_if_new: "subscribed",
    status: "subscribed",
    merge_fields: { FNAME: r.first_name, COMPANY: r.company },
  });
  if (!upsertRes.ok) {
    const err = await upsertRes.text();
    throw new Error(`Upsert ${email}: ${upsertRes.status} ${err.slice(0, 200)}`);
  }

  // 2. Static segment com só esse email
  const timestamp = Date.now();
  const segRes = await mcFetch("POST", `/lists/${MC_LIST_ID}/segments`, {
    name: `TEST · Cadência Proposta / Case Similar · ${r.first_name} · ${timestamp}`,
    static_segment: [email],
  });
  if (!segRes.ok) {
    const err = await segRes.text();
    throw new Error(`Segment ${email}: ${segRes.status} ${err.slice(0, 200)}`);
  }
  const mcSegmentId: number = (await segRes.json()).id;

  // 3. Criar campanha
  const campRes = await mcFetch("POST", `/campaigns`, {
    type: "regular",
    recipients: {
      list_id: MC_LIST_ID,
      segment_opts: { saved_segment_id: mcSegmentId },
    },
    settings: {
      subject_line: subject,
      preview_text: preheader,
      title: `TEST · Proposta/Case Similar · ${r.first_name}`,
      from_name: "TBO",
      reply_to: "contato@agenciatbo.com.br",
      to_name: "*|FNAME|*",
      auto_footer: false,
      inline_css: true,
      authenticate: true,
    },
  });
  if (!campRes.ok) {
    const err = await campRes.text();
    throw new Error(`Campaign ${email}: ${campRes.status} ${err.slice(0, 200)}`);
  }
  const campJson = await campRes.json();
  const mcCampaignId: string = campJson.id;
  const mcWebId: number = campJson.web_id;

  // 4. PUT content HTML
  const contentRes = await mcFetch("PUT", `/campaigns/${mcCampaignId}/content`, { html });
  if (!contentRes.ok) {
    const err = await contentRes.text();
    throw new Error(`Content ${email}: ${contentRes.status} ${err.slice(0, 200)}`);
  }

  // 5. POST send
  const sendRes = await mcFetch("POST", `/campaigns/${mcCampaignId}/actions/send`);
  if (!sendRes.ok) {
    const err = await sendRes.text();
    throw new Error(`Send ${email}: ${sendRes.status} ${err.slice(0, 200)}`);
  }

  return { mcCampaignId, mcWebId, mcSegmentId };
}

// ──────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    if (!ANTHROPIC_API_KEY || !MC_API_KEY) {
      return jsonResponse(
        { error: "Configuração incompleta (ANTHROPIC_API_KEY ou MAILCHIMP_API_KEY ausente)" },
        500,
      );
    }

    // Recipients: vem no body ou usa defaults
    let body: TestSendRequest = {};
    try {
      body = (await req.json()) as TestSendRequest;
    } catch {
      /* sem body é ok */
    }
    const recipients = body.recipients?.length ? body.recipients : DEFAULT_RECIPIENTS;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const results: Array<Record<string, unknown>> = [];

    for (const r of recipients) {
      const startedAt = Date.now();
      try {
        // 1. Gerar via Claude
        const generated = await generateForRecipient(r);

        // 2. Aplicar merges customizadas + strip placeholders
        const finalSubject = applyCustomMerges(generated.subject, r);
        const finalBodyMd = stripPlaceholders(applyCustomMerges(generated.body, r));
        const finalPreheader = applyCustomMerges(generated.preheader ?? "", r);

        // 3. Renderizar HTML com template TBO
        const html = buildEmailHtml({
          subject: finalSubject,
          body: finalBodyMd,
          eyebrow: getGreetingEyebrow(),
          preheader: finalPreheader,
        });

        // 4. Enviar via Mailchimp
        const mc = await sendViaMailchimp(r, finalSubject, html, finalPreheader);

        // 5. Persistir em ai_email_drafts pra ficar rastreável no histórico
        await supabase.from("ai_email_drafts").insert({
          deal_id: "00000000-0000-0000-0000-000000000000", // placeholder — é teste
          stage_at_generation: "proposta",
          variants: [
            {
              label: "Case Similar",
              tone: "prova",
              subject: finalSubject,
              body: finalBodyMd,
            },
          ],
          selected_variant_index: 0,
          final_subject: finalSubject,
          final_body: finalBodyMd,
          status: "sent",
          sent_at: new Date().toISOString(),
          mailchimp_campaign_id: mc.mcCampaignId,
          model: CLAUDE_MODEL,
          prompt_version: "test-cadence-v1",
          generation_ms: Date.now() - startedAt,
        });

        results.push({
          email: r.email,
          status: "sent",
          subject: finalSubject,
          body_preview: finalBodyMd.slice(0, 200),
          mailchimp_campaign_id: mc.mcCampaignId,
          mailchimp_dashboard_url: `https://${MC_SERVER}.admin.mailchimp.com/campaigns/show/?id=${mc.mcWebId}`,
          generation_ms: Date.now() - startedAt,
        });
      } catch (err) {
        results.push({
          email: r.email,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;

    return jsonResponse({
      success: sentCount > 0,
      sent: sentCount,
      failed: results.length - sentCount,
      results,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Erro interno" },
      500,
    );
  }
});

function getGreetingEyebrow(): string {
  const now = new Date();
  // Hora em SP (UTC-3) a partir de UTC
  const h = (now.getUTCHours() - 3 + 24) % 24;
  if (h < 12) return "BOM DIA";
  if (h < 18) return "BOA TARDE";
  return "BOA NOITE";
}
