"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  getLaunches,
  getLaunchById,
  createLaunch,
  updateLaunch,
  deleteLaunch,
  updatePhase,
  approveGate,
  toggleChecklistItem,
  addChecklistItem,
  updateKPI,
  type Launch,
  type CreateLaunchInput,
  type LaunchPhase,
  type LaunchKPI,
} from "../services/launches";

// ── Query Keys ──────────────────────────────────────────────────────────────

export const launchKeys = {
  all: ["launches"] as const,
  list: (filters?: { status?: string; search?: string }) =>
    ["launches", "list", filters] as const,
  detail: (id: string) => ["launches", "detail", id] as const,
};

// ── List Hook ───────────────────────────────────────────────────────────────

export function useLaunches(filters?: { status?: string; search?: string }) {
  const supabase = createClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: launchKeys.list(filters),
    queryFn: () => getLaunches(supabase, filters),
    staleTime: 1000 * 60 * 2,
    enabled: !!tenantId,
  });
}

// ── Detail Hook ─────────────────────────────────────────────────────────────

export function useLaunchDetail(id: string) {
  const supabase = createClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: launchKeys.detail(id),
    queryFn: () => getLaunchById(supabase, id),
    staleTime: 1000 * 60,
    enabled: !!tenantId && !!id,
  });
}

// ── Create Launch ───────────────────────────────────────────────────────────

export function useCreateLaunch() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLaunchInput) => createLaunch(supabase, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: launchKeys.all });
      toast.success("Lançamento criado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar lançamento");
    },
  });
}

// ── Update Launch ───────────────────────────────────────────────────────────

export function useUpdateLaunch() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Launch> }) =>
      updateLaunch(supabase, id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: launchKeys.detail(id) });
      const previous = queryClient.getQueryData(launchKeys.detail(id));
      queryClient.setQueryData(launchKeys.detail(id), (old: unknown) => {
        if (!old) return old;
        return { ...(old as Launch), ...updates };
      });
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(launchKeys.detail(id), context.previous);
      }
      toast.error("Erro ao atualizar lançamento");
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: launchKeys.all });
      queryClient.invalidateQueries({ queryKey: launchKeys.detail(id) });
    },
  });
}

// ── Delete Launch ───────────────────────────────────────────────────────────

export function useDeleteLaunch() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLaunch(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: launchKeys.all });
      toast.success("Lançamento removido");
    },
    onError: () => {
      toast.error("Erro ao remover lançamento");
    },
  });
}

// ── Update Phase ────────────────────────────────────────────────────────────

export function useUpdatePhase(launchId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      phaseId,
      updates,
    }: {
      phaseId: string;
      updates: Partial<LaunchPhase>;
    }) => updatePhase(supabase, phaseId, updates),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launchKeys.detail(launchId) });
    },
  });
}

// ── Approve Gate ────────────────────────────────────────────────────────────

export function useApproveGate(launchId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({ phaseId, notes }: { phaseId: string; notes?: string }) =>
      approveGate(supabase, phaseId, userId!, notes),
    onSuccess: () => {
      toast.success("Gate aprovado — fase concluída");
    },
    onError: () => {
      toast.error("Erro ao aprovar gate");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launchKeys.detail(launchId) });
      queryClient.invalidateQueries({ queryKey: launchKeys.all });
    },
  });
}

// ── Toggle Checklist Item ───────────────────────────────────────────────────

export function useToggleChecklistItem(launchId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      toggleChecklistItem(supabase, itemId, completed, userId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launchKeys.detail(launchId) });
    },
  });
}

// ── Add Checklist Item ──────────────────────────────────────────────────────

export function useAddChecklistItem(launchId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phaseId, title }: { phaseId: string; title: string }) =>
      addChecklistItem(supabase, phaseId, title),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launchKeys.detail(launchId) });
    },
  });
}

// ── Update KPI ──────────────────────────────────────────────────────────────

export function useUpdateKPI(launchId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kpiId, updates }: { kpiId: string; updates: Partial<LaunchKPI> }) =>
      updateKPI(supabase, kpiId, updates),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launchKeys.detail(launchId) });
    },
  });
}
