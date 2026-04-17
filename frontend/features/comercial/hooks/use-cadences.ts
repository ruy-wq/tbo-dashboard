"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  type Cadence,
  type CadenceEnrollment,
  type CadenceSend,
  type EnrollmentStatus,
  enrollDeal,
  generateCadenceStep,
  getCadenceWithSteps,
  listCadences,
  listEnrollmentsByDeal,
  listSendsByEnrollment,
  sendCadenceStep,
  updateCadenceSendDraft,
  updateEnrollmentStatus,
} from "../services/cadences";

const KEY = {
  all: ["cadences"] as const,
  list: () => ["cadences", "list"] as const,
  detail: (id: string) => ["cadences", "detail", id] as const,
  enrollmentsByDeal: (dealId: string) => ["cadences", "enrollments", dealId] as const,
  sendsByEnrollment: (enrollmentId: string) => ["cadences", "sends", enrollmentId] as const,
};

export function useCadences() {
  return useQuery({
    queryKey: KEY.list(),
    queryFn: () => listCadences(createClient() as unknown as SupabaseClient),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCadenceDetail(cadenceId: string | null) {
  return useQuery({
    queryKey: cadenceId ? KEY.detail(cadenceId) : ["cadences", "detail", "null"],
    queryFn: () => getCadenceWithSteps(createClient() as unknown as SupabaseClient, cadenceId!),
    enabled: !!cadenceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCadenceEnrollments(dealId: string | null) {
  return useQuery({
    queryKey: dealId ? KEY.enrollmentsByDeal(dealId) : ["cadences", "enrollments", "null"],
    queryFn: () => listEnrollmentsByDeal(createClient() as unknown as SupabaseClient, dealId!),
    enabled: !!dealId,
  });
}

export function useCadenceSends(enrollmentId: string | null) {
  return useQuery({
    queryKey: enrollmentId ? KEY.sendsByEnrollment(enrollmentId) : ["cadences", "sends", "null"],
    queryFn: () => listSendsByEnrollment(createClient() as unknown as SupabaseClient, enrollmentId!),
    enabled: !!enrollmentId,
  });
}

export function useEnrollDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, cadenceId, tenantId }: { dealId: string; cadenceId: string; tenantId: string }) =>
      enrollDeal(createClient() as unknown as SupabaseClient, dealId, cadenceId, tenantId),
    onSuccess: (enrollment) => {
      qc.invalidateQueries({ queryKey: KEY.enrollmentsByDeal(enrollment.deal_id) });
      toast.success("Deal matriculado na cadência");
    },
    onError: (err) => {
      toast.error("Falha ao matricular", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}

export function useUpdateEnrollmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnrollmentStatus; dealId: string }) =>
      updateEnrollmentStatus(createClient() as unknown as SupabaseClient, id, status),
    onSuccess: (_void, vars) => {
      qc.invalidateQueries({ queryKey: KEY.enrollmentsByDeal(vars.dealId) });
      const msg =
        vars.status === "paused" ? "Cadência pausada"
        : vars.status === "cancelled" ? "Cadência cancelada"
        : vars.status === "active" ? "Cadência retomada"
        : "Cadência concluída";
      toast.success(msg);
    },
    onError: (err) => {
      toast.error("Falha ao atualizar cadência", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}

export function useGenerateCadenceStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      stepOrder,
      userGuidance,
    }: {
      enrollmentId: string;
      stepOrder?: number;
      userGuidance?: string;
    }) =>
      generateCadenceStep(createClient() as unknown as SupabaseClient, enrollmentId, {
        stepOrder,
        userGuidance,
      }),
    onSuccess: (send) => {
      qc.invalidateQueries({ queryKey: KEY.sendsByEnrollment(send.enrollment_id) });
      toast.success("Rascunho do e-mail gerado", {
        description: "Revise e clique em Enviar quando estiver pronto.",
      });
    },
    onError: (err) => {
      toast.error("Falha ao gerar rascunho", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}

export function useSendCadenceStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sendId,
      subject,
      body,
    }: {
      sendId: string;
      enrollmentId: string;
      dealId: string;
      subject?: string;
      body?: string;
    }) =>
      sendCadenceStep(createClient() as unknown as SupabaseClient, sendId, {
        subject,
        body,
      }),
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: KEY.sendsByEnrollment(vars.enrollmentId) });
      qc.invalidateQueries({ queryKey: KEY.enrollmentsByDeal(vars.dealId) });
      toast.success(
        result.enrollment_completed ? "E-mail enviado · cadência concluída" : "E-mail enviado",
        {
          description: result.enrollment_completed
            ? "Todos os steps da cadência foram disparados."
            : `Próximo step: ${result.next_step_order}`,
        },
      );
    },
    onError: (err) => {
      toast.error("Falha ao enviar", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}

export function useUpdateCadenceSendDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sendId,
      patch,
    }: {
      sendId: string;
      enrollmentId: string;
      patch: { final_subject?: string; final_body?: string };
    }) => updateCadenceSendDraft(createClient() as unknown as SupabaseClient, sendId, patch),
    onSuccess: (_send, vars) => {
      qc.invalidateQueries({ queryKey: KEY.sendsByEnrollment(vars.enrollmentId) });
    },
  });
}

// Helper pra agrupar cadências por etapa (usado na UI)
export function groupCadencesByStage(cadences: Cadence[]): Record<string, Cadence[]> {
  const grouped: Record<string, Cadence[]> = {};
  for (const c of cadences) {
    if (!grouped[c.stage_trigger]) grouped[c.stage_trigger] = [];
    grouped[c.stage_trigger].push(c);
  }
  return grouped;
}

export type { Cadence, CadenceEnrollment, CadenceSend, EnrollmentStatus };
