/**
 * dre-builder.ts
 * Pure functions that build DRE structures from raw data.
 * Split from finance-accounting.ts for the 300-line limit.
 */

import type {
  DreGroup,
  DRESnapshot,
  DRELine,
  DRESummary,
  RawTransaction,
  RawCategory,
} from "./dre-types";
import {
  inferDreGroupFromOmieCode,
  inferDreGroupFromName,
} from "./dre-types";

// ── Build DRE from transactions ───────────────────────────────────────────────

export function buildDREFromTransactions(
  transactions: RawTransaction[],
  categories: RawCategory[],
  payrollTotal: number,
  month: string
): Omit<DRESnapshot, "id" | "tenant_id" | "computed_at" | "meta_receita" | "meta_ebitda" | "source" | "notes" | "updated_at" | "created_at"> {
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const buckets: Record<DreGroup, number> = {
    receita_bruta: 0,
    deducoes: 0,
    custo_producao: 0,
    despesa_pessoal: payrollTotal,
    despesa_marketing: 0,
    despesa_admin: 0,
    despesa_tecnologia: 0,
    despesa_financeira: 0,
    depreciacao: 0,
    impostos_renda: 0,
    outros: 0,
  };

  for (const tx of transactions) {
    if (!["pago", "liquidado", "provisionado"].includes(tx.status)) continue;
    const val = tx.paid_amount || tx.amount || 0;
    if (val <= 0) continue;

    // Priority: 1) OMIE category code  2) category name  3) tx type fallback
    const omieGroup = tx.omie_categoria_codigo
      ? inferDreGroupFromOmieCode(tx.omie_categoria_codigo)
      : null;
    const cat = tx.category_id ? catMap.get(tx.category_id) : null;
    const group = omieGroup
      ?? (cat ? inferDreGroupFromName(cat.name) : null)
      ?? (tx.type === "receita" ? "receita_bruta" : "outros");

    buckets[group] += val;
  }

  const receita_bruta = buckets.receita_bruta;
  const deducoes = buckets.deducoes;
  const receita_liquida = receita_bruta - deducoes;
  const custo_producao = buckets.custo_producao;
  const lucro_bruto = receita_liquida - custo_producao;
  const desp_pessoal = buckets.despesa_pessoal;
  const desp_marketing = buckets.despesa_marketing;
  const desp_admin = buckets.despesa_admin;
  const desp_tecnologia = buckets.despesa_tecnologia;
  const desp_outros = buckets.outros;
  const total_desp_op = desp_pessoal + desp_marketing + desp_admin + desp_tecnologia + desp_outros;
  const ebitda = lucro_bruto - total_desp_op;
  const depreciacao = buckets.depreciacao;
  const ebit = ebitda - depreciacao;
  const result_financeiro = -buckets.despesa_financeira;
  const lair = ebit + result_financeiro;
  const irpj_csll = buckets.impostos_renda;
  const lucro_liquido = lair - irpj_csll;

  return {
    month,
    receita_bruta,
    deducoes,
    receita_liquida,
    custo_producao,
    lucro_bruto,
    desp_pessoal,
    desp_marketing,
    desp_admin,
    desp_tecnologia,
    desp_outros,
    total_desp_op,
    ebitda,
    depreciacao,
    ebit,
    result_financeiro,
    lair,
    irpj_csll,
    lucro_liquido,
  };
}

// ── DRE lines builder ─────────────────────────────────────────────────────────

export function buildDRELines(snap: DRESnapshot): DRELine[] {
  const v = (n: number) => n;
  return [
    { label: "Receita Bruta de Serviços", key: "receita_bruta", value: v(snap.receita_bruta), indent: 0, isSubtotal: false, isTotal: false, isPositive: true, sign: 1 },
    { label: "(-) Deduções e Impostos s/ Receita", key: "deducoes", value: v(snap.deducoes), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(=) Receita Líquida", key: "receita_liquida", value: v(snap.receita_liquida), indent: 0, isSubtotal: true, isTotal: false, isPositive: snap.receita_liquida >= 0, sign: 1 },
    { label: "(-) Custos de Produção", key: "custo_producao", value: v(snap.custo_producao), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(=) Lucro Bruto", key: "lucro_bruto", value: v(snap.lucro_bruto), indent: 0, isSubtotal: true, isTotal: false, isPositive: snap.lucro_bruto >= 0, sign: 1 },
    { label: "(-) Despesas com Pessoal", key: "desp_pessoal", value: v(snap.desp_pessoal), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(-) Despesas de Marketing", key: "desp_marketing", value: v(snap.desp_marketing), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(-) Despesas Administrativas", key: "desp_admin", value: v(snap.desp_admin), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(-) Despesas com Tecnologia", key: "desp_tecnologia", value: v(snap.desp_tecnologia), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(-) Outras Despesas Operacionais", key: "desp_outros", value: v(snap.desp_outros), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(=) EBITDA", key: "ebitda", value: v(snap.ebitda), indent: 0, isSubtotal: true, isTotal: false, isPositive: snap.ebitda >= 0, sign: 1 },
    { label: "(-) Depreciação e Amortização", key: "depreciacao", value: v(snap.depreciacao), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(=) EBIT (Resultado Operacional)", key: "ebit", value: v(snap.ebit), indent: 0, isSubtotal: true, isTotal: false, isPositive: snap.ebit >= 0, sign: 1 },
    { label: "(+/-) Resultado Financeiro", key: "result_financeiro", value: v(snap.result_financeiro), indent: 1, isSubtotal: false, isTotal: false, isPositive: snap.result_financeiro >= 0, sign: 1 },
    { label: "(=) LAIR (Lucro Antes do IR)", key: "lair", value: v(snap.lair), indent: 0, isSubtotal: true, isTotal: false, isPositive: snap.lair >= 0, sign: 1 },
    { label: "(-) IRPJ + CSLL", key: "irpj_csll", value: v(snap.irpj_csll), indent: 1, isSubtotal: false, isTotal: false, isPositive: false, sign: -1 },
    { label: "(=) Lucro Líquido", key: "lucro_liquido", value: v(snap.lucro_liquido), indent: 0, isSubtotal: false, isTotal: true, isPositive: snap.lucro_liquido >= 0, sign: 1 },
  ];
}

// ── DRE Summary builder ─────────────────────────────────────────────────────

export function buildDRESummary(snap: DRESnapshot): DRESummary {
  const ebitdaMargin = snap.receita_bruta > 0 ? (snap.ebitda / snap.receita_bruta) * 100 : 0;
  const lucroMargin = snap.receita_bruta > 0 ? (snap.lucro_liquido / snap.receita_bruta) * 100 : 0;
  const vsMetaReceita = snap.meta_receita && snap.meta_receita > 0
    ? ((snap.receita_bruta - snap.meta_receita) / snap.meta_receita) * 100
    : null;
  const vsMetaEbitda = snap.meta_ebitda && snap.meta_ebitda !== 0
    ? ((snap.ebitda - snap.meta_ebitda) / Math.abs(snap.meta_ebitda)) * 100
    : null;

  return {
    month: snap.month,
    receitaBruta: snap.receita_bruta,
    receitaLiquida: snap.receita_liquida,
    ebitda: snap.ebitda,
    ebitdaMargin,
    lucroLiquido: snap.lucro_liquido,
    lucroMargin,
    metaReceita: snap.meta_receita,
    metaEbitda: snap.meta_ebitda,
    vsMetaReceita,
    vsMetaEbitda,
    snapshot: snap,
  };
}
