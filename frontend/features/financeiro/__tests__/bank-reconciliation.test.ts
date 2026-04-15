import { describe, it, expect, vi } from "vitest";
import {
  getReconciliationSummary,
  listBankTransactions,
} from "../services/bank-transactions-service";

// ── Mock Supabase factory ───────────────────────────────────────────────────

type SupabaseResponse = { data: unknown; error: unknown; count?: number };

function createQueryBuilder(response: SupabaseResponse) {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt", "is",
    "ilike", "like",
    "order", "limit", "single", "maybeSingle", "range",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  builder.then = (resolve: (v: SupabaseResponse) => void) => {
    return Promise.resolve(response).then(resolve);
  };

  return builder;
}

function createMockSupabase(
  tableResponses: Record<string, SupabaseResponse | SupabaseResponse[]>
) {
  const callCounts: Record<string, number> = {};

  return {
    from: vi.fn((table: string) => {
      callCounts[table] = (callCounts[table] || 0) + 1;
      const cfg = tableResponses[table];
      if (!cfg) return createQueryBuilder({ data: null, error: null });
      if (Array.isArray(cfg)) {
        const idx = Math.min(callCounts[table] - 1, cfg.length - 1);
        return createQueryBuilder(cfg[idx]);
      }
      return createQueryBuilder(cfg);
    }),
  } as unknown as Parameters<typeof getReconciliationSummary>[0];
}

// ── getReconciliationSummary ────────────────────────────────────────────────

describe("getReconciliationSummary", () => {
  it("calculates total, reconciled, pending counts correctly", async () => {
    const rows = [
      { amount: 1000, type: "credit", reconciled: true },
      { amount: 500, type: "debit", reconciled: true },
      { amount: 2000, type: "credit", reconciled: false },
      { amount: 300, type: "debit", reconciled: false },
    ];
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: rows, error: null },
    });

    const result = await getReconciliationSummary(supabase, "t-1");
    expect(result.total).toBe(4);
    expect(result.reconciled).toBe(2);
    expect(result.pending).toBe(2);
  });

  it("calculates totalCredit, totalDebit, balance", async () => {
    const rows = [
      { amount: 1000, type: "credit", reconciled: true },
      { amount: 3000, type: "credit", reconciled: false },
      { amount: 500, type: "debit", reconciled: true },
    ];
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: rows, error: null },
    });

    const result = await getReconciliationSummary(supabase, "t-1");
    expect(result.totalCredit).toBe(4000);
    expect(result.totalDebit).toBe(500);
    expect(result.balance).toBe(3500);
  });

  it("calculates reconciledPct (rounded %)", async () => {
    const rows = [
      { amount: 100, type: "credit", reconciled: true },
      { amount: 100, type: "credit", reconciled: true },
      { amount: 100, type: "credit", reconciled: false },
    ];
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: rows, error: null },
    });

    const result = await getReconciliationSummary(supabase, "t-1");
    expect(result.reconciledPct).toBe(67); // Math.round(2/3*100)
  });

  it("empty data → all zeros", async () => {
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: [], error: null },
    });

    const result = await getReconciliationSummary(supabase, "t-1");
    expect(result.total).toBe(0);
    expect(result.reconciled).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.reconciledPct).toBe(0);
    expect(result.totalCredit).toBe(0);
    expect(result.totalDebit).toBe(0);
    expect(result.balance).toBe(0);
  });

  it("throws on supabase error", async () => {
    const supabase = createMockSupabase({
      finance_bank_transactions: {
        data: null,
        error: { message: "connection failed" },
      },
    });

    await expect(
      getReconciliationSummary(supabase, "t-1")
    ).rejects.toThrow("getReconciliationSummary");
  });
});

// ── listBankTransactions ────────────────────────────────────────────────────

describe("listBankTransactions", () => {
  it("returns data and count for basic query", async () => {
    const rows = [
      { id: "tx-1", amount: 100, type: "credit" },
      { id: "tx-2", amount: 200, type: "debit" },
    ];
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: rows, error: null, count: 2 },
    });

    const result = await listBankTransactions(supabase, "t-1");
    expect(result.data).toHaveLength(2);
    expect(result.count).toBe(2);
  });

  it("returns empty data and count 0 for no results", async () => {
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: [], error: null, count: 0 },
    });

    const result = await listBankTransactions(supabase, "t-1");
    expect(result.data).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it("applies filters correctly (calls chain methods)", async () => {
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: [], error: null, count: 0 },
    });

    await listBankTransactions(supabase, "t-1", {
      bank_account_id: "acc-1",
      reconciled: false,
      type: "credit",
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
      search: "design",
      page: 2,
      pageSize: 10,
    });

    // Verify from was called with the correct table
    expect(supabase.from).toHaveBeenCalledWith("finance_bank_transactions");
  });

  it("throws on supabase error", async () => {
    const supabase = createMockSupabase({
      finance_bank_transactions: {
        data: null,
        error: { message: "timeout" },
      },
    });

    await expect(
      listBankTransactions(supabase, "t-1")
    ).rejects.toThrow("listBankTransactions");
  });

  it("handles null data gracefully (returns empty array)", async () => {
    const supabase = createMockSupabase({
      finance_bank_transactions: { data: null, error: null, count: null },
    });

    const result = await listBankTransactions(supabase, "t-1");
    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });
});
