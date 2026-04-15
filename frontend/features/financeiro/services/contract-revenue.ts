import type { Database } from "@/lib/supabase/types";
import type { FinanceSupabase } from "./finance-types";
import { TABLE_TRANSACTIONS } from "./finance-types";

type TransactionInsert = Database["public"]["Tables"]["finance_transactions"]["Insert"];

/**
 * Result of generating revenue transactions from active contracts.
 */
export interface ContractRevenueResult {
  created: number;
  skipped: number;
  errors: string[];
}

interface ActiveContract {
  id: string;
  title: string;
  monthly_value: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  person_name: string | null;
  category: string;
}

/**
 * Generates receita transactions for all active contracts for a given month.
 * Idempotent: skips if a transaction with the same contract_id + month already exists.
 */
export async function generateContractRevenue(
  supabase: FinanceSupabase,
  tenantId: string,
  userId: string,
  targetMonth: string // YYYY-MM
): Promise<ContractRevenueResult> {
  // Validate month format
  if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
    throw new Error("Mês deve estar no formato YYYY-MM");
  }

  const [year, month] = targetMonth.split("-").map(Number);
  const monthStart = `${targetMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${targetMonth}-${String(lastDay).padStart(2, "0")}`;

  // Fetch active contracts with monthly_value
  const { data: contracts, error: contractsErr } = await supabase
    .from("contracts")
    .select(
      "id, title, monthly_value, start_date, end_date, status, person_name, category"
    )
    .eq("status", "active")
    .eq("category", "cliente")
    .gt("monthly_value", 0);

  if (contractsErr) throw contractsErr;

  const activeContracts = (contracts ?? []) as ActiveContract[];

  // Filter contracts valid for target month
  const validContracts = activeContracts.filter((c) => {
    if (c.start_date && c.start_date > monthEnd) return false;
    if (c.end_date && c.end_date < monthStart) return false;
    return true;
  });

  if (validContracts.length === 0) {
    return { created: 0, skipped: 0, errors: [] };
  }

  // Check which contracts already have transactions for this month
  const contractIds = validContracts.map((c) => c.id);
  const { data: existing, error: existErr } = await supabase
    .from(TABLE_TRANSACTIONS)
    .select("contract_id")
    .in("contract_id", contractIds)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (existErr) throw existErr;

  const existingContractIds = new Set(
    ((existing ?? []) as unknown as Array<{ contract_id: string }>).map(
      (r) => r.contract_id
    )
  );

  // Build transactions to insert
  const toInsert: TransactionInsert[] = validContracts
    .filter((c) => !existingContractIds.has(c.id))
    .map((c) => ({
      tenant_id: tenantId,
      type: "receita",
      status: "previsto",
      description: `Receita contrato: ${c.title}`,
      amount: c.monthly_value!,
      paid_amount: 0,
      date: `${targetMonth}-05`, // dia 5 como padrão
      due_date: `${targetMonth}-10`, // vencimento dia 10
      counterpart: c.person_name,
      contract_id: c.id,
      business_unit: null,
      created_by: userId,
      updated_by: userId,
    }));

  const skipped = validContracts.length - toInsert.length;

  if (toInsert.length === 0) {
    return { created: 0, skipped, errors: [] };
  }

  const result: ContractRevenueResult = {
    created: 0,
    skipped,
    errors: [],
  };

  // Insert in batches of 50
  const BATCH = 50;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error: insertErr, data: insertedRows } = await supabase
      .from(TABLE_TRANSACTIONS)
      .insert(batch)
      .select("id");

    if (insertErr) {
      result.errors.push(insertErr.message);
    } else {
      result.created += insertedRows?.length ?? batch.length;
    }
  }

  return result;
}

/**
 * Fetches a summary of contracts eligible for revenue generation.
 */
export async function getContractRevenueSummary(
  supabase: FinanceSupabase
): Promise<{
  activeContracts: number;
  totalMonthlyRevenue: number;
}> {
  const { data, error } = await supabase
    .from("contracts")
    .select("monthly_value")
    .eq("status", "active")
    .eq("category", "cliente")
    .gt("monthly_value", 0);

  if (error) throw error;

  const contracts = (data ?? []) as Array<{ monthly_value: number }>;
  const totalMonthlyRevenue = contracts.reduce(
    (s, c) => s + Number(c.monthly_value),
    0
  );

  return {
    activeContracts: contracts.length,
    totalMonthlyRevenue,
  };
}
