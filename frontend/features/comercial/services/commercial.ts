import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

// ── RD Pipeline types ───────────────────────────────────────────────────────────

export interface RdPipelineStage {
  id: string;
  name: string;
  order: number;
}

export interface RdPipelineRow {
  id: string;
  tenant_id: string;
  rd_pipeline_id: string;
  name: string;
  stages: RdPipelineStage[];
  owner_name: string | null;
  deal_count: number;
  created_at: string;
  updated_at: string;
}

interface DealFilters {
  stage?: string;
  search?: string;
  owner_id?: string;
  pipeline?: string;
  owner_name?: string;
  rd_stage_id?: string;
}

/**
 * Busca TODOS os deals que batem com o filtro, contornando o max-rows do PostgREST (1000).
 * Pagina internamente em batches de 1000 até esgotar.
 */
export async function getDeals(
  supabase: SupabaseClient<Database>,
  filters?: DealFilters,
): Promise<DealRow[]> {
  const PAGE = 1000;
  const all: DealRow[] = [];
  let from = 0;
  const MAX = 50_000;
  while (from < MAX) {
    let query = supabase
      .from("crm_deals")
      .select("*")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE - 1);

    if (filters?.stage) query = query.eq("stage", filters.stage);
    if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id);
    if (filters?.pipeline) query = query.eq("rd_pipeline_id" as never, filters.pipeline);
    if (filters?.owner_name) query = query.eq("owner_name", filters.owner_name);
    if (filters?.rd_stage_id) query = query.eq("rd_stage_id" as never, filters.rd_stage_id);
    if (filters?.search) {
      const safe = filters.search
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/,/g, "\\,")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\./g, "\\.");
      query = query.or(`name.ilike.%${safe}%,company.ilike.%${safe}%,contact.ilike.%${safe}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as DealRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export async function getDealById(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data, error } = await supabase
    .from("crm_deals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as DealRow;
}

export async function createDeal(
  supabase: SupabaseClient<Database>,
  deal: Database["public"]["Tables"]["crm_deals"]["Insert"],
) {
  const { data, error } = await supabase
    .from("crm_deals")
    .insert(deal as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DealRow;
}

export async function updateDeal(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["crm_deals"]["Update"],
) {
  const { data, error } = await supabase
    .from("crm_deals")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DealRow;
}

export async function updateDealStage(
  supabase: SupabaseClient<Database>,
  id: string,
  stage: string,
) {
  return updateDeal(supabase, id, { stage });
}

// ── Bulk operations ────────────────────────────────────────────────────────

export async function bulkUpdateDealStage(
  supabase: SupabaseClient<Database>,
  ids: string[],
  stage: string,
): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase
    .from("crm_deals")
    .update({ stage } as never, { count: "exact" })
    .in("id", ids);
  if (error) throw error;
  return count ?? ids.length;
}

export async function bulkUpdateDealOwner(
  supabase: SupabaseClient<Database>,
  ids: string[],
  ownerName: string | null,
): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase
    .from("crm_deals")
    .update({ owner_name: ownerName } as never, { count: "exact" })
    .in("id", ids);
  if (error) throw error;
  return count ?? ids.length;
}

export async function bulkUpdateDealPriority(
  supabase: SupabaseClient<Database>,
  ids: string[],
  priority: string,
): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase
    .from("crm_deals")
    .update({ priority } as never, { count: "exact" })
    .in("id", ids);
  if (error) throw error;
  return count ?? ids.length;
}

export async function bulkDeleteDeals(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase
    .from("crm_deals")
    .delete({ count: "exact" })
    .in("id", ids);
  if (error) throw error;
  return count ?? ids.length;
}

export interface PipelineOption {
  pipeline_name: string;
  owner_name: string | null;
  deal_count: number;
}

export async function getDealPipelines(
  supabase: SupabaseClient<Database>,
): Promise<PipelineOption[]> {
  const { data, error } = await supabase
    .from("crm_deals")
    .select("rd_pipeline_name, owner_name" as never)
    .not("rd_pipeline_name" as never, "is", null);

  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    rd_pipeline_name: string;
    owner_name: string | null;
  }>;
  const map = new Map<string, { owner_name: string | null; count: number }>();

  for (const r of rows) {
    const key = r.rd_pipeline_name;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { owner_name: r.owner_name, count: 1 });
    }
  }

  return Array.from(map.entries()).map(([name, v]) => ({
    pipeline_name: name,
    owner_name: v.owner_name,
    deal_count: v.count,
  }));
}

// ── Pipelines (com stages persistidos) ───────────────────────────────────────

export async function getRdPipelines(
  supabase: SupabaseClient<Database>,
): Promise<RdPipelineRow[]> {
  const { data, error } = await supabase
    .from("rd_pipelines" as never)
    .select("*")
    .order("name");

  if (error) throw error;
  return (data ?? []) as unknown as RdPipelineRow[];
}

export async function getRdPipelineById(
  supabase: SupabaseClient<Database>,
  pipelineId: string,
): Promise<RdPipelineRow | null> {
  const { data, error } = await supabase
    .from("rd_pipelines" as never)
    .select("*")
    .eq("rd_pipeline_id", pipelineId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as RdPipelineRow | null;
}

// ── Owners (distinct from deals) ────────────────────────────────────────────────

export async function getDealOwners(
  supabase: SupabaseClient<Database>,
  pipelineId?: string,
): Promise<string[]> {
  let query = supabase
    .from("crm_deals")
    .select("owner_name" as never)
    .not("owner_name", "is", null);

  if (pipelineId) {
    query = query.eq("rd_pipeline_id" as never, pipelineId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{ owner_name: string }>;
  const unique = new Set(rows.map((r) => r.owner_name));
  return Array.from(unique).sort();
}

// ── CRM Stages (dynamic, from Supabase) ─────────────────────────────────────

export interface CrmStageRow {
  id: string;
  label: string;
  sort_order: number;
  color: string | null;
  bg: string | null;
  tenant_id: string;
}

export async function getCrmStages(
  supabase: SupabaseClient<Database>,
): Promise<CrmStageRow[]> {
  const { data, error } = await supabase
    .from("crm_stages")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as CrmStageRow[];
}

export async function createCrmStage(
  supabase: SupabaseClient<Database>,
  stage: { id: string; label: string; sort_order: number; color: string; bg: string; tenant_id: string },
): Promise<CrmStageRow> {
  const { data, error } = await supabase
    .from("crm_stages")
    .insert(stage as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as CrmStageRow;
}

export async function updateCrmStage(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Partial<{ label: string; sort_order: number; color: string; bg: string }>,
): Promise<CrmStageRow> {
  const { data, error } = await supabase
    .from("crm_stages")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as CrmStageRow;
}

export async function deleteCrmStage(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("crm_stages")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

const CLOSED_STAGES = ["fechado_ganho", "fechado_perdido"];

export function computeDealKPIs(deals: DealRow[]) {
  const activeDeals = deals.filter((d) => !CLOSED_STAGES.includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "fechado_ganho");
  const lostDeals = deals.filter((d) => d.stage === "fechado_perdido");
  const totalClosed = wonDeals.length + lostDeals.length;

  const pipelineValue = activeDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const wonValue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const forecast = activeDeals.reduce(
    (s, d) => s + ((d.value ?? 0) * (d.probability ?? 0)) / 100,
    0,
  );
  const conversionRate =
    totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

  return {
    total: deals.length,
    active: activeDeals.length,
    won: wonDeals.length,
    lost: lostDeals.length,
    pipelineValue,
    wonValue,
    forecast,
    conversionRate,
  };
}
