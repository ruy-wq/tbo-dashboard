import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ── Supabase client alias ────────────────────────────────────────────────────

export type FinanceSupabase = SupabaseClient<Database>;

// ── Table constants ──────────────────────────────────────────────────────────

export const TABLE_TRANSACTIONS = "finance_transactions";
export const TABLE_CATEGORIES = "finance_categories";
export const TABLE_COST_CENTERS = "finance_cost_centers";
export const TABLE_SNAPSHOTS = "finance_snapshots_daily";
export const TABLE_CASH_ENTRIES = "fin_cash_entries";
export const TABLE_BANK_STATEMENTS = "finance_bank_statements";
export const TABLE_RECURRING_RULES = "finance_recurring_rules";

// ── Core types ───────────────────────────────────────────────────────────────

export interface FinanceTransaction {
  id: string;
  tenant_id: string;
  type: "receita" | "despesa" | "transferencia";
  status: "previsto" | "provisionado" | "pago" | "liquidado" | "parcial" | "atrasado" | "recorrente" | "cancelado";
  description: string;
  notes: string | null;
  tags: string[];
  amount: number;
  paid_amount: number;
  date: string;
  due_date: string | null;
  paid_date: string | null;
  category_id: string | null;
  cost_center_id: string | null;
  project_id: string | null;
  counterpart: string | null;
  counterpart_doc: string | null;
  payment_method: string | null;
  bank_account: string | null;
  omie_id: string | null;
  omie_synced_at: string | null;
  business_unit: string | null;
  responsible_id: string | null;
  omie_raw: Record<string, unknown> | null;
  recurring_rule_id: string | null;
  contract_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  tenant_id: string;
  name: string;
  type: "receita" | "despesa";
  omie_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceCostCenter {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  omie_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceSnapshot {
  id: string;
  tenant_id: string;
  snapshot_date: string;
  total_receitas: number;
  total_despesas: number;
  saldo_dia: number;
  saldo_acumulado: number;
  payables_open: number;
  receivables_open: number;
  created_at: string;
}

export interface FinanceStatus {
  totalTransactions: number;
  totalReceitas: number;
  totalDespesas: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  lastSyncAt: string | null;
  categoriesCount: number;
  costCentersCount: number;
}

export interface FinanceStatusWithAmounts {
  /** Total valor a receber (receitas pendentes/previstas) no período */
  arCount: number;
  arAmount: number;
  /** Total valor a pagar (despesas pendentes/previstas) no período */
  apCount: number;
  apAmount: number;
  /** Pendentes (qualquer tipo) no período */
  pendingCount: number;
  /** Atrasados no período */
  overdueCount: number;
  /** Gap = arAmount - apAmount */
  gap: number;
}

export interface FinanceSyncResult {
  ok: boolean;
  message: string;
  inserted?: number;
  updated?: number;
  errors?: string[];
}

export type FinanceSortColumn =
  | "date"
  | "due_date"
  | "amount"
  | "description"
  | "status"
  | "counterpart";

export type FinanceSortDir = "asc" | "desc";

export interface FinanceFilters {
  type?: "receita" | "despesa" | "transferencia";
  typeIn?: string[];
  status?: string;
  statusIn?: string[];
  category_id?: string;
  cost_center_id?: string;
  business_unit?: string;
  project_id?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: "date" | "paid_date";
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: FinanceSortColumn;
  sortDir?: FinanceSortDir;
}

// ── KPI types ────────────────────────────────────────────────────────────────

export interface FounderKPIs {
  receitaMTD: number;
  despesaMTD: number;
  margemMTD: number;
  margemPct: number;
  apNext30: number;
  arNext30: number;
  saldoAcumulado: number;
  costCenterRanking: Array<{
    code: string;
    name: string;
    total: number;
  }>;
  categoryRanking: Array<{
    name: string;
    type: string;
    total: number;
  }>;
  buRevenue: Array<{
    business_unit: string;
    total: number;
  }>;
  projectRanking: Array<{
    project_id: string;
    name: string;
    receita: number;
    despesa: number;
    margem: number;
  }>;
}

// ── Aging types ──────────────────────────────────────────────────────────────

export type AgingBucket = {
  label: string;
  minDays: number;
  maxDays: number;
  direction: "past" | "future";
  ar: number;
  ap: number;
  arCount: number;
  apCount: number;
};

export type FinanceAgingData = {
  buckets: AgingBucket[];
  totalAr: number;
  totalAp: number;
  totalArCount: number;
  totalApCount: number;
  projectedAr: number;
  projectedArCount: number;
};

// ── Cash flow types ──────────────────────────────────────────────────────────

export type CashFlowPoint = {
  date: string;
  label: string;
  inflow: number;
  outflow: number;
  balance: number;
};

// ── Revenue concentration types ──────────────────────────────────────────────

export interface ClientConcentration {
  client: string;
  revenue: number;
  pct: number;
  txCount: number;
  alertLevel: "normal" | "alta" | "critico";
}

export interface RevenueConcentrationData {
  clients: ClientConcentration[];
  totalRevenue: number;
  totalClients: number;
  top5Pct: number;
}

// ── Payroll types ────────────────────────────────────────────────────────────

export interface PayrollVendor {
  vendor: string;
  total: number;
  count: number;
}

export interface PayrollBreakdownData {
  vendors: PayrollVendor[];
  totalFolha: number;
  totalOperacional: number;
  headcount: number;
}

// ── Overdue types ────────────────────────────────────────────────────────────

export interface OverdueEntry {
  id: string;
  type: "receita" | "despesa";
  status: string;
  description: string;
  counterpart: string | null;
  counterpart_doc: string | null;
  amount: number;
  paid_amount: number;
  due_date: string;
  date: string | null;
  days_overdue: number;
  category_name: string | null;
  cost_center_name: string | null;
  omie_num_titulo: string | null;
  omie_juros: number;
  omie_multa: number;
  omie_desconto: number;
  payment_method: string | null;
  notes: string | null;
  isProjected: boolean;
}

export interface OverdueEntriesData {
  entries: OverdueEntry[];
  projectedEntries: OverdueEntry[];
  totalAr: number;
  totalAp: number;
  totalArCount: number;
  totalApCount: number;
  projectedAr: number;
  projectedArCount: number;
}

// ── Bank statement types ─────────────────────────────────────────────────────

export interface BankStatement {
  id: string;
  tenant_id: string;
  bank_account_id: string | null;
  omie_id: string | null;
  date: string;
  description: string | null;
  amount: number;
  balance: number | null;
  type: "credit" | "debit";
  category: string | null;
  document_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankStatementFilters {
  dateFrom?: string;
  dateTo?: string;
  bankAccountId?: string;
  type?: "credit" | "debit";
  page?: number;
  pageSize?: number;
}

// ── Recurring rule types ────────────────────────────────────────────────────

export type RecurringFrequency = "monthly";

export interface RecurringRule {
  id: string;
  tenant_id: string;
  type: "receita" | "despesa";
  description: string;
  amount: number;
  category_id: string | null;
  cost_center_id: string | null;
  counterpart: string | null;
  counterpart_doc: string | null;
  payment_method: string | null;
  bank_account: string | null;
  business_unit: string | null;
  tags: string[];
  frequency: RecurringFrequency;
  day_of_month: number;
  start_month: string;
  end_month: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringRuleSummary {
  rules: RecurringRule[];
  activeCount: number;
  totalDespesaMensal: number;
  totalReceitaMensal: number;
}

export interface GenerateResult {
  created: number;
  skipped: number;
  errors: string[];
}
