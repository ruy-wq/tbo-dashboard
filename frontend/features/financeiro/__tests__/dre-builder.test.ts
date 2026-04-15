import { describe, it, expect } from "vitest";
import {
  buildDREFromTransactions,
  buildDRELines,
  buildDRESummary,
} from "../services/dre-builder";
import type {
  DRESnapshot,
  RawTransaction,
  RawCategory,
} from "../services/dre-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTx(
  overrides: Partial<RawTransaction> = {}
): RawTransaction {
  return {
    type: "receita",
    amount: 1000,
    paid_amount: 0,
    status: "pago",
    category_id: null,
    omie_categoria_codigo: null,
    ...overrides,
  };
}

function makeSnapshot(
  overrides: Partial<DRESnapshot> = {}
): DRESnapshot {
  return {
    id: "snap-1",
    tenant_id: "t-1",
    month: "2026-03",
    receita_bruta: 100000,
    deducoes: 5000,
    receita_liquida: 95000,
    custo_producao: 20000,
    lucro_bruto: 75000,
    desp_pessoal: 30000,
    desp_marketing: 5000,
    desp_admin: 10000,
    desp_tecnologia: 3000,
    desp_outros: 2000,
    total_desp_op: 50000,
    ebitda: 25000,
    depreciacao: 1000,
    ebit: 24000,
    result_financeiro: -500,
    lair: 23500,
    irpj_csll: 3000,
    lucro_liquido: 20500,
    meta_receita: 120000,
    meta_ebitda: 30000,
    source: "computed",
    notes: null,
    computed_at: "2026-03-15T00:00:00Z",
    ...overrides,
  };
}

// ── buildDREFromTransactions ─────────────────────────────────────────────────

describe("buildDREFromTransactions", () => {
  it("routes receita transactions to receita_bruta bucket", () => {
    const txs = [makeTx({ type: "receita", amount: 5000, status: "pago" })];
    const result = buildDREFromTransactions(txs, [], 0, "2026-03");
    expect(result.receita_bruta).toBe(5000);
  });

  it("routes despesa to correct DRE group via OMIE code (priority 1)", () => {
    const txs = [
      makeTx({ type: "despesa", amount: 3000, status: "pago", omie_categoria_codigo: "2.07.001" }),
    ];
    const result = buildDREFromTransactions(txs, [], 0, "2026-03");
    expect(result.desp_marketing).toBe(3000);
  });

  it("routes despesa to correct DRE group via category name (priority 2)", () => {
    const cats: RawCategory[] = [{ id: "cat-1", name: "Marketing Digital", type: "despesa" }];
    const txs = [
      makeTx({ type: "despesa", amount: 2000, status: "pago", category_id: "cat-1" }),
    ];
    const result = buildDREFromTransactions(txs, cats, 0, "2026-03");
    expect(result.desp_marketing).toBe(2000);
  });

  it("falls back to 'outros' when no category match for despesa", () => {
    const txs = [makeTx({ type: "despesa", amount: 1500, status: "liquidado" })];
    const result = buildDREFromTransactions(txs, [], 0, "2026-03");
    expect(result.desp_outros).toBe(1500);
  });

  it("only includes transactions with status pago/liquidado/provisionado", () => {
    const txs = [
      makeTx({ type: "receita", amount: 1000, status: "pago" }),
      makeTx({ type: "receita", amount: 2000, status: "cancelado" }),
      makeTx({ type: "receita", amount: 3000, status: "pendente" }),
      makeTx({ type: "receita", amount: 4000, status: "liquidado" }),
      makeTx({ type: "receita", amount: 5000, status: "provisionado" }),
    ];
    const result = buildDREFromTransactions(txs, [], 0, "2026-03");
    expect(result.receita_bruta).toBe(1000 + 4000 + 5000);
  });

  it("uses paid_amount with fallback to amount", () => {
    const txs = [
      makeTx({ type: "receita", amount: 1000, paid_amount: 900, status: "pago" }),
      makeTx({ type: "receita", amount: 2000, paid_amount: 0, status: "pago" }),
    ];
    const result = buildDREFromTransactions(txs, [], 0, "2026-03");
    // paid_amount is truthy (900) for first, falsy (0) for second → falls back to amount (2000)
    expect(result.receita_bruta).toBe(900 + 2000);
  });

  it("adds payrollTotal to despesa_pessoal bucket", () => {
    const result = buildDREFromTransactions([], [], 45000, "2026-03");
    expect(result.desp_pessoal).toBe(45000);
  });

  it("calculates derived fields correctly", () => {
    const txs = [
      makeTx({ type: "receita", amount: 100000, status: "pago" }),
      makeTx({ type: "despesa", amount: 5000, status: "pago", omie_categoria_codigo: "2.02.001" }), // deducoes
      makeTx({ type: "despesa", amount: 10000, status: "pago", omie_categoria_codigo: "2.03.001" }), // custo_producao
    ];
    const result = buildDREFromTransactions(txs, [], 20000, "2026-03");

    expect(result.receita_liquida).toBe(100000 - 5000);
    expect(result.lucro_bruto).toBe(95000 - 10000);
    expect(result.ebitda).toBe(85000 - 20000); // lucro_bruto - total_desp_op (only pessoal=20000)
  });

  it("empty transactions → all zeros except payroll", () => {
    const result = buildDREFromTransactions([], [], 0, "2026-03");
    expect(result.receita_bruta).toBe(0);
    expect(result.deducoes).toBe(0);
    expect(result.lucro_liquido).toBe(0);
    expect(result.month).toBe("2026-03");
  });
});

// ── buildDRELines ────────────────────────────────────────────────────────────

describe("buildDRELines", () => {
  it("returns 17 lines in correct DRE waterfall order", () => {
    const lines = buildDRELines(makeSnapshot());
    expect(lines).toHaveLength(17);
    expect(lines[0].key).toBe("receita_bruta");
    expect(lines[16].key).toBe("lucro_liquido");
  });

  it("marks subtotals and totals correctly", () => {
    const lines = buildDRELines(makeSnapshot());
    const subtotals = lines.filter((l) => l.isSubtotal);
    const totals = lines.filter((l) => l.isTotal);
    expect(subtotals.length).toBeGreaterThanOrEqual(4); // receita_liquida, lucro_bruto, ebitda, ebit, lair
    expect(totals.length).toBe(1); // lucro_liquido
    expect(totals[0].key).toBe("lucro_liquido");
  });

  it("sets isPositive based on sign of computed values", () => {
    const snap = makeSnapshot({ ebitda: -5000 });
    const lines = buildDRELines(snap);
    const ebitdaLine = lines.find((l) => l.key === "ebitda");
    expect(ebitdaLine?.isPositive).toBe(false);
  });
});

// ── buildDRESummary ──────────────────────────────────────────────────────────

describe("buildDRESummary", () => {
  it("calculates EBITDA margin correctly", () => {
    const summary = buildDRESummary(makeSnapshot());
    expect(summary.ebitdaMargin).toBeCloseTo((25000 / 100000) * 100, 2);
  });

  it("handles zero receita_bruta (no division by zero)", () => {
    const summary = buildDRESummary(makeSnapshot({ receita_bruta: 0 }));
    expect(summary.ebitdaMargin).toBe(0);
    expect(summary.lucroMargin).toBe(0);
  });

  it("calculates vsMetaReceita / vsMetaEbitda percentages", () => {
    const summary = buildDRESummary(makeSnapshot());
    // vsMetaReceita = ((100000 - 120000) / 120000) * 100
    expect(summary.vsMetaReceita).toBeCloseTo(-16.6667, 2);
    // vsMetaEbitda = ((25000 - 30000) / 30000) * 100
    expect(summary.vsMetaEbitda).toBeCloseTo(-16.6667, 2);
  });

  it("returns null for vs meta when meta is null", () => {
    const summary = buildDRESummary(makeSnapshot({ meta_receita: null, meta_ebitda: null }));
    expect(summary.vsMetaReceita).toBeNull();
    expect(summary.vsMetaEbitda).toBeNull();
  });

  it("returns null for vs meta when meta is 0", () => {
    const summary = buildDRESummary(makeSnapshot({ meta_receita: 0, meta_ebitda: 0 }));
    expect(summary.vsMetaReceita).toBeNull();
    expect(summary.vsMetaEbitda).toBeNull();
  });
});
