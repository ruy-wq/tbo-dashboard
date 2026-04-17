import type { SupabaseClient } from "@supabase/supabase-js";

export type CadenceStage = "lead" | "qualificacao" | "proposta" | "negociacao" | "fechado_ganho" | "fechado_perdido";
export type EnrollmentStatus = "active" | "paused" | "completed" | "cancelled";
export type SendStatus = "draft" | "sent" | "failed" | "skipped";

export interface Cadence {
  id: string;
  tenant_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  stage_trigger: CadenceStage;
  bu: string | null;
  default_interval_days: number;
  is_active: boolean;
  is_system: boolean;
  source: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CadenceStep {
  id: string;
  cadence_id: string;
  step_order: number;
  name: string;
  subject_template: string;
  body_template: string;
  objective: string | null;
  role: string | null;
  days_from_previous: number;
  angles: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CadenceEnrollment {
  id: string;
  tenant_id: string;
  deal_id: string;
  cadence_id: string;
  current_step_order: number;
  status: EnrollmentStatus;
  enrolled_by: string | null;
  enrolled_at: string;
  paused_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CadenceSend {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  step_id: string;
  step_order: number;
  status: SendStatus;
  final_subject: string | null;
  final_body: string | null;
  mailchimp_campaign_id: string | null;
  generated_draft_id: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  error_message: string | null;
  sent_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Cadences ──────────────────────────────────────────────────────────────
export async function listCadences(supabase: SupabaseClient): Promise<Cadence[]> {
  const { data, error } = await supabase
    .from("cadences")
    .select("*")
    .eq("is_active", true)
    .order("stage_trigger", { ascending: true })
    .order("bu", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Cadence[];
}

export async function getCadenceWithSteps(
  supabase: SupabaseClient,
  cadenceId: string,
): Promise<{ cadence: Cadence; steps: CadenceStep[] }> {
  const [cadRes, stepsRes] = await Promise.all([
    supabase.from("cadences").select("*").eq("id", cadenceId).single(),
    supabase.from("cadence_steps").select("*").eq("cadence_id", cadenceId).order("step_order", { ascending: true }),
  ]);
  if (cadRes.error) throw cadRes.error;
  if (stepsRes.error) throw stepsRes.error;
  return {
    cadence: cadRes.data as unknown as Cadence,
    steps: (stepsRes.data ?? []) as unknown as CadenceStep[],
  };
}

// ── Enrollments ───────────────────────────────────────────────────────────
export async function listEnrollmentsByDeal(
  supabase: SupabaseClient,
  dealId: string,
): Promise<Array<CadenceEnrollment & { cadence: Cadence }>> {
  const { data, error } = await supabase
    .from("cadence_enrollments")
    .select("*, cadence:cadences!inner(*)")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as never;
}

export async function enrollDeal(
  supabase: SupabaseClient,
  dealId: string,
  cadenceId: string,
  tenantId: string,
): Promise<CadenceEnrollment> {
  const { data: userRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("cadence_enrollments")
    .insert({
      deal_id: dealId,
      cadence_id: cadenceId,
      tenant_id: tenantId,
      enrolled_by: userRes?.user?.id ?? null,
      status: "active",
      current_step_order: 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CadenceEnrollment;
}

export async function updateEnrollmentStatus(
  supabase: SupabaseClient,
  id: string,
  status: EnrollmentStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "paused") patch.paused_at = new Date().toISOString();
  if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();
  if (status === "active") patch.paused_at = null;
  const { error } = await supabase.from("cadence_enrollments").update(patch).eq("id", id);
  if (error) throw error;
}

// ── Sends ─────────────────────────────────────────────────────────────────
export async function listSendsByEnrollment(
  supabase: SupabaseClient,
  enrollmentId: string,
): Promise<CadenceSend[]> {
  const { data, error } = await supabase
    .from("cadence_sends")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("step_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CadenceSend[];
}

export async function generateCadenceStep(
  supabase: SupabaseClient,
  enrollmentId: string,
  opts?: { stepOrder?: number; userGuidance?: string },
): Promise<CadenceSend> {
  const { data, error } = await supabase.functions.invoke("generate-cadence-step", {
    body: {
      enrollment_id: enrollmentId,
      step_order: opts?.stepOrder,
      user_guidance: opts?.userGuidance?.trim() || undefined,
    },
  });
  if (error) throw error;
  if (!data?.success || !data.send) throw new Error(data?.error || "Falha ao gerar step");
  return data.send as CadenceSend;
}

export async function sendCadenceStep(
  supabase: SupabaseClient,
  sendId: string,
  overrides?: { subject?: string; body?: string },
): Promise<{ send_id: string; mailchimp_campaign_id: string; enrollment_completed: boolean; next_step_order: number | null }> {
  const { data, error } = await supabase.functions.invoke("send-cadence-step", {
    body: {
      send_id: sendId,
      override_subject: overrides?.subject,
      override_body: overrides?.body,
    },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Falha ao enviar");
  return data as never;
}

export async function updateCadenceSendDraft(
  supabase: SupabaseClient,
  sendId: string,
  patch: { final_subject?: string; final_body?: string },
): Promise<CadenceSend> {
  const { data, error } = await supabase
    .from("cadence_sends")
    .update(patch)
    .eq("id", sendId)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CadenceSend;
}
