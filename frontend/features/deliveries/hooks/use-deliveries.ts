"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  getProjectDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  type DeliveryRow,
  type DeliveryInsert,
  type DeliveryUpdate,
} from "@/features/deliveries/services/deliveries";

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useProjectDeliveries(projectId: string) {
  return useQuery({
    queryKey: ["project-deliveries", projectId],
    queryFn: () => {
      const supabase = createClient();
      return getProjectDeliveries(supabase, projectId);
    },
    staleTime: 60_000,
    enabled: !!projectId,
  });
}

// ─── Create ──────────────────────────────────────────────────────────────────

export function useCreateDelivery() {
  const qc = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation({
    mutationFn: (input: Omit<DeliveryInsert, "tenant_id">) => {
      const supabase = createClient();
      return createDelivery(supabase, { ...input, tenant_id: tenantId! });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project-deliveries", data.project_id] });
      qc.invalidateQueries({ queryKey: ["delivery-token", data.project_id] });
      toast.success(`Entrega "${data.title}" criada`);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar entrega: ${err.message}`);
    },
  });
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function useUpdateDelivery() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: DeliveryUpdate }) => {
      const supabase = createClient();
      return updateDelivery(supabase, id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: ["project-deliveries"] });

      const allQueries = qc.getQueriesData<DeliveryRow[]>({ queryKey: ["project-deliveries"] });
      for (const [key, data] of allQueries) {
        if (data) {
          qc.setQueryData(key, data.map((d) => (d.id === id ? { ...d, ...updates } : d)));
        }
      }
      return { allQueries };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project-deliveries", data.project_id] });
      qc.invalidateQueries({ queryKey: ["delivery-token", data.project_id] });
      toast.success("Entrega atualizada");
    },
    onError: (err: Error, _vars, context) => {
      if (context?.allQueries) {
        for (const [key, data] of context.allQueries) {
          qc.setQueryData(key, data);
        }
      }
      toast.error(`Erro ao atualizar: ${err.message}`);
    },
  });
}

// ─── Delete (soft) ───────────────────────────────────────────────────────────

export function useDeleteDelivery() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) => {
      const supabase = createClient();
      return deleteDelivery(supabase, id);
    },
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["project-deliveries", projectId] });
      qc.invalidateQueries({ queryKey: ["delivery-token", projectId] });
      toast.success("Entrega desativada");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao desativar: ${err.message}`);
    },
  });
}
