/**
 * dre-service.ts
 * Supabase service functions for DRE snapshots and chart of accounts.
 * Split from finance-accounting.ts for the 300-line limit.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getTBOMonthRangeFromString } from "./finance-cycle";
import type {
  ChartOfAccount,
  DRESnapshot,
  DRETrend,
  DREComparisonLine,
  DREComparison,
  RawTransaction,
  RawCategory,
} from "./dre-types";
import {
  DRE_NUMERIC_KEYS,
  DRE_LABEL_MAP,
  REVENUE_KEYS,
  EXPENSE_KEYS,
} from "./dre-types";
import { buildDREFromTransactions } from "./dre-builder";

type AccountingSupabase = SupabaseClient<Database>;

// ── Service functions ─────────────────────────────────────────────────────────

export async function getDRESnapshot(
  supabase: AccountingSupabase,
  month: string
): Promise<DRESnapshot | null> {
  const { data } = await supabase
    .from("finance_dre_snapshots")
    .select("*")
    .eq("month", month)
    .maybeSingle();
  return (data as DRESnapshot | null) ?? null;
}

export async function getDRETrend(
  supabase: AccountingSupabase,
  months: number = 12
): Promise<DRETrend[]> {
  const { data } = await supabase
    .from("finance_dre_snapshots")
    .select("month, receita_bruta, ebitda, lucro_liquido")
    .order("month", { ascending: false })
    .limit(months);

  if (!data) return [];

  return (data as Array<{
    month: string;
    receita_bruta: number;
    ebitda: number;
    lucro_liquido: number;
  }>)
    .reverse()
    .map((row) => ({
      month: row.month,
      receitaBruta: row.receita_bruta,
      ebitda: row.ebitda,
      lucroLiquido: row.lucro_liquido,
      ebitdaMargin: row.receita_bruta > 0
        ? (row.ebitda / row.receita_bruta) * 100
        : 0,
    }));
}

export async function computeAndUpsertDRE(
  supabase: AccountingSupabase,
  month: string
): Promise<DRESnapshot> {
  // Resolve tenant_id from the authenticated user's profile (required by RLS + UNIQUE constraint).
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile?.tenant_id) throw new Error("Tenant not found");
  const tenantId: string = profile.tenant_id;

  // TBO financial cycle: month runs from day 15 to day 14 of next month
  const { from, to } = getTBOMonthRangeFromString(month);

  const [txRes, catRes, payrollRes] = await Promise.all([
    supabase
      .from("finance_transactions")
      .select("type, amount, paid_amount, status, category_id, omie_categoria_codigo")
      .gte("date", from)
      .lte("date", to),
    supabase.from("finance_categories").select("id, name, type"),
    supabase
      .from("finance_team_payroll")
      .select("salary, is_active")
      .eq("month", month)
      .eq("is_active", true),
  ]);

  const payrollTotal = ((payrollRes.data ?? []) as Array<{
    salary: number;
    is_active: boolean;
  }>).reduce((s, p) => s + (p.salary || 0), 0);

  const dreData = buildDREFromTransactions(
    (txRes.data ?? []) as RawTransaction[],
    (catRes.data ?? []) as RawCategory[],
    payrollTotal,
    month
  );

  const { data: existing } = await supabase
    .from("finance_dre_snapshots")
    .select("id, meta_receita, meta_ebitda")
    .eq("month", month)
    .maybeSingle();

  // Exclude GENERATED ALWAYS AS STORED columns — Postgres rejects explicit values for them.
  const {
    receita_liquida: _rl,
    lucro_bruto: _lb,
    total_desp_op: _tdo,
    ebitda: _eb,
    ebit: _ebit,
    lair: _lair,
    lucro_liquido: _ll,
    ...inputFields
  } = dreData;

  const upsertPayload = {
    ...inputFields,
    tenant_id: tenantId,
    meta_receita: (existing as { meta_receita?: number | null } | null)?.meta_receita ?? null,
    meta_ebitda: (existing as { meta_ebitda?: number | null } | null)?.meta_ebitda ?? null,
    source: "computed",
    computed_at: new Date().toISOString(),
    ...(existing ? { id: (existing as { id: string }).id } : {}),
  };

  const { data, error } = await supabase
    .from("finance_dre_snapshots")
    .upsert(upsertPayload as never, { onConflict: "tenant_id,month" })
    .select("*")
    .single();

  if (error) throw new Error(`DRE upsert failed: ${error.message}`);
  return data as DRESnapshot;
}

export async function updateDREMeta(
  supabase: AccountingSupabase,
  month: string,
  meta: { meta_receita?: number; meta_ebitda?: number }
): Promise<void> {
  const { error } = await supabase
    .from("finance_dre_snapshots")
    .update(meta as never)
    .eq("month", month);
  if (error) throw new Error(`DRE meta update failed: ${error.message}`);
}

export async function getChartOfAccounts(
  supabase: AccountingSupabase
): Promise<ChartOfAccount[]> {
  const { data } = await supabase
    .from("finance_chart_of_accounts")
    .select("*")
    .eq("is_active", true)
    .order("dre_order", { ascending: true });
  return (data ?? []) as ChartOfAccount[];
}

// ── DRE Comparison ────────────────────────────────────────────────────────────

/**
 * Compare two DRE snapshots, computing delta and % variation per line.
 * Variations > 10% in absolute value are flagged as `isSignificant`.
 */
export async function getDREComparison(
  supabase: AccountingSupabase,
  currentMonth: string,
  previousMonth: string
): Promise<DREComparison> {
  const [current, previous] = await Promise.all([
    getDRESnapshot(supabase, currentMonth),
    getDRESnapshot(supabase, previousMonth),
  ]);

  const lines: DREComparisonLine[] = DRE_NUMERIC_KEYS.map((key) => {
    const cur = typeof current?.[key] === "number" ? (current[key] as number) : 0;
    const prev = typeof previous?.[key] === "number" ? (previous[key] as number) : 0;
    const delta = cur - prev;
    const deltaPct = prev !== 0 ? (delta / Math.abs(prev)) * 100 : null;

    let isPositiveDelta: boolean | null = null;
    if (delta !== 0) {
      if (REVENUE_KEYS.has(key)) isPositiveDelta = delta > 0;
      else if (EXPENSE_KEYS.has(key)) isPositiveDelta = delta < 0;
    }

    return {
      label: DRE_LABEL_MAP[key] ?? key,
      key,
      current: cur,
      previous: prev,
      delta,
      deltaPct,
      isPositiveDelta,
      isSignificant: deltaPct !== null && Math.abs(deltaPct) > 10,
    };
  });

  return { currentMonth, previousMonth, lines, current, previous };
}
