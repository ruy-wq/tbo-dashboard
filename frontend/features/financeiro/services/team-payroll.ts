import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeamPayrollEntry {
  id: string;
  tenant_id: string;
  month: string;
  profile_id: string | null;
  name: string;
  role: string;
  section: "equipe" | "vendas" | "outros";
  salary: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined from profiles (canonical source when linked)
  profile_name: string | null;
  profile_cargo: string | null;
  profile_avatar: string | null;
}

export interface UpsertTeamPayrollInput {
  month: string;
  name: string;
  role?: string;
  section?: "equipe" | "vendas" | "outros";
  salary: number;
  is_active?: boolean;
  notes?: string | null;
  profile_id?: string | null;
}

export interface TeamPayrollSummary {
  entries: TeamPayrollEntry[];
  totalFolha: number;
  totalDespesas: number;
  headcount: number;
  month: string;
}

const TABLE = "finance_team_payroll";
const SELECT_WITH_PROFILE =
  "id, tenant_id, month, profile_id, name, role, section, salary, is_active, notes, created_by, created_at, updated_at, profiles:profile_id(full_name, cargo, avatar_url)";
const SELECT_COLS =
  "id, tenant_id, month, profile_id, name, role, section, salary, is_active, notes, created_by, created_at, updated_at";

// ── Helpers ───────────────────────────────────────────────────────────────────

interface RawPayrollRow {
  id: string;
  tenant_id: string;
  month: string;
  profile_id: string | null;
  name: string;
  role: string;
  section: "equipe" | "vendas" | "outros";
  salary: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string; cargo: string; avatar_url: string | null } | null;
}

function mapRow(r: RawPayrollRow): TeamPayrollEntry {
  return {
    id: r.id,
    tenant_id: r.tenant_id,
    month: r.month,
    profile_id: r.profile_id,
    name: r.profiles?.full_name ?? r.name,
    role: r.profiles?.cargo ?? r.role,
    section: r.section,
    salary: r.salary,
    is_active: r.is_active,
    notes: r.notes,
    created_by: r.created_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
    profile_name: r.profiles?.full_name ?? null,
    profile_cargo: r.profiles?.cargo ?? null,
    profile_avatar: r.profiles?.avatar_url ?? null,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Active headcount from profiles (source of truth). */
export async function getActiveHeadcount(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await supabase
    .from("profiles" as never)
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getTeamPayroll(
  supabase: SupabaseClient<Database>,
  month: string,
): Promise<TeamPayrollSummary> {
  const [payrollRes, headcountFromProfiles] = await Promise.all([
    supabase
      .from(TABLE as never)
      .select(SELECT_WITH_PROFILE)
      .eq("month", month)
      .order("salary", { ascending: false }),
    getActiveHeadcount(supabase),
  ]);

  if (payrollRes.error) throw new Error(payrollRes.error.message);

  const entries = (payrollRes.data ?? []).map((r) => mapRow(r as unknown as RawPayrollRow));
  const activeEntries = entries.filter((e) => e.is_active && e.salary > 0);
  const totalFolha = activeEntries.reduce((sum, e) => sum + Number(e.salary), 0);
  const totalDespesas = entries.reduce((sum, e) => sum + Number(e.salary), 0);
  // Headcount from profiles (source of truth), not from payroll entries
  const headcount = headcountFromProfiles;

  return { entries, totalFolha, totalDespesas, headcount, month };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function upsertTeamPayrollEntry(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  userId: string,
  input: UpsertTeamPayrollInput,
): Promise<TeamPayrollEntry> {
  const payload = {
    tenant_id: tenantId,
    month: input.month,
    name: input.name,
    role: input.role ?? "",
    section: input.section ?? "equipe",
    salary: input.salary,
    is_active: input.is_active ?? true,
    notes: input.notes ?? null,
    profile_id: input.profile_id ?? null,
    created_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE as never)
    .upsert(payload as never, { onConflict: "tenant_id,month,name" })
    .select(SELECT_COLS)
    .single();

  if (error) throw new Error(error.message);
  const row = data as unknown as RawPayrollRow;
  return { ...row, profile_name: null, profile_cargo: null, profile_avatar: null };
}

export async function updateTeamPayrollEntry(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Partial<Pick<TeamPayrollEntry, "name" | "role" | "section" | "salary" | "is_active" | "notes">>,
): Promise<TeamPayrollEntry> {
  const { data, error } = await supabase
    .from(TABLE as never)
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();

  if (error) throw new Error(error.message);
  const row = data as unknown as RawPayrollRow;
  return { ...row, profile_name: null, profile_cargo: null, profile_avatar: null };
}

export async function deleteTeamPayrollEntry(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE as never)
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function duplicateMonthPayroll(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  userId: string,
  sourceMonth: string,
  targetMonth: string,
): Promise<TeamPayrollEntry[]> {
  const { entries: source } = await getTeamPayroll(supabase, sourceMonth);
  if (source.length === 0) return [];

  const payloads = source.map((e) => ({
    tenant_id: tenantId,
    month: targetMonth,
    name: e.name,
    role: e.role,
    section: e.section,
    salary: e.salary,
    is_active: e.is_active,
    notes: e.notes,
    profile_id: e.profile_id,
    created_by: userId,
  }));

  const { data, error } = await supabase
    .from(TABLE as never)
    .upsert(payloads as never, { onConflict: "tenant_id,month,name" })
    .select(SELECT_COLS);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const row = r as unknown as RawPayrollRow;
    return { ...row, profile_name: null, profile_cargo: null, profile_avatar: null };
  });
}
