"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  getFinanceTransactions,
  getFinanceCategories,
  getFinanceCostCenters,
  getFinanceSnapshots,
  getFinanceStatus,
  getFinanceStatusWithAmounts,
  getFounderKPIs,
  getFinanceAging,
  getFinanceCashFlowProjection,
  getFinanceChartData,
  triggerFinanceSync,
  getRevenueConcentrationByClient,
  getOverdueEntries,
  getPayrollBreakdown,
  getBankStatements,
  getBankStatementCashFlow,
  getLatestBankStatementBalance,
  createFinanceTransaction,
  updateFinanceTransaction,
  deleteFinanceTransaction,
  type FinanceTransaction,
  type FinanceCategory,
  type FinanceCostCenter,
  type FinanceSnapshot,
  type FinanceStatus,
  type FinanceStatusWithAmounts,
  type FinanceFilters,
  type FounderKPIs,
  type FinanceAgingData,
  type CashFlowPoint,
  type RevenueConcentrationData,
  type OverdueEntriesData,
  type PayrollBreakdownData,
  type BankStatement,
  type BankStatementFilters,
} from "@/features/financeiro/services";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/features/financeiro/services/finance-schemas";
import {
  batchAutoCategorize,
} from "@/features/financeiro/services/auto-categorize";
import type { Database } from "@/lib/supabase/types";

type TransactionUpdate = Database["public"]["Tables"]["finance_transactions"]["Update"];

// ── Transactions ──────────────────────────────────────────────────────────────

export function useFinanceTransactions(filters: FinanceFilters = {}) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  // Stable key from filters
  const filterKey = JSON.stringify(filters);

  const query = useQuery<{ data: FinanceTransaction[]; count: number }>({
    queryKey: ["finance-transactions", tenantId, filterKey],
    queryFn: async () => {
      if (!tenantId) return { data: [], count: 0 };
      const supabase = createClient();
      return getFinanceTransactions(supabase, filters);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 30,
  });

  // Realtime subscription — invalidate on any change
  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`finance-tx-realtime:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "finance_transactions",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          qc.invalidateQueries({
            queryKey: ["finance-transactions", tenantId],
          });
          // Also refresh status when transactions change
          qc.invalidateQueries({
            queryKey: ["finance-status", tenantId],
          });
          qc.invalidateQueries({
            queryKey: ["finance-status-amounts", tenantId],
          });
          // Keep founder KPIs and snapshots in sync
          qc.invalidateQueries({
            queryKey: ["finance-founder-kpis", tenantId],
          });
          qc.invalidateQueries({
            queryKey: ["finance-snapshots", tenantId],
          });
          qc.invalidateQueries({
            queryKey: ["finance-aging", tenantId],
          });
          qc.invalidateQueries({
            queryKey: ["finance-cashflow-projection", tenantId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, qc]);

  return query;
}

// ── Categories ────────────────────────────────────────────────────────────────

export function useFinanceCategories() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<FinanceCategory[]>({
    queryKey: ["finance-categories", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      return getFinanceCategories(supabase);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // Categories rarely change
  });
}

// ── Cost Centers ──────────────────────────────────────────────────────────────

export function useFinanceCostCenters() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<FinanceCostCenter[]>({
    queryKey: ["finance-cost-centers", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      return getFinanceCostCenters(supabase);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Snapshots (for charts) ────────────────────────────────────────────────────

export function useFinanceSnapshots(days = 30) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<FinanceSnapshot[]>({
    queryKey: ["finance-snapshots", tenantId, days],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      return getFinanceSnapshots(supabase, days);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10,
  });
}

// ── Status ────────────────────────────────────────────────────────────────────

export function useFinanceStatus() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<FinanceStatus>({
    queryKey: ["finance-status", tenantId],
    queryFn: async () => {
      if (!tenantId)
        return {
          totalTransactions: 0,
          totalReceitas: 0,
          totalDespesas: 0,
          pendingCount: 0,
          paidCount: 0,
          overdueCount: 0,
          lastSyncAt: null,
          categoriesCount: 0,
          costCentersCount: 0,
        };
      const supabase = createClient();
      return getFinanceStatus(supabase);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

// ── Status with Monetary Amounts ─────────────────────────────────────────────

export function useFinanceStatusWithAmounts(dateFrom?: string, dateTo?: string) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<FinanceStatusWithAmounts>({
    queryKey: ["finance-status-amounts", tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId)
        return {
          arCount: 0,
          arAmount: 0,
          apCount: 0,
          apAmount: 0,
          pendingCount: 0,
          overdueCount: 0,
          gap: 0,
        };
      const supabase = createClient();
      return getFinanceStatusWithAmounts(supabase, dateFrom, dateTo);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

// ── Founder KPIs ─────────────────────────────────────────────────────────────

export function useFounderKPIs() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<FounderKPIs>({
    queryKey: ["finance-founder-kpis", tenantId],
    queryFn: async () => {
      if (!tenantId)
        return {
          receitaMTD: 0,
          despesaMTD: 0,
          margemMTD: 0,
          margemPct: 0,
          apNext30: 0,
          arNext30: 0,
          saldoAcumulado: 0,
          costCenterRanking: [],
          categoryRanking: [],
          buRevenue: [],
          projectRanking: [],
        };
      const supabase = createClient();
      return getFounderKPIs(supabase);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ── Aging AR/AP ───────────────────────────────────────────────────────────────

export function useFinanceAging() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<FinanceAgingData>({
    queryKey: ["finance-aging", tenantId],
    queryFn: async () => {
      if (!tenantId)
        return {
          buckets: [],
          totalAr: 0,
          totalAp: 0,
          totalArCount: 0,
          totalApCount: 0,
          projectedAr: 0,
          projectedArCount: 0,
        };
      const supabase = createClient();
      return getFinanceAging(supabase);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });
}

// ── Cash Flow Projection ──────────────────────────────────────────────────────

export function useFinanceCashFlowProjection(days = 30) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<CashFlowPoint[]>({
    queryKey: ["finance-cashflow-projection", tenantId, days],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      return getFinanceCashFlowProjection(supabase, days);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });
}

// ── Chart Data (unpaginated, for client-side aggregation) ────────────────────

export function useFinanceChartData(
  filters: Omit<FinanceFilters, "page" | "pageSize" | "search"> = {},
  enabled = true
) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const filterKey = JSON.stringify(filters);

  return useQuery<FinanceTransaction[]>({
    queryKey: ["finance-chart-data", tenantId, filterKey],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      return getFinanceChartData(supabase, filters);
    },
    enabled: !!tenantId && enabled,
    staleTime: 1000 * 30,
  });
}

// ── Sync mutation ─────────────────────────────────────────────────────────────

export function useTriggerFinanceSync() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation({
    mutationFn: triggerFinanceSync,
    onSuccess: () => {
      // Invalidate everything finance-related (including founder KPIs + bank statements)
      qc.invalidateQueries({ queryKey: ["finance-transactions", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-categories", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-cost-centers", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-status", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-status-amounts", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-snapshots", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-founder-kpis", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-revenue-concentration", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-bank-statements", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-bank-balance-latest", tenantId] });
      qc.invalidateQueries({ queryKey: ["finance-bank-cashflow", tenantId] });
    },
  });
}


// ── Revenue Concentration by Client ──────────────────────────────────────────

export function useRevenueConcentrationByClient(dateFrom?: string, dateTo?: string) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<RevenueConcentrationData>({
    queryKey: ["finance-revenue-concentration", tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId)
        return { clients: [], totalRevenue: 0, totalClients: 0, top5Pct: 0 };
      const supabase = createClient();
      return getRevenueConcentrationByClient(supabase, dateFrom, dateTo);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });
}

// ── Payroll Breakdown (Auto-detect from transactions) ────────────────────────

export function usePayrollBreakdown(dateFrom: string, dateTo: string) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<PayrollBreakdownData>({
    queryKey: ["finance-payroll-breakdown", tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId)
        return { vendors: [], totalFolha: 0, totalOperacional: 0, headcount: 0 };
      const supabase = createClient();
      return getPayrollBreakdown(supabase, dateFrom, dateTo);
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ── Overdue Entries (Contas a Pagar/Receber) ────────────────────────────────

export function useOverdueEntries(type: "ar" | "ap" | "all" = "all") {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<OverdueEntriesData>({
    queryKey: ["finance-overdue-entries", tenantId, type],
    queryFn: async () => {
      if (!tenantId)
        return { entries: [], projectedEntries: [], totalAr: 0, totalAp: 0, totalArCount: 0, totalApCount: 0, projectedAr: 0, projectedArCount: 0 };
      const supabase = createClient();
      return getOverdueEntries(supabase, type);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ── Bank Statements (Extrato Bancário) ──────────────────────────────────────

export function useBankStatements(filters: BankStatementFilters = {}) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const filterKey = JSON.stringify(filters);

  return useQuery<{ data: BankStatement[]; count: number }>({
    queryKey: ["finance-bank-statements", tenantId, filterKey],
    queryFn: async () => {
      if (!tenantId) return { data: [], count: 0 };
      const supabase = createClient();
      return getBankStatements(supabase, filters);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60,
  });
}

export function useLatestBankBalance() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<{ balance: number; date: string } | null>({
    queryKey: ["finance-bank-balance-latest", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const supabase = createClient();
      return getLatestBankStatementBalance(supabase);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useBankStatementCashFlow(dateFrom: string, dateTo: string) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<CashFlowPoint[]>({
    queryKey: ["finance-bank-cashflow", tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      return getBankStatementCashFlow(supabase, dateFrom, dateTo);
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Transaction CRUD Mutations ──────────────────────────────────────────────

function invalidateAllFinanceQueries(
  qc: ReturnType<typeof useQueryClient>,
  tenantId: string | null
) {
  const keys = [
    "finance-transactions",
    "finance-status",
    "finance-status-amounts",
    "finance-founder-kpis",
    "finance-snapshots",
    "finance-aging",
    "finance-cashflow-projection",
    "finance-chart-data",
  ];
  for (const k of keys) {
    qc.invalidateQueries({ queryKey: [k, tenantId] });
  }
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!tenantId || !userId) throw new Error("Não autenticado");
      const supabase = createClient();
      return createFinanceTransaction(supabase, tenantId, userId, input);
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["finance-transactions", tenantId] });
      await qc.cancelQueries({ queryKey: ["finance-chart-data", tenantId] });

      // Snapshot all transaction list caches for rollback
      const prevQueries = qc.getQueriesData<{ data: FinanceTransaction[]; count: number }>({
        queryKey: ["finance-transactions", tenantId],
      });

      // Optimistically add to first matching cache with temp ID
      const tempTx: FinanceTransaction = {
        id: `temp-${Date.now()}`,
        tenant_id: tenantId ?? "",
        type: input.type,
        status: input.status,
        description: input.description,
        amount: input.amount,
        paid_amount: input.paid_amount ?? 0,
        date: input.date,
        due_date: input.due_date ?? null,
        paid_date: input.paid_date ?? null,
        category_id: input.category_id ?? null,
        cost_center_id: input.cost_center_id ?? null,
        project_id: input.project_id ?? null,
        counterpart: input.counterpart ?? null,
        counterpart_doc: input.counterpart_doc ?? null,
        payment_method: input.payment_method ?? null,
        bank_account: input.bank_account ?? null,
        business_unit: input.business_unit ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
        contract_id: input.contract_id ?? null,
        omie_id: null,
        omie_synced_at: null,
        omie_raw: null,
        responsible_id: null,
        recurring_rule_id: null,
        created_by: userId ?? null,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      for (const [key, data] of prevQueries) {
        if (data) {
          qc.setQueryData(key, {
            data: [tempTx, ...data.data],
            count: data.count + 1,
          });
        }
      }

      return { prevQueries };
    },
    onError: (_err, _input, context) => {
      // Rollback all caches to previous state
      if (context?.prevQueries) {
        for (const [key, data] of context.prevQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => invalidateAllFinanceQueries(qc, tenantId),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateTransactionInput;
    }) => {
      if (!userId) throw new Error("Não autenticado");
      const supabase = createClient();
      return updateFinanceTransaction(supabase, id, userId, updates);
    },
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: ["finance-transactions", tenantId] });
      await qc.cancelQueries({ queryKey: ["finance-chart-data", tenantId] });

      const prevQueries = qc.getQueriesData<{ data: FinanceTransaction[]; count: number }>({
        queryKey: ["finance-transactions", tenantId],
      });

      // Optimistically apply updates in all cached lists
      for (const [key, data] of prevQueries) {
        if (data) {
          qc.setQueryData(key, {
            ...data,
            data: data.data.map((tx) =>
              tx.id === id
                ? { ...tx, ...updates, updated_at: new Date().toISOString() }
                : tx
            ),
          });
        }
      }

      return { prevQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevQueries) {
        for (const [key, data] of context.prevQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => invalidateAllFinanceQueries(qc, tenantId),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      return deleteFinanceTransaction(supabase, id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["finance-transactions", tenantId] });
      await qc.cancelQueries({ queryKey: ["finance-chart-data", tenantId] });

      const prevQueries = qc.getQueriesData<{ data: FinanceTransaction[]; count: number }>({
        queryKey: ["finance-transactions", tenantId],
      });

      // Optimistically remove from all cached lists
      for (const [key, data] of prevQueries) {
        if (data) {
          qc.setQueryData(key, {
            data: data.data.filter((tx) => tx.id !== id),
            count: Math.max(0, data.count - 1),
          });
        }
      }

      return { prevQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.prevQueries) {
        for (const [key, data] of context.prevQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => invalidateAllFinanceQueries(qc, tenantId),
  });
}

// ── Bulk Auto-Categorize ──────────────────────────────────────────────────

export function useBulkAutoCategorize() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      transactions,
      categories,
      costCenters,
    }: {
      transactions: Array<{
        id: string;
        description: string;
        type: "receita" | "despesa" | "transferencia";
        counterpart: string | null;
        business_unit: string | null;
        category_id: string | null;
        cost_center_id: string | null;
      }>;
      categories: FinanceCategory[];
      costCenters: FinanceCostCenter[];
    }) => {
      if (!userId) throw new Error("Não autenticado");

      const suggestions = batchAutoCategorize(transactions, categories, costCenters);
      if (suggestions.length === 0) return { updated: 0, total: transactions.length };

      const supabase = createClient();

      let updated = 0;
      for (const s of suggestions) {
        const updates: TransactionUpdate = {
          updated_by: userId,
          updated_at: new Date().toISOString(),
        };
        if (s.category_id) updates.category_id = s.category_id;
        if (s.cost_center_id) updates.cost_center_id = s.cost_center_id;

        const { error } = await supabase
          .from("finance_transactions")
          .update(updates)
          .eq("id", s.id);

        if (!error) updated++;
      }

      return { updated, total: suggestions.length };
    },
    onSuccess: () => invalidateAllFinanceQueries(qc, tenantId),
  });
}
