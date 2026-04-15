"use client";

// ── use-ai-reconciliation ─────────────────────────────────────────────────────
// React Query hooks para o agente AI de conciliação bancária.
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { createLogger } from "@/lib/logger";
import type { BankTransaction } from "@/lib/supabase/types/bank-reconciliation";
import type { FinanceTransaction, FinanceCategory, FinanceCostCenter } from "@/features/financeiro/services/finance-types";
import type {
  AIMatchResponse,
  AICategorizeResponse,
  AIAnomalyResponse,
  AISummaryResponse,
  AIMatchSuggestion,
  AICategorySuggestion,
  AIAnomaly,
} from "@/features/financeiro/services/ai-reconciliation";

const logger = createLogger("use-ai-reconciliation");

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIAnalyzeResult extends AIMatchResponse {
  cached: boolean;
  meta?: { model: string; tokensUsed: number; latencyMs: number };
}

export interface AICategorizeResult extends AICategorizeResponse {
  cached: boolean;
  meta?: { model: string; tokensUsed: number; latencyMs: number };
}

interface AIErrorResponse {
  error: string;
  detail?: string;
}

// ── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchAI<T>(payload: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessão expirada");

  const res = await fetch("/api/ai/conciliacao", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const body: unknown = await res.json();

  if (!res.ok) {
    const err = body as AIErrorResponse;
    throw new Error(err.error ?? `Erro ${res.status}`);
  }

  return body as T;
}

// ── Query keys ───────────────────────────────────────────────────────────────

export const aiReconciliationKeys = {
  all: ["ai-reconciliation"] as const,
  suggestions: (tenantId: string | null) =>
    ["ai-reconciliation", "suggestions", tenantId] as const,
};

// ── Hook: useAIAnalyze (F1 — match inteligente) ─────────────────────────────

interface AIAnalyzeInput {
  unmatchedBankTxs: BankTransaction[];
  availableFinanceTxs: FinanceTransaction[];
}

export function useAIAnalyze() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation<AIAnalyzeResult, Error, AIAnalyzeInput>({
    mutationFn: async ({ unmatchedBankTxs, availableFinanceTxs }) => {
      logger.info("AI analyze started", {
        unmatchedCount: unmatchedBankTxs.length,
        availableCount: availableFinanceTxs.length,
      });

      const result = await fetchAI<AIAnalyzeResult>({
        action: "analyze",
        unmatchedBankTxs,
        availableFinanceTxs,
      });

      logger.info("AI analyze completed", {
        matchesFound: result.matches.length,
        cached: result.cached,
        latencyMs: result.meta?.latencyMs,
      });

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiReconciliationKeys.suggestions(tenantId) });
    },
    onError: (err) => {
      logger.error("AI analyze failed", { error: err.message });
    },
  });
}

// ── Hook: useAICategorize (F2 — categorização semântica) ─────────────────────

interface AICategorizeInput {
  bankTxs: BankTransaction[];
  categories: FinanceCategory[];
  costCenters: FinanceCostCenter[];
}

export function useAICategorize() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation<AICategorizeResult, Error, AICategorizeInput>({
    mutationFn: async ({ bankTxs, categories, costCenters }) => {
      logger.info("AI categorize started", { txCount: bankTxs.length });

      const result = await fetchAI<AICategorizeResult>({
        action: "categorize",
        bankTxs,
        availableCategories: categories.map((c) => c.name),
        availableCostCenters: costCenters.map((cc) => `${cc.code} - ${cc.name}`),
      });

      logger.info("AI categorize completed", {
        categorizationsCount: result.categorizations.length,
        cached: result.cached,
      });

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiReconciliationKeys.suggestions(tenantId) });
    },
    onError: (err) => {
      logger.error("AI categorize failed", { error: err.message });
    },
  });
}

// ── Hook: useAISuggestions (read pending suggestions) ─────────────────────────

export interface AISuggestionRow {
  id: string;
  type: string;
  suggestion_json: Record<string, unknown>;
  confidence: number;
  reasoning: string;
  status: string;
  created_at: string;
  model_used: string;
  tokens_used: number;
  latency_ms: number;
}

export function useAISuggestions() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<AISuggestionRow[]>({
    queryKey: aiReconciliationKeys.suggestions(tenantId),
    queryFn: async () => {
      if (!tenantId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("finance_ai_suggestions")
        .select("id, type, suggestion_json, confidence, reasoning, status, created_at, model_used, tokens_used, latency_ms")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return (data ?? []) as AISuggestionRow[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60, // 1 min
  });
}

// ── Hook: useResolveSuggestion (accept/reject) ───────────────────────────────

interface ResolveInput {
  suggestionId: string;
  status: "accepted" | "rejected";
}

export function useResolveSuggestion() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation<void, Error, ResolveInput>({
    mutationFn: async ({ suggestionId, status }) => {
      if (!userId) throw new Error("Usuário não identificado");
      const supabase = createClient();
      const { error } = await supabase
        .from("finance_ai_suggestions")
        .update({
          status,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", suggestionId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiReconciliationKeys.suggestions(tenantId) });
    },
  });
}

// ── Hook: useAIAnomalies (F3 — detecção de anomalias) ────────────────────────

export interface AIAnomalyResult extends AIAnomalyResponse {
  cached: boolean;
  meta?: { model: string; tokensUsed: number; latencyMs: number };
}

interface AIAnomalyInput {
  bankTxs: BankTransaction[];
  financeTxs: FinanceTransaction[];
  reconciledCount: number;
  pendingCount: number;
  totalCredit: number;
  totalDebit: number;
}

export function useAIAnomalies() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation<AIAnomalyResult, Error, AIAnomalyInput>({
    mutationFn: async (input) => {
      logger.info("AI anomalies started", { bankTxCount: input.bankTxs.length });

      const result = await fetchAI<AIAnomalyResult>({
        action: "anomalies",
        ...input,
      });

      logger.info("AI anomalies completed", {
        anomaliesFound: result.anomalies.length,
        healthScore: result.healthScore,
        cached: result.cached,
      });

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiReconciliationKeys.suggestions(tenantId) });
    },
    onError: (err) => {
      logger.error("AI anomalies failed", { error: err.message });
    },
  });
}

// ── Hook: useAISummary (F5 — resumo narrativo) ──────────────────────────────

export interface AISummaryResult extends AISummaryResponse {
  cached: boolean;
  meta?: { model: string; tokensUsed: number; latencyMs: number };
}

interface AISummaryInput {
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

export function useAISummary() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation<AISummaryResult, Error, AISummaryInput>({
    mutationFn: async (input) => {
      logger.info("AI summary started", { period: input.periodLabel });

      const result = await fetchAI<AISummaryResult>({
        action: "summary",
        ...input,
      });

      logger.info("AI summary completed", { cached: result.cached });
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiReconciliationKeys.suggestions(tenantId) });
    },
    onError: (err) => {
      logger.error("AI summary failed", { error: err.message });
    },
  });
}

// ── Re-export types for components ──────────────────────────────────────────

export type { AIMatchSuggestion, AICategorySuggestion, AIAnomaly };
