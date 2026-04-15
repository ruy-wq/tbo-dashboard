/**
 * recurring-rules.ts
 * CRUD + generation logic for recurring financial transactions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  type RecurringRule,
  type RecurringRuleSummary,
  type GenerateResult,
} from "./finance-types";
import type { RecurringRuleInput } from "./finance-schemas";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getRecurringRules(
  supabase: SupabaseClient<Database>
): Promise<RecurringRuleSummary> {
  const { data, error } = await supabase
    .from("finance_recurring_rules")
    .select("*")
    .order("description", { ascending: true });

  if (error) throw new Error(error.message);
  const rules = (data ?? []) as RecurringRule[];

  const active = rules.filter((r) => r.is_active);
  const totalDespesaMensal = active
    .filter((r) => r.type === "despesa")
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalReceitaMensal = active
    .filter((r) => r.type === "receita")
    .reduce((s, r) => s + Number(r.amount), 0);

  return {
    rules,
    activeCount: active.length,
    totalDespesaMensal,
    totalReceitaMensal,
  };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createRecurringRule(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  userId: string,
  input: RecurringRuleInput
): Promise<RecurringRule> {
  const { data, error } = await supabase
    .from("finance_recurring_rules")
    .insert({
      tenant_id: tenantId,
      ...input,
      category_id: input.category_id ?? null,
      cost_center_id: input.cost_center_id ?? null,
      counterpart: input.counterpart ?? null,
      counterpart_doc: input.counterpart_doc ?? null,
      payment_method: input.payment_method ?? null,
      bank_account: input.bank_account ?? null,
      business_unit: input.business_unit ?? null,
      tags: input.tags ?? [],
      end_month: input.end_month ?? null,
      notes: input.notes ?? null,
      frequency: "monthly",
      created_by: userId,
      updated_by: userId,
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as RecurringRule;
}

export async function updateRecurringRule(
  supabase: SupabaseClient<Database>,
  id: string,
  userId: string,
  updates: Partial<RecurringRuleInput> & { is_active?: boolean }
): Promise<RecurringRule> {
  const { data, error } = await supabase
    .from("finance_recurring_rules")
    .update({ ...updates, updated_by: userId } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as RecurringRule;
}

export async function deleteRecurringRule(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("finance_recurring_rules")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function toggleRecurringRule(
  supabase: SupabaseClient<Database>,
  id: string,
  userId: string,
  isActive: boolean
): Promise<RecurringRule> {
  return updateRecurringRule(supabase, id, userId, { is_active: isActive });
}

// ── Generation ───────────────────────────────────────────────────────────────

export async function generateRecurringTransactions(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  userId: string,
  targetMonth: string
): Promise<GenerateResult> {
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  // Fetch active rules that apply to this month
  const { data: rules, error: rulesErr } = await supabase
    .from("finance_recurring_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .lte("start_month", targetMonth);

  if (rulesErr) throw new Error(rulesErr.message);

  const applicable = ((rules ?? []) as RecurringRule[]).filter(
    (r) => !r.end_month || r.end_month >= targetMonth
  );

  for (const rule of applicable) {
    const day = String(rule.day_of_month).padStart(2, "0");
    const txDate = `${targetMonth}-${day}`;

    const record = {
      tenant_id: tenantId,
      type: rule.type,
      status: "previsto",
      description: rule.description,
      amount: rule.amount,
      paid_amount: 0,
      date: txDate,
      due_date: txDate,
      category_id: rule.category_id,
      cost_center_id: rule.cost_center_id,
      counterpart: rule.counterpart,
      counterpart_doc: rule.counterpart_doc,
      payment_method: rule.payment_method,
      bank_account: rule.bank_account,
      business_unit: rule.business_unit,
      tags: rule.tags,
      recurring_rule_id: rule.id,
      created_by: userId,
      updated_by: userId,
    };

    // Idempotent: UNIQUE index on (recurring_rule_id, date) prevents duplicates
    const { error: insertErr, data: inserted } = await supabase
      .from("finance_transactions")
      .upsert(record as never, {
        onConflict: "recurring_rule_id,date",
        ignoreDuplicates: true,
      })
      .select("id");

    if (insertErr) {
      errors.push(`${rule.description}: ${insertErr.message}`);
    } else if (inserted && inserted.length > 0) {
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped, errors };
}
