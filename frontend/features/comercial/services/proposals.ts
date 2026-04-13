import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProposalStatus = "draft" | "sent" | "approved" | "rejected" | "expired" | "enviada" | "aprovada" | "recusada" | "rascunho";

export interface ProposalRow {
  id: string;
  tenant_id: string;
  name: string;           // nome do empreendimento
  client: string | null;  // empresa cliente
  company: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  project_type: string | null;
  project_location: string | null;
  ref_code: string | null;
  valid_days: number;
  status: ProposalStatus;
  urgency_flag: boolean;
  package_discount_flag: boolean;
  package_discount_pct: number;
  cash_discount_pct: number;
  subtotal: number;
  discount_amount: number;
  value: number;          // total final
  notes: string | null;
  introduction: string | null;
  show_d3d_flow: boolean;
  payment_conditions: PaymentConditionOption[] | null;
  deal_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentConditionOption {
  label: string;
  description: string;
  highlight?: boolean;
  details?: string;
}

export interface ProposalInsert {
  tenant_id: string;
  name: string;
  client?: string | null;
  company?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  project_type?: string | null;
  project_location?: string | null;
  ref_code?: string | null;
  valid_days?: number;
  status?: ProposalStatus;
  urgency_flag?: boolean;
  package_discount_flag?: boolean;
  package_discount_pct?: number;
  cash_discount_pct?: number;
  subtotal?: number;
  discount_amount?: number;
  value?: number;
  notes?: string | null;
  introduction?: string | null;
  show_d3d_flow?: boolean;
  payment_conditions?: PaymentConditionOption[] | null;
  deal_id?: string | null;
}

export interface ProposalUpdate extends Partial<Omit<ProposalInsert, "tenant_id">> {}

export interface ProposalItemRow {
  id: string;
  proposal_id: string;
  service_id: string | null;
  tenant_id: string;
  title: string;
  description: string | null;
  bu: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  subtotal: number;
  observations: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalItemInsert {
  proposal_id: string;
  tenant_id: string;
  service_id?: string | null;
  title: string;
  description?: string | null;
  bu?: string | null;
  quantity?: number;
  unit_price?: number;
  discount_pct?: number;
  observations?: string | null;
  sort_order?: number;
}

export interface ProposalItemUpdate {
  title?: string;
  description?: string | null;
  bu?: string | null;
  quantity?: number;
  unit_price?: number;
  discount_pct?: number;
  observations?: string | null;
  sort_order?: number;
}

export interface ProposalWithItems extends ProposalRow {
  items: ProposalItemRow[];
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getProposals(
  supabase: SupabaseClient<Database>,
  status?: ProposalStatus,
): Promise<ProposalRow[]> {
  let query = supabase
    .from("proposals" as never)
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ProposalRow[];
}

export async function getProposalById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ProposalWithItems> {
  const [proposalRes, itemsRes] = await Promise.all([
    supabase.from("proposals" as never).select("*").eq("id", id).single(),
    supabase
      .from("proposal_items" as never)
      .select("*")
      .eq("proposal_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (proposalRes.error) throw proposalRes.error;
  if (itemsRes.error) throw itemsRes.error;

  return {
    ...(proposalRes.data as unknown as ProposalRow),
    items: (itemsRes.data ?? []) as unknown as ProposalItemRow[],
  };
}

export async function createProposal(
  supabase: SupabaseClient<Database>,
  input: ProposalInsert,
): Promise<ProposalRow> {
  const { data, error } = await supabase
    .from("proposals" as never)
    .insert(input as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ProposalRow;
}

export async function updateProposal(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: ProposalUpdate,
): Promise<ProposalRow> {
  const { data, error } = await supabase
    .from("proposals" as never)
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ProposalRow;
}

export async function deleteProposal(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("proposals" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── Proposal Items ───────────────────────────────────────────────────────────

export async function upsertProposalItems(
  supabase: SupabaseClient<Database>,
  proposalId: string,
  tenantId: string,
  items: Array<Omit<ProposalItemInsert, "proposal_id" | "tenant_id">>,
): Promise<ProposalItemRow[]> {
  // Apaga os itens existentes e reinserente (mais simples que diff)
  await supabase
    .from("proposal_items" as never)
    .delete()
    .eq("proposal_id", proposalId);

  if (items.length === 0) return [];

  const rows = items.map((item, i) => ({
    ...item,
    proposal_id: proposalId,
    tenant_id: tenantId,
    sort_order: item.sort_order ?? i,
    subtotal: (item.quantity ?? 1) * (item.unit_price ?? 0) * (1 - (item.discount_pct ?? 0) / 100),
  }));

  const { data, error } = await supabase
    .from("proposal_items" as never)
    .insert(rows as never)
    .select();
  if (error) throw error;
  return (data ?? []) as unknown as ProposalItemRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateRefCode(existingCount: number): string {
  const year = new Date().getFullYear();
  const num = String(existingCount + 1).padStart(4, "0");
  return `TBO-${year}-${num}`;
}

export function computeProposalTotals(
  items: Array<{ quantity: number; unit_price: number; discount_pct: number }>,
  urgencyFlag: boolean,
  packageDiscountFlag: boolean,
  urgencyMultiplier: number,
  packageDiscountPct: number,
): { subtotal: number; discount_amount: number; value: number } {
  const subtotal = items.reduce(
    (sum, item) =>
      sum + item.quantity * item.unit_price * (1 - item.discount_pct / 100),
    0,
  );

  const packageDiscount = packageDiscountFlag ? subtotal * packageDiscountPct : 0;
  const afterDiscount = subtotal - packageDiscount;
  const total = urgencyFlag ? afterDiscount * urgencyMultiplier : afterDiscount;

  return {
    subtotal,
    discount_amount: packageDiscount,
    value: total,
  };
}
