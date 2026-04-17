"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  generateNewsletterDraft,
  listNewsletterDrafts,
  getNewsletterDraft,
  updateNewsletterDraft,
  discardNewsletterDraft,
  type NewsletterBriefing,
  type NewsletterDraft,
} from "../services/newsletter-drafts";

const KEY = "newsletter-drafts" as const;

export function useNewsletterDrafts(limit = 20) {
  const supabase = createClient();
  return useQuery({
    queryKey: [KEY, "list", limit],
    queryFn: () => listNewsletterDrafts(supabase, limit),
    staleTime: 30_000,
  });
}

export function useNewsletterDraft(id: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => getNewsletterDraft(supabase, id!),
    enabled: !!id,
  });
}

export function useGenerateNewsletterDraft() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (briefing: NewsletterBriefing) =>
      generateNewsletterDraft(supabase, briefing),
    onSuccess: (draft) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Edição gerada", {
        description: `"${draft.subject}" pronta para revisão.`,
      });
    },
    onError: (err) => {
      toast.error("Falha ao gerar newsletter", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}

export function useUpdateNewsletterDraft() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Pick<
          NewsletterDraft,
          "subject" | "preheader" | "eyebrow" | "body" | "title" | "status"
        >
      >;
    }) => updateNewsletterDraft(supabase, id, updates),
    onSuccess: (draft) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.setQueryData([KEY, "detail", draft.id], draft);
    },
  });
}

export function useDiscardNewsletterDraft() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discardNewsletterDraft(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success("Edição descartada");
    },
  });
}
