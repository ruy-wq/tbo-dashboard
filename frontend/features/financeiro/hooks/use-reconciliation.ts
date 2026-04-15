"use client";

// ── use-reconciliation ────────────────────────────────────────────────────────
// React Query hooks que orquestram o motor de conciliação bancária automática.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { createLogger } from "@/lib/logger";
import {
  listBankTransactions,
  listReconciliationRules,
  reconcileTransaction,
  unreconcileTransaction,
} from "@/features/financeiro/services/bank-reconciliation";
import {
  runReconciliationEngine,
  type ReconciliationResult,
  type ReconciliationCandidate,
  type EngineConfig,
} from "@/features/financeiro/services/reconciliation-engine";
import { getFinanceTransactions } from "@/features/financeiro/services/finance-transactions";

type TypedSupabase = SupabaseClient<Database>;

const logger = createLogger("use-reconciliation");

// ── Empty result helper ───────────────────────────────────────────────────────

function emptyResult(): ReconciliationResult {
  return {
    auto: [],
    suggest: [],
    unmatched: [],
    stats: { totalBankTxs: 0, autoCount: 0, suggestCount: 0, unmatchedCount: 0 },
  };
}

// ── Audit log helper ──────────────────────────────────────────────────────────

interface AuditEntry {
  tenantId: string;
  bankTxId: string;
  financeTxId: string;
  userId: string;
  method: "auto" | "manual" | "rule";
  score: number | null;
}

async function insertReconciliationLog(
  supabase: TypedSupabase,
  entry: AuditEntry
): Promise<void> {
  const { error } = await supabase
    .from("finance_reconciliation_log")
    .insert({
      tenant_id: entry.tenantId,
      bank_tx_id: entry.bankTxId,
      finance_tx_id: entry.financeTxId,
      reconciled_by: entry.userId,
      method: entry.method,
      score: entry.score,
      created_at: new Date().toISOString(),
    });
  if (error) {
    logger.warn("Audit log insert failed", { error: error.message });
  }
}

// ── Query keys ────────────────────────────────────────────────────────────────

const QK = {
  candidates: (tenantId: string | null, bankAccountId?: string, from?: string, to?: string) =>
    ["reconciliation-candidates", tenantId, bankAccountId, from, to] as const,
  bankTxs: (tenantId: string | null) =>
    ["bank-transactions", tenantId] as const,
};

// ── Hook: useCandidates ───────────────────────────────────────────────────────

export interface CandidatesFilters {
  bankAccountId?: string;
  dateFrom?: string;
  dateTo?: string;
  config?: Partial<EngineConfig>;
}

/**
 * Fetches unreconciled bank transactions + internal finance transactions,
 * runs the reconciliation engine, and returns scored candidates.
 */
export function useReconciliationCandidates(
  filters: CandidatesFilters = {}
) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const { bankAccountId, dateFrom, dateTo, config } = filters;

  return useQuery<ReconciliationResult>({
    queryKey: QK.candidates(tenantId, bankAccountId, dateFrom, dateTo),
    queryFn: async () => {
      if (!tenantId) return emptyResult();

      const supabase = createClient();

      const [bankRes, financeRes, rules] = await Promise.all([
        listBankTransactions(supabase, tenantId, {
          bank_account_id: bankAccountId,
          reconciled: false,
          dateFrom,
          dateTo,
          pageSize: 500,
        }),
        getFinanceTransactions(supabase, {
          statusIn: ["previsto", "provisionado", "pago", "liquidado", "atrasado"],
          dateFrom,
          dateTo,
          pageSize: 500,
        }),
        listReconciliationRules(supabase, tenantId),
      ]);

      logger.info("Engine input loaded", {
        bankTxs: bankRes.count,
        financeTxs: financeRes.count,
        rules: rules.length,
      });

      const result = runReconciliationEngine(
        bankRes.data,
        financeRes.data,
        rules,
        config
      );

      logger.info("Engine result", result.stats);
      return result;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 30, // 30s
  });
}

// ── Hook: useApplyReconciliation (single match) ───────────────────────────────

interface ApplyInput {
  bankTxId: string;
  financeTxId: string;
  score?: number;
  method?: "manual" | "rule";
}

/**
 * Applies a single reconciliation (manual approval of a suggested match).
 */
export function useApplyReconciliation() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation<void, Error, ApplyInput>({
    mutationFn: async ({ bankTxId, financeTxId, score, method = "manual" }) => {
      if (!userId || !tenantId) throw new Error("Usuário não identificado.");
      const supabase = createClient();

      await reconcileTransaction(supabase, bankTxId, financeTxId, userId);
      await insertReconciliationLog(supabase, {
        tenantId,
        bankTxId,
        financeTxId,
        userId,
        method,
        score: score ?? null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.candidates(tenantId) });
      qc.invalidateQueries({ queryKey: QK.bankTxs(tenantId) });
    },
    onError: (err) => {
      logger.error("Apply reconciliation failed", { error: err.message });
    },
  });
}

// ── Hook: useAutoReconcile (batch auto candidates) ────────────────────────────

interface AutoReconcileResult {
  applied: number;
  errors: number;
}

/**
 * Reconciles all "auto" tier candidates in a single batch operation.
 * Each candidate is applied sequentially with audit logging.
 */
export function useAutoReconcile() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation<AutoReconcileResult, Error, ReconciliationCandidate[]>({
    mutationFn: async (candidates) => {
      if (!userId || !tenantId) throw new Error("Usuário não identificado.");
      const supabase = createClient();
      let applied = 0;
      let errors = 0;

      for (const candidate of candidates) {
        try {
          await reconcileTransaction(
            supabase,
            candidate.bankTxId,
            candidate.financeTxId,
            userId
          );
          await insertReconciliationLog(supabase, {
            tenantId,
            bankTxId: candidate.bankTxId,
            financeTxId: candidate.financeTxId,
            userId,
            method: candidate.matchType === "rule" ? "rule" : "auto",
            score: candidate.score,
          });
          applied++;
        } catch (err) {
          errors++;
          logger.error("Auto-reconcile item failed", {
            bankTxId: candidate.bankTxId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      logger.info("Auto-reconcile batch complete", { applied, errors });
      return { applied, errors };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.candidates(tenantId) });
      qc.invalidateQueries({ queryKey: QK.bankTxs(tenantId) });
    },
    onError: (err) => {
      logger.error("Auto-reconcile batch failed", { error: err.message });
    },
  });
}

// ── Hook: useUnreconcile ──────────────────────────────────────────────────────

/**
 * Reverts a previously reconciled bank transaction back to unreconciled.
 */
export function useUnreconcile() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (bankTxId) => {
      const supabase = createClient();
      await unreconcileTransaction(supabase, bankTxId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.candidates(tenantId) });
      qc.invalidateQueries({ queryKey: QK.bankTxs(tenantId) });
    },
    onError: (err) => {
      logger.error("Unreconcile failed", { error: err.message });
    },
  });
}
