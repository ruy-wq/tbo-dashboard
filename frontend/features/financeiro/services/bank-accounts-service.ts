import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  BankAccount,
  BankAccountInsert,
  BankAccountUpdate,
} from "@/lib/supabase/types/bank-reconciliation";

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 50;

export type Supabase = SupabaseClient<Database>;

// ── Bank Accounts ─────────────────────────────────────────────────────────────

export async function listBankAccounts(
  supabase: Supabase,
  tenantId: string,
  onlyActive = true
): Promise<BankAccount[]> {
  let query = supabase
    .from("finance_bank_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("bank_name", { ascending: true });

  if (onlyActive) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error) throw new Error(`listBankAccounts: ${error.message}`);
  return (data ?? []) as BankAccount[];
}

export async function getBankAccount(
  supabase: Supabase,
  id: string
): Promise<BankAccount | null> {
  const { data, error } = await supabase
    .from("finance_bank_accounts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getBankAccount: ${error.message}`);
  }
  return data as BankAccount;
}

export async function createBankAccount(
  supabase: Supabase,
  payload: BankAccountInsert
): Promise<BankAccount> {
  const { data, error } = await supabase
    .from("finance_bank_accounts")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw new Error(`createBankAccount: ${error.message}`);
  return data as BankAccount;
}

export async function updateBankAccount(
  supabase: Supabase,
  id: string,
  payload: BankAccountUpdate
): Promise<BankAccount> {
  const { data, error } = await supabase
    .from("finance_bank_accounts")
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateBankAccount: ${error.message}`);
  return data as BankAccount;
}
