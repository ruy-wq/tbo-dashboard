"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  getTeamPayroll,
  upsertTeamPayrollEntry,
  updateTeamPayrollEntry,
  deleteTeamPayrollEntry,
  duplicateMonthPayroll,
  type TeamPayrollSummary,
  type TeamPayrollEntry,
  type UpsertTeamPayrollInput,
} from "@/features/financeiro/services/team-payroll";

const QK = "finance-team-payroll";

// ── Query ─────────────────────────────────────────────────────────────────────

export function useTeamPayroll(month: string) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  const query = useQuery<TeamPayrollSummary>({
    queryKey: [QK, tenantId, month],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant nao identificado.");
      const supabase = createClient();
      return getTeamPayroll(supabase, month);
    },
    enabled: !!tenantId && !!month && /^\d{4}-\d{2}$/.test(month),
    staleTime: 1000 * 60 * 2,
  });

  // Realtime
  useEffect(() => {
    if (!tenantId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`ftp-rt:${tenantId}:${month}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "finance_team_payroll",
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
  }, [tenantId, month, qc]);

  return query;
}

// ── Upsert ────────────────────────────────────────────────────────────────────

export function useUpsertTeamPayroll() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation<TeamPayrollEntry, Error, UpsertTeamPayrollInput>({
    mutationFn: async (input) => {
      if (!tenantId || !userId) throw new Error("Auth nao identificado.");
      const supabase = createClient();
      return upsertTeamPayrollEntry(supabase, tenantId, userId, input);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [QK, tenantId, variables.month] });
      qc.invalidateQueries({ queryKey: [QK, tenantId] });
    },
  });
}

// ── Update ────────────────────────────────────────────────────────────────────

export function useUpdateTeamPayroll(month: string) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  type UpdateVars = { id: string; updates: Partial<Pick<TeamPayrollEntry, "name" | "role" | "section" | "salary" | "is_active" | "notes">> };
  type UpdateCtx = { prev: TeamPayrollSummary | undefined };

  return useMutation<TeamPayrollEntry, Error, UpdateVars, UpdateCtx>({
    mutationFn: async ({ id, updates }) => {
      const supabase = createClient();
      return updateTeamPayrollEntry(supabase, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: [QK, tenantId, month] });
      const prev = qc.getQueryData<TeamPayrollSummary>([QK, tenantId, month]);
      if (prev) {
        const optimistic: TeamPayrollSummary = {
          ...prev,
          entries: prev.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        };
        const active = optimistic.entries.filter((e) => e.is_active && e.salary > 0);
        optimistic.totalFolha = active.reduce((s, e) => s + Number(e.salary), 0);
        // headcount comes from profiles, not payroll entries — preserve it
        optimistic.totalDespesas = optimistic.entries.reduce((s, e) => s + Number(e.salary), 0);
        qc.setQueryData([QK, tenantId, month], optimistic);
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData([QK, tenantId, month], context.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [QK, tenantId, month] });
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function useDeleteTeamPayroll(month: string) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  type DeleteCtx = { prev: TeamPayrollSummary | undefined };

  return useMutation<void, Error, string, DeleteCtx>({
    mutationFn: async (id) => {
      const supabase = createClient();
      return deleteTeamPayrollEntry(supabase, id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [QK, tenantId, month] });
      const prev = qc.getQueryData<TeamPayrollSummary>([QK, tenantId, month]);
      if (prev) {
        const optimistic: TeamPayrollSummary = {
          ...prev,
          entries: prev.entries.filter((e) => e.id !== id),
        };
        const active = optimistic.entries.filter((e) => e.is_active && e.salary > 0);
        optimistic.totalFolha = active.reduce((s, e) => s + Number(e.salary), 0);
        // headcount comes from profiles, not payroll entries — preserve it
        optimistic.totalDespesas = optimistic.entries.reduce((s, e) => s + Number(e.salary), 0);
        qc.setQueryData([QK, tenantId, month], optimistic);
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        qc.setQueryData([QK, tenantId, month], context.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [QK, tenantId, month] });
    },
  });
}

// ── Duplicate month ───────────────────────────────────────────────────────────

export function useDuplicateMonthPayroll() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation<
    TeamPayrollEntry[],
    Error,
    { sourceMonth: string; targetMonth: string }
  >({
    mutationFn: async ({ sourceMonth, targetMonth }) => {
      if (!tenantId || !userId) throw new Error("Auth nao identificado.");
      const supabase = createClient();
      return duplicateMonthPayroll(supabase, tenantId, userId, sourceMonth, targetMonth);
    },
    onSuccess: (_data, { targetMonth }) => {
      qc.invalidateQueries({ queryKey: [QK, tenantId, targetMonth] });
    },
  });
}
