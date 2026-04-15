import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  BankTransaction,
  BankTransactionInsert,
  BankTransactionUpdate,
  BankTransactionFilters,
  ReconciliationSummary,
} from "@/lib/supabase/types/bank-reconciliation";

import { DEFAULT_PAGE_SIZE } from "./bank-accounts-service";

type Supabase = SupabaseClient<Database>;

// ── Bank Transactions ─────────────────────────────────────────────────────────

export async function listBankTransactions(
  supabase: Supabase,
  tenantId: string,
  filters: BankTransactionFilters = {}
): Promise<{ data: BankTransaction[]; count: number }> {
  const {
    bank_account_id,
    reconciled,
    type,
    dateFrom,
    dateTo,
    search,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("finance_bank_transactions")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("transaction_date", { ascending: false })
    .range(from, to);

  if (bank_account_id) query = query.eq("bank_account_id", bank_account_id);
  if (reconciled !== undefined) query = query.eq("reconciled", reconciled);
  if (type) query = query.eq("type", type);
  if (dateFrom) query = query.gte("transaction_date", dateFrom);
  if (dateTo) query = query.lte("transaction_date", dateTo);
  if (search) query = query.ilike("description", `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(`listBankTransactions: ${error.message}`);
  return { data: (data ?? []) as BankTransaction[], count: count ?? 0 };
}

export async function insertBankTransactions(
  supabase: Supabase,
  transactions: BankTransactionInsert[]
): Promise<{ inserted: number; skipped: number }> {
  if (transactions.length === 0) return { inserted: 0, skipped: 0 };

  // upsert with conflict on (bank_account_id, ofx_id) — skip duplicates
  const { data, error } = await supabase
    .from("finance_bank_transactions")
    .upsert(transactions as never, {
      onConflict: "bank_account_id,ofx_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) throw new Error(`insertBankTransactions: ${error.message}`);
  const inserted = data?.length ?? 0;
  return { inserted, skipped: transactions.length - inserted };
}

export async function updateBankTransaction(
  supabase: Supabase,
  id: string,
  payload: BankTransactionUpdate
): Promise<BankTransaction> {
  const { data, error } = await supabase
    .from("finance_bank_transactions")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateBankTransaction: ${error.message}`);
  return data as BankTransaction;
}

export async function reconcileTransaction(
  supabase: Supabase,
  bankTxId: string,
  financeTxId: string,
  userId: string
): Promise<BankTransaction> {
  // 1. Get bank transaction to extract paid date and amount
  const { data: bankTx, error: bankErr } = await supabase
    .from("finance_bank_transactions")
    .select("amount, transaction_date")
    .eq("id", bankTxId)
    .single();

  if (bankErr) throw new Error(`reconcileTransaction: ${bankErr.message}`);
  const { amount, transaction_date } = bankTx;

  // 2. Update bank transaction with reconciliation metadata
  const result = await updateBankTransaction(supabase, bankTxId, {
    reconciled: true,
    reconciled_at: new Date().toISOString(),
    reconciled_by: userId,
    finance_tx_id: financeTxId,
  });

  // 3. Update finance transaction: status → pago, set paid_date and paid_amount
  const { error: finErr } = await supabase
    .from("finance_transactions")
    .update({
      status: "pago",
      paid_amount: Math.abs(amount),
      paid_date: transaction_date,
      reconciled_source: "manual",
      updated_by: userId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", financeTxId);

  if (finErr) throw new Error(`reconcileTransaction (finance_tx update): ${finErr.message}`);

  return result;
}

export async function unreconcileTransaction(
  supabase: Supabase,
  bankTxId: string
): Promise<BankTransaction> {
  return updateBankTransaction(supabase, bankTxId, {
    reconciled: false,
    reconciled_at: null,
    reconciled_by: null,
    finance_tx_id: null,
  });
}

// ── Reconciliation Summary ────────────────────────────────────────────────────

export async function getReconciliationSummary(
  supabase: Supabase,
  tenantId: string,
  bankAccountId?: string
): Promise<ReconciliationSummary> {
  let query = supabase
    .from("finance_bank_transactions")
    .select("amount, type, reconciled")
    .eq("tenant_id", tenantId);

  if (bankAccountId) query = query.eq("bank_account_id", bankAccountId);

  const { data, error } = await query;
  if (error) throw new Error(`getReconciliationSummary: ${error.message}`);

  const rows = (data ?? []) as Pick<BankTransaction, "amount" | "type" | "reconciled">[];
  const total = rows.length;
  const reconciled = rows.filter((r) => r.reconciled).length;
  const totalCredit = rows
    .filter((r) => r.type === "credit")
    .reduce((acc, r) => acc + r.amount, 0);
  const totalDebit = rows
    .filter((r) => r.type === "debit")
    .reduce((acc, r) => acc + r.amount, 0);

  return {
    total,
    reconciled,
    pending: total - reconciled,
    reconciledPct: total > 0 ? Math.round((reconciled / total) * 100) : 0,
    totalCredit,
    totalDebit,
    balance: totalCredit - totalDebit,
  };
}
