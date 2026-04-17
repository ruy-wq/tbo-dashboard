// ============================================================================
// TBO OS — Edge Function: Generate Cadence Step Draft
//
// Dado um enrollment_id, busca o step atual da cadência, puxa contexto do deal
// + activities, e pede pra Opus 4.7 PERSONALIZAR o template do step com
// contexto do lead (mantendo o ângulo/papel original do Notion).
//
// Cria cadence_sends com status='draft'. Envio é manual via /send-cadence-step.
//
// Auth: verify_jwt: false. Frontend autenticado invoca via supabase-js.
// SERVICE_ROLE internamente. URL não pública.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = "claude-opus-4-7";
const PROMPT_VERSION = "cadence-v1";

interface GenerateRequest {
  enrollment_id: string;
  step_order?: number; // opcional — default = current_step_order do enrollment
  user_guidance?: string; // opcional — ajustes do usuário além do template
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

const SYSTEM_PROMPT = `Você é um estrategista sênior de growth B2B e copywriter consultivo da TBO, agência de lançamentos imobiliários. Sua função aqui é PERSONALIZAR um e-mail da cadência editorial mantendo integralmente:

- O ÂNGULO editorial do template (papel na jornada, insight central, objeção trabalhada)
- O TOM — consultivo, denso, sem linguagem de agência, sem pitch explícito
- A ESTRUTURA de raciocínio do template (abertura, desenvolvimento, pergunta final)

O que você deve AJUSTAR:
- Referências ao nome do contato ({{primeiro_nome}}) e da empresa ({{empresa}}) — deixe os tokens nos lugares certos
- Detalhes sutis que conectem com o contexto específico do deal (nome do projeto, BU, valor se relevante, histórico de atividades)
- Pequenas variações lexicais pra parecer escrita genuína, não copiada

O que você NÃO deve fazer:
- Mudar a mensagem central do e-mail
- Remover a pergunta final (se houver)
- Adicionar CTA comercial que não existia no original
- Usar emojis se o original não usa
- Estender o comprimento além de ~20% do original

REGRAS DE TIPOGRAFIA:
- Português brasileiro com acentuação completa
- Sem travessão (—) no corpo argumentativo — só em aposto curto ou saudação informal
- Sem fórmula "X não é Y, é Z"
- Sem aforismo guru/coach
- Parágrafos curtos (1-3 linhas)
- Manter **bold** e *itálico* do original

FORMATO DE SAÍDA — você tem UMA ferramenta: \`emit_cadence_email\`. Chame-a com:
- final_subject: assunto (pode ajustar levemente o do template se agregar)
- final_body: corpo completo em markdown

NÃO escreva nada fora da chamada de ferramenta.`;

function buildUserMessage(
  step: { name: string; subject_template: string; body_template: string; objective: string | null; role: string | null; angles: Record<string, unknown> },
  deal: Record<string, unknown>,
  activities: Array<Record<string, unknown>>,
  cadenceName: string,
  priorSends: Array<{ step_order: number; final_subject: string | null }>,
  userGuidance: string | null,
): string {
  const parts: string[] = [];

  parts.push(`# Cadência em andamento: ${cadenceName}`);
  parts.push(`Este é o **${step.name}** — step ${step.role ?? "sem role"} da cadência.`);
  if (step.objective) parts.push(`**Objetivo deste e-mail:** ${step.objective}`);
  if (step.angles && Object.keys(step.angles).length > 0) {
    parts.push(`**Metadados editoriais:** ${JSON.stringify(step.angles)}`);
  }
  parts.push(``);

  parts.push(`# Template original (do Notion — seguir fielmente o ângulo)`);
  parts.push(`**Subject:** ${step.subject_template}`);
  parts.push(``);
  parts.push(`**Body:**`);
  parts.push(step.body_template);
  parts.push(``);

  parts.push(`# Contexto do Lead`);
  parts.push(`**Nome do deal:** ${deal.name ?? "—"}`);
  parts.push(`**Empresa (incorporadora):** ${deal.company ?? "—"}`);
  parts.push(`**Contato:** ${deal.contact ?? "—"}`);
  if (deal.value) parts.push(`**Valor estimado:** R$ ${deal.value}`);
  if (deal.notes) parts.push(`**Notas internas:** ${String(deal.notes).slice(0, 500)}`);
  if (deal.source) parts.push(`**Origem:** ${deal.source}`);

  if (activities.length > 0) {
    parts.push(``);
    parts.push(`# Atividades recentes (pra contextualizar — use só se couber naturalmente)`);
    for (const a of activities.slice(0, 5)) {
      const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString("pt-BR") : "";
      const type = a.activity_type || a.type || "atividade";
      const desc = a.description || a.notes || a.content || "";
      parts.push(`- [${date}] ${type}: ${String(desc).slice(0, 160)}`);
    }
  }

  if (priorSends.length > 0) {
    parts.push(``);
    parts.push(`# E-mails já enviados nesta cadência (NÃO repita ângulo)`);
    priorSends.forEach((s) => {
      parts.push(`- Step ${s.step_order}: "${s.final_subject ?? ""}"`);
    });
  }

  if (userGuidance) {
    parts.push(``);
    parts.push(`# Ajuste específico do usuário pra esta geração`);
    parts.push(userGuidance.replace(/\n+/g, " ").trim());
  }

  parts.push(``);
  parts.push(`# Tarefa`);
  parts.push(
    `Chame a ferramenta \`emit_cadence_email\` com subject e body PERSONALIZADOS pro contexto deste deal, mantendo integralmente o ângulo editorial do template acima. Use {{primeiro_nome}} e {{empresa}} como placeholders (serão resolvidos no envio). Máximo 1000 tokens de body.`,
  );

  return parts.join("\n");
}

interface ToolUseBlock {
  type: "tool_use";
  name: string;
  input: { final_subject: string; final_body: string };
}
interface TextBlock {
  type: "text";
  text: string;
}
type ContentBlock = ToolUseBlock | TextBlock;

async function callClaude(
  userMessage: string,
): Promise<{ final_subject: string; final_body: string; inputTokens: number; outputTokens: number }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "emit_cadence_email",
          description: "Emite o e-mail personalizado da cadência.",
          input_schema: {
            type: "object",
            properties: {
              final_subject: { type: "string", description: "Assunto final, podendo ajustar levemente o do template." },
              final_body: { type: "string", description: "Corpo markdown completo, personalizado pro deal. Até 1000 tokens. Mantém {{primeiro_nome}} e {{empresa}}." },
            },
            required: ["final_subject", "final_body"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "emit_cadence_email" },
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const blocks: ContentBlock[] = data.content ?? [];
  const toolBlock = blocks.find(
    (b): b is ToolUseBlock => b.type === "tool_use" && b.name === "emit_cadence_email",
  );
  if (!toolBlock) {
    const dump = blocks.map((b) => (b.type === "text" ? b.text : JSON.stringify(b))).join("\n").slice(0, 400);
    throw new Error(`Claude não retornou tool_use. Raw: ${dump}`);
  }

  return {
    final_subject: toolBlock.input.final_subject,
    final_body: toolBlock.input.final_body,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { enrollment_id, step_order, user_guidance } = (await req.json()) as GenerateRequest;
    if (!enrollment_id) return jsonResponse({ error: "enrollment_id obrigatório" }, 400);
    if (!ANTHROPIC_API_KEY) return jsonResponse({ error: "ANTHROPIC_API_KEY não configurada" }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Enrollment + cadence + deal
    const { data: enrollment, error: enErr } = await supabase
      .from("cadence_enrollments")
      .select("id, tenant_id, deal_id, cadence_id, current_step_order, status")
      .eq("id", enrollment_id)
      .single();
    if (enErr || !enrollment) return jsonResponse({ error: "Enrollment não encontrado" }, 404);
    if (enrollment.status !== "active") {
      return jsonResponse({ error: `Enrollment está ${enrollment.status}, não ativo` }, 400);
    }

    const targetStepOrder = step_order ?? enrollment.current_step_order;

    // 2. Step alvo
    const { data: step, error: stepErr } = await supabase
      .from("cadence_steps")
      .select("id, step_order, name, subject_template, body_template, objective, role, angles")
      .eq("cadence_id", enrollment.cadence_id)
      .eq("step_order", targetStepOrder)
      .single();
    if (stepErr || !step) return jsonResponse({ error: `Step ${targetStepOrder} não encontrado` }, 404);

    // 3. Cadence (pra nome)
    const { data: cadence } = await supabase
      .from("cadences")
      .select("name")
      .eq("id", enrollment.cadence_id)
      .single();

    // 4. Deal + activities
    const { data: deal, error: dealErr } = await supabase
      .from("crm_deals")
      .select("*")
      .eq("id", enrollment.deal_id)
      .single();
    if (dealErr || !deal) return jsonResponse({ error: "Deal não encontrado" }, 404);

    const { data: activities } = await supabase
      .from("crm_deal_activities")
      .select("activity_type, description, created_at")
      .eq("deal_id", enrollment.deal_id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 5. Envios anteriores dessa enrollment
    const { data: priorSendsRaw } = await supabase
      .from("cadence_sends")
      .select("step_order, final_subject")
      .eq("enrollment_id", enrollment_id)
      .eq("status", "sent")
      .order("step_order", { ascending: true });
    const priorSends = (priorSendsRaw ?? []) as Array<{ step_order: number; final_subject: string | null }>;

    // 6. Se já existe draft pendente pra esse step, retorna ele (evita duplicar)
    const { data: existingDraft } = await supabase
      .from("cadence_sends")
      .select("*")
      .eq("enrollment_id", enrollment_id)
      .eq("step_order", targetStepOrder)
      .eq("status", "draft")
      .maybeSingle();
    if (existingDraft) {
      return jsonResponse({ success: true, send: existingDraft, reused: true });
    }

    // 7. Chama Claude
    const userMessage = buildUserMessage(
      step as never,
      deal as Record<string, unknown>,
      (activities ?? []) as Array<Record<string, unknown>>,
      cadence?.name ?? "Cadência",
      priorSends,
      typeof user_guidance === "string" && user_guidance.trim() ? user_guidance.trim().slice(0, 1500) : null,
    );

    const { final_subject, final_body, inputTokens, outputTokens } = await callClaude(userMessage);

    // 8. Persiste como cadence_send draft
    const { data: send, error: insertErr } = await supabase
      .from("cadence_sends")
      .insert({
        tenant_id: enrollment.tenant_id,
        enrollment_id: enrollment.id,
        step_id: step.id,
        step_order: step.step_order,
        status: "draft",
        final_subject,
        final_body,
      })
      .select()
      .single();

    if (insertErr || !send) {
      return jsonResponse({ error: "Falha ao persistir send", detail: insertErr?.message, generated: { final_subject, final_body } }, 500);
    }

    return jsonResponse({
      success: true,
      send,
      meta: { model: MODEL, prompt_version: PROMPT_VERSION, input_tokens: inputTokens, output_tokens: outputTokens },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
