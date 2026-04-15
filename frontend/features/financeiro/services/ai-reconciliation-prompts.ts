// ── AI Reconciliation Prompts ────────────────────────────────────────────────
// Prompt builder functions and data summarizers for the AI financial analyst.
// ─────────────────────────────────────────────────────────────────────────────

import type { BankTransaction } from "@/lib/supabase/types/bank-reconciliation";
import type { FinanceTransaction } from "./finance-types";

// ── Sanitization (mask sensitive docs before sending to API) ─────────────────

function maskDoc(doc: string | null): string | null {
  if (!doc) return null;
  const cleaned = doc.replace(/[^0-9]/g, "");
  if (cleaned.length >= 11) {
    return cleaned.slice(0, 3) + "***" + cleaned.slice(-2);
  }
  return doc;
}

// ── Data summarizers ────────────────────────────────────────────────────────

export interface BankTxSummary {
  id: string;
  date: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
}

export interface FinanceTxSummary {
  id: string;
  date: string;
  amount: number;
  paid_amount: number;
  type: "receita" | "despesa" | "transferencia";
  status: string;
  description: string;
  counterpart: string | null;
  counterpart_doc: string | null;
  category: string | null;
  cost_center: string | null;
}

export function toBankSummary(tx: BankTransaction): BankTxSummary {
  return {
    id: tx.id,
    date: tx.transaction_date,
    amount: tx.amount,
    type: tx.type,
    description: tx.description,
  };
}

export function toFinanceSummary(tx: FinanceTransaction & { category_name?: string; cost_center_name?: string }): FinanceTxSummary {
  return {
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    paid_amount: tx.paid_amount,
    type: tx.type,
    status: tx.status,
    description: tx.description,
    counterpart: tx.counterpart,
    counterpart_doc: maskDoc(tx.counterpart_doc),
    category: (tx as unknown as Record<string, unknown>).category_name as string | null ?? null,
    cost_center: (tx as unknown as Record<string, unknown>).cost_center_name as string | null ?? null,
  };
}

// ── F1: Intelligent Match Prompt ────────────────────────────────────────────

export function buildMatchPrompt(
  unmatchedBankTxs: BankTransaction[],
  availableFinanceTxs: FinanceTransaction[]
): string {
  const bankSummaries = unmatchedBankTxs.slice(0, 20).map(toBankSummary);
  const financeSummaries = availableFinanceTxs.slice(0, 50).map(toFinanceSummary);

  return `Analise as transações bancárias sem correspondência e tente encontrar matches nos lançamentos internos.

## Transações Bancárias (sem match)
${JSON.stringify(bankSummaries, null, 2)}

## Lançamentos Internos Disponíveis
${JSON.stringify(financeSummaries, null, 2)}

## Instruções
Para cada transação bancária, verifique:
1. Valor compatível (exato ou próximo, considere que o banco pode ter taxas/juros)
2. Data próxima (±7 dias úteis)
3. Descrição com termos similares (nomes de pessoas, empresas, serviços)
4. Tipo compatível: credit → receita, debit → despesa
5. Considere que descrições bancárias são abreviadas (ex: "PIX FULANO" pode ser "Pagamento freelancer Fulano da Silva")

Retorne APENAS JSON válido:
{
  "matches": [
    {
      "bankTxId": "id da transação bancária",
      "financeTxId": "id do lançamento interno",
      "confidence": 75,
      "reasoning": "Explicação curta do porquê do match"
    }
  ],
  "insights": "Observação geral opcional sobre padrões encontrados"
}

Se não encontrar nenhum match válido, retorne: {"matches": [], "insights": "Nenhum match encontrado."}
IMPORTANTE: Só sugira matches com confiança ≥ 40%. Prefira não sugerir a sugerir errado.`;
}

// ── F2: Semantic Categorization Prompt ───────────────────────────────────────

export function buildCategorizePrompt(
  bankTxs: BankTransaction[],
  availableCategories: string[],
  availableCostCenters: string[]
): string {
  const txSummaries = bankTxs.slice(0, 30).map(toBankSummary);

  return `Categorize as transações bancárias abaixo com base na descrição e tipo.

## Transações Bancárias
${JSON.stringify(txSummaries, null, 2)}

## Categorias Disponíveis
${JSON.stringify(availableCategories)}

## Centros de Custo Disponíveis
${JSON.stringify(availableCostCenters)}

## Regras de Categorização (contexto TBO)
- Folha/salário/pro-labore → "Pessoal" / CC: ADM (ou BU do colaborador se identificável)
- PIX para nomes de pessoas → provavelmente freelancer ou colaborador
- Adobe/Figma/Canva/software → "Tecnologia" / CC: ADM
- Impostos/DAS/ISS → "Impostos" / CC: ADM
- Aluguel/condomínio → "Administrativas" / CC: ADM
- Recebimento de clientes → "Receitas" / CC: BU do projeto
- Tarifa bancária → "Financeira" / CC: ADM
- Colaboradores conhecidos: Lucca/Rafa/Gustavo → MKT | Celso/Nelson → BRD | Eduarda/Mariane → D3D | Marco/Ruy → CORP

Retorne APENAS JSON válido:
{
  "categorizations": [
    {
      "bankTxId": "id",
      "suggestedCategory": "Nome da categoria (da lista acima)",
      "suggestedCostCenter": "Código CC ou null",
      "suggestedType": "receita|despesa|transferencia",
      "confidence": 80,
      "reasoning": "Explicação curta"
    }
  ]
}

IMPORTANTE: Use APENAS categorias da lista fornecida. Se nenhuma se aplica, use a mais próxima e sinalize confiança baixa.`;
}

// ── F3: Anomaly Detection Prompt ────────────────────────────────────────────

export interface AnomalyContext {
  bankTxs: BankTransaction[];
  financeTxs: FinanceTransaction[];
  reconciledCount: number;
  pendingCount: number;
  totalCredit: number;
  totalDebit: number;
}

export function buildAnomalyPrompt(ctx: AnomalyContext): string {
  const bankSummaries = ctx.bankTxs.slice(0, 100).map(toBankSummary);
  const financeSummaries = ctx.financeTxs.slice(0, 100).map((tx) => ({
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    paid_amount: tx.paid_amount,
    type: tx.type,
    status: tx.status,
    description: tx.description,
    counterpart: tx.counterpart,
  }));

  return `Analise as transações abaixo e identifique anomalias financeiras.

## Contexto
- Transações bancárias: ${ctx.bankTxs.length} (crédito total: R$${ctx.totalCredit.toFixed(2)}, débito total: R$${ctx.totalDebit.toFixed(2)})
- Lançamentos internos: ${ctx.financeTxs.length}
- Conciliados: ${ctx.reconciledCount} | Pendentes: ${ctx.pendingCount}

## Transações Bancárias
${JSON.stringify(bankSummaries, null, 2)}

## Lançamentos Internos
${JSON.stringify(financeSummaries, null, 2)}

## Tipos de Anomalia a Detectar
1. **duplicata**: Mesma descrição + valor em datas próximas (possível pagamento duplicado)
2. **valor_atipico**: Valor significativamente fora do padrão (>3x a média para a mesma categoria/descrição)
3. **padrao_irregular**: Quebra de padrão recorrente (ex: salário que sempre é X, mas neste mês é Y)
4. **ausencia**: Pagamento recorrente esperado que não apareceu no período
5. **divergencia**: Valor bancário difere do lançamento interno (possível erro de digitação)

## Severidade
- **info**: Observação, sem ação necessária
- **alerta**: Requer revisão manual
- **critico**: Possível perda financeira, ação imediata

## Health Score
Calcule uma nota de 0 a 100 para a saúde financeira baseada em:
- % de transações conciliadas
- Quantidade de anomalias críticas encontradas
- Divergências de valor

Retorne APENAS JSON válido:
{
  "anomalies": [
    {
      "id": "anomaly-1",
      "severity": "alerta",
      "type": "duplicata",
      "title": "Possível pagamento duplicado",
      "description": "Descrição detalhada da anomalia",
      "affectedTxIds": ["tx-id-1", "tx-id-2"],
      "suggestedAction": "Verificar se ambos os pagamentos são legítimos"
    }
  ],
  "healthScore": 85,
  "summary": "Resumo geral da análise de anomalias"
}

Se não encontrar anomalias, retorne array vazio com healthScore alto.`;
}

// ── F5: Narrative Summary Prompt ────────────────────────────────────────────

export interface SummaryContext {
  periodLabel: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  reconciledPct: number;
  pendingCount: number;
  overdueCount: number;
  overdueAmount: number;
  topCategories: Array<{ name: string; total: number }>;
  topCounterparts: Array<{ name: string; total: number }>;
  recentTxs: Array<{ description: string; amount: number; type: string; date: string }>;
}

export function buildSummaryPrompt(ctx: SummaryContext): string {
  return `Gere um diagnóstico financeiro narrativo para o período: ${ctx.periodLabel}.

## Dados do Período
- Receitas: R$${ctx.totalReceitas.toFixed(2)}
- Despesas: R$${ctx.totalDespesas.toFixed(2)}
- Saldo: R$${ctx.saldo.toFixed(2)}
- Margem: ${ctx.totalReceitas > 0 ? (((ctx.totalReceitas - ctx.totalDespesas) / ctx.totalReceitas) * 100).toFixed(1) : "0"}%
- Conciliação: ${ctx.reconciledPct}% das transações conciliadas
- Pendentes: ${ctx.pendingCount} transações
- Inadimplentes: ${ctx.overdueCount} títulos (R$${ctx.overdueAmount.toFixed(2)})

## Top 5 Categorias de Despesa
${ctx.topCategories.map((c, i) => `${i + 1}. ${c.name}: R$${c.total.toFixed(2)}`).join("\n")}

## Top 5 Contrapartes (Clientes/Fornecedores)
${ctx.topCounterparts.map((c, i) => `${i + 1}. ${c.name}: R$${c.total.toFixed(2)}`).join("\n")}

## Últimas 10 Transações
${ctx.recentTxs.slice(0, 10).map((t) => `- ${t.date} | ${t.type} | R$${t.amount.toFixed(2)} | ${t.description}`).join("\n")}

## Instruções
1. **Diagnóstico**: Parágrafo narrativo (3-5 frases) sobre a situação financeira. Tom profissional e direto. Destaque riscos e oportunidades.
2. **Destaques**: 3-5 bullet points classificados como positivo/atenção/risco.
3. **Ações**: 2-4 ações concretas e acionáveis que o gestor deveria tomar.
4. **Métricas**: Consolidado numérico do período.

Retorne APENAS JSON válido:
{
  "diagnostico": "Texto narrativo do diagnóstico...",
  "destaques": [
    {"tipo": "positivo", "texto": "Receita cresceu 15% vs período anterior"},
    {"tipo": "risco", "texto": "3 títulos vencidos sem cobrança"}
  ],
  "acoes": [
    "Cobrar cliente X — R$15.000 vencido há 12 dias",
    "Revisar contrato Y — margem abaixo de 10%"
  ],
  "metricas": {
    "receitaPeriodo": ${ctx.totalReceitas},
    "despesaPeriodo": ${ctx.totalDespesas},
    "margemPct": ${ctx.totalReceitas > 0 ? (((ctx.totalReceitas - ctx.totalDespesas) / ctx.totalReceitas) * 100) : 0},
    "conciliacaoPct": ${ctx.reconciledPct},
    "inadimplenciaPct": ${ctx.totalReceitas > 0 ? ((ctx.overdueAmount / ctx.totalReceitas) * 100) : 0}
  }
}`;
}
