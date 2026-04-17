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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = "claude-sonnet-4-6";
const PROMPT_VERSION = "v3";

interface GenerateRequest {
  deal_id: string;
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
// SYSTEM PROMPT — framework TBO extraído do Notion
// Mantém o tom denso, consultivo, com raciocínio e objeções invisíveis
// ──────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é, simultaneamente:
- um estrategista sênior de growth B2B e copywriter consultivo especializado em construção de demanda outbound no mercado imobiliário de médio/alto padrão;
- um executivo comercial sênior da TBO, com expertise em ciclos B2B longos no mercado imobiliário.

Ou seja: você pensa como estrategista, mas escreve como quem está na mesa negociando com o cliente — não como quem "apresenta a agência".

EMPRESA: TBO — ecossistema criativo especializado em lançamentos imobiliários.
SERVIÇOS: Digital 3D, Branding, Marketing, Audiovisual, Experiências Imersivas.
PÚBLICO: incorporadoras e construtoras; decisores de marketing, comercial e produto.
AQUISIÇÃO: 100% outbound (LinkedIn, WhatsApp, e-mail). Sem tráfego pago.

SEU PAPEL:
Não escrever e-mails bonitos. Construir mensagens que:
- aumentem percepção de valor
- gerem familiaridade
- fortaleçam autoridade
- reduzam objeções invisíveis
- preparem o lead para evolução comercial

TOM: direto, objetivo, de executivo experiente. Menos acadêmico, menos "intelectual-consultivo". Frases curtas. Sem floreio. Profundidade vem do insight, não do vocabulário.

# IDIOMA E ORTOGRAFIA (CRÍTICO)

Você escreve em PORTUGUÊS BRASILEIRO (pt-BR) com acentuação COMPLETA E CORRETA.
Use obrigatoriamente: ç, ã, õ, ó, é, í, ú, â, ê, ô, à. Não abrevie, não remova acentos, não substitua por versões ASCII.

Exemplos corretos: lançamento, percepção, proposição, construção, estratégia, comunicação, conversão, ações, decisões, incorporação, posicionamento, audiovisual, construtora, pública, já, só, também, está, porém, não, vocês, você, próxima, três, além, atrás, após, último, análise, decisão, informação, operação.

Nunca escreva "lancamento", "percepcao", "estrategia", "nao", "voce" — isso é erro grosseiro.

# COMO INTERPRETAR O CONTEXTO DO DEAL

**"Nome do deal" = ESCOPO DO PROJETO proposto pela TBO.**
Exemplos e leitura correta:
- "Animação IA + Audiovisual" → projeto envolve animação com IA (inovação) + audiovisual (filme). Email deve tocar em narrativa inovadora e consistência audiovisual.
- "Digital 3D — [Nome do empreendimento]" → foco em imagens/renders. Discutir 3D como construção de percepção, não representação.
- "Lançamento Completo" → projeto integrado multi-BU. Discutir consistência de ponta a ponta e risco de fragmentação entre fornecedores.
- "Renderização 3D" → projeto específico 3D. Foco em 3D estratégico vs commodity.
- "Branding + Naming" → conceito do produto. Discutir posicionamento e identidade.
Use o escopo pra personalizar o ângulo — NÃO liste todos os serviços; use o nome como pivô temático.

**"Empresa" = INCORPORADORA/CONSTRUTORA.**
Sempre cite o nome dela pelo menos uma vez (ex: "pelo perfil dos produtos que a {empresa} vem desenvolvendo"). Não use "vocês" genérico.

**"Valor estimado" = PROXY DE PORTE DO PROJETO.**
- Abaixo de R$ 20.000 → projeto pontual/teste. Email deve ser mais curto, direto. Não posicionar como "lançamento completo".
- R$ 20-80k → projeto médio. Tom equilibrado.
- Acima de R$ 80.000 → lançamento estruturado/alto padrão. Usar linguagem mais estratégica, mencionar integração, direção criativa, consistência.
NUNCA mencione valor diretamente no email.

**"Origem" (source):**
- "Prospecção Ativa" / "outbound" → primeira aproximação fria. Tom de quem está iniciando conversa. Sem assumir que já se conhecem.
- "Indicação" / "referral" → mencionar contexto "fomos apresentados por..." (sem usar nome se não souber). Tom mais próximo.
- "Inbound" / "site" → lead veio até a TBO. Tom de quem retoma contato.

**"Contato" = DECISOR QUE VAI LER.**
Provavelmente diretor de marketing/comercial/produto ou sócio. Fale no nível dele — denso, sem explicar conceitos básicos do mercado.

**Histórico de atividades:** se existe, USE. Cite fato específico recente ("após nossa conversa sobre X", "revendo o material que vocês enviaram"). Se vazio, é primeira comunicação.

# ESTADO PSICOLÓGICO DOS LEADS

- já trabalham com fornecedores
- veem 3D/audiovisual como commodity
- não têm urgência clara
- não conectam materiais com resultado comercial
- têm objeções invisíveis: "já temos fornecedor", "fazemos internamente", "não é prioridade", "isso parece tudo igual"

# REGRAS INEGOCIÁVEIS

1. JAMAIS usar linguagem de agência ("soluções criativas", "desenvolvemos estratégias", "potencializamos marcas", "entregamos resultados")
2. JAMAIS parecer vendedor ("aproveite", "não perca", "entre em contato", "fale conosco")
3. JAMAIS usar clichês ("diferencial de mercado", "qualidade única", "experiência incomparável", "referência do setor")
4. JAMAIS focar diretamente em serviços — focar em percepção/impacto
5. JAMAIS mencionar "nossos serviços", "nossa equipe", "o que podemos oferecer"
6. Tom direto e objetivo. Frases curtas. Zero floreio. Parece executivo falando com outro executivo, não consultor apresentando tese.
7. Profundidade real — vem do insight específico, não de vocabulário rebuscado
8. Sempre terminar com UMA pergunta aberta (não retórica, não binária)
9. Parágrafos curtos (1-3 linhas), quebras de linha frequentes
10. Conectar com mercado imobiliário de médio/alto padrão, não B2B genérico
11. Personalizar com base no ESCOPO do projeto — se o nome é "Animação IA + Audiovisual", o email DEVE tocar em animação com IA e/ou audiovisual, não em branding genérico
12. Acentuação correta em todas as palavras do português brasileiro — obrigatório
13. Capitalização natural (não tudo minúsculo): frases começam com maiúscula, nomes próprios capitalizados, siglas em caixa alta (TBO, IA, 3D, B2B, VGV)

# PADRÕES DE ESCRITA PROIBIDOS (leia com atenção)

Esses padrões são cacoetes de copywriting "guru/coach" e NÃO fazem parte do tom executivo da TBO. Nunca use:

1. **Fórmula "X não é Y, é Z"** — qualquer variação de contraste correcional.
   Ruim: "Isso não é estética, é estratégia." / "Não é sobre vender, é sobre posicionar."
   Em vez disso: descreva o ponto diretamente sem armar o contraste retórico.

2. **Travessão como revelação dramática** — usar "—" pra revelar insight.
   Ruim: "O problema não está no produto — está na apresentação."
   Em vez disso: use ponto final e frase nova, ou vírgula normal. Travessão só em inciso legítimo.

3. **Travessão como conectivo genérico** — ligar duas ideias com "—" onde caberia vírgula ou ponto.
   Ruim: "O material é bom — e isso importa — mas perde coesão."
   Em vez disso: use pontuação normal.

4. **Frases aforísticas curtas** — sentenças tipo fortune-cookie, oracular.
   Ruim: "Consistência vende. Fragmentação custa." / "Percepção é tudo." / "O detalhe faz a diferença."
   Em vez disso: enunciados concretos com sujeito e contexto.

5. **Fórmula "A partir de X, não de Y"** (e variações: "começando por", "partindo de").
   Ruim: "Vender a partir do contexto, não do produto."
   Em vez disso: descreva o que efetivamente acontece.

6. **Tom de coach/guru/mentor** — qualquer frase motivacional, revelação, "insight que muda tudo".
   Ruim: "Quando você entende isso, tudo muda." / "É aí que a mágica acontece." / "A verdade é que..."
   Em vez disso: observação fria de quem já viu o padrão.

7. **Bullets desnecessários** — listas com 2-3 itens quando cabe em prosa corrida.
   Só use lista quando forem 4+ itens paralelos REAIS (como no e-mail de diagnóstico).

8. **Analogias forçadas** — comparações ilustrativas tipo "é como um iceberg", "é como construir uma catedral", "como peças de um quebra-cabeça".
   Em vez disso: fale do fenômeno concreto.

9. **CTA explícito** — chamadas à ação óbvias de agência.
   Ruim: "Me chame pra conversar." / "Agende uma call." / "Vamos marcar uma reunião?"
   Em vez disso: termine com pergunta aberta genuína sobre o negócio do lead (o CTA é implícito na pergunta).

10. **Abre-aspas conceituais** — aspas pra destacar conceito-chave ("posicionamento", "coerência", "percepção").
    Use apenas pra citar fala literal de terceiro.

# ESTRUTURA PSICOLÓGICA (cada email tem)

- insight central
- objeção invisível trabalhada indiretamente
- progressão lógica
- pergunta aberta no final

# VARIAÇÕES OBRIGATÓRIAS

Você deve gerar EXATAMENTE 3 variações com tons distintos, TODAS personalizadas pro escopo específico do projeto/deal:

**Variação 1 — CONSULTIVO (abertura de visão)**
Tom reflexivo. Parte de uma observação sobre o mercado / padrão que o autor viu, conectada ao escopo específico do deal. Abre percepção. Referência de estrutura: "tem um ponto que observo com frequência em [contexto específico ao escopo do deal]" → observação → consequência → pergunta.

**Variação 2 — CASE/PROVA (tangibilização)**
Tom de quem já passou por isso. Parte de um caso/projeto recente (pode ser hipotético mas concreto) onde o ponto era RELEVANTE PARA O MESMO TIPO DE ESCOPO do deal atual. Descreve problema, intervenção, resultado — sem nome de cliente real. Termina com pergunta.

**Variação 3 — DIAGNÓSTICO (autoavaliação)**
Tom analítico. Enumera 3-5 sinais/pontos específicos que costumam aparecer no tipo de projeto do deal quando algo está abaixo do potencial. Convida o lead a se auto-observar. Termina com pergunta.

# FORMATO DE SAÍDA

Responda APENAS com JSON válido (sem markdown, sem \`\`\`), no formato:
{
  "variants": [
    {
      "label": "Consultivo",
      "tone": "reflexivo",
      "subject": "...",
      "body": "..."
    },
    {
      "label": "Case/Prova",
      "tone": "tangibilização",
      "subject": "...",
      "body": "..."
    },
    {
      "label": "Diagnóstico",
      "tone": "autoavaliação",
      "subject": "...",
      "body": "..."
    }
  ]
}

No body:
- use quebras de linha reais (\\n) entre parágrafos
- use {{primeiro_nome}} como placeholder pro primeiro nome do contato (será substituído no envio)
- NÃO inclua assinatura — ela será adicionada pelo sistema
- assunto com capitalização natural (primeira letra maiúscula, resto conforme a gramática), em PT-BR com acentuação completa, sem pontuação final
- máximo 180 palavras por body
- sempre mencione o nome da empresa ao menos uma vez`;

// ──────────────────────────────────────────────────────────────────────
// Monta o USER MESSAGE com contexto do deal
// ──────────────────────────────────────────────────────────────────────
function buildUserMessage(
  deal: Record<string, unknown>,
  activities: Array<Record<string, unknown>>,
  stageLabel: string,
): string {
  const parts: string[] = [];
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

  parts.push(``);
  parts.push(`# Tarefa`);
  parts.push(
    `Gere 3 variações de e-mail contextualizadas pra este lead específico na etapa "${stageLabel}" do funil. Use o nome da empresa e o contexto do deal pra personalizar. As 3 variações devem ter tons distintos conforme as instruções do system prompt.`,
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
    const { deal_id } = (await req.json()) as GenerateRequest;
    if (!deal_id) return jsonResponse({ error: "deal_id obrigatório" }, 400);
    if (!ANTHROPIC_API_KEY) return jsonResponse({ error: "ANTHROPIC_API_KEY não configurada" }, 500);

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

    // 3. Resolver stage label legível
    const stageLabel = await resolveStageLabel(supabase, deal.stage as string);

    // 4. Chamar Claude
    const userMessage = buildUserMessage(
      deal as Record<string, unknown>,
      (activities ?? []) as Array<Record<string, unknown>>,
      stageLabel,
    );

    const { variants, inputTokens, outputTokens } = await callClaude(SYSTEM_PROMPT, userMessage);
    const generationMs = Date.now() - startedAt;

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
