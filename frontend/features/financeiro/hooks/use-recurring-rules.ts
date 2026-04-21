"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  toggleRecurringRule,
  generateRecurringTransactions,
} from "@/features/financeiro/services/recurring-rules";
import type {
  RecurringRule,
  RecurringRuleSummary,
  GenerateResult,
} from "@/features/financeiro/services/finance-types";
import type { RecurringRuleInput } from "@/features/financeiro/services/finance-schemas";

const QK = "finance-recurring-rules";

// ── Query ─────────────────────────────────────────────────────────────────────

export function useRecurringRules() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  const query = useQuery<RecurringRuleSummary>({
    queryKey: [QK, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant não identificado.");
      const supabase = createClient();
      return getRecurringRules(supabase);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
  });

  // Realtime
  useEffect(() => {
    if (!tenantId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`frr-rt:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "finance_recurring_rules",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: [QK, tenantId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, qc]);

  return query;
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateRecurringRule() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation<RecurringRule, Error, RecurringRuleInput>({
    mutationFn: async (input) => {
      if (!tenantId || !userId) throw new Error("Auth não identificado.");
      const supabase = createClient();
      return createRecurringRule(supabase, tenantId, userId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, tenantId] });
    },
  });
}

// ── Update ────────────────────────────────────────────────────────────────────

export function useUpdateRecurringRule() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  type UpdateVars = {
    id: string;
    updates: Partial<RecurringRuleInput> & { is_active?: boolean };
  };

  return useMutation<RecurringRule, Error, UpdateVars>({
    mutationFn: async ({ id, updates }) => {
      if (!userId) throw new Error("Auth não identificado.");
      const supabase = createClient();
      return updateRecurringRule(supabase, id, userId, updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, tenantId] });
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────

function recomputeSummary(rules: RecurringRule[]): RecurringRuleSummary {
  const active = rules.filter((r) => r.is_active);
  return {
    rules,
    activeCount: active.length,
    totalDespesaMensal: active
      .filter((r) => r.type === "despesa")
      .reduce((s, r) => s + Number(r.amount), 0),
    totalReceitaMensal: active
      .filter((r) => r.type === "receita")
      .reduce((s, r) => s + Number(r.amount), 0),
  };
}

export function useDeleteRecurringRule() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  type DeleteCtx = { prev: RecurringRuleSummary | undefined };

  return useMutation<void, Error, string, DeleteCtx>({
    mutationFn: async (id) => {
      const supabase = createClient();
      return deleteRecurringRule(supabase, id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [QK, tenantId] });
      const prev = qc.getQueryData<RecurringRuleSummary>([QK, tenantId]);
      if (prev) {
        const rules = prev.rules.filter((r) => r.id !== id);
        qc.setQueryData([QK, tenantId], recomputeSummary(rules));
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) qc.setQueryData([QK, tenantId], context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [QK, tenantId] });
    },
  });
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export function useToggleRecurringRule() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  type ToggleVars = { id: string; isActive: boolean };
  type ToggleCtx = { prev: RecurringRuleSummary | undefined };

  return useMutation<RecurringRule, Error, ToggleVars, ToggleCtx>({
    mutationFn: async ({ id, isActive }) => {
      if (!userId) throw new Error("Auth não identificado.");
      const supabase = createClient();
      return toggleRecurringRule(supabase, id, userId, isActive);
    },
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: [QK, tenantId] });
      const prev = qc.getQueryData<RecurringRuleSummary>([QK, tenantId]);
      if (prev) {
        const rules = prev.rules.map((r) =>
          r.id === id ? { ...r, is_active: isActive } : r,
        );
        qc.setQueryData([QK, tenantId], recomputeSummary(rules));
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData([QK, tenantId], context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [QK, tenantId] });
    },
  });
}

// ── Generate transactions ─────────────────────────────────────────────────────

export function useGenerateRecurringTransactions() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation<GenerateResult, Error, string>({
    mutationFn: async (targetMonth) => {
      if (!tenantId || !userId) throw new Error("Auth não identificado.");
      const supabase = createClient();
      return generateRecurringTransactions(supabase, tenantId, userId, targetMonth);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-transactions"] });
      qc.invalidateQueries({ queryKey: ["founder-dashboard"] });
    },
  });
}
