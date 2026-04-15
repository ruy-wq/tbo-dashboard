// ── AI Reconciliation Schemas ────────────────────────────────────────────────
// Zod schemas, derived types, and system prompt for the AI financial analyst.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ── System prompt (shared across all functions) ──────────────────────────────

export const SYSTEM_PROMPT = `Você é um analista financeiro sênior especializado em conciliação bancária de agências de comunicação e design.

Contexto do negócio:
- Agência TBO com BUs: BRD (Branding), D3D (Digital 3D), MKT (Marketing), AV (Audiovisual), INT (Interiores), ADM (Administrativo), CORP (Corporativo)
- Ciclo financeiro: dia 15 ao dia 15
- Pagamento de equipe: dia 15 de cada mês
- Receitas vêm de contratos de serviço criativo (projetos imobiliários, branding, marketing digital)
- Despesas: folha de pagamento, freelancers, software (Adobe, Figma), impostos, administrativo

Regras obrigatórias:
1. Responda SEMPRE em português brasileiro
2. Seja preciso com valores — NUNCA arredonde sem avisar
3. Sinalize o nível de confiança: ALTA (>85%), MÉDIA (50-85%), BAIXA (<50%)
4. Se não tem certeza, diga explicitamente — NUNCA invente matches
5. Retorne APENAS JSON válido, sem texto adicional fora do JSON`;

// ── F1: Intelligent Match ───────────────────────────────────────────────────

export const AIMatchSuggestionSchema = z.object({
  bankTxId: z.string(),
  financeTxId: z.string(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const AIMatchResponseSchema = z.object({
  matches: z.array(AIMatchSuggestionSchema),
  insights: z.string().optional(),
});

export type AIMatchSuggestion = z.infer<typeof AIMatchSuggestionSchema>;
export type AIMatchResponse = z.infer<typeof AIMatchResponseSchema>;

// ── F2: Semantic Categorization ─────────────────────────────────────────────

export const AICategorySuggestionSchema = z.object({
  bankTxId: z.string(),
  suggestedCategory: z.string(),
  suggestedCostCenter: z.string().nullable(),
  suggestedType: z.enum(["receita", "despesa", "transferencia"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const AICategorizeResponseSchema = z.object({
  categorizations: z.array(AICategorySuggestionSchema),
});

export type AICategorySuggestion = z.infer<typeof AICategorySuggestionSchema>;
export type AICategorizeResponse = z.infer<typeof AICategorizeResponseSchema>;

// ── F3: Anomaly Detection ───────────────────────────────────────────────────

export const AIAnomalySchema = z.object({
  id: z.string(),
  severity: z.enum(["info", "alerta", "critico"]),
  type: z.enum(["duplicata", "valor_atipico", "padrao_irregular", "ausencia", "divergencia"]),
  title: z.string(),
  description: z.string(),
  affectedTxIds: z.array(z.string()),
  suggestedAction: z.string(),
});

export const AIAnomalyResponseSchema = z.object({
  anomalies: z.array(AIAnomalySchema),
  healthScore: z.number().min(0).max(100),
  summary: z.string(),
});

export type AIAnomaly = z.infer<typeof AIAnomalySchema>;
export type AIAnomalyResponse = z.infer<typeof AIAnomalyResponseSchema>;

// ── F5: Narrative Summary ──────────────────────────────────────────────────

export const AISummaryResponseSchema = z.object({
  diagnostico: z.string(),
  destaques: z.array(z.object({
    tipo: z.enum(["positivo", "atencao", "risco"]),
    texto: z.string(),
  })),
  acoes: z.array(z.string()),
  metricas: z.object({
    receitaPeriodo: z.number(),
    despesaPeriodo: z.number(),
    margemPct: z.number(),
    conciliacaoPct: z.number(),
    inadimplenciaPct: z.number(),
  }),
});

export type AISummaryResponse = z.infer<typeof AISummaryResponseSchema>;
