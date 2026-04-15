import type { Database } from "@/lib/supabase/types";
import type { FinanceSupabase } from "./finance-types";
import {
  TABLE_TRANSACTIONS,
  TABLE_CATEGORIES,
  TABLE_COST_CENTERS,
  TABLE_SNAPSHOTS,
  type FinanceTransaction,
  type FinanceCategory,
  type FinanceCostCenter,
  type FinanceSnapshot,
  type FinanceStatus,
  type FinanceStatusWithAmounts,
  type FinanceFilters,
  type FinanceSyncResult,
} from "./finance-types";
import type { CreateTransactionInput, UpdateTransactionInput } from "./finance-schemas";
import { roundMoney, sanitizeText } from "./finance-schemas";

type TransactionInsert = Database["public"]["Tables"]["finance_transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["finance_transactions"]["Update"];

// ── Input sanitization ────────────────────────────────────────────────────────

function sanitizeCreateInput(input: CreateTransactionInput): CreateTransactionInput {
  return {
    ...input,
    description: sanitizeText(input.description),
    amount: roundMoney(input.amount),
    paid_amount: roundMoney(input.paid_amount ?? 0),
    counterpart: input.counterpart ? sanitizeText(input.counterpart) : input.counterpart,
    notes: input.notes ? sanitizeText(input.notes) : input.notes,
  };
}

function sanitizeUpdateInput(input: UpdateTransactionInput): UpdateTransactionInput {
  return {
    ...input,
    description: input.description !== undefined ? sanitizeText(input.description) : undefined,
    amount: input.amount !== undefined ? roundMoney(input.amount) : undefined,
    paid_amount: input.paid_amount !== undefined ? roundMoney(input.paid_amount) : undefined,
    counterpart: input.counterpart ? sanitizeText(input.counterpart) : input.counterpart,
    notes: input.notes ? sanitizeText(input.notes) : input.notes,
  };
}

// ── Transactions (paginated) ─────────────────────────────────────────────────

export async function getFinanceTransactions(
  supabase: FinanceSupabase,
  filters: FinanceFilters = {}
): Promise<{ data: FinanceTransaction[]; count: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLE_TRANSACTIONS)
    .select("*", { count: "exact" })
    .order("date", { ascending: false });

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.typeIn?.length) query = query.in("type", filters.typeIn);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.statusIn?.length) query = query.in("status", filters.statusIn);
  if (filters.category_id) query = query.eq("category_id", filters.category_id);
  if (filters.cost_center_id)
    query = query.eq("cost_center_id", filters.cost_center_id);
  if (filters.business_unit)
    query = query.eq("business_unit", filters.business_unit);
  if (filters.project_id)
    query = query.eq("project_id", filters.project_id);
  if (filters.dateField === "paid_date") {
    if (filters.dateFrom && filters.dateTo) {
      query = query.or(
        `and(paid_date.gte.${filters.dateFrom},paid_date.lte.${filters.dateTo}),` +
        `and(paid_date.is.null,date.gte.${filters.dateFrom},date.lte.${filters.dateTo})`
      );
    } else if (filters.dateFrom) {
      query = query.or(
        `paid_date.gte.${filters.dateFrom},and(paid_date.is.null,date.gte.${filters.dateFrom})`
      );
    } else if (filters.dateTo) {
      query = query.or(
        `paid_date.lte.${filters.dateTo},and(paid_date.is.null,date.lte.${filters.dateTo})`
      );
    }
  } else {
    if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("date", filters.dateTo);
  }
  if (filters.search)
    query = query.ilike("description", `%${filters.search}%`);

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as FinanceTransaction[],
    count: count ?? 0,
  };
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function getFinanceCategories(
  supabase: FinanceSupabase,
  activeOnly = true
): Promise<FinanceCategory[]> {
  let query = supabase
    .from(TABLE_CATEGORIES)
    .select("*")
    .order("name");

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FinanceCategory[];
}

// ── Cost Centers ─────────────────────────────────────────────────────────────

export async function getFinanceCostCenters(
  supabase: FinanceSupabase,
  activeOnly = true
): Promise<FinanceCostCenter[]> {
  let query = supabase
    .from(TABLE_COST_CENTERS)
    .select("*")
    .order("code");

  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FinanceCostCenter[];
}

// ── Snapshots ────────────────────────────────────────────────────────────────

export async function getFinanceSnapshots(
  supabase: FinanceSupabase,
  days = 30
): Promise<FinanceSnapshot[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from(TABLE_SNAPSHOTS)
    .select("*")
    .gte("snapshot_date", sinceStr)
    .order("snapshot_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FinanceSnapshot[];
}

// ── Status ───────────────────────────────────────────────────────────────────

export async function getFinanceStatus(
  supabase: FinanceSupabase,
  months = 12
): Promise<FinanceStatus> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceStr = since.toISOString().split("T")[0];

  const [txRes, catRes, ccRes] = await Promise.all([
    supabase
      .from(TABLE_TRANSACTIONS)
      .select("type, status, omie_synced_at", { count: "exact" })
      .gte("date", sinceStr),
    supabase
      .from(TABLE_CATEGORIES)
      .select("id", { count: "exact" })
      .eq("is_active", true),
    supabase
      .from(TABLE_COST_CENTERS)
      .select("id", { count: "exact" })
      .eq("is_active", true),
  ]);

  const transactions = (txRes.data ?? []) as Array<{
    type: string;
    status: string;
    omie_synced_at: string | null;
  }>;

  const receitas = transactions.filter((t) => t.type === "receita").length;
  const despesas = transactions.filter((t) => t.type === "despesa").length;
  const pending = transactions.filter((t) => t.status === "previsto" || t.status === "provisionado").length;
  const paid = transactions.filter((t) => t.status === "pago" || t.status === "liquidado" || t.status === "parcial").length;
  const overdue = transactions.filter((t) => t.status === "atrasado").length;

  const syncDates = transactions
    .map((t) => t.omie_synced_at)
    .filter(Boolean)
    .sort()
    .reverse();

  return {
    totalTransactions: txRes.count ?? 0,
    totalReceitas: receitas,
    totalDespesas: despesas,
    pendingCount: pending,
    paidCount: paid,
    overdueCount: overdue,
    lastSyncAt: syncDates[0] ?? null,
    categoriesCount: catRes.count ?? 0,
    costCentersCount: ccRes.count ?? 0,
  };
}

// ── Status with monetary amounts ─────────────────────────────────────────────

export async function getFinanceStatusWithAmounts(
  supabase: FinanceSupabase,
  dateFrom?: string,
  dateTo?: string
): Promise<FinanceStatusWithAmounts> {
  let query = supabase
    .from(TABLE_TRANSACTIONS)
    .select("type, status, amount, paid_amount");

  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    type: string;
    status: string;
    amount: number;
    paid_amount: number;
  }>;

  const isAR = (r: typeof rows[0]) =>
    r.type === "receita" &&
    (r.status === "previsto" || r.status === "provisionado" || r.status === "atrasado");

  const isAP = (r: typeof rows[0]) =>
    r.type === "despesa" &&
    (r.status === "previsto" || r.status === "provisionado" || r.status === "atrasado");

  const isPending = (r: typeof rows[0]) =>
    r.status === "previsto" || r.status === "provisionado";

  const arRows = rows.filter(isAR);
  const apRows = rows.filter(isAP);

  const arAmount = arRows.reduce((s, r) => s + (r.paid_amount || r.amount || 0), 0);
  const apAmount = apRows.reduce((s, r) => s + (r.paid_amount || r.amount || 0), 0);

  return {
    arCount: arRows.length,
    arAmount,
    apCount: apRows.length,
    apAmount,
    pendingCount: rows.filter(isPending).length,
    overdueCount: rows.filter((r) => r.status === "atrasado").length,
    gap: arAmount - apAmount,
  };
}

// ── Chart data (fetches all matching records, paginated internally) ──────────

const CHART_PAGE_SIZE = 1000;

export async function getFinanceChartData(
  supabase: FinanceSupabase,
  filters: Omit<FinanceFilters, "page" | "pageSize" | "search"> = {}
): Promise<FinanceTransaction[]> {
  const allData: FinanceTransaction[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from(TABLE_TRANSACTIONS)
      .select(
        "id, type, status, description, counterpart, amount, paid_amount, date, due_date, category_id, cost_center_id, business_unit"
      )
      .order("date", { ascending: true })
      .range(from, from + CHART_PAGE_SIZE - 1);

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.typeIn?.length) query = query.in("type", filters.typeIn);
    if (filters.statusIn?.length) query = query.in("status", filters.statusIn);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.category_id) query = query.eq("category_id", filters.category_id);
    if (filters.business_unit) query = query.eq("business_unit", filters.business_unit);

    const dateField = filters.dateField ?? "date";
    if (filters.dateFrom) query = query.gte(dateField, filters.dateFrom);
    if (filters.dateTo) query = query.lte(dateField, filters.dateTo);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as FinanceTransaction[];
    allData.push(...rows);

    hasMore = rows.length === CHART_PAGE_SIZE;
    from += CHART_PAGE_SIZE;
  }

  return allData;
}

// ── Create Transaction ──────────────────────────────────────────────────────

export async function createFinanceTransaction(
  supabase: FinanceSupabase,
  tenantId: string,
  userId: string,
  input: CreateTransactionInput
): Promise<FinanceTransaction> {
  const sanitized = sanitizeCreateInput(input);
  const payload: TransactionInsert = {
    description: sanitized.description,
    tenant_id: tenantId,
    type: sanitized.type,
    status: sanitized.status,
    amount: sanitized.amount,
    paid_amount: sanitized.paid_amount ?? 0,
    date: sanitized.date,
    due_date: sanitized.due_date ?? null,
    paid_date: sanitized.paid_date ?? null,
    category_id: sanitized.category_id ?? null,
    cost_center_id: sanitized.cost_center_id ?? null,
    project_id: sanitized.project_id ?? null,
    counterpart: sanitized.counterpart ?? null,
    counterpart_doc: sanitized.counterpart_doc ?? null,
    payment_method: sanitized.payment_method ?? null,
    bank_account: sanitized.bank_account ?? null,
    business_unit: sanitized.business_unit ?? null,
    tags: sanitized.tags ?? [],
    notes: sanitized.notes ?? null,
    contract_id: sanitized.contract_id ?? null,
    created_by: userId,
    updated_by: userId,
  };
  const { data, error } = await supabase
    .from(TABLE_TRANSACTIONS)
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as FinanceTransaction;
}

// ── Update Transaction ──────────────────────────────────────────────────────

const AUDIT_FIELDS = ["status", "amount", "paid_amount", "paid_date", "category_id", "cost_center_id"] as const;

export async function updateFinanceTransaction(
  supabase: FinanceSupabase,
  id: string,
  userId: string,
  updates: UpdateTransactionInput
): Promise<FinanceTransaction> {
  const updates_ = sanitizeUpdateInput(updates);
  // Fetch current values for audit trail
  const { data: current, error: fetchErr } = await supabase
    .from(TABLE_TRANSACTIONS)
    .select("tenant_id, status, amount, paid_amount, paid_date, category_id, cost_center_id")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;
  const prev = current as Record<string, unknown>;

  const updatePayload: TransactionUpdate = {
    ...updates_,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(TABLE_TRANSACTIONS)
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  // Log audit trail for changed fields
  // Note: finance_transaction_audit table is not in generated Database types yet,
  // so we use a typed RPC-style insert via the untyped .from() path.
  const auditRows = AUDIT_FIELDS
    .filter((f) => f in updates_ && String(updates_[f as keyof typeof updates_] ?? "") !== String(prev[f] ?? ""))
    .map((f) => ({
      tenant_id: prev.tenant_id as string,
      transaction_id: id,
      field_name: f,
      old_value: prev[f] != null ? String(prev[f]) : null,
      new_value: updates_[f as keyof typeof updates_] != null ? String(updates_[f as keyof typeof updates_]) : null,
      changed_by: userId,
      source: "manual" as const,
    }));

  if (auditRows.length > 0) {
    // Table not in generated Database types — keep cast until types are regenerated
    await (supabase as unknown as { from: (t: string) => { insert: (d: typeof auditRows) => Promise<unknown> } })
      .from("finance_transaction_audit")
      .insert(auditRows);
  }

  return data as FinanceTransaction;
}

// ── Delete Transaction ──────────────────────────────────────────────────────

export async function deleteFinanceTransaction(
  supabase: FinanceSupabase,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLE_TRANSACTIONS)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ── Get single transaction ──────────────────────────────────────────────────

export async function getFinanceTransactionById(
  supabase: FinanceSupabase,
  id: string
): Promise<FinanceTransaction> {
  const { data, error } = await supabase
    .from(TABLE_TRANSACTIONS)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as FinanceTransaction;
}

// ── Client-side API wrappers ─────────────────────────────────────────────────

export async function triggerFinanceSync(): Promise<FinanceSyncResult> {
  const res = await fetch("/api/finance/sync-omie", { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      message: body.error ?? `Sync failed (${res.status})`,
    };
  }
  return res.json();
}

export async function fetchFinanceStatus(): Promise<FinanceStatus> {
  const res = await fetch("/api/finance/status");
  if (!res.ok) throw new Error(`Failed to fetch status (${res.status})`);
  return res.json();
}
