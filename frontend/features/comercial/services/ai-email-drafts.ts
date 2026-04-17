import type { SupabaseClient } from "@supabase/supabase-js";

export interface AiEmailDraftVariant {
  label: string;
  tone: string;
  subject: string;
  body: string;
}

export interface AiEmailDraft {
  id: string;
  tenant_id: string | null;
  deal_id: string;
  stage_at_generation: string;
  variants: AiEmailDraftVariant[];
  selected_variant_index: number | null;
  final_subject: string | null;
  final_body: string | null;
  status: "pending_review" | "edited" | "sent" | "discarded";
  sent_at: string | null;
  discarded_at: string | null;
  mailchimp_campaign_id: string | null;
  model: string | null;
  prompt_version: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  generation_ms: number | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAiEmailDraftsByDeal(
  supabase: SupabaseClient,
  dealId: string,
): Promise<AiEmailDraft[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("ai_email_drafts")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AiEmailDraft[];
}

export async function generateAiEmailDrafts(
  supabase: SupabaseClient,
  dealId: string,
  userGuidance?: string,
): Promise<AiEmailDraft> {
  const { data, error } = await supabase.functions.invoke("generate-ai-email-drafts", {
    body: { deal_id: dealId, user_guidance: userGuidance?.trim() || undefined },
  });
  if (error) throw error;
  if (!data?.success || !data.draft) {
    throw new Error(data?.error || "Falha ao gerar rascunhos");
  }
  return data.draft as AiEmailDraft;
}

export async function updateAiEmailDraft(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<
    Pick<
      AiEmailDraft,
      "selected_variant_index" | "final_subject" | "final_body" | "status"
    >
  >,
): Promise<AiEmailDraft> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("ai_email_drafts")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as AiEmailDraft;
}

export async function discardAiEmailDraft(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await (supabase as SupabaseClient)
    .from("ai_email_drafts")
    .update({
      status: "discarded",
      discarded_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (error) throw error;
}
