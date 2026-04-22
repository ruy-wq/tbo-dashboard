"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUsers,
  updateUserRole,
  getAuditLogs,
} from "@/features/configuracoes/services/settings";

export function useProfile() {
  const supabase = createClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => {
      if (!userId) throw new Error("Unauthenticated");
      return getProfile(supabase, userId);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const supabase = createClient();
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (updates: Parameters<typeof updateProfile>[2]) => {
      if (!userId) throw new Error("Unauthenticated");
      return updateProfile(supabase, userId, updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: () => toast.error("Erro ao salvar perfil. Tente novamente."),
  });
}

export function useUploadAvatar() {
  const supabase = createClient();
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error("Unauthenticated");
      const url = await uploadAvatar(supabase, userId, file);
      await updateProfile(supabase, userId, { avatar_url: url });
      return url;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: () => toast.error("Erro ao fazer upload do avatar. Tente novamente."),
  });
}

export function useUsers() {
  const supabase = createClient();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useQuery({
    queryKey: ["users", tenantId],
    queryFn: () => getUsers(supabase),
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId,
  });
}

export function useUpdateUserRole() {
  const supabase = createClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(supabase, userId, role),
    onMutate: async ({ userId, role }) => {
      const key = ["users", tenantId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<{ id: string; role: string | null }[]>(key);
      qc.setQueryData<{ id: string; role: string | null }[] | undefined>(key, (old) =>
        old?.map((u) => (u.id === userId ? { ...u, role } : u)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["users", tenantId], ctx.previous);
      }
      toast.error("Erro ao atualizar role. Tente novamente.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["users", tenantId] });
    },
  });
}

export function useAuditLogs(opts: {
  page?: number;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const supabase = createClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  const page = opts.page ?? 0;
  const limit = 25;

  return useQuery({
    queryKey: ["audit-logs", tenantId, page, opts.action, opts.entityType, opts.dateFrom, opts.dateTo],
    queryFn: () =>
      getAuditLogs(supabase, {
        limit,
        offset: page * limit,
        action: opts.action,
        entityType: opts.entityType,
        dateFrom: opts.dateFrom,
        dateTo: opts.dateTo,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: !!tenantId,
  });
}
