import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  ReconciliationRule,
  ReconciliationRuleInsert,
  ReconciliationRuleUpdate,
} from "@/lib/supabase/types/bank-reconciliation";

type Supabase = SupabaseClient<Database>;

// ── Reconciliation Rules ──────────────────────────────────────────────────────

export async function listReconciliationRules(
  supabase: Supabase,
  tenantId: string
): Promise<ReconciliationRule[]> {
  const { data, error } = await supabase
    .from("finance_reconciliation_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("priority", { ascending: true });
  if (error) throw new Error(`listReconciliationRules: ${error.message}`);
  return (data ?? []) as ReconciliationRule[];
}

export async function createReconciliationRule(
  supabase: Supabase,
  payload: ReconciliationRuleInsert
): Promise<ReconciliationRule> {
  const { data, error } = await supabase
    .from("finance_reconciliation_rules")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw new Error(`createReconciliationRule: ${error.message}`);
  return data as ReconciliationRule;
}

export async function updateReconciliationRule(
  supabase: Supabase,
  id: string,
  payload: ReconciliationRuleUpdate
): Promise<ReconciliationRule> {
  const { data, error } = await supabase
    .from("finance_reconciliation_rules")
    .update({ ...payload, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateReconciliationRule: ${error.message}`);
  return data as ReconciliationRule;
}

export async function deleteReconciliationRule(
  supabase: Supabase,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("finance_reconciliation_rules")
    .update({ is_active: false, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw new Error(`deleteReconciliationRule: ${error.message}`);
}

// ── Match Confidence Score ─────────────────────────────────────────────────────

export interface MatchCandidate {
  /** Bank transaction amount (may be negative for debits) */
  bankAmount: number;
  /** YYYY-MM-DD */
  bankDate: string;
  bankDescription: string;
  /** Finance transaction expected amount (always positive) */
  financeAmount: number;
  /** YYYY-MM-DD */
  financeDate: string;
  financeDescription: string;
  /** Whether a reconciliation rule matches this pair */
  ruleMatches?: boolean;
}

export interface MatchScore {
  /** 0–100 */
  score: number;
  /** Visual tier: "alta" ≥80, "media" ≥50, "baixa" <50 */
  tier: "alta" | "media" | "baixa";
  breakdown: {
    amount: number;
    date: number;
    description: number;
    rule: number;
  };
}

/** Word-overlap Jaccard similarity (0–1) between two strings */
function descriptionSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const wa = new Set(normalize(a));
  const wb = new Set(normalize(b));
  if (wa.size === 0 || wb.size === 0) return 0;

  let intersection = 0;
  for (const w of wa) {
    if (wb.has(w)) intersection++;
  }
  const union = wa.size + wb.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Calculate match confidence score (0–100) between a bank transaction and a finance transaction.
 *
 * Scoring weights:
 *   +40 pts  amount matches within R$0.01 (partial credit up to +20 for near-match within R$1)
 *   +25 pts  date within ±3 days (graded: ±0 days = 25, ±1-3 = 15, ±4-7 = 5)
 *   +20 pts  description word-overlap similarity
 *   +15 pts  reconciliation rule explicitly matched
 */
export function calculateMatchScore(candidate: MatchCandidate): MatchScore {
  const {
    bankAmount,
    bankDate,
    financeAmount,
    financeDate,
    bankDescription,
    financeDescription,
    ruleMatches,
  } = candidate;

  // ── Amount (+40) ────────────────────────────────────────────────────────────
  const amountDiff = Math.abs(Math.abs(bankAmount) - Math.abs(financeAmount));
  let amountPts = 0;
  if (amountDiff <= 0.01) {
    amountPts = 40;
  } else if (amountDiff <= 0.10) {
    amountPts = 30;
  } else if (amountDiff <= 1.00) {
    amountPts = 15;
  }

  // ── Date proximity (+25) ────────────────────────────────────────────────────
  const bDate = new Date(bankDate);
  const fDate = new Date(financeDate);
  const diffDays = Math.abs((bDate.getTime() - fDate.getTime()) / (1000 * 60 * 60 * 24));
  let datePts = 0;
  if (diffDays <= 0.5) {
    datePts = 25;
  } else if (diffDays <= 3) {
    datePts = 15;
  } else if (diffDays <= 7) {
    datePts = 5;
  }

  // ── Description similarity (+20) ────────────────────────────────────────────
  const sim = descriptionSimilarity(bankDescription, financeDescription);
  const descPts = Math.round(sim * 20);

  // ── Rule match (+15) ────────────────────────────────────────────────────────
  const rulePts = ruleMatches ? 15 : 0;

  const score = Math.min(100, amountPts + datePts + descPts + rulePts);
  const tier: MatchScore["tier"] = score >= 80 ? "alta" : score >= 50 ? "media" : "baixa";

  return {
    score,
    tier,
    breakdown: {
      amount: amountPts,
      date: datePts,
      description: descPts,
      rule: rulePts,
    },
  };
}

/**
 * Find best matching finance transactions for a bank transaction.
 * Returns candidates sorted by score descending.
 */
export async function findReconciliationCandidates(
  supabase: Supabase,
  tenantId: string,
  bankTx: { id: string; amount: number; transaction_date: string; description: string; type: string },
  rules: ReconciliationRule[]
): Promise<Array<{ transactionId: string; description: string; amount: number; date: string; score: MatchScore }>> {
  // ±7 day window around bank transaction date
  const txDate = new Date(bankTx.transaction_date);
  const windowFrom = new Date(txDate);
  windowFrom.setDate(windowFrom.getDate() - 7);
  const windowTo = new Date(txDate);
  windowTo.setDate(windowTo.getDate() + 7);

  const { data, error } = await supabase
    .from("finance_transactions")
    .select("id, description, amount, date, type, status")
    .eq("tenant_id", tenantId)
    .eq("type", bankTx.type === "credit" ? "receita" : "despesa")
    .not("status", "in", '("cancelado")')
    .gte("date", windowFrom.toISOString().split("T")[0])
    .lte("date", windowTo.toISOString().split("T")[0]);

  if (error) throw new Error(`findReconciliationCandidates: ${error.message}`);

  const candidates = (data ?? []) as Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    type: string;
    status: string;
  }>;

  // Check which rules match this bank transaction (rules use `pattern` field)
  const matchingRules = rules.filter((r) =>
    r.pattern &&
    bankTx.description.toLowerCase().includes(r.pattern.toLowerCase())
  );
  const hasRuleMatch = matchingRules.length > 0;

  return candidates
    .map((tx) => ({
      transactionId: tx.id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      score: calculateMatchScore({
        bankAmount: bankTx.amount,
        bankDate: bankTx.transaction_date,
        bankDescription: bankTx.description,
        financeAmount: tx.amount,
        financeDate: tx.date,
        financeDescription: tx.description,
        ruleMatches: hasRuleMatch,
      }),
    }))
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, 10);
}
