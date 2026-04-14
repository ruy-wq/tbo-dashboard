"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/features/portfolio/services/portfolio";
import type {
  PortfolioItem,
  PortfolioInsert,
  PortfolioUpdate,
} from "@/features/portfolio/types/portfolio";

// ─── Query ──────────────────────────────────────────────────────────────────

export function usePortfolio() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["portfolio", tenantId],
    queryFn: () => {
      const supabase = createClient();
      return getPortfolioItems(supabase, tenantId!);
    },
    staleTime: 60_000 * 5,
    enabled: !!tenantId,
  });
}

// ─── Create ─────────────────────────────────────────────────────────────────

export function useCreatePortfolioItem() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (input: Omit<PortfolioInsert, "tenant_id" | "created_by">) => {
      const supabase = createClient();
      return createPortfolioItem(supabase, {
        ...input,
        tenant_id: tenantId!,
        created_by: userId ?? null,
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["portfolio"] });
      const prev = qc.getQueryData<PortfolioItem[]>(["portfolio", tenantId]);

      if (prev) {
        const optimistic: PortfolioItem = {
          id: `temp-${Date.now()}`,
          tenant_id: tenantId!,
          project_id: input.project_id ?? null,
          project_name: input.project_name ?? null,
          client_name: input.client_name ?? null,
          client_company: input.client_company ?? null,
          bu: input.bu,
          category: input.category,
          title: input.title,
          description: input.description ?? null,
          thumbnail_url: input.thumbnail_url ?? null,
          media_urls: input.media_urls ?? [],
          external_url: input.external_url ?? null,
          year: input.year ?? null,
          is_featured: input.is_featured ?? false,
          featured_by: null,
          tags: input.tags ?? [],
          created_by: userId ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        qc.setQueryData(["portfolio", tenantId], [optimistic, ...prev]);
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData(["portfolio", tenantId], context.prev);
      toast.error("Erro ao adicionar case ao portfólio");
    },
    onSuccess: () => {
      toast.success("Case adicionado ao portfólio");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

// ─── Update ─────────────────────────────────────────────────────────────────

export function useUpdatePortfolioItem() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PortfolioUpdate }) => {
      const supabase = createClient();
      return updatePortfolioItem(supabase, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: ["portfolio"] });
      const prev = qc.getQueryData<PortfolioItem[]>(["portfolio", tenantId]);

      if (prev) {
        qc.setQueryData(
          ["portfolio", tenantId],
          prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData(["portfolio", tenantId], context.prev);
      toast.error("Erro ao atualizar case");
    },
    onSuccess: () => {
      toast.success("Case atualizado");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation({
    mutationFn: (id: string) => {
      const supabase = createClient();
      return deletePortfolioItem(supabase, id);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["portfolio"] });
      const prev = qc.getQueryData<PortfolioItem[]>(["portfolio", tenantId]);

      if (prev) {
        qc.setQueryData(
          ["portfolio", tenantId],
          prev.filter((item) => item.id !== id),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData(["portfolio", tenantId], context.prev);
      toast.error("Erro ao remover case");
    },
    onSuccess: () => {
      toast.success("Case removido do portfólio");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

// ─── Toggle Featured ────────────────────────────────────────────────────────

export function useToggleFeatured() {
  const update = useUpdatePortfolioItem();
  const userId = useAuthStore((s) => s.user?.id);

  return (item: PortfolioItem) => {
    update.mutate({
      id: item.id,
      updates: {
        is_featured: !item.is_featured,
        featured_by: !item.is_featured ? userId : undefined,
      },
    });
  };
}
