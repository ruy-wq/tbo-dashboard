// ============================================================================
// TBO OS — Edge Function: Generate AI Email Drafts
//
// Dado um deal_id + stage, busca contexto completo (deal + activities +
// transcrições Fireflies se houver) e chama Claude pra gerar 3 variações
// de email em tons distintos, baseadas no framework TBO (Notion).
//
// Persiste resultado em ai_email_drafts e retorna o registro criado.
//
// Auth: verify_jwt: false. O frontend autenticado invoca via supabase-js.
// Como a função usa SERVICE_ROLE_KEY internamente, qualquer caller poderia
// abusar do endpoint. Mitigação: a URL não é pública (precisa conhecer
// project ref + function slug) e mantemos observabilidade via logs.
// TODO: migrar pra verify_jwt: true quando resolvermos o edge case do JWT.
//
// Env vars obrigatórias:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   ANTHROPIC_API_KEY
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { SYSTEM_PROMPT } from "./prompt.ts";
import {
  STAGE_PLAYBOOKS,
  resolvePlaybookKey,
  buildPlaybookSection,
  type StagePlaybook,
} from "./stage-playbooks.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = "claude-opus-4-7";
const PROMPT_VERSION = "v9-opus-guided";
const BLOG_BASE_URL = "https://wearetbo.com.br/pt/blog/";

interface GenerateRequest {
  deal_id: string;
  user_guidance?: string;
}

interface Variant {
  label: string;
  tone: string;
  subject: string;
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
// Sanitização defensiva — remove padrões proibidos que a IA possa ter
// deixado passar mesmo com o prompt reforçado.
// ──────────────────────────────────────────────────────────────────────
/**
 * Sanitização defensiva que remove travessões em USO ESTILÍSTICO DE COPYWRITER
 * no corpo argumentativo, mas preserva travessões em contextos legítimos:
 *
 * - Saudação do primeiro parágrafo (ex: "Oi, **João** — tudo bem?")
 * - Bullets de listas (linhas começando com "- " ou "* ")
 * - Cabeçalhos (linhas começando com "#")
 * - Blockquotes (linhas começando com "> ")
 * - Dentro de links markdown "[...](...)"
 * - Dentro de tokens placeholder "{{...}}"
 */
function sanitizeText(text: string): string {
  if (!text) return text;

  // 1. Preserva tokens de placeholder {{...}} e links [texto](url) durante a
  //    remoção de travessões — eles podem conter "—" legítimo.
  const placeholders: string[] = [];
  let out = text.replace(/\{\{[^}]*\}\}/g, (m) => {
    placeholders.push(m);
    return `\u0001PH${placeholders.length - 1}\u0001`;
  });
  out = out.replace(/\[[^\]]*\]\([^)]+\)/g, (m) => {
    placeholders.push(m);
    return `\u0001PH${placeholders.length - 1}\u0001`;
  });

  // 2. Processa linha por linha, aplicando sanitização de travessão apenas em
  //    linhas que NÃO são saudação/bullet/header/blockquote.
  const lines = out.split("\n");
  const paragraphsSeen = { count: 0 }; // conta parágrafos não-vazios pra identificar o primeiro (saudação)
  let hitNonEmpty = false;
  const cleanedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      // linha em branco = separa parágrafos
      if (hitNonEmpty) {
        paragraphsSeen.count += 1;
        hitNonEmpty = false;
      }
      return line;
    }
    hitNonEmpty = true;

    const isBullet = /^(\s*[-*]\s)/.test(line);
    const isHeader = /^\s*#{1,6}\s/.test(line);
    const isBlockquote = /^\s*>\s/.test(line);
    const isGreetingParagraph = paragraphsSeen.count === 0; // primeiro parágrafo

    // Preserva travessão nesses contextos
    if (isBullet || isHeader || isBlockquote || isGreetingParagraph) {
      return line;
    }

    // Caso geral: remove travessão (— U+2014, – U+2013) no corpo argumentativo
    let cleaned = line.replace(/\s+[—–]\s+/g, ". ");
    cleaned = cleaned.replace(/[—–]/g, ",");
    return cleaned;
  });
  out = cleanedLines.join("\n");

  // 3. Normaliza ponto final duplicado (caso "x. . y")
  out = out.replace(/\.\s*\./g, ".");

  // 4. Normaliza espaços múltiplos (sem tocar em \n)
  out = out.replace(/[ \t]+/g, " ");

  // 5. Normaliza quebras de linha triplas
  out = out.replace(/\n{3,}/g, "\n\n");

  // 6. Capitaliza primeira letra após ". " se virou minúscula
  out = out.replace(/(\. )([a-záéíóúâêôàãõç])/g, (_m, p1, p2) => p1 + p2.toUpperCase());

  // Restaura placeholders/links
  out = out.replace(/\u0001PH(\d+)\u0001/g, (_m, i) => placeholders[Number(i)] ?? "");

  return out.trim();
}

function sanitizeVariant(v: Variant): Variant {
  return {
    label: v.label,
    tone: v.tone,
    subject: sanitizeText(v.subject),
    body: sanitizeText(v.body),
  };
}

// ──────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — framework TBO extraído do Notion
// Mantém o tom denso, consultivo, com raciocínio e objeções invisíveis
// ──────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────
// Monta o USER MESSAGE com contexto do deal
// ──────────────────────────────────────────────────────────────────────
interface PriorDraftSummary {
  created_at: string;
  variants: Array<{ label: string; subject: string; body: string }>;
}

interface Theme {
  name: string;
  description: string | null;
  angle_instruction: string;
  bu: string | null;
}

interface LinkRef {
  title: string;
  url: string;
  description: string | null;
  kind: string;
  bu: string | null;
}

interface BlogPostRef {
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[];
  published_at: string | null;
}

interface PortfolioRef {
  title: string;
  project_name: string | null;
  bu: string | null;
  description: string | null;
  external_url: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Infere a BU principal do escopo do deal a partir do nome
// ──────────────────────────────────────────────────────────────────────
function inferBu(dealName: string): string | null {
  const n = (dealName || "").toLowerCase();
  if (/lan[çc]amento\s+completo|ecossistema|integr/i.test(n)) return "Lançamento Completo";
  if (/3d|render|visualiza[çc]|archviz|maquete/i.test(n)) return "Digital 3D";
  if (/audiovisual|v[ií]deo|film[ea]|drone|teaser/i.test(n)) return "Audiovisual";
  if (/branding|naming|identidade|logotipo|logo/i.test(n)) return "Branding";
  if (/marketing|digital|campanha|m[ií]dia|perform/i.test(n)) return "Marketing";
  if (/imersiv|plataforma|interativ|tour\s*360|vr|realidade/i.test(n)) return "Experiências Imersivas";
  return null;
}

function buildUserMessage(
  deal: Record<string, unknown>,
  activities: Array<Record<string, unknown>>,
  stageLabel: string,
  playbook: StagePlaybook,
  priorDrafts: PriorDraftSummary[],
  inferredBu: string | null,
  themes: Theme[],
  links: LinkRef[],
  blogPosts: BlogPostRef[],
  portfolioItems: PortfolioRef[],
  userGuidance: string | null,
): string {
  const parts: string[] = [];

  // Briefing do próprio usuário — tem PRIORIDADE MÁXIMA sobre temas/playbook.
  // Se o Marco descreveu o que quer comunicar, essa mensagem dita o ângulo.
  if (userGuidance) {
    parts.push(`# BRIEFING DO USUÁRIO (PRIORIDADE MÁXIMA)`);
    parts.push(
      `O usuário descreveu explicitamente o que quer comunicar neste e-mail. Esta instrução tem PRIORIDADE sobre os temas editoriais, playbook da etapa e ângulos sugeridos. Use-a como o NORTE EDITORIAL das 3 variações — cada uma explora um recorte diferente deste briefing, mas todas respeitam a intenção central abaixo:`,
    );
    parts.push(``);
    parts.push(`> ${userGuidance.replace(/\n+/g, " ").trim()}`);
    parts.push(``);
    parts.push(
      `Os temas editoriais, blog posts e links listados depois são MATERIAL DE APOIO — use quando servirem ao briefing, ignore quando não servirem.`,
    );
    parts.push(``);
  }

  // Playbook da etapa — vem ANTES do contexto do lead pra estabelecer a
  // estrutura das 3 variações que o modelo deve produzir.
  parts.push(buildPlaybookSection(playbook));
  parts.push(``);

  parts.push(`# Contexto do Lead`);
  parts.push(`**Nome do deal:** ${deal.name ?? "—"}`);
  parts.push(`**Empresa (incorporadora):** ${deal.company ?? "—"}`);
  parts.push(`**Contato:** ${deal.contact ?? "—"}`);
  parts.push(`**Etapa atual no funil:** ${stageLabel}`);
  if (deal.value) parts.push(`**Valor estimado:** R$ ${deal.value}`);
  if (deal.notes) parts.push(`**Notas internas:** ${deal.notes}`);
  if (deal.source) parts.push(`**Origem:** ${deal.source}`);

  if (activities.length > 0) {
    parts.push(``);
    parts.push(`# Histórico recente de atividades`);
    for (const a of activities.slice(0, 10)) {
      const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString("pt-BR") : "";
      const type = a.activity_type || a.type || "atividade";
      const desc = a.description || a.notes || a.content || "";
      parts.push(`- [${date}] ${type}: ${String(desc).slice(0, 200)}`);
    }
  }

  // Passa ângulos já usados em gerações anteriores pra forçar variação
  if (priorDrafts.length > 0) {
    parts.push(``);
    parts.push(`# ÂNGULOS JÁ USADOS EM GERAÇÕES ANTERIORES`);
    parts.push(
      `Este lead já teve ${priorDrafts.length} geração(ões) anterior(es). NÃO repita os mesmos ângulos. Escolha abordagens DIFERENTES dentro de cada tipo.`,
    );
    parts.push(``);
    priorDrafts.forEach((draft, i) => {
      const dateStr = new Date(draft.created_at).toLocaleDateString("pt-BR");
      parts.push(`## Geração ${i + 1} (${dateStr})`);
      draft.variants.forEach((v) => {
        const firstLine = (v.body || "").split("\n").find((l) => l.trim().length > 20) || "";
        parts.push(
          `- **${v.label}**: subject "${v.subject}" · abertura: "${firstLine.slice(0, 140)}${firstLine.length > 140 ? "..." : ""}"`,
        );
      });
    });
    parts.push(``);
  }

  // BU inferida do escopo do deal
  if (inferredBu) {
    parts.push(``);
    parts.push(`# BU inferida do escopo: ${inferredBu}`);
    parts.push(`Use isso pra calibrar a profundidade técnica do email.`);
  }

  // Temas editoriais disponíveis
  if (themes.length > 0) {
    parts.push(``);
    parts.push(`# TEMAS EDITORIAIS DISPONÍVEIS PARA ESTA ETAPA`);
    parts.push(
      `Os temas abaixo foram curados pela equipe TBO pra esta combinação de etapa/BU. Use como INSPIRAÇÃO de ângulo. Escolha o que fizer mais sentido por variação. Cada tema é uma direção editorial, não um template rígido.`,
    );
    parts.push(``);
    themes.forEach((t, i) => {
      parts.push(`${i + 1}. **${t.name}**${t.bu ? ` (${t.bu})` : ""}`);
      if (t.description) parts.push(`   ${t.description}`);
      parts.push(`   Direção: ${t.angle_instruction}`);
      parts.push(``);
    });
  }

  // Blog posts TBO publicados
  if (blogPosts.length > 0) {
    parts.push(``);
    parts.push(`# ARTIGOS DO BLOG TBO PARA REFERENCIAR (com link)`);
    parts.push(
      `Artigos publicados recentemente no blog TBO. Quando fizer sentido, referencie UM artigo por variação com hiperlink markdown [título](URL). Use de forma natural, como "vale a leitura sobre [Y](url)" ou "recentemente escrevi sobre [X](url)". Nunca force; se não couber no ângulo, não use.`,
    );
    parts.push(``);
    blogPosts.forEach((p) => {
      const url = `${BLOG_BASE_URL}${p.slug}`;
      parts.push(`- **${p.title}** ${url}`);
      if (p.excerpt) parts.push(`  ${p.excerpt.slice(0, 180)}`);
      if (p.tags?.length) parts.push(`  Tags: ${p.tags.slice(0, 5).join(", ")}`);
    });
  }

  // Portfolio (cases)
  if (portfolioItems.length > 0) {
    parts.push(``);
    parts.push(`# CASES DO PORTFÓLIO TBO (referência de prova)`);
    parts.push(
      `Cases reais que podem ser mencionados na variação Case/Prova. Se mencionar, use "em um projeto recente para [tipo de cliente]" sem citar nome real.`,
    );
    portfolioItems.forEach((p) => {
      parts.push(`- **${p.title}**${p.bu ? ` (${p.bu})` : ""}: ${p.description ?? ""}`);
    });
  }

  // Links curados da biblioteca
  if (links.length > 0) {
    parts.push(``);
    parts.push(`# LINKS TBO CURADOS (biblioteca editorial)`);
    parts.push(
      `Links pra páginas específicas do site TBO e fontes externas. Use APENAS se for naturalmente ao ponto da variação. Prioridade: landing da BU inferida, depois institucional, depois blog. Formato markdown [título](url).`,
    );
    links.forEach((l) => {
      parts.push(`- [${l.kind}] **${l.title}**${l.bu ? ` (${l.bu})` : ""}: ${l.url}`);
      if (l.description) parts.push(`  ${l.description}`);
    });
  }

  parts.push(``);
  parts.push(`# Tarefa`);
  if (priorDrafts.length > 0) {
    parts.push(
      `Gere 3 variações NOVAS de e-mail pra este lead. As variações anteriores estão listadas acima. É ESSENCIAL que esta geração use ângulos distintos dos já tentados. Varie cidade do case, tipo de sinais do diagnóstico, ângulo do consultivo. Mesmo lead, abordagem diferente.`,
    );
  } else {
    parts.push(
      `Gere 3 variações de e-mail contextualizadas pra este lead específico na etapa "${stageLabel}" do funil. Use o nome da empresa e o contexto do deal pra personalizar.`,
    );
  }
  parts.push(``);
  parts.push(
    `IMPORTANTE sobre hiperlinks: inclua 1-2 links por variação quando fizer sentido (markdown [texto](url)). Priorize: (1) landing da BU inferida, (2) UM artigo do blog se o tópico conecta com o ângulo, (3) página institucional. Não force. Links devem parecer sugestão natural de leitura, não CTA promocional.`,
  );

  return parts.join("\n");
}

// ──────────────────────────────────────────────────────────────────────
// Resolve nome legível da stage
// ──────────────────────────────────────────────────────────────────────
async function resolveStageLabel(
  supabase: ReturnType<typeof createClient>,
  stage: string,
): Promise<string> {
  // Primeiro tenta crm_stages custom
  const { data: custom } = await supabase
    .from("crm_stages")
    .select("name")
    .eq("id", stage)
    .maybeSingle();
  if (custom?.name) return custom.name as string;

  // Fallback: mapeamento DEAL_STAGES padrão
  const map: Record<string, string> = {
    lead: "Lead",
    qualificacao: "Qualificação",
    proposta: "Proposta em Aberto",
    negociacao: "Negociação",
    fechado_ganho: "Fechado (Ganho)",
    fechado_perdido: "Fechado (Perdido)",
  };
  return map[stage] || stage;
}

// ──────────────────────────────────────────────────────────────────────
// Chama Anthropic Messages API
// ──────────────────────────────────────────────────────────────────────
async function callClaude(
  systemPrompt: string,
  userMessage: string,
): Promise<{
  variants: Variant[];
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
      // Opus 4.7 não aceita temperature (deprecated pro modelo). A variação
      // entre gerações vem do histórico de ângulos usados + instrução explícita
      // no user message.
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

  // Remove fences de markdown se Claude resolver usar (mesmo sendo instruído a não usar)
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: { variants: Variant[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Falha ao parsear resposta da Claude como JSON. Resposta raw: ${text.slice(0, 500)}`);
  }

  if (!Array.isArray(parsed.variants) || parsed.variants.length !== 3) {
    throw new Error(
      `Resposta não contém 3 variants. Recebido: ${JSON.stringify(parsed).slice(0, 300)}`,
    );
  }

  return {
    variants: parsed.variants,
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
    const { deal_id, user_guidance } = (await req.json()) as GenerateRequest;
    if (!deal_id) return jsonResponse({ error: "deal_id obrigatório" }, 400);
    if (!ANTHROPIC_API_KEY) return jsonResponse({ error: "ANTHROPIC_API_KEY não configurada" }, 500);
    const trimmedGuidance =
      typeof user_guidance === "string" && user_guidance.trim()
        ? user_guidance.trim().slice(0, 2000)
        : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Buscar deal
    const { data: deal, error: dealErr } = await supabase
      .from("crm_deals")
      .select("*")
      .eq("id", deal_id)
      .single();
    if (dealErr || !deal) return jsonResponse({ error: "Deal não encontrado" }, 404);

    // 2. Buscar últimas activities
    const { data: activities } = await supabase
      .from("crm_deal_activities")
      .select("*")
      .eq("deal_id", deal_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // 2b. Buscar gerações anteriores pra forçar variação de ângulos
    const { data: priorDraftsRaw } = await supabase
      .from("ai_email_drafts")
      .select("created_at, variants")
      .eq("deal_id", deal_id)
      .neq("status", "discarded")
      .order("created_at", { ascending: false })
      .limit(3);

    const priorDrafts: PriorDraftSummary[] = (priorDraftsRaw ?? []).map(
      (d: { created_at: string; variants: unknown }) => ({
        created_at: d.created_at,
        variants: Array.isArray(d.variants)
          ? (d.variants as Array<{ label: string; subject: string; body: string }>)
          : [],
      }),
    );

    // 3. Resolver stage label legível + playbook da etapa
    const stageLabel = await resolveStageLabel(supabase, deal.stage as string);
    const playbookKey = resolvePlaybookKey(deal.stage as string, stageLabel);
    const playbook = STAGE_PLAYBOOKS[playbookKey];

    // 3b. Inferir BU + buscar temas, links, blog e portfolio
    const inferredBu = inferBu(deal.name as string);

    const { data: themesRaw } = await supabase
      .from("email_content_themes")
      .select("name, description, angle_instruction, bu")
      .eq("stage", deal.stage as string)
      .eq("active", true)
      .or(inferredBu ? `bu.is.null,bu.eq.${inferredBu}` : `bu.is.null`)
      .limit(8);
    const themes: Theme[] = (themesRaw ?? []) as unknown as Theme[];

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: linksRaw } = await supabase
      .from("email_link_library")
      .select("title, url, description, kind, bu, external, published_at")
      .eq("active", true)
      .or(
        inferredBu
          ? `bu.is.null,bu.eq.${inferredBu},and(external.eq.true,published_at.gte.${sevenDaysAgo})`
          : `bu.is.null,and(external.eq.true,published_at.gte.${sevenDaysAgo})`,
      )
      .limit(15);
    const links: LinkRef[] = (linksRaw ?? []) as unknown as LinkRef[];

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: blogRaw } = await supabase
      .from("blog_posts")
      .select("title, slug, excerpt, tags, published_at")
      .eq("status", "publicado")
      .gte("published_at", ninetyDaysAgo)
      .order("published_at", { ascending: false })
      .limit(8);
    const blogPosts: BlogPostRef[] = (blogRaw ?? []) as unknown as BlogPostRef[];

    let portfolioItems: PortfolioRef[] = [];
    if (inferredBu) {
      const { data: portRaw } = await supabase
        .from("portfolio_items")
        .select("title, project_name, bu, description, external_url")
        .eq("bu", inferredBu)
        .eq("is_featured", true)
        .limit(3);
      portfolioItems = (portRaw ?? []) as unknown as PortfolioRef[];
    }

    // 4. Chamar Claude
    const userMessage = buildUserMessage(
      deal as Record<string, unknown>,
      (activities ?? []) as Array<Record<string, unknown>>,
      stageLabel,
      playbook,
      priorDrafts,
      inferredBu,
      themes,
      links,
      blogPosts,
      portfolioItems,
      trimmedGuidance,
    );

    const { variants: rawVariants, inputTokens, outputTokens } = await callClaude(SYSTEM_PROMPT, userMessage);
    const generationMs = Date.now() - startedAt;

    // Sanitização defensiva: remove travessões e cacoetes que escaparam do prompt
    const variants = rawVariants.map(sanitizeVariant);

    // 5. Persistir draft
    // IMPORTANTE: passar tenant_id explicitamente — a Edge Function roda
    // com SERVICE_ROLE_KEY, então auth.uid() é null dentro do trigger e
    // a RLS filtra o registro fora do SELECT do frontend.
    const { data: draft, error: insertErr } = await supabase
      .from("ai_email_drafts")
      .insert({
        tenant_id: deal.tenant_id,
        deal_id,
        stage_at_generation: deal.stage,
        variants,
        status: "pending_review",
        model: MODEL,
        prompt_version: PROMPT_VERSION,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        generation_ms: generationMs,
      })
      .select()
      .single();

    if (insertErr || !draft) {
      return jsonResponse(
        { error: "Falha ao persistir draft", detail: insertErr?.message },
        500,
      );
    }

    return jsonResponse({
      success: true,
      draft,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return jsonResponse({ error: message }, 500);
  }
});
