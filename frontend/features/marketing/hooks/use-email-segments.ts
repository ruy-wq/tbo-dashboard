"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getEmailSegments,
  getEmailSegment,
  createEmailSegment,
  updateEmailSegment,
  deleteEmailSegment,
  estimateSegmentCount,
  refreshSegmentCount,
} from "../services/email-segments";
import type { EmailSegmentInput, SegmentRuleSet } from "../types/marketing";
import { toast } from "sonner";

export function useEmailSegments() {
  return useQuery({
    queryKey: ["email-studio", "segments"],
    queryFn: () => getEmailSegments(createClient()),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmailSegment(id: string | null) {
  return useQuery({
    queryKey: ["email-studio", "segments", id],
    queryFn: () => getEmailSegment(createClient(), id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateEmailSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmailSegmentInput) => createEmailSegment(createClient(), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-studio", "segments"] });
      toast.success("Segmento criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar segmento"),
  });
}

export function useUpdateEmailSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailSegmentInput> }) =>
      updateEmailSegment(createClient(), id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-studio", "segments"] });
      toast.success("Segmento atualizado");
    },
    onError: () => toast.error("Erro ao atualizar segmento"),
  });
}

export function useDeleteEmailSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmailSegment(createClient(), id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-studio", "segments"] });
      toast.success("Segmento excluído");
    },
    onError: () => toast.error("Erro ao excluir segmento"),
  });
}

export function useEstimateSegmentCount(rules: SegmentRuleSet | null) {
  return useQuery({
    queryKey: ["email-studio", "segments", "estimate", rules],
    queryFn: () => estimateSegmentCount(createClient(), rules!),
    enabled: !!rules && rules.rules.length > 0,
    staleTime: 1000 * 30,
  });
}

export function useRefreshSegmentCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ segmentId, rules }: { segmentId: string; rules: SegmentRuleSet }) =>
      refreshSegmentCount(createClient(), segmentId, rules),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-studio", "segments"] });
      toast.success("Contagem atualizada");
    },
    onError: () => toast.error("Erro ao atualizar contagem"),
  });
}
