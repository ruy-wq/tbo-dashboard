import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailSegment, EmailSegmentInput, SegmentRuleSet } from "../types/marketing";

export interface SegmentLead {
  id: string;
  name: string;
  company: string | null;
  contact: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  stage: string;
  source: string | null;
  value: number | null;
  tags: string[] | null;
  updated_at: string | null;
}

// ── Segments CRUD ─────────────────────────────────────────────────────

export async function getEmailSegments(supabase: SupabaseClient): Promise<EmailSegment[]> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_segments")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EmailSegment[];
}

export async function getEmailSegment(supabase: SupabaseClient, id: string): Promise<EmailSegment> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_segments")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as EmailSegment;
}

export async function createEmailSegment(
  supabase: SupabaseClient,
  input: EmailSegmentInput,
): Promise<EmailSegment> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_segments")
    .insert(input as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as EmailSegment;
}

export async function updateEmailSegment(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<EmailSegmentInput>,
): Promise<EmailSegment> {
  const { data, error } = await (supabase as SupabaseClient)
    .from("email_segments")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as EmailSegment;
}

export async function deleteEmailSegment(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await (supabase as SupabaseClient)
    .from("email_segments")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Contagem estimada de deals por segmento ───────────────────────────

type CrmDealQuery = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

function applySegmentRules(query: CrmDealQuery, rules: SegmentRuleSet): CrmDealQuery {
  for (const rule of rules.rules) {
    switch (rule.field) {
      case "funnel_stage":
        if (rule.operator === "equals" && typeof rule.value === "string") {
          query = query.eq("stage", rule.value);
        } else if (rule.operator === "in" && Array.isArray(rule.value)) {
          query = query.in("stage", rule.value);
        } else if (rule.operator === "not_equals" && typeof rule.value === "string") {
          query = query.neq("stage", rule.value);
        } else if (rule.operator === "not_in" && Array.isArray(rule.value)) {
          // Supabase não tem .notIn nativo — filtrar client-side se necessário
          // Usa not.in. filter
          query = query.not("stage", "in", `(${(rule.value as string[]).join(",")})`);
        }
        break;
      case "deal_source":
        if (rule.operator === "equals" && typeof rule.value === "string") {
          query = query.eq("source", rule.value);
        } else if (rule.operator === "in" && Array.isArray(rule.value)) {
          query = query.in("source", rule.value);
        }
        break;
      case "deal_value_min":
        if (typeof rule.value === "number") {
          query = query.gte("value", rule.value);
        }
        break;
      case "deal_value_max":
        if (typeof rule.value === "number") {
          query = query.lte("value", rule.value);
        }
        break;
      case "has_email":
        if (rule.value === true) {
          query = query.not("contact_email", "is", null);
          query = query.neq("contact_email", "");
        }
        break;
      case "created_after":
        if (typeof rule.value === "string") {
          query = query.gte("created_at", rule.value);
        }
        break;
      case "created_before":
        if (typeof rule.value === "string") {
          query = query.lte("created_at", rule.value);
        }
        break;
      case "bu":
        if (rule.operator === "equals" && typeof rule.value === "string") {
          query = query.eq("bu", rule.value);
        } else if (rule.operator === "in" && Array.isArray(rule.value)) {
          query = query.in("bu", rule.value);
        }
        break;
      case "tags":
        if (rule.operator === "contains" && typeof rule.value === "string") {
          query = query.contains("tags", [rule.value]);
        }
        break;
    }
  }
  return query;
}

export async function estimateSegmentCount(
  supabase: SupabaseClient,
  rules: SegmentRuleSet,
): Promise<number> {
  const baseQuery = (supabase as SupabaseClient)
    .from("crm_deals")
    .select("id", { count: "exact", head: true });
  const query = applySegmentRules(baseQuery as CrmDealQuery, rules);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

const LEAD_SELECT =
  "id, name, company, contact, contact_email, contact_phone, stage, source, value, tags, updated_at";

export async function listSegmentLeads(
  supabase: SupabaseClient,
  segment: Pick<EmailSegment, "segment_type" | "rules" | "static_deal_ids">,
  limit = 500,
): Promise<SegmentLead[]> {
  if (segment.segment_type === "static") {
    if (!segment.static_deal_ids?.length) return [];
    const { data, error } = await (supabase as SupabaseClient)
      .from("crm_deals")
      .select(LEAD_SELECT)
      .in("id", segment.static_deal_ids)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as SegmentLead[];
  }

  const baseQuery = (supabase as SupabaseClient)
    .from("crm_deals")
    .select(LEAD_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);
  const query = applySegmentRules(baseQuery as CrmDealQuery, segment.rules);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as SegmentLead[];
}

export async function refreshSegmentCount(
  supabase: SupabaseClient,
  segmentId: string,
  rules: EmailSegment["rules"],
): Promise<number> {
  const count = await estimateSegmentCount(supabase, rules);
  await (supabase as SupabaseClient)
    .from("email_segments")
    .update({ estimated_count: count, last_counted_at: new Date().toISOString() } as never)
    .eq("id", segmentId);
  return count;
}
