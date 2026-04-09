"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  getCreativeBriefings,
  updateBriefingStatus,
  createCreativeBriefing,
  getAllCampaignBriefings,
  type CreativeBriefingRow,
  type CampaignBriefingWithCampaign,
  type CreateBriefingInput,
} from "@/features/clientes/services/creative-briefings";

export function useCreativeBriefings(filters?: {
  status?: string;
  search?: string;
}) {
  const supabase = createClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["creative-briefings", tenantId, filters],
    queryFn: () => getCreativeBriefings(supabase, filters),
    staleTime: 1000 * 60 * 2,
    enabled: !!tenantId,
  });
}

export function useAllCampaignBriefings(filters?: {
  status?: string;
  search?: string;
}) {
  const supabase = createClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["campaign-briefings-all", tenantId, filters],
    queryFn: () => getAllCampaignBriefings(supabase, filters),
    staleTime: 1000 * 60 * 2,
    enabled: !!tenantId,
  });
}

export function useCreateCreativeBriefing() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBriefingInput) =>
      createCreativeBriefing(supabase, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creative-briefings"] });
    },
  });
}

export function useUpdateBriefingStatus() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: CreativeBriefingRow["status"];
    }) => updateBriefingStatus(supabase, id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["creative-briefings"] });
      const prev = qc.getQueriesData({ queryKey: ["creative-briefings"] });

      qc.setQueriesData(
        { queryKey: ["creative-briefings"] },
        (old: CreativeBriefingRow[] | undefined) =>
          old?.map((b) => (b.id === id ? { ...b, status } : b)),
      );

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["creative-briefings"] });
    },
  });
}
