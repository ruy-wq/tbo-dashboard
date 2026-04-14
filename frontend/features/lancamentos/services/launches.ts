import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { PHASE_DEFINITIONS, DEFAULT_KPIS } from "../lib/constants";

// ── Types ───────────────────────────────────────────────────────────────────

export interface Launch {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  target_vgv: number;
  target_units: number;
  location: string | null;
  persona: string | null;
  positioning: string | null;
  pricing_strategy: string | null;
  commercial_policy: string | null;
  commission_structure: string | null;
  market_diagnosis: string | null;
  investment_thesis: string | null;
  current_phase: number;
  overall_progress: number;
  actual_vgv: number;
  units_sold: number;
  cac: number;
  conversion_rate: number;
  status: string;
  start_date: string | null;
  target_date: string | null;
  cover_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaunchPhase {
  id: string;
  launch_id: string;
  phase_number: number;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  gate_approved: boolean;
  gate_approved_by: string | null;
  gate_approved_at: string | null;
  gate_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaunchPhaseItem {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  is_required: boolean;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface LaunchKPI {
  id: string;
  launch_id: string;
  phase_number: number | null;
  name: string;
  category: string;
  target_value: number | null;
  current_value: number;
  unit: string;
  trend: string;
  alert_threshold: number | null;
  is_alert: boolean;
  created_at: string;
  updated_at: string;
}

export interface LaunchWithPhases extends Launch {
  launch_phases: (LaunchPhase & { launch_phase_items: LaunchPhaseItem[] })[];
  launch_kpis: LaunchKPI[];
}

// ── Queries ─────────────────────────────────────────────────────────────────

export async function getLaunches(
  supabase: SupabaseClient<Database>,
  filters?: { status?: string; search?: string },
): Promise<Launch[]> {
  let query = supabase
    .from("launches" as never)
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    const safe = filters.search
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%");
    query = query.or(`name.ilike.%${safe}%,location.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Launch[];
}

export async function getLaunchById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<LaunchWithPhases> {
  const { data, error } = await supabase
    .from("launches" as never)
    .select(`
      *,
      launch_phases(*, launch_phase_items(*)),
      launch_kpis(*)
    `)
    .eq("id", id)
    .order("phase_number", { referencedTable: "launch_phases", ascending: true })
    .order("sort_order", { referencedTable: "launch_phases.launch_phase_items", ascending: true })
    .single();

  if (error) throw error;
  return data as unknown as LaunchWithPhases;
}

// ── Mutations ───────────────────────────────────────────────────────────────

export interface CreateLaunchInput {
  tenant_id: string;
  name: string;
  description?: string;
  target_vgv?: number;
  target_units?: number;
  location?: string;
  start_date?: string;
  target_date?: string;
  created_by?: string;
}

export async function createLaunch(
  supabase: SupabaseClient<Database>,
  input: CreateLaunchInput,
): Promise<Launch> {
  // 1. Create the launch
  const { data: launch, error } = await supabase
    .from("launches" as never)
    .insert(input as never)
    .select()
    .single();

  if (error) throw error;
  const created = launch as unknown as Launch;

  // 2. Create the 7 default phases
  const phases = PHASE_DEFINITIONS.map((def) => ({
    launch_id: created.id,
    phase_number: def.number,
    name: def.name,
    description: def.description,
    status: def.number === 1 ? "in_progress" : "pending",
  }));

  const { data: createdPhases, error: phaseError } = await supabase
    .from("launch_phases" as never)
    .insert(phases as never)
    .select();

  if (phaseError) throw phaseError;
  const phasesData = createdPhases as unknown as LaunchPhase[];

  // 3. Create default checklist items per phase
  const items = phasesData.flatMap((phase) => {
    const def = PHASE_DEFINITIONS.find((d) => d.number === phase.phase_number);
    if (!def) return [];
    return def.defaultItems.map((title, idx) => ({
      phase_id: phase.id,
      title,
      is_required: true,
      sort_order: idx,
    }));
  });

  if (items.length > 0) {
    const { error: itemError } = await supabase
      .from("launch_phase_items" as never)
      .insert(items as never);
    if (itemError) throw itemError;
  }

  // 4. Create default KPIs
  const kpis = DEFAULT_KPIS.map((k) => ({
    launch_id: created.id,
    name: k.name,
    category: k.category,
    unit: k.unit,
    phase_number: k.phase_number,
    target_value: 0,
    current_value: 0,
  }));

  const { error: kpiError } = await supabase
    .from("launch_kpis" as never)
    .insert(kpis as never);
  if (kpiError) throw kpiError;

  return created;
}

export async function updateLaunch(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Partial<Launch>,
): Promise<Launch> {
  const { data, error } = await supabase
    .from("launches" as never)
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Launch;
}

export async function deleteLaunch(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("launches" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Phase Operations ────────────────────────────────────────────────────────

export async function updatePhase(
  supabase: SupabaseClient<Database>,
  phaseId: string,
  updates: Partial<LaunchPhase>,
): Promise<LaunchPhase> {
  const { data, error } = await supabase
    .from("launch_phases" as never)
    .update(updates as never)
    .eq("id", phaseId)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LaunchPhase;
}

export async function approveGate(
  supabase: SupabaseClient<Database>,
  phaseId: string,
  userId: string,
  notes?: string,
): Promise<void> {
  const { error } = await supabase
    .from("launch_phases" as never)
    .update({
      gate_approved: true,
      gate_approved_by: userId,
      gate_approved_at: new Date().toISOString(),
      gate_notes: notes ?? null,
      status: "completed",
      completed_at: new Date().toISOString(),
      progress: 100,
    } as never)
    .eq("id", phaseId);

  if (error) throw error;
}

// ── Checklist Operations ────────────────────────────────────────────────────

export async function toggleChecklistItem(
  supabase: SupabaseClient<Database>,
  itemId: string,
  completed: boolean,
  userId?: string,
): Promise<LaunchPhaseItem> {
  const { data, error } = await supabase
    .from("launch_phase_items" as never)
    .update({
      is_completed: completed,
      completed_by: completed ? userId ?? null : null,
      completed_at: completed ? new Date().toISOString() : null,
    } as never)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LaunchPhaseItem;
}

export async function addChecklistItem(
  supabase: SupabaseClient<Database>,
  phaseId: string,
  title: string,
): Promise<LaunchPhaseItem> {
  const { data, error } = await supabase
    .from("launch_phase_items" as never)
    .insert({ phase_id: phaseId, title, is_required: false } as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LaunchPhaseItem;
}

// ── KPI Operations ──────────────────────────────────────────────────────────

export async function updateKPI(
  supabase: SupabaseClient<Database>,
  kpiId: string,
  updates: Partial<LaunchKPI>,
): Promise<LaunchKPI> {
  const { data, error } = await supabase
    .from("launch_kpis" as never)
    .update(updates as never)
    .eq("id", kpiId)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LaunchKPI;
}
