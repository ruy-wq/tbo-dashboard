import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OperationalIndicator {
  id: string;
  tenant_id: string;
  month: string; // "YYYY-MM"
  headcount: number | null;
  folha_pagamento: number | null;
  custos_fixos: number | null;
  meta_receita: number | null;
  meta_margem: number | null;
  churn_clientes_perdidos: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertOperationalIndicatorInput {
  month: string;
  headcount?: number | null;
  folha_pagamento?: number | null;
  custos_fixos?: number | null;
  meta_receita?: number | null;
  meta_margem?: number | null;
  churn_clientes_perdidos?: number | null;
  notes?: string | null;
}

const SELECT_COLS =
  "id, tenant_id, month, headcount, folha_pagamento, custos_fixos, meta_receita, meta_margem, churn_clientes_perdidos, notes, created_by, created_at, updated_at";

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Returns operational indicators for a specific month, or null if none exist.
 */
export async function getOperationalIndicators(
  supabase: SupabaseClient<Database>,
  month: string,
): Promise<OperationalIndicator | null> {
  const { data, error } = await supabase
    .from("finance_operational_indicators")
    .select(SELECT_COLS)
    .eq("month", month)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as OperationalIndicator | null;
}

/**
 * Returns operational indicators for a range of months, ordered by month ASC.
 */
export async function getOperationalIndicatorsRange(
  supabase: SupabaseClient<Database>,
  fromMonth: string,
  toMonth: string,
): Promise<OperationalIndicator[]> {
  const { data, error } = await supabase
    .from("finance_operational_indicators")
    .select(SELECT_COLS)
    .gte("month", fromMonth)
    .lte("month", toMonth)
    .order("month", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as OperationalIndicator[];
}

/**
 * Upserts operational indicators for a tenant + month (UNIQUE constraint).
 */
export async function upsertOperationalIndicator(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  userId: string,
  input: UpsertOperationalIndicatorInput,
): Promise<OperationalIndicator> {
  const payload = {
    tenant_id: tenantId,
    month: input.month,
    headcount: input.headcount ?? null,
    folha_pagamento: input.folha_pagamento ?? null,
    custos_fixos: input.custos_fixos ?? null,
    meta_receita: input.meta_receita ?? null,
    meta_margem: input.meta_margem ?? null,
    churn_clientes_perdidos: input.churn_clientes_perdidos ?? null,
    notes: input.notes ?? null,
    created_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("finance_operational_indicators")
    .upsert(payload as never, { onConflict: "tenant_id,month" })
    .select(SELECT_COLS)
    .single();

  if (error) throw new Error(error.message);
  return data as OperationalIndicator;
}
