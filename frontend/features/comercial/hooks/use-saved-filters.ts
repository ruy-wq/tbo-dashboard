"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  getSavedFilters,
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  type SavedFilter,
} from "@/features/comercial/services/saved-filters";
import type { Json } from "@/lib/supabase/types";

export function useSavedFilters<T = Json>(module: string) {
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["saved-filters", tenantId, userId, module],
    queryFn: async () => {
      const supabase = createClient();
      return getSavedFilters<T>(supabase, module);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId && !!userId,
  });
}

export function useCreateSavedFilter<T = Json>() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (input: { module: string; name: string; filters: T; is_pinned?: boolean }) => {
      if (!tenantId || !userId) throw new Error("Sessão expirada — faça login.");
      const supabase = createClient();
      return createSavedFilter<T>(supabase, {
        user_id: userId,
        tenant_id: tenantId,
        ...input,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-filters"] });
    },
    onError: (err) => {
      toast.error(`Erro ao salvar filtro: ${err.message}`);
    },
  });
}

export function useUpdateSavedFilter<T = Json>() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; filters?: T; is_pinned?: boolean };
    }) => {
      const supabase = createClient();
      return updateSavedFilter<T>(supabase, id, updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-filters"] });
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar filtro: ${err.message}`);
    },
  });
}

export function useDeleteSavedFilter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      return deleteSavedFilter(supabase, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-filters"] });
    },
    onError: (err) => {
      toast.error(`Erro ao deletar filtro: ${err.message}`);
    },
  });
}

export type { SavedFilter };
