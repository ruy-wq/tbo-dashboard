import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailSegment, EmailSegmentInput } from "../types/marketing";

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

export async function estimateSegmentCount(
  supabase: SupabaseClient,
  rules: EmailSegment["rules"],
): Promise<number> {
  // Constrói query dinâmica contra crm_deals
  let query = (supabase as SupabaseClient)
    .from("crm_deals")
    .select("id", { count: "exact", head: true });

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

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
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
