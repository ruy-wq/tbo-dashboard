// ============================================================================
// TBO OS — Edge Function: Generate Newsletter Draft
//
// Gera uma edição de newsletter editorial (estilo tns business) via Claude,
// a partir de um briefing do usuário (tema, tom, destaques, público, incluir
// trending). Persiste em ai_newsletter_drafts e retorna o registro criado.
//
// Auth: verify_jwt: false. O frontend autenticado invoca via supabase-js.
// Como a função usa SERVICE_ROLE_KEY internamente, a URL não é pública.
//
// Env vars obrigatórias:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   ANTHROPIC_API_KEY
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { SYSTEM_PROMPT } from "./prompt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = "claude-sonnet-4-6";
const PROMPT_VERSION = "v1";

interface Briefing {
  theme: string;                    // tema principal da edição
  tone?: string;                     // ex: "informativo", "provocativo", "reflexivo"
  audience_hint?: string;            // ex: "toda a base", "só incorporadoras"
  highlights?: string[];             // 1-3 destaques manuais que a IA deve desenvolver
  include_trending?: boolean;        // incluir seção Trending Now
  send_time?: "morning" | "afternoon" | "evening"; // define eyebrow
  target_segment_id?: string | null; // segmento Mailchimp (opcional)
}

interface GenerateRequest {
  briefing: Briefing;
  tenant_id?: string | null;
}

interface GeneratedDraft {
  title: string;
  subject: string;
  preheader: string;
  eyebrow: string;
  body: string;
}

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

// ──────────────────────────────────────────────────────────────────────
// Monta user message com briefing + contexto TBO
// ──────────────────────────────────────────────────────────────────────
function buildUserMessage(briefing: Briefing, blogPosts: BlogPostRef[]): string {
  const parts: string[] = [];

  parts.push(`# Briefing da edição`);
  parts.push(`**Tema principal:** ${briefing.theme}`);
  if (briefing.tone) parts.push(`**Tom desejado:** ${briefing.tone}`);
  if (briefing.audience_hint) parts.push(`**Público:** ${briefing.audience_hint}`);
  if (briefing.highlights?.length) {
    parts.push(``);
    parts.push(`**Destaques pra desenvolver (${briefing.highlights.length}):**`);
    briefing.highlights.forEach((h, i) => parts.push(`${i + 1}. ${h}`));
  }
  parts.push(``);
  parts.push(`**Incluir seção Trending now:** ${briefing.include_trending ? "sim" : "não"}`);

  // Eyebrow baseado em send_time
  const eyebrowMap: Record<string, string> = {
    morning: "BOM DIA",
    afternoon: "BOA TARDE",
    evening: "BOA NOITE",
  };
  const eyebrow = eyebrowMap[briefing.send_time ?? "afternoon"] ?? "BOA TARDE";
  parts.push(`**Eyebrow:** ${eyebrow}`);

  // Blog posts recentes pra referenciar (se include_trending)
  if (briefing.include_trending && blogPosts.length > 0) {
    parts.push(``);
    parts.push(`# Artigos do blog TBO disponíveis pra linkar na seção Trending`);
    parts.push(
      `Use 1-2 destes na seção Trending now (bullet com link markdown). Não invente URLs.`,
    );
    blogPosts.forEach((p) => {
      const url = `https://wearetbo.com.br/pt/blog/${p.slug}`;
      parts.push(`- **${p.title}** — ${url}`);
      if (p.excerpt) parts.push(`  ${p.excerpt.slice(0, 140)}`);
    });
  }

  parts.push(``);
  parts.push(`# Tarefa`);
  parts.push(
    `Gere a edição completa da newsletter seguindo a estrutura do system prompt. Abertura com HOOK (storytelling sobre o tema), preview em blockquote, separadores, trending se pedido, bloco principal desenvolvendo o tema, fechamento editorial. Máx 600 palavras.`,
  );

  return parts.join("\n");
}

interface BlogPostRef {
  title: string;
  slug: string;
  excerpt: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Chama Anthropic Messages API
// ──────────────────────────────────────────────────────────────────────
async function callClaude(
  systemPrompt: string,
  userMessage: string,
): Promise<{
  draft: GeneratedDraft;
  inputTokens: number;
  outputTokens: number;
}> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      temperature: 0.85,  // mais editorial, menos "fórmula"
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: GeneratedDraft;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Falha ao parsear resposta da Claude como JSON. Raw: ${text.slice(0, 400)}`);
  }

  if (!parsed.title || !parsed.subject || !parsed.body) {
    throw new Error(`Resposta incompleta: ${JSON.stringify(parsed).slice(0, 300)}`);
  }

  return {
    draft: parsed,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const startedAt = Date.now();

  try {
    const { briefing, tenant_id } = (await req.json()) as GenerateRequest;
    if (!briefing?.theme) {
      return jsonResponse({ error: "briefing.theme obrigatório" }, 400);
    }
    if (!ANTHROPIC_API_KEY) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY não configurada" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Buscar blog posts recentes se vai incluir trending
    let blogPosts: BlogPostRef[] = [];
    if (briefing.include_trending) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: blogRaw } = await supabase
        .from("blog_posts")
        .select("title, slug, excerpt")
        .eq("status", "publicado")
        .gte("published_at", ninetyDaysAgo)
        .order("published_at", { ascending: false })
        .limit(10);
      blogPosts = (blogRaw ?? []) as unknown as BlogPostRef[];
    }

    // Chamar Claude
    const userMessage = buildUserMessage(briefing, blogPosts);
    const { draft, inputTokens, outputTokens } = await callClaude(SYSTEM_PROMPT, userMessage);
    const generationMs = Date.now() - startedAt;

    // Persistir
    const { data: row, error: insertErr } = await supabase
      .from("ai_newsletter_drafts")
      .insert({
        tenant_id: tenant_id ?? null,
        title: draft.title,
        subject: draft.subject,
        preheader: draft.preheader,
        eyebrow: draft.eyebrow,
        body: draft.body,
        briefing,
        target_segment_id: briefing.target_segment_id ?? null,
        status: "pending_review",
        model: MODEL,
        prompt_version: PROMPT_VERSION,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        generation_ms: generationMs,
      })
      .select()
      .single();

    if (insertErr || !row) {
      return jsonResponse(
        { error: "Falha ao persistir draft", detail: insertErr?.message },
        500,
      );
    }

    return jsonResponse({ success: true, draft: row });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return jsonResponse({ error: message }, 500);
  }
});
