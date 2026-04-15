import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EmailTemplate,
  EmailCampaign,
  EmailSend,
  EmailAnalytics,
} from "../types/marketing";

// NOTE: Tables (email_templates, email_campaigns, email_sends) will be created via migration.
// Until then, cast to untyped SupabaseClient to bypass strict DB typing.

// ── Templates ──────────────────────────────────────────────────────

export async function getEmailTemplates(supabase: SupabaseClient): Promise<EmailTemplate[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_templates")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EmailTemplate[];
}

export async function getEmailTemplate(supabase: SupabaseClient, id: string): Promise<EmailTemplate> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as EmailTemplate;
}

export async function createEmailTemplate(
  supabase: SupabaseClient,
  data: Pick<EmailTemplate, "name" | "subject" | "html_content" | "category" | "tags">,
): Promise<EmailTemplate> {
  const { data: row, error } = await (supabase as SupabaseClient)
    .from("email_templates")
    .insert(data as never)
    .select()
    .single();
  if (error) throw error;
  return row as unknown as EmailTemplate;
}

export async function updateEmailTemplate(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<EmailTemplate, "name" | "subject" | "html_content" | "category" | "tags">>,
): Promise<EmailTemplate> {
  const { data: row, error } = await (supabase as SupabaseClient)
    .from("email_templates")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return row as unknown as EmailTemplate;
}

export async function deleteEmailTemplate(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await (supabase as SupabaseClient)
    .from("email_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Campaigns ──────────────────────────────────────────────────────

export async function getEmailCampaigns(supabase: SupabaseClient): Promise<EmailCampaign[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EmailCampaign[];
}

export async function getEmailCampaign(supabase: SupabaseClient, id: string): Promise<EmailCampaign> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_campaigns")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as EmailCampaign;
}

export async function createEmailCampaign(
  supabase: SupabaseClient,
  data: Pick<EmailCampaign, "name" | "subject" | "template_id" | "list_id" | "scheduled_at">,
): Promise<EmailCampaign> {
  const { data: row, error } = await (supabase as SupabaseClient)
    .from("email_campaigns")
    .insert({ ...data, status: "draft" } as never)
    .select()
    .single();
  if (error) throw error;
  return row as unknown as EmailCampaign;
}

export async function updateEmailCampaign(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<EmailCampaign, "name" | "subject" | "template_id" | "list_id" | "scheduled_at" | "status">>,
): Promise<EmailCampaign> {
  const { data: row, error } = await (supabase as SupabaseClient)
    .from("email_campaigns")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return row as unknown as EmailCampaign;
}

export async function sendEmailCampaign(supabase: SupabaseClient, id: string): Promise<{ success: boolean; recipients: number; delivered: number; bounced: number }> {
  // Chama Edge Function que resolve segmento → emails → envia via Resend
  const { data, error } = await supabase.functions.invoke("send-email-campaign", {
    body: { campaign_id: id },
  });
  if (error) throw error;
  return data as { success: boolean; recipients: number; delivered: number; bounced: number };
}

// ── Sends ──────────────────────────────────────────────────────────

export async function getEmailSends(supabase: SupabaseClient): Promise<EmailSend[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_sends")
    .select("*")
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EmailSend[];
}

export async function getEmailSendsByCampaign(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<EmailSend[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_sends")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EmailSend[];
}

// ── Analytics ──────────────────────────────────────────────────────

export async function getEmailAnalytics(supabase: SupabaseClient): Promise<EmailAnalytics[]> {
  // Agrega métricas de email_sends por campanha
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_sends")
    .select("campaign_id, campaign_name, recipient_count, delivered, opened, clicked, bounced, unsubscribed, status");
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    campaign_id: string;
    campaign_name: string;
    recipient_count: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    status: string;
  }>;

  // Agrupa por campaign_id
  const grouped = new Map<string, EmailAnalytics>();
  for (const row of rows) {
    const existing = grouped.get(row.campaign_id);
    if (existing) {
      existing.total_sent += row.recipient_count;
      existing.total_delivered += row.delivered;
      existing.total_opened += row.opened;
      existing.total_clicked += row.clicked;
      existing.total_bounced += row.bounced;
      existing.total_unsubscribed += row.unsubscribed;
    } else {
      grouped.set(row.campaign_id, {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        total_sent: row.recipient_count,
        total_delivered: row.delivered,
        total_opened: row.opened,
        total_clicked: row.clicked,
        total_bounced: row.bounced,
        total_unsubscribed: row.unsubscribed,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0,
        unsubscribe_rate: 0,
      });
    }
  }

  // Calcula taxas
  return Array.from(grouped.values()).map((a) => ({
    ...a,
    open_rate: a.total_delivered > 0 ? (a.total_opened / a.total_delivered) * 100 : 0,
    click_rate: a.total_opened > 0 ? (a.total_clicked / a.total_opened) * 100 : 0,
    bounce_rate: a.total_sent > 0 ? (a.total_bounced / a.total_sent) * 100 : 0,
    unsubscribe_rate: a.total_delivered > 0 ? (a.total_unsubscribed / a.total_delivered) * 100 : 0,
  }));
}

export async function getEmailCampaignAnalytics(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<EmailAnalytics> {
  const all = await getEmailAnalytics(supabase);
  const found = all.find((a) => a.campaign_id === campaignId);
  if (!found) throw new Error(`Analytics not found for campaign ${campaignId}`);
  return found;
}
