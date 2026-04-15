/**
 * auto-categorize-mappings.ts
 * Data mappings, constants, and CC inference functions for auto-categorization.
 * Split from auto-categorize.ts for the 300-line limit.
 */

import type { FinanceCostCenter } from "./finance-types";
import { normalize, normalizeAggressive, stripOmiePrefix } from "./auto-categorize-helpers";

// ── Category prefix → Cost Center code mapping ───────────────────────────
// CCs = BUs da TBO: BRD, D3D, MKT, AV, INT + ADM (overhead) + CORP
// Despesas de pessoal são alocadas por BU quando possível (ex: Lucca/Rafa → MKT).
// Custos genéricos (impostos, financeiro, admin) → ADM.

export const CATEGORY_PREFIX_TO_CC: Array<{ prefixes: string[]; ccCode: string }> = [
  // Administrativas, Serviços Terceiros, Outros → ADM
  { prefixes: ["administrativas", "servicos terceiros", "serviços terceiros", "outros custos"], ccCode: "ADM" },
  // Impostos → ADM
  { prefixes: ["impostos"], ccCode: "ADM" },
  // Financeira → ADM
  { prefixes: ["financeira", "atividade de financiamento"], ccCode: "ADM" },
  // Pessoal → ADM (default; overridden by counterpart-based rules below)
  { prefixes: ["pessoal"], ccCode: "ADM" },
  // Custos - Comercial → MKT (comercial é parte do marketing na TBO)
  { prefixes: ["custos - comercial", "custos comercial"], ccCode: "MKT" },
  // Custos de produção (freelancers, fornecedores) → inferido por BU keywords abaixo
  { prefixes: ["custos - mao de obra", "custos mao de obra", "custos - fornecedor", "custos fornecedor"], ccCode: "ADM" },
  // Custos genéricos → ADM
  { prefixes: ["custos"], ccCode: "ADM" },
  // Marketing
  { prefixes: ["marketing", "midia"], ccCode: "MKT" },
  // Tecnologia / Software → ADM (overhead)
  { prefixes: ["tecnologia", "software", "hosting"], ccCode: "ADM" },
  // Receitas → inferido por BU keywords abaixo
  { prefixes: ["receitas"], ccCode: "ADM" },
];

// ── Counterpart → CC (despesas de pessoal por BU) ───────────────────────
// Colaboradores conhecidos da TBO e suas BUs

export const COUNTERPART_CC_MAP: Array<{ patterns: string[]; ccCode: string }> = [
  // Marketing / Comercial
  { patterns: ["lucca", "lucca nonato"], ccCode: "MKT" },
  { patterns: ["rafaela oltramari"], ccCode: "MKT" },
  { patterns: ["gustavo henrique bientinez", "gustavo bientinez"], ccCode: "MKT" },
  { patterns: ["m&n performance", "m&n"], ccCode: "MKT" },
  // Branding
  { patterns: ["celso fernando"], ccCode: "BRD" },
  { patterns: ["nelson mozart"], ccCode: "BRD" },
  // Digital 3D
  { patterns: ["arqfreelas", "nathalia"], ccCode: "D3D" },
  { patterns: ["eduarda monique"], ccCode: "D3D" },
  { patterns: ["mariane borges"], ccCode: "D3D" },
  { patterns: ["lucio tiago", "maurilo torres"], ccCode: "D3D" },
  // Corporativo (sócios)
  { patterns: ["marco andolfato"], ccCode: "CORP" },
  { patterns: ["ruy luiz"], ccCode: "CORP" },
];

// ── Keyword fallback rules ─────────────────────────────────────────────────
// For manual transactions that don't follow OMIE naming

export interface FallbackRule {
  keywords: string[];
  categorySearch: string;
  ccCode: string | null;
}

export const FALLBACK_RULES: FallbackRule[] = [
  // Pessoal
  { keywords: ["salario", "salarios", "folha", "holerite", "pro labore"], categorySearch: "pessoal", ccCode: "ADM" },
  { keywords: ["inss", "fgts", "encargo"], categorySearch: "pessoal", ccCode: "ADM" },
  { keywords: ["vale transporte", "vale refeicao", "vale alimentacao", "beneficio", "plano saude", "unimed"], categorySearch: "pessoal", ccCode: "ADM" },
  // Freelancer / Produção
  { keywords: ["freelancer", "freela", "terceirizado"], categorySearch: "custos - mao de obra", ccCode: "ADM" },
  // Administrativo
  { keywords: ["contabilidade", "contador", "bpo"], categorySearch: "servicos terceiros - contabilidade", ccCode: "ADM" },
  { keywords: ["aluguel", "condominio", "iptu"], categorySearch: "administrativas", ccCode: "ADM" },
  // Financeiro
  { keywords: ["tarifa bancaria", "tarifas bancarias"], categorySearch: "financeira - tarifas", ccCode: "ADM" },
  { keywords: ["juros", "multa bancaria"], categorySearch: "financeira - juros", ccCode: "ADM" },
  { keywords: ["emprestimo", "financiamento", "consorcio"], categorySearch: "financiamento", ccCode: "ADM" },
  // Impostos
  { keywords: ["simples nacional", "das", "iss", "pis", "cofins"], categorySearch: "impostos", ccCode: "ADM" },
  // Comercial → MKT (na TBO, comercial é parte do marketing)
  { keywords: ["comissao", "comercial"], categorySearch: "custos - comercial", ccCode: "MKT" },
  // Software → ADM (overhead)
  { keywords: ["adobe", "figma", "canva", "notion", "slack", "google workspace", "software", "licenca"], categorySearch: "tecnologia", ccCode: "ADM" },
];

// ── BU → Cost Center ─────────────────────────────────────────────────────

export const BU_TO_CC: Record<string, string> = {
  branding: "BRD",
  "digital 3d": "D3D",
  marketing: "MKT",
  audiovisual: "AV",
  interiores: "INT",
};

// ── BU Keywords → CC (for description-based inference) ───────────────────

export const BU_KEYWORDS_CC: Array<{ keywords: string[]; ccCode: string }> = [
  { keywords: ["branding", "marca", "identidade visual", "logo", "naming"], ccCode: "BRD" },
  { keywords: ["3d", "render", "maquete", "modelagem", "vray", "lumion", "archviz", "planta humanizada"], ccCode: "D3D" },
  { keywords: ["marketing", "social", "redes sociais", "conteudo", "seo", "performance", "trafego", "midia"], ccCode: "MKT" },
  { keywords: ["audiovisual", "video", "filmagem", "edicao", "motion", "animacao", "som", "audio", "drone", "camera"], ccCode: "AV" },
  { keywords: ["interiores", "interior", "arquitetura", "decoracao", "mobiliario", "fachada"], ccCode: "INT" },
];

// ── CC inference functions ─────────────────────────────────────────────────

export function inferCCFromCategoryName(
  categoryName: string,
  costCenters: FinanceCostCenter[]
): FinanceCostCenter | null {
  const stripped = normalize(stripOmiePrefix(categoryName));
  const strippedAgg = normalizeAggressive(stripOmiePrefix(categoryName));

  for (const { prefixes, ccCode } of CATEGORY_PREFIX_TO_CC) {
    const matches = prefixes.some(
      (p) => stripped.startsWith(normalize(p)) || strippedAgg.startsWith(normalizeAggressive(p))
    );
    if (matches) {
      return costCenters.find((cc) => cc.code === ccCode) ?? null;
    }
  }

  return null;
}

/**
 * Infer cost center directly from transaction description prefix.
 * Handles cases where no category match was found but the description
 * still contains recognizable OMIE prefixes like "(-) Pessoal", "(-) Administrativas".
 */
export function inferCCFromDescription(
  description: string,
  costCenters: FinanceCostCenter[]
): FinanceCostCenter | null {
  const stripped = normalize(stripOmiePrefix(description));
  const strippedAgg = normalizeAggressive(stripOmiePrefix(description));

  for (const { prefixes, ccCode } of CATEGORY_PREFIX_TO_CC) {
    const matches = prefixes.some(
      (p) => stripped.startsWith(normalize(p)) || strippedAgg.startsWith(normalizeAggressive(p))
    );
    if (matches) {
      return costCenters.find((cc) => cc.code === ccCode) ?? null;
    }
  }

  return null;
}

export function inferCCFromBusinessUnit(
  businessUnit: string | null,
  costCenters: FinanceCostCenter[]
): FinanceCostCenter | null {
  if (!businessUnit) return null;
  const ccCode = BU_TO_CC[normalize(businessUnit)];
  if (!ccCode) return null;
  return costCenters.find((cc) => cc.code === ccCode) ?? null;
}
