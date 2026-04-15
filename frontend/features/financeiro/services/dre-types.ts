/**
 * dre-types.ts
 * Types, interfaces, constants and inference functions for the DRE module.
 * Split from finance-accounting.ts for the 300-line limit.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type DreGroup =
  | "receita_bruta"
  | "deducoes"
  | "custo_producao"
  | "despesa_pessoal"
  | "despesa_marketing"
  | "despesa_admin"
  | "despesa_tecnologia"
  | "despesa_financeira"
  | "depreciacao"
  | "impostos_renda"
  | "outros";

export interface ChartOfAccount {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  dre_group: DreGroup;
  dre_order: number;
  tipo: "receita" | "despesa" | "neutro";
  is_active: boolean;
  omie_id: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DRESnapshot {
  id: string;
  tenant_id: string;
  month: string;
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  custo_producao: number;
  lucro_bruto: number;
  desp_pessoal: number;
  desp_marketing: number;
  desp_admin: number;
  desp_tecnologia: number;
  desp_outros: number;
  total_desp_op: number;
  ebitda: number;
  depreciacao: number;
  ebit: number;
  result_financeiro: number;
  lair: number;
  irpj_csll: number;
  lucro_liquido: number;
  meta_receita: number | null;
  meta_ebitda: number | null;
  source: string;
  notes: string | null;
  computed_at: string;
}

export interface DRELine {
  label: string;
  key: keyof DRESnapshot | string;
  value: number;
  indent: number;       // 0 = top-level, 1 = sub-item
  isSubtotal: boolean;
  isTotal: boolean;
  isPositive?: boolean; // undefined = neutral, true = green, false = red
  sign: 1 | -1;        // 1 = add, -1 = subtract in the waterfall
}

export interface DRESummary {
  month: string;
  receitaBruta: number;
  receitaLiquida: number;
  ebitda: number;
  ebitdaMargin: number;
  lucroLiquido: number;
  lucroMargin: number;
  metaReceita: number | null;
  metaEbitda: number | null;
  vsMetaReceita: number | null;  // %
  vsMetaEbitda: number | null;   // %
  snapshot: DRESnapshot;
}

export interface DRETrend {
  month: string;
  receitaBruta: number;
  ebitda: number;
  lucroLiquido: number;
  ebitdaMargin: number;
}

export interface DREComparisonLine {
  label: string;
  key: string;
  current: number;
  previous: number;
  /** Absolute difference: current - previous */
  delta: number;
  /** Percentage change (null if previous = 0) */
  deltaPct: number | null;
  /**
   * Whether the delta direction is favorable.
   * true = good, false = bad, null = neutral (computed subtotals)
   */
  isPositiveDelta: boolean | null;
  /** Highlight when |deltaPct| > 10% */
  isSignificant: boolean;
}

export interface DREComparison {
  currentMonth: string;
  previousMonth: string;
  lines: DREComparisonLine[];
  current: DRESnapshot | null;
  previous: DRESnapshot | null;
}

export interface RawTransaction {
  type: string;
  amount: number;
  paid_amount: number;
  status: string;
  category_id: string | null;
  omie_categoria_codigo: string | null;
}

export interface RawCategory {
  id: string;
  name: string;
  type: string;
}

// ── OMIE categoria_codigo → DRE group mapping ───────────────────────────────
// OMIE uses a hierarchical numeric code: first digit = type (1=receita, 2=despesa).
// Second level = major group. We map the prefix to the DRE bucket.

// Mapping calibrated against TBO's internal budget spreadsheet (Orçamento Agência TBO.xlsx).
// Codes verified against real transaction data from OMIE.
export const OMIE_CODE_DRE_MAP: Array<[string, DreGroup]> = [
  // 1.xx = Receitas (Serviços Prestados, BV, Indicações)
  ["1.", "receita_bruta"],
  // 2.01 = Despesas de Pessoas (salários equipe — ~R$61k/mês)
  ["2.01.", "despesa_pessoal"],
  // 2.02 = Deduções (ISS, PIS, COFINS)
  ["2.02.", "deducoes"],
  // 2.03 = Terceirização / Custo de Produção (freelancers 3D, branding, AV, interiores)
  ["2.03.", "custo_producao"],
  // 2.04 = Despesas Operacionais (contabilidade, BPO, associações, plataformas, INSS, mentoria)
  ["2.04.", "despesa_admin"],
  // 2.05 = Impostos e taxas operacionais
  ["2.05.", "deducoes"],
  // 2.06 = Depreciação e amortização
  ["2.06.", "depreciacao"],
  // 2.07 = Despesas de Vendas (comissão, CRM RD Station, comercial)
  ["2.07.", "despesa_marketing"],
  // 2.08 = Marketing e Comercial (campanhas, agência terceirizada, comissões)
  ["2.08.", "despesa_marketing"],
  // 2.09 = Resultado financeiro (juros, tarifas bancárias)
  ["2.09.", "despesa_financeira"],
  // 2.10 = Resultado financeiro (empréstimos, consórcio)
  ["2.10.", "despesa_financeira"],
  // 2.11+ = Impostos sobre renda (IRPJ, CSLL)
  ["2.11.", "impostos_renda"],
];

export function inferDreGroupFromOmieCode(code: string): DreGroup | null {
  for (const [prefix, group] of OMIE_CODE_DRE_MAP) {
    if (code.startsWith(prefix)) return group;
  }
  return null;
}

// Fallback: category name → DRE group (for transactions without omie_categoria_codigo)
// Keywords matched against normalized category name (lowercase, underscored).
// Calibrated against real TBO category names from OMIE:
//   (-) Custos - Mão de Obra, (-) Pessoal - Pró-Labore, (-) Impostos - Simples Nacional,
//   (-) Financeira - Tarifas Bancárias, (-) Administrativas - ..., (+) Receitas - ...
export const CATEGORY_DRE_MAP: Record<string, DreGroup> = {
  // receitas (todas as (+) Receitas - ...)
  "receitas": "receita_bruta", "receita": "receita_bruta",
  "conta_a_receber": "receita_bruta",
  // deduções
  "impostos": "deducoes", "simples_nacional": "deducoes",
  "iss": "deducoes", "pis_cofins": "deducoes",
  // custo de produção (mão de obra = freelancers + fixa alocada em projetos)
  "mao_de_obra": "custo_producao", "freelancer": "custo_producao",
  "custos_-_mao": "custo_producao",
  // pessoal (pró-labore, INSS, benefícios)
  "pro-labore": "despesa_pessoal", "pro_labore": "despesa_pessoal",
  "inss": "despesa_pessoal", "irrf": "despesa_pessoal",
  "pessoal": "despesa_pessoal", "folha": "despesa_pessoal",
  "beneficios": "despesa_pessoal", "encargos": "despesa_pessoal",
  // marketing / comercial
  "comercial": "despesa_marketing", "marketing": "despesa_marketing",
  "midia": "despesa_marketing",
  // admin
  "administrativas": "despesa_admin", "administrativo": "despesa_admin",
  "sindicatos": "despesa_admin", "associacoes": "despesa_admin",
  "contabilidade": "despesa_admin", "bpo": "despesa_admin",
  "consultorias": "despesa_admin", "mentoria": "despesa_admin",
  "software": "despesa_admin", "assinaturas": "despesa_admin",
  "juridico": "despesa_admin", "aluguel": "despesa_admin",
  "servicos_terceiros": "despesa_admin",
  "conta_a_pagar": "despesa_admin", "outros_custos": "despesa_admin",
  "outros": "despesa_admin",
  // financeiro
  "tarifas_bancarias": "despesa_financeira", "tarifas": "despesa_financeira",
  "juros": "despesa_financeira", "emprestimo": "despesa_financeira",
  "financiamento": "despesa_financeira", "parcelamentos": "despesa_financeira",
  "consorcios": "despesa_financeira", "investimento": "despesa_financeira",
  "financeira": "despesa_financeira",
};

export function inferDreGroupFromName(categoryName: string): DreGroup {
  const lower = categoryName.toLowerCase().replace(/\s+/g, "_");
  for (const [key, group] of Object.entries(CATEGORY_DRE_MAP)) {
    if (lower.includes(key)) return group;
  }
  return "outros";
}

/** Numeric DRE keys in waterfall order */
export const DRE_NUMERIC_KEYS: Array<keyof DRESnapshot> = [
  "receita_bruta", "deducoes", "receita_liquida", "custo_producao",
  "lucro_bruto", "desp_pessoal", "desp_marketing", "desp_admin",
  "desp_tecnologia", "desp_outros", "total_desp_op", "ebitda",
  "depreciacao", "ebit", "result_financeiro", "lair", "irpj_csll", "lucro_liquido",
];

export const DRE_LABEL_MAP: Record<string, string> = {
  receita_bruta: "Receita Bruta",
  deducoes: "(-) Deduções",
  receita_liquida: "(=) Receita Líquida",
  custo_producao: "(-) Custo de Produção",
  lucro_bruto: "(=) Lucro Bruto",
  desp_pessoal: "(-) Despesas com Pessoal",
  desp_marketing: "(-) Despesas de Marketing",
  desp_admin: "(-) Despesas Administrativas",
  desp_tecnologia: "(-) Despesas com Tecnologia",
  desp_outros: "(-) Outras Despesas",
  total_desp_op: "(=) Total Despesas Op.",
  ebitda: "(=) EBITDA",
  depreciacao: "(-) Depreciação",
  ebit: "(=) EBIT",
  result_financeiro: "Resultado Financeiro",
  lair: "(=) LAIR",
  irpj_csll: "(-) IRPJ + CSLL",
  lucro_liquido: "(=) Lucro Líquido",
};

// Lines where a positive delta is favorable (revenue/profit)
export const REVENUE_KEYS = new Set([
  "receita_bruta", "receita_liquida", "lucro_bruto", "ebitda",
  "ebit", "result_financeiro", "lair", "lucro_liquido",
]);
// Lines where a negative delta is favorable (expenses — lower is better)
export const EXPENSE_KEYS = new Set([
  "deducoes", "custo_producao", "desp_pessoal", "desp_marketing",
  "desp_admin", "desp_tecnologia", "desp_outros", "total_desp_op",
  "depreciacao", "irpj_csll",
]);
