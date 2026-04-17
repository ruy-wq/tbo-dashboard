"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { curateNewsletterThemes } from "../services/newsletter-curator";

export function useCurateNewsletterThemes() {
  const supabase = createClient();
  return useMutation({
    mutationFn: () => curateNewsletterThemes(supabase),
    onError: (err) => {
      toast.error("Falha ao buscar temas", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    },
  });
}
