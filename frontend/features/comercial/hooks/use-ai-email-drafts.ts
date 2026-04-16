"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  type AiEmailDraft,
  discardAiEmailDraft,
  generateAiEmailDrafts,
  getAiEmailDraftsByDeal,
  updateAiEmailDraft,
} from "../services/ai-email-drafts";
import { toast } from "sonner";

export function useAiEmailDrafts(dealId: string | null) {
  return useQuery({
    queryKey: ["ai-email-drafts", dealId],
    queryFn: () =>
      getAiEmailDraftsByDeal(createClient() as unknown as SupabaseClient, dealId!),
    enabled: !!dealId,
    staleTime: 1000 * 30,
  });
}

export function useGenerateAiEmailDrafts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dealId: string) =>
      generateAiEmailDrafts(createClient() as unknown as SupabaseClient, dealId),
    onSuccess: (draft) => {
      qc.invalidateQueries({ queryKey: ["ai-email-drafts", draft.deal_id] });
      toast.success("3 rascunhos gerados", {
        description: "Revise as opções e escolha uma.",
      });
    },
    onError: (err) => {
      toast.error("Falha ao gerar rascunhos", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}

export function useUpdateAiEmailDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Pick<
          AiEmailDraft,
          "selected_variant_index" | "final_subject" | "final_body" | "status"
        >
      >;
    }) =>
      updateAiEmailDraft(
        createClient() as unknown as SupabaseClient,
        id,
        updates,
      ),
    onSuccess: (draft) => {
      qc.invalidateQueries({ queryKey: ["ai-email-drafts", draft.deal_id] });
    },
    onError: (err) => {
      toast.error("Falha ao salvar", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}

export function useDiscardAiEmailDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      discardAiEmailDraft(createClient() as unknown as SupabaseClient, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-email-drafts"] });
      toast.success("Rascunho descartado");
    },
    onError: () => toast.error("Falha ao descartar rascunho"),
  });
}
