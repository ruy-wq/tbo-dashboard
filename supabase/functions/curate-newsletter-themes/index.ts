// ============================================================================
// TBO OS — Edge Function: Curate Newsletter Themes
//
// Claude faz pesquisa editorial ativa na web (via web_search tool nativa da
// Anthropic) em fontes curadas de arquitetura/design/arte/mercado imobiliário
// de alto padrão, cruza com posts recentes do blog TBO pra evitar repetição,
// e retorna 4-5 sugestões de tema pra newsletter.
//
// Auth: verify_jwt: false. Só retorna sugestões; não persiste nada (a persistência
// acontece se o usuário gerar a newsletter via generate-newsletter-draft depois).
//
// Env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { SYSTEM_PROMPT } from "./prompt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
// Haiku 4.5 pra curadoria: rate limit muito mais generoso que Sonnet e
// qualidade suficiente pra tarefa de buscar + estruturar JSON.
const MODEL = "claude-haiku-4-5-20251001";
// Com Haiku podemos voltar a 5 buscas (uma por universo) sem estourar.
const MAX_WEB_SEARCHES = 5;

interface ThemeSource {
  title: string;
  url: string;
}

interface SuggestedTheme {
  title: string;
  angle: string;
  universes_crossed: string[];
  why_now: string;
  seo_keyword: string;
  sources: ThemeSource[];
  suggested_pov: string;
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
// Chama Anthropic com web_search habilitada
// ──────────────────────────────────────────────────────────────────────
async function callClaudeWithWebSearch(userMessage: string): Promise<{
  themes: SuggestedTheme[];
  inputTokens: number;
  outputTokens: number;
  searchesUsed: number;
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
      max_tokens: 6000,
      temperature: 0.7,
      // Server-side tool: Claude faz as buscas, a Anthropic executa e devolve resultados.
      // https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: MAX_WEB_SEARCHES,
        },
      ],
      // Prompt caching (ephemeral): primeira chamada paga normal, próximas 5min
      // reusam o cache (90% desconto + alivia rate limit de input tokens/min).
      // https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    // Rate limit: erro específico pra UI mostrar mensagem útil.
    if (res.status === 429) {
      throw new Error(
        "RATE_LIMIT: Limite da API Anthropic atingido. Aguarde ~1 minuto e tente novamente. (Prompt caching já ativo pra próximas chamadas.)",
      );
    }
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();

  // A resposta do Claude com tool use tem múltiplos blocks. O JSON final
  // está no último bloco de text depois de todas as chamadas de web_search.
  const textBlocks = (data.content ?? [])
    .filter((b: { type: string; text?: string }) => b.type === "text" && b.text)
    .map((b: { text: string }) => b.text);

  // Conta só server_tool_use — cada busca gera um par (request + result),
  // então contar os dois dobraria o número real de queries executadas.
  const searchesUsed = (data.content ?? []).filter(
    (b: { type: string }) => b.type === "server_tool_use",
  ).length;

  // Pega o texto final (última mensagem textual do Claude depois de pesquisar)
  const finalText = textBlocks[textBlocks.length - 1] ?? "";

  // Parser robusto: Haiku tende a adicionar preâmbulo/fence antes do JSON.
  // Tenta 3 estratégias em ordem: (1) JSON direto, (2) extrair do fence markdown,
  // (3) extrair o primeiro bloco {...} válido do texto.
  let parsed: { themes: SuggestedTheme[] } | null = null;
  const trimmed = finalText.trim();

  // Estratégia 1: JSON puro
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    /* continua pra próxima estratégia */
  }

  // Estratégia 2: fence markdown ```json ... ```
  if (!parsed) {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
      try {
        parsed = JSON.parse(fenceMatch[1]);
      } catch {
        /* continua */
      }
    }
  }

  // Estratégia 3: primeiro bloco {...} bem formado no texto
  if (!parsed) {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(candidate);
      } catch {
        /* desiste */
      }
    }
  }

  if (!parsed) {
    throw new Error(
      `Falha ao parsear resposta como JSON. Raw: ${finalText.slice(0, 500)}`,
    );
  }

  if (!Array.isArray(parsed.themes) || parsed.themes.length === 0) {
    throw new Error(
      `Resposta não contém temas. Recebido: ${JSON.stringify(parsed).slice(0, 300)}`,
    );
  }

  return {
    themes: parsed.themes,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    searchesUsed,
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
    if (!ANTHROPIC_API_KEY) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY não configurada" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Buscar artigos já publicados nos últimos 30 dias pra evitar repetição
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: recentRaw } = await supabase
      .from("blog_posts")
      .select("title, slug, tags, published_at")
      .eq("status", "publicado")
      .gte("published_at", thirtyDaysAgo)
      .order("published_at", { ascending: false })
      .limit(20);

    const recent = (recentRaw ?? []) as Array<{
      title: string;
      slug: string;
      tags: string[] | null;
      published_at: string;
    }>;

    // 2. Montar user message com contexto
    const parts: string[] = [];
    parts.push(
      `Hoje é ${new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}.`,
    );
    parts.push("");
    parts.push(
      "Sua tarefa: pesquisar a web AGORA em fontes curadas e sugerir 4-5 temas editoriais frescos (publicados nos últimos 2-7 dias) pra newsletter TBO.",
    );
    parts.push("");

    if (recent.length > 0) {
      parts.push(
        `# ARTIGOS JÁ PUBLICADOS NO BLOG TBO (últimos 30 dias) — NÃO REPETIR`,
      );
      parts.push(
        `Evite sugerir temas que cubram os mesmos ângulos dos artigos abaixo:`,
      );
      parts.push("");
      recent.forEach((p, i) => {
        const date = new Date(p.published_at).toLocaleDateString("pt-BR");
        const tags = (p.tags ?? []).slice(0, 4).join(", ");
        parts.push(`${i + 1}. [${date}] **${p.title}**${tags ? ` · tags: ${tags}` : ""}`);
      });
      parts.push("");
    }

    parts.push(
      "Faça agora as 7+ buscas descritas no system prompt. Depois retorne o JSON com os 4-5 melhores temas. Priorize temas que cruzem 2+ universos e tenham fontes concretas.",
    );

    const userMessage = parts.join("\n");

    // 3. Chamar Claude com web_search
    const { themes, inputTokens, outputTokens, searchesUsed } =
      await callClaudeWithWebSearch(userMessage);

    const generationMs = Date.now() - startedAt;

    return jsonResponse({
      success: true,
      themes,
      metadata: {
        model: MODEL,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        web_searches_used: searchesUsed,
        generation_ms: generationMs,
        already_published_count: recent.length,
      },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Erro interno";
    const isRateLimit = message.startsWith("RATE_LIMIT:");
    return jsonResponse(
      { error: message, code: isRateLimit ? "rate_limit" : "internal" },
      isRateLimit ? 429 : 500,
    );
  }
});
