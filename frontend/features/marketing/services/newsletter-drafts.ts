import type { SupabaseClient } from "@supabase/supabase-js";

export interface NewsletterBriefing {
  theme: string;
  tone?: string;
  audience_hint?: string;
  highlights?: string[];
  include_trending?: boolean;
  send_time?: "morning" | "afternoon" | "evening";
  target_segment_id?: string | null;
}

export interface NewsletterDraft {
  id: string;
  tenant_id: string | null;
  title: string;
  subject: string;
  preheader: string | null;
  eyebrow: string | null;
  body: string;
  briefing: NewsletterBriefing;
  target_segment_id: string | null;
  status: "pending_review" | "edited" | "scheduled" | "sent" | "discarded";
  scheduled_at: string | null;
  sent_at: string | null;
  discarded_at: string | null;
  mailchimp_campaign_id: string | null;
  recipient_count: number | null;
  opens_count: number | null;
  clicks_count: number | null;
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

export async function generateNewsletterDraft(
  supabase: SupabaseClient,
  briefing: NewsletterBriefing,
): Promise<NewsletterDraft> {
  const { data, error } = await supabase.functions.invoke("generate-newsletter-draft", {
    body: { briefing },
  });
  if (error) throw error;
  if (!data?.success || !data.draft) {
    throw new Error(data?.error || "Falha ao gerar newsletter");
  }
  return data.draft as NewsletterDraft;
}

export async function listNewsletterDrafts(
  supabase: SupabaseClient,
  limit = 20,
): Promise<NewsletterDraft[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("ai_newsletter_drafts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsletterDraft[];
}

export async function getNewsletterDraft(
  supabase: SupabaseClient,
  id: string,
): Promise<NewsletterDraft> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("ai_newsletter_drafts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as NewsletterDraft;
}

export async function updateNewsletterDraft(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<
    Pick<
      NewsletterDraft,
      | "subject"
      | "preheader"
      | "eyebrow"
      | "body"
      | "title"
      | "status"
      | "target_segment_id"
    >
  >,
): Promise<NewsletterDraft> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("ai_newsletter_drafts")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as NewsletterDraft;
}

export async function discardNewsletterDraft(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await (supabase as SupabaseClient)
    .from("ai_newsletter_drafts")
    .update({
      status: "discarded",
      discarded_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (error) throw error;
}
