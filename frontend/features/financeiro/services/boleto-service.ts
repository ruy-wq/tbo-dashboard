// ── Boleto Service — CRUD operations ─────────────────────────────────────────
// Operações de banco de dados para finance_boletos
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  Boleto,
  BoletoInsert,
  BoletoUpdate,
  BoletoFilters,
  BoletoSummary,
} from "@/lib/supabase/types/boletos";

const DEFAULT_PAGE_SIZE = 50;

type Supabase = SupabaseClient<Database>;

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function listBoletos(
  supabase: Supabase,
  tenantId: string,
  filters: BoletoFilters = {}
): Promise<{ data: Boleto[]; count: number }> {
  const {
    status,
    dateFrom,
    dateTo,
    search,
    invoiceId,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("finance_boletos")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("due_date", dateFrom);
  if (dateTo) query = query.lte("due_date", dateTo);
  if (search) query = query.or(`payer_name.ilike.%${search}%,nosso_numero.ilike.%${search}%`);
  if (invoiceId) query = query.eq("invoice_id", invoiceId);

  const { data, error, count } = await query;
  if (error) throw new Error(`listBoletos: ${error.message}`);
  return { data: (data ?? []) as Boleto[], count: count ?? 0 };
}

export async function getBoleto(
  supabase: Supabase,
  id: string
): Promise<Boleto | null> {
  const { data, error } = await supabase
    .from("finance_boletos")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getBoleto: ${error.message}`);
  }
  return data as Boleto;
}

export async function createBoleto(
  supabase: Supabase,
  payload: BoletoInsert
): Promise<Boleto> {
  const { data, error } = await supabase
    .from("finance_boletos")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw new Error(`createBoleto: ${error.message}`);
  return data as Boleto;
}

export async function updateBoleto(
  supabase: Supabase,
  id: string,
  payload: BoletoUpdate
): Promise<Boleto> {
  const { data, error } = await supabase
    .from("finance_boletos")
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateBoleto: ${error.message}`);
  return data as Boleto;
}

export async function cancelBoleto(
  supabase: Supabase,
  id: string
): Promise<Boleto> {
  return updateBoleto(supabase, id, { status: "cancelado" });
}

// ── Mark remessa sent ─────────────────────────────────────────────────────────

export async function markRemessaSent(
  supabase: Supabase,
  ids: string[]
): Promise<void> {
  const { error } = await supabase
    .from("finance_boletos")
    .update({ remessa_sent_at: new Date().toISOString() } as never)
    .in("id", ids);
  if (error) throw new Error(`markRemessaSent: ${error.message}`);
}

// ── Apply retorno records ─────────────────────────────────────────────────────

export async function applyRetornoRecord(
  supabase: Supabase,
  tenantId: string,
  nossoNumero: string,
  payload: BoletoUpdate
): Promise<void> {
  const { error } = await supabase
    .from("finance_boletos")
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq("tenant_id", tenantId)
    .eq("nosso_numero", nossoNumero);
  if (error) throw new Error(`applyRetornoRecord: ${error.message}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────

export async function getBoletosSummary(
  supabase: Supabase,
  tenantId: string
): Promise<BoletoSummary> {
  const { data, error } = await supabase
    .from("finance_boletos")
    .select("status, amount, paid_amount")
    .eq("tenant_id", tenantId);

  if (error) throw new Error(`getBoletosSummary: ${error.message}`);

  const rows = (data ?? []) as Pick<Boleto, "status" | "amount" | "paid_amount">[];

  const summarize = (status: Boleto["status"]) => ({
    count: rows.filter((r) => r.status === status).length,
    value: rows
      .filter((r) => r.status === status)
      .reduce((acc, r) => acc + r.amount, 0),
  });

  const emitidos = summarize("emitido");
  const pagos = summarize("pago");
  const vencidos = summarize("vencido");
  const cancelados = summarize("cancelado");

  return {
    totalEmitidos: emitidos.count,
    totalPagos: pagos.count,
    totalVencidos: vencidos.count,
    totalCancelados: cancelados.count,
    valorEmitidos: emitidos.value,
    valorPagos: pagos.value,
    valorVencidos: vencidos.value,
  };
}

// ── Update overdue boletos ────────────────────────────────────────────────────

/** Mark emitidos past due_date as vencido */
export async function markOverdueBoletos(
  supabase: Supabase,
  tenantId: string
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("finance_boletos")
    .update({ status: "vencido", updated_at: new Date().toISOString() } as never)
    .eq("tenant_id", tenantId)
    .eq("status", "emitido")
    .lt("due_date", today)
    .select("id");

  if (error) throw new Error(`markOverdueBoletos: ${error.message}`);
  return data?.length ?? 0;
}
