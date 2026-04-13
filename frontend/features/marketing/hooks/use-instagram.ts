"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  listInstagramAccounts,
  getInstagramAccount,
  connectInstagramAccount,
  disconnectInstagramAccount,
  updateInstagramAccount,
  getAccountInsights,
  getLatestInsight,
  getAccountMedia,
  getTopMedia,
  triggerAccountSync,
} from "../services/instagram";
import type {
  MetaInstagramAccount,
  MetaInstagramInsight,
  MetaInstagramMedia,
  ConnectAccountPayload,
  InsightsPeriod,
} from "../types/instagram";

function useSupabase() {
  return createClient();
}

// ── Accounts ────────────────────────────────────────────────────────────────

export function useInstagramAccounts() {
  const supabase = useSupabase();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["instagram-accounts", tenantId],
    queryFn: () => listInstagramAccounts(supabase, tenantId!),
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId,
  });
}

export function useInstagramAccount(accountId: string | null) {
  const supabase = useSupabase();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["instagram-account", accountId],
    queryFn: () => getInstagramAccount(supabase, accountId!),
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId && !!accountId,
  });
}

export function useConnectInstagramAccount() {
  const supabase = useSupabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConnectAccountPayload) =>
      connectInstagramAccount(supabase, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instagram-accounts"] });
      toast.success("Conta Instagram conectada com sucesso");
    },
    onError: () => toast.error("Erro ao conectar conta Instagram"),
  });
}

export function useDisconnectInstagramAccount() {
  const supabase = useSupabase();
  const qc = useQueryClient();

  type Ctx = { prev: MetaInstagramAccount[] | undefined };

  return useMutation<void, Error, string, Ctx>({
    mutationFn: (accountId: string) =>
      disconnectInstagramAccount(supabase, accountId),
    onMutate: async (accountId) => {
      await qc.cancelQueries({ queryKey: ["instagram-accounts"] });
      const prev = qc.getQueryData<MetaInstagramAccount[]>(["instagram-accounts"]);
      qc.setQueryData<MetaInstagramAccount[]>(
        ["instagram-accounts"],
        (old) => old?.map((a) => (a.id === accountId ? { ...a, is_active: false } : a)) ?? []
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["instagram-accounts"], ctx.prev);
      toast.error("Erro ao desconectar conta");
    },
    onSuccess: () => toast.success("Conta desconectada"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["instagram-accounts"] }),
  });
}

export function useUpdateInstagramAccount() {
  const supabase = useSupabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<MetaInstagramAccount, "account_type" | "client_name" | "tags" | "sync_frequency" | "is_active">>;
    }) => updateInstagramAccount(supabase, id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instagram-accounts"] });
      toast.success("Conta atualizada");
    },
    onError: () => toast.error("Erro ao atualizar conta"),
  });
}

// ── Insights ────────────────────────────────────────────────────────────────

export function useInstagramInsights(
  accountId: string | null,
  period: InsightsPeriod = "30d"
) {
  const supabase = useSupabase();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["instagram-insights", accountId, period],
    queryFn: () => getAccountInsights(supabase, accountId!, period),
    staleTime: 1000 * 60 * 10,
    enabled: !!tenantId && !!accountId,
  });
}

export function useLatestInstagramInsight(accountId: string | null) {
  const supabase = useSupabase();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["instagram-latest-insight", accountId],
    queryFn: () => getLatestInsight(supabase, accountId!),
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId && !!accountId,
  });
}

// ── Media ───────────────────────────────────────────────────────────────────

export function useInstagramMedia(
  accountId: string | null,
  options?: { mediaType?: string; limit?: number }
) {
  const supabase = useSupabase();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["instagram-media", accountId, options],
    queryFn: () => getAccountMedia(supabase, accountId!, options),
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId && !!accountId,
  });
}

export function useInstagramTopMedia(
  accountId: string | null,
  sortBy: "reach" | "engagement_rate" | "like_count" | "total_interactions" = "reach",
  limit = 10
) {
  const supabase = useSupabase();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery<MetaInstagramMedia[]>({
    queryKey: ["instagram-top-media", accountId, sortBy, limit],
    queryFn: () => getTopMedia(supabase, accountId!, sortBy, limit),
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId && !!accountId,
  });
}

// ── Sync ────────────────────────────────────────────────────────────────────

export function useSyncInstagramAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, days }: { accountId: string; days?: number }) =>
      triggerAccountSync(accountId, days),
    onMutate: () => {
      toast.loading("Sincronizando dados do Instagram...", { id: "ig-sync" });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Sincronizacao concluida", { id: "ig-sync" });
      qc.invalidateQueries({ queryKey: ["instagram-accounts"] });
      qc.invalidateQueries({ queryKey: ["instagram-insights"] });
      qc.invalidateQueries({ queryKey: ["instagram-media"] });
      qc.invalidateQueries({ queryKey: ["instagram-top-media"] });
      qc.invalidateQueries({ queryKey: ["instagram-latest-insight"] });
    },
    onError: (err) => {
      toast.error(`Erro na sincronizacao: ${err.message}`, { id: "ig-sync" });
    },
  });
}

// ── Aggregated hooks ────────────────────────────────────────────────────────

/** Convenience: previous period insights for comparison */
export function useInstagramInsightsWithComparison(
  accountId: string | null,
  period: InsightsPeriod = "30d"
) {
  const current = useInstagramInsights(accountId, period);

  const prevPeriodMap: Record<InsightsPeriod, InsightsPeriod> = {
    "7d": "7d",
    "30d": "30d",
    "90d": "90d",
  };

  // Fetch double the period to extract previous segment
  const doublePeriod = period === "7d" ? "30d" : period === "30d" ? "90d" : "90d";
  const allInsights = useInstagramInsights(accountId, doublePeriod);

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  let previousInsights: MetaInstagramInsight[] = [];
  if (allInsights.data && current.data) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const prevCutoff = new Date();
    prevCutoff.setDate(prevCutoff.getDate() - periodDays * 2);

    previousInsights = allInsights.data.filter((i) => {
      const d = new Date(i.date);
      return d >= prevCutoff && d < cutoff;
    });
  }

  return {
    current: current.data ?? [],
    previous: previousInsights,
    isLoading: current.isLoading || allInsights.isLoading,
    error: current.error || allInsights.error,
  };
}
