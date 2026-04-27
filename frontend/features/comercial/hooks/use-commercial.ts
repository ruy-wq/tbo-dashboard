"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { logAuditTrail } from "@/lib/audit-trail";
import { toast } from "sonner";
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  bulkUpdateDealStage,
  bulkUpdateDealOwner,
  bulkUpdateDealPriority,
  bulkDeleteDeals,
  getDealPipelines,
  getRdPipelines,
  getDealOwners,
  getCrmStages,
  createCrmStage,
  deleteCrmStage,
} from "@/features/comercial/services/commercial";

interface DealFilters {
  stage?: string;
  search?: string;
  owner_id?: string;
  pipeline?: string;
  owner_name?: string;
  rd_stage_id?: string;
}

export function useDeals(filters?: DealFilters) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["deals", tenantId, filters],
    queryFn: async () => {
      const supabase = createClient();
      return getDeals(supabase, filters);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId,
  });
}

export function useDeal(id: string | null) {
  return useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const supabase = createClient();
      return getDealById(supabase, id!);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (
      deal: Parameters<typeof createDeal>[1],
    ) => {
      const supabase = createClient();
      return createDeal(supabase, deal);
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["deals"] });

      logAuditTrail({
        userId: useAuthStore.getState().user?.id ?? "unknown",
        action: "create",
        table: "crm_deals",
        recordId: (data as Record<string, unknown>)?.id as string ?? "unknown",
        after: variables as unknown as Record<string, unknown>,
      });
    },
    onError: (err, variables) => {
      toast.error(`Erro ao criar deal: ${err.message}`, {
        action: {
          label: "Tentar novamente",
          onClick: () => mutation.mutate(variables),
        },
      });
    },
  });
  return mutation;
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof updateDeal>[2];
    }) => {
      const supabase = createClient();
      return updateDeal(supabase, id, updates);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["deals"] });

      logAuditTrail({
        userId: useAuthStore.getState().user?.id ?? "unknown",
        action: "update",
        table: "crm_deals",
        recordId: variables.id,
        after: variables.updates as Record<string, unknown>,
      });
    },
    onError: (err, variables) => {
      toast.error(`Erro ao atualizar deal: ${err.message}`, {
        action: {
          label: "Tentar novamente",
          onClick: () => mutation.mutate(variables),
        },
      });
    },
  });
  return mutation;
}

export function usePipelines() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["deal-pipelines", tenantId],
    queryFn: async () => {
      const supabase = createClient();
      return getDealPipelines(supabase);
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!tenantId,
  });
}

// ── Pipelines (com stages persistidos) ───────────────────────────────────────

export function useRdPipelines() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["rd-pipelines", tenantId],
    queryFn: async () => {
      const supabase = createClient();
      return getRdPipelines(supabase);
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!tenantId,
  });
}

// ── Owners (distinct from deals) ────────────────────────────────────────────────

export function useDealOwners(pipelineId?: string) {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["deal-owners", tenantId, pipelineId],
    queryFn: async () => {
      const supabase = createClient();
      return getDealOwners(supabase, pipelineId);
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!tenantId,
  });
}

export function useUpdateDealStage() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const supabase = createClient();
      return updateDealStage(supabase, id, stage);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["deals"] });

      logAuditTrail({
        userId: useAuthStore.getState().user?.id ?? "unknown",
        action: "status_change",
        table: "crm_deals",
        recordId: variables.id,
        after: { stage: variables.stage },
        metadata: { field: "stage" },
      });
    },
    onError: (err, variables) => {
      toast.error(`Erro ao mover deal: ${err.message}`, {
        action: {
          label: "Tentar novamente",
          onClick: () => mutation.mutate(variables),
        },
      });
    },
  });
  return mutation;
}

// ── Bulk operations ──────────────────────────────────────────────────────────

export function useBulkUpdateDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, stage }: { ids: string[]; stage: string }) => {
      const supabase = createClient();
      return bulkUpdateDealStage(supabase, ids, stage);
    },
    onSuccess: (count, variables) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      logAuditTrail({
        userId: useAuthStore.getState().user?.id ?? "unknown",
        action: "status_change",
        table: "crm_deals",
        recordId: `bulk:${variables.ids.length}`,
        after: { stage: variables.stage, count },
        metadata: { field: "stage", bulk: true, count: variables.ids.length },
      });
    },
    onError: (err) => {
      toast.error(`Erro ao mover leads: ${err.message}`);
    },
  });
}

export function useBulkUpdateDealOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, ownerName }: { ids: string[]; ownerName: string | null }) => {
      const supabase = createClient();
      return bulkUpdateDealOwner(supabase, ids, ownerName);
    },
    onSuccess: (count, variables) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      logAuditTrail({
        userId: useAuthStore.getState().user?.id ?? "unknown",
        action: "update",
        table: "crm_deals",
        recordId: `bulk:${variables.ids.length}`,
        after: { owner_name: variables.ownerName, count },
        metadata: { field: "owner_name", bulk: true, count: variables.ids.length },
      });
    },
    onError: (err) => {
      toast.error(`Erro ao atribuir owner: ${err.message}`);
    },
  });
}

export function useBulkUpdateDealPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, priority }: { ids: string[]; priority: string }) => {
      const supabase = createClient();
      return bulkUpdateDealPriority(supabase, ids, priority);
    },
    onSuccess: (count, variables) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      logAuditTrail({
        userId: useAuthStore.getState().user?.id ?? "unknown",
        action: "update",
        table: "crm_deals",
        recordId: `bulk:${variables.ids.length}`,
        after: { priority: variables.priority, count },
        metadata: { field: "priority", bulk: true, count: variables.ids.length },
      });
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar prioridade: ${err.message}`);
    },
  });
}

export function useBulkDeleteDeals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient();
      return bulkDeleteDeals(supabase, ids);
    },
    onSuccess: (count, ids) => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      logAuditTrail({
        userId: useAuthStore.getState().user?.id ?? "unknown",
        action: "delete",
        table: "crm_deals",
        recordId: `bulk:${ids.length}`,
        before: { count },
        metadata: { bulk: true },
      });
    },
    onError: (err) => {
      toast.error(`Erro ao deletar leads: ${err.message}`);
    },
  });
}

// ── CRM Stages (dynamic) ────────────────────────────────────────────────────

export function useCrmStages() {
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["crm-stages", tenantId],
    queryFn: async () => {
      const supabase = createClient();
      return getCrmStages(supabase);
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!tenantId,
  });
}

export function useCreateCrmStage() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  const mutation = useMutation({
    mutationFn: async (stage: { id: string; label: string; sort_order: number; color: string; bg: string }) => {
      if (!tenantId) throw new Error("Tenant não encontrado");
      const supabase = createClient();
      return createCrmStage(supabase, { ...stage, tenant_id: tenantId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-stages"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (err, variables) => {
      toast.error(`Erro ao criar etapa: ${err.message}`, {
        action: {
          label: "Tentar novamente",
          onClick: () => mutation.mutate(variables),
        },
      });
    },
  });
  return mutation;
}

export function useDeleteCrmStage() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      return deleteCrmStage(supabase, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-stages"] });
    },
    onError: (err, variables) => {
      toast.error(`Erro ao deletar etapa: ${err.message}`, {
        action: {
          label: "Tentar novamente",
          onClick: () => mutation.mutate(variables),
        },
      });
    },
  });
  return mutation;
}
