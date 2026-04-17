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
const PROMPT_VERSION = "v5";

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
// Sanitização defensiva — remove padrões proibidos que a IA possa ter
// deixado passar mesmo com o prompt reforçado.
// ──────────────────────────────────────────────────────────────────────
function sanitizeText(text: string): string {
  if (!text) return text;
  let out = text;

  // 1. Remove TODOS os travessões (— U+2014, – U+2013).
  //    Substitui por ". " quando separa frases, vírgula quando está entre palavras.
  //    Heurística: se o travessão tem espaços de ambos os lados, assume separador de frase.
  out = out.replace(/\s+[—–]\s+/g, ". ");
  out = out.replace(/[—–]/g, ",");

  // 2. Normaliza ponto final duplicado (caso "x. . y")
  out = out.replace(/\.\s*\./g, ".");

  // 3. Normaliza espaços múltiplos
  out = out.replace(/[ \t]+/g, " ");

  // 4. Normaliza quebras de linha triplas
  out = out.replace(/\n{3,}/g, "\n\n");

  // 5. Capitaliza primeira letra após ". " se virou minúscula
  out = out.replace(/(\. )([a-záéíóúâêôàãõç])/g, (_m, p1, p2) => p1 + p2.toUpperCase());

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

# PADRÕES DE ESCRITA PROIBIDOS (leia com atenção máxima)

Esses padrões são cacoetes de copywriter guru/coach. São proibidos em TODAS as circunstâncias, INCLUSIVE se você só mudar a pontuação.

## P1 — FÓRMULA DE CONTRASTE CORRECIONAL (a mais importante)

Qualquer estrutura onde você NEGA algo pra em seguida REVELAR o "verdadeiro" ponto. Proibido em todas as variações, independente de pontuação:

- "Isso não é estética, é estratégia."
- "Isso não é estética. É estratégia."
- "O problema não está no produto, está na apresentação."
- "O problema não está no produto. Está na apresentação."
- "O maior risco não está na execução. Está na falta de X."
- "O maior risco não está na execução — está na falta de X."
- "A questão não é X. É Y."
- "Não se trata de X. Trata-se de Y."
- "Não vem de X. Vem de Y."
- "X não, Y sim."

Todas essas construções são a MESMA fórmula proibida. Não importa se você usa vírgula, ponto, travessão ou parágrafo novo pra fazer a "revelação". Continua proibido.

Por quê: é retórica de copywriter vendendo curso. Executivo reconhece de longe e ignora.

Como escrever em vez disso: enuncie o ponto afirmativamente, direto, sem armar o contraste. Se o ponto é "o risco real é a falta de fio condutor", escreva "o risco real é a falta de fio condutor". Nada de negar outra coisa antes.

Exemplos de reescrita:
- Ruim: "O problema não está na qualidade. Está na coerência."
- Bom: "A coerência entre as peças é onde o projeto perde força hoje."
- Ruim: "Não é sobre vender mais. É sobre vender com mais segurança."
- Bom: "A segurança na decisão do comprador é o que muda no volume."

## P2 — TRAVESSÃO (proibido em uso estilístico)

Você NÃO deve usar o caractere "—" em nenhum email gerado. Proibido em:

- Revelação: "O problema está no produto — está na apresentação."
- Ênfase: "X — e isso é crítico — Y."
- Reformulação: "fazer A — ou seja, B."
- Conclusão: "A, B, C — tudo isso importa."
- Conectivo: "O material é bom — mas perde coesão."

A única exceção teórica seria aposto legítimo, mas mesmo nesse caso use VÍRGULAS:
- Bom: "A construtora, em seu último projeto, observou X."
- Ruim: "A construtora — em seu último projeto — observou X."

Regra prática: NENHUM travessão em NENHUM dos 3 emails. Se estiver tentado, substitua por ponto final e frase nova.

## P3 — FRASES AFORÍSTICAS

Sentenças oraculares tipo fortune-cookie.
- Ruim: "Consistência vende. Fragmentação custa." / "Percepção é tudo."
- Bom: enunciados concretos com sujeito e complemento.

## P4 — FÓRMULA "A PARTIR DE X, NÃO DE Y"

E variações ("começando por", "partindo de", "baseado em X, não em Y").
- Ruim: "Vender a partir do contexto, não do produto."
- Bom: descreva o que efetivamente acontece.

## P5 — TOM DE COACH/GURU/MENTOR

Frases motivacionais, revelações, "insights que mudam tudo".
- Ruim: "Quando você entende isso, tudo muda." / "É aí que a mágica acontece." / "A verdade é que..."
- Bom: observação fria de quem já viu o padrão dezenas de vezes.

## P6 — BULLETS DESNECESSÁRIOS

Listas com 2-3 itens que caberiam em prosa. Só use lista quando forem 4+ itens paralelos reais (como no email de Diagnóstico).

## P7 — ANALOGIAS FORÇADAS

"É como um iceberg", "é como construir uma catedral", "como peças de um quebra-cabeça". Fale do fenômeno concreto.

## P8 — CTA EXPLÍCITO

"Me chame pra conversar." / "Agende uma call." / "Vamos marcar uma reunião?" / "Bora conversar?" — tudo proibido. Termine com pergunta aberta genuína sobre o negócio do lead.

## P9 — ABRE-ASPAS CONCEITUAIS

Aspas pra destacar palavra-chave ("posicionamento", "coerência", "percepção"). Use aspas só pra citar fala literal de terceiro.

# CHECKLIST FINAL ANTES DE ENTREGAR

Antes de devolver o JSON, releia cada um dos 3 bodies e VERIFIQUE:
1. Algum travessão "—"? Se sim, REESCREVA a frase sem ele.
2. Alguma estrutura "X não A, é/está B" (com qualquer pontuação)? Se sim, REESCREVA enunciando B direto.
3. Alguma frase aforística curta? Se sim, expanda pra enunciado concreto.
4. Algum CTA explícito? Se sim, substitua por pergunta sobre o negócio.
5. Alguma analogia forçada? Se sim, fale do fenômeno direto.

Só entregue o JSON quando tiver passado nos 5 checks.

# ESTRUTURA PSICOLÓGICA (cada email tem)

- insight central
- objeção invisível trabalhada indiretamente
- progressão lógica
- pergunta aberta no final

# VARIAÇÕES OBRIGATÓRIAS

Você deve gerar EXATAMENTE 3 variações com tons distintos, TODAS personalizadas pro escopo específico do projeto/deal.

Cada tipo (Consultivo, Case/Prova, Diagnóstico) tem um POOL DE ÂNGULOS. Escolha 1 ângulo de cada pool, priorizando ângulos NOVOS (que não foram usados em gerações anteriores desse mesmo lead). Se o usuário clicou "Gerar novos" várias vezes, use ângulos diferentes a cada rodada. A monotonia entre gerações é o maior defeito possível.

## Variação 1 — CONSULTIVO (tom reflexivo, abertura de visão)

Escolha UM dos ângulos abaixo (ou crie um novo na mesma família):

- **Padrão de mercado** — "tem um ponto que observo com frequência em [contexto]"
- **Comportamento do comprador** — como o decisor final percebe/compara/decide
- **Evolução do setor** — o que mudou recentemente em lançamentos desse perfil
- **Momento do projeto** — o que fica em jogo na fase específica em que o deal está
- **Fricção invisível** — a parte do processo que ninguém mede mas impacta venda
- **Decisão sob pressão** — como incorporadoras tomam decisão rápida quando o timing aperta
- **Percepção vs. realidade** — o gap entre o que o produto é e como ele chega no comprador

## Variação 2 — CASE/PROVA (tangibilização)

Escolha UM dos ângulos abaixo:

- **Projeto em cidade do sul** (Joinville, Curitiba, Porto Alegre, Blumenau, Florianópolis)
- **Projeto em cidade do sudeste** (São Paulo interior, Campinas, Ribeirão, Belo Horizonte)
- **Lançamento com revisão de material no meio** — reestruturaram apresentação antes de abrir VSO
- **Projeto que ajustou só um dos pilares** (só 3D, ou só narrativa audiovisual) e mudou leitura
- **Incorporadora que centralizou fornecedores** após ter fragmentação
- **Projeto premium com percepção mediana** — como a intervenção elevou percepção
- **Lançamento que começou forte no digital** (antes do estande físico)
- **Caso em que o corretor precisava explicar demais** — como material passou a "vender sozinho"

Descreva PROBLEMA → INTERVENÇÃO → RESULTADO sem citar nome real.

## Variação 3 — DIAGNÓSTICO (autoavaliação)

Escolha UM dos ângulos abaixo:

- **Sinais de fragmentação entre peças** (5 pontos)
- **Sinais de percepção aquém do produto** (4 pontos)
- **Sinais de que o comercial compensa por falta de apresentação** (5 pontos)
- **Sinais de que o conceito se dilui ao longo do funil** (4 pontos)
- **Sinais de que o comprador compara demais** (5 pontos)
- **Sinais de que o timing tá apertado pro material atual** (4 pontos)
- **Sinais específicos pro tipo de projeto do deal** (criar a partir do escopo)

Formato: 3-5 bullets curtos e concretos, SEM a fórmula X-não-é-Y. Termina com pergunta sobre quais sinais ressoam.

## REGRA ANTI-REPETIÇÃO

Se o user message incluir uma seção "# ÂNGULOS JÁ USADOS EM GERAÇÕES ANTERIORES", você DEVE escolher ângulos diferentes dos listados. Essa é a diferença entre parecer um assistente automatizado e parecer um executivo que pensa em cada abordagem individualmente.

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
interface PriorDraftSummary {
  created_at: string;
  variants: Array<{ label: string; subject: string; body: string }>;
}

function buildUserMessage(
  deal: Record<string, unknown>,
  activities: Array<Record<string, unknown>>,
  stageLabel: string,
  priorDrafts: PriorDraftSummary[],
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

  parts.push(``);
  parts.push(`# Tarefa`);
  if (priorDrafts.length > 0) {
    parts.push(
      `Gere 3 variações NOVAS de e-mail pra este lead. As variações anteriores estão listadas acima — é ESSENCIAL que esta geração use ângulos distintos dos já tentados. Varie cidade do case, tipo de sinais do diagnóstico, ângulo do consultivo. Mesmo lead, abordagem diferente.`,
    );
  } else {
    parts.push(
      `Gere 3 variações de e-mail contextualizadas pra este lead específico na etapa "${stageLabel}" do funil. Use o nome da empresa e o contexto do deal pra personalizar.`,
    );
  }

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
      // Temperature levemente alta pra garantir variação entre gerações.
      // Com o prompt rígido de regras proibidas, baixa temperatura tende a
      // convergir pros mesmos ângulos a cada rodada.
      temperature: 0.95,
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

    // 3. Resolver stage label legível
    const stageLabel = await resolveStageLabel(supabase, deal.stage as string);

    // 4. Chamar Claude
    const userMessage = buildUserMessage(
      deal as Record<string, unknown>,
      (activities ?? []) as Array<Record<string, unknown>>,
      stageLabel,
      priorDrafts,
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
