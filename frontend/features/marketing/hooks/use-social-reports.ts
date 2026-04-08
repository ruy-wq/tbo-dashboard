import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface SocialReportRow {
  id: string;
  token: string;
  client_name: string;
  handle: string | null;
  platform: string;
  report_data: Record<string, unknown>;
  period_label: string | null;
  period_start: string | null;
  period_end: string | null;
  access_password: string | null;
  access_count: number;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  is_active: boolean;
  created_at: string;
}

const KEYS = {
  all: ["social-reports"] as const,
  list: () => [...KEYS.all, "list"] as const,
  byToken: (token: string) => [...KEYS.all, "token", token] as const,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateReportToken(clientName: string, periodLabel: string): string {
  const client = slugify(clientName || "cliente");
  const period = slugify(periodLabel || "relatorio");
  const random = Math.random().toString(36).slice(2, 7);
  return `${client}-${period}-${random}`;
}

interface CreateReportInput {
  tenantId: string;
  clientName: string;
  handle?: string;
  platform?: string;
  reportData: Record<string, unknown>;
  periodLabel?: string;
  periodStart?: string;
  periodEnd?: string;
  accessPassword?: string;
}

export function useCreateSocialReport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const token = generateReportToken(input.clientName, input.periodLabel ?? "");
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("client_social_reports")
        .insert({
          tenant_id: input.tenantId,
          token,
          client_name: input.clientName,
          handle: input.handle ?? null,
          platform: input.platform ?? "instagram",
          report_data: input.reportData,
          period_label: input.periodLabel ?? null,
          period_start: input.periodStart ?? null,
          period_end: input.periodEnd ?? null,
          access_password: input.accessPassword ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SocialReportRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Link de compartilhamento criado.");
    },
    onError: () => {
      toast.error("Erro ao criar link de compartilhamento.");
    },
  });
}

export function useSocialReports() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("client_social_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SocialReportRow[];
    },
  });
}
