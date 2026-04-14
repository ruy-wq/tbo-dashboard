"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  getShowcases,
  createShowcase,
  deleteShowcase,
  getShowcaseByToken,
} from "@/features/portfolio/services/showcase";
import type { ShowcaseInsert } from "@/features/portfolio/types/showcase";

// ─── Token generation ───────────────────────────────────────────────────────

function generateToken(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function useShowcases() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["showcases", tenantId],
    queryFn: () => {
      const supabase = createClient();
      return getShowcases(supabase, tenantId!);
    },
    staleTime: 60_000,
    enabled: !!tenantId,
  });
}

export function useShowcaseByToken(token: string) {
  return useQuery({
    queryKey: ["showcase", token],
    queryFn: () => {
      const supabase = createClient();
      return getShowcaseByToken(supabase, token);
    },
    staleTime: 0,
    enabled: !!token,
  });
}

// ─── Create ─────────────────────────────────────────────────────────────────

export function useCreateShowcase() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (input: { title: string; description?: string; itemIds: string[] }) => {
      const supabase = createClient();
      const payload: ShowcaseInsert = {
        tenant_id: tenantId!,
        token: generateToken(),
        title: input.title,
        description: input.description ?? null,
        item_ids: input.itemIds,
        created_by: userId ?? null,
      };
      return createShowcase(supabase, payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["showcases"] });
      const url = `${window.location.origin}/showcase/${data.token}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a area de transferencia!", {
        description: url,
        duration: 6000,
      });
    },
    onError: () => {
      toast.error("Erro ao gerar link de apresentacao");
    },
  });
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export function useDeleteShowcase() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const supabase = createClient();
      return deleteShowcase(supabase, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["showcases"] });
      toast.success("Link desativado");
    },
    onError: () => {
      toast.error("Erro ao desativar link");
    },
  });
}
