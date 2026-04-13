/**
 * _post-sync.ts
 * Post-sync reconciliation — runs after OMIE data lands in Supabase.
 *
 * Fixes:
 * 1. Auto-creates missing categories from transaction omie_categoria_codigo values
 * 2. Re-links transactions to their categories (category_id)
 * 3. Updates overdue statuses (previsto → atrasado)
 * 4. Derives business_unit from omie_categoria_codigo patterns
 * 5. Computes daily snapshots for cash flow charts & KPIs
 */

import type { SupabaseClient } from "./_shared";
import { createSyncLogger } from "./_logger";

const log = createSyncLogger("post-sync");

// ── OMIE category code → human-readable name prefix ─────────────────────────

const CODE_PREFIX_NAMES: Array<[string, string, "receita" | "despesa"]> = [
  ["1.01.", "(+) Receitas - Serviços", "receita"],
  ["1.02.", "(+) Receitas Financeiras", "receita"],
  ["1.03.", "(+) Devoluções", "receita"],
  ["1.04.", "(+) Outras Receitas", "receita"],
  ["2.01.", "(-) Pessoal", "despesa"],
  ["2.02.", "(-) Deduções e Impostos s/ Receita", "despesa"],
  ["2.03.", "(-) Custo de Produção / Terceirização", "despesa"],
  ["2.04.", "(-) Despesas Administrativas", "despesa"],
  ["2.05.", "(-) Impostos e Taxas Operacionais", "despesa"],
  ["2.06.", "(-) Depreciação e Amortização", "despesa"],
  ["2.07.", "(-) Despesas Comerciais / Vendas", "despesa"],
  ["2.08.", "(-) Marketing e Comercial", "despesa"],
  ["2.09.", "(-) Resultado Financeiro", "despesa"],
  ["2.10.", "(-) Resultado Financeiro (Empréstimos)", "despesa"],
  ["2.11.", "(-) Impostos sobre Renda (IRPJ/CSLL)", "despesa"],
];

function inferCategoryNameAndType(code: string): { name: string; type: "receita" | "despesa" } {
  for (const [prefix, name, type] of CODE_PREFIX_NAMES) {
    if (code.startsWith(prefix)) return { name: `${name} [${code}]`, type };
  }
  const isReceita = code.startsWith("1.");
  return {
    name: isReceita ? `(+) Receita [${code}]` : `(-) Despesa [${code}]`,
    type: isReceita ? "receita" : "despesa",
  };
}

// ── OMIE category code → business_unit mapping ──────────────────────────────
// Derived from TBO's cost center structure and OMIE code hierarchy.

// Values MUST match the check constraint on finance_transactions.business_unit:
// 'Branding', 'Digital 3D', 'Marketing', 'Audiovisual', 'Interiores',
// 'Performance', 'Social & Conteúdo', 'Design', 'Administrativo',
// 'Comercial', 'Tecnologia', 'Produção', 'RH'
const CODE_BU_MAP: Array<[string, string]> = [
  // 2.07 = Comercial/Vendas
  ["2.07.", "Comercial"],
  // 2.08 = Marketing
  ["2.08.", "Marketing"],
];

function inferBUFromCategoryCode(code: string | null): string | null {
  if (!code) return null;
  for (const [prefix, bu] of CODE_BU_MAP) {
    if (code.startsWith(prefix)) return bu;
  }
  return null;
}

// ── 1. Auto-create missing categories from transaction data ─────────────────

export async function reconcileCategories(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  try {
    // Find unique omie_categoria_codigo values in transactions that don't have a matching category
    const { data: missingCodes } = await (supabase as never as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: Array<{ code: string }> | null }>;
    }).rpc("get_missing_category_codes", { p_tenant_id: tenantId });

    // Fallback: manual query if RPC doesn't exist
    let codes: string[] = [];

    if (!missingCodes) {
      // Direct query approach
      const { data: txCodes } = await (supabase as never as {
        from: (t: string) => {
          select: (s: string) => {
            eq: (c: string, v: string) => {
              not: (c: string, op: string, v: null) => {
                is: (c: string, v: null) => Promise<{ data: Array<{ omie_categoria_codigo: string }> | null }>;
              };
            };
          };
        };
      })
        .from("finance_transactions")
        .select("omie_categoria_codigo")
        .eq("tenant_id", tenantId)
        .not("omie_categoria_codigo", "is", null)
        .is("category_id", null);

      if (txCodes?.length) {
        const uniqueCodes = new Set(txCodes.map((r) => r.omie_categoria_codigo));

        // Check which ones already exist
        const { data: existing } = await (supabase as never as {
          from: (t: string) => {
            select: (s: string) => {
              eq: (c: string, v: string) => {
                in: (c: string, v: string[]) => Promise<{ data: Array<{ omie_id: string }> | null }>;
              };
            };
          };
        })
          .from("finance_categories")
          .select("omie_id")
          .eq("tenant_id", tenantId)
          .in("omie_id", Array.from(uniqueCodes));

        const existingSet = new Set((existing ?? []).map((r) => r.omie_id));
        codes = Array.from(uniqueCodes).filter((c) => !existingSet.has(c));
      }
    } else {
      codes = missingCodes.map((r) => r.code);
    }

    if (codes.length === 0) {
      log.info("No missing categories to create");
      return { created: 0, errors };
    }

    log.info("Creating missing categories", { count: codes.length, codes: codes.slice(0, 10) });

    const records = codes.map((code) => {
      const { name, type } = inferCategoryNameAndType(code);
      return {
        tenant_id: tenantId,
        name,
        type,
        omie_id: code,
        is_active: true,
      };
    });

    // Batch insert
    const { error } = await (supabase as never as {
      from: (t: string) => {
        upsert: (d: unknown, o: { onConflict: string; ignoreDuplicates: boolean }) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("finance_categories")
      .upsert(records, { onConflict: "tenant_id,omie_id", ignoreDuplicates: false });

    if (error) {
      errors.push(`Create categories: ${error.message}`);
    } else {
      created = records.length;
    }
  } catch (err) {
    errors.push(`reconcileCategories: ${err instanceof Error ? err.message : String(err)}`);
  }

  log.info("Categories reconciled", { created, errors: errors.length });
  return { created, errors };
}

// ── 2. Re-link transaction category_id from omie_categoria_codigo ───────────

export async function relinkTransactionCategories(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ linked: number; errors: string[] }> {
  const errors: string[] = [];
  let linked = 0;

  try {
    // Build category lookup: omie_id → UUID
    const { data: cats } = await (supabase as never as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (c: string, v: string) => {
            not: (c: string, op: string, v: null) => Promise<{ data: Array<{ id: string; omie_id: string }> | null }>;
          };
        };
      };
    })
      .from("finance_categories")
      .select("id, omie_id")
      .eq("tenant_id", tenantId)
      .not("omie_id", "is", null);

    const catMap = new Map((cats ?? []).map((c) => [c.omie_id, c.id]));

    if (catMap.size === 0) {
      log.info("No categories available for relinking");
      return { linked: 0, errors };
    }

    // Fetch transactions with omie_categoria_codigo but no category_id
    const { data: unlinked } = await (supabase as never as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (c: string, v: string) => {
            not: (c: string, op: string, v: null) => {
              is: (c: string, v: null) => Promise<{ data: Array<{ id: string; omie_categoria_codigo: string }> | null }>;
            };
          };
        };
      };
    })
      .from("finance_transactions")
      .select("id, omie_categoria_codigo")
      .eq("tenant_id", tenantId)
      .not("omie_categoria_codigo", "is", null)
      .is("category_id", null);

    if (!unlinked?.length) {
      log.info("No unlinked transactions to fix");
      return { linked: 0, errors };
    }

    log.info("Relinking transactions to categories", { count: unlinked.length });

    // Group by category_id for batch updates
    const updateMap = new Map<string, string[]>();
    for (const tx of unlinked) {
      const catId = catMap.get(tx.omie_categoria_codigo);
      if (catId) {
        const ids = updateMap.get(catId) ?? [];
        ids.push(tx.id);
        updateMap.set(catId, ids);
      }
    }

    // Batch UPDATE per category
    for (const [categoryId, txIds] of updateMap) {
      // Process in chunks of 200
      for (let i = 0; i < txIds.length; i += 200) {
        const chunk = txIds.slice(i, i + 200);
        const { error } = await (supabase as never as {
          from: (t: string) => {
            update: (d: unknown) => {
              in: (c: string, v: string[]) => Promise<{ error: { message: string } | null }>;
            };
          };
        })
          .from("finance_transactions")
          .update({ category_id: categoryId, updated_at: new Date().toISOString() })
          .in("id", chunk);

        if (error) {
          errors.push(`Relink batch: ${error.message}`);
        } else {
          linked += chunk.length;
        }
      }
    }
  } catch (err) {
    errors.push(`relinkTransactionCategories: ${err instanceof Error ? err.message : String(err)}`);
  }

  log.info("Transactions relinked", { linked, errors: errors.length });
  return { linked, errors };
}

// ── 3. Update overdue statuses ──────────────────────────────────────────────

export async function updateOverdueStatuses(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    const today = new Date().toISOString().split("T")[0];

    // Update transactions with due_date in the past and status = 'previsto'
    const { data, error } = await (supabase as never as {
      from: (t: string) => {
        update: (d: unknown) => {
          eq: (c: string, v: string) => {
            eq: (c: string, v: string) => {
              lt: (c: string, v: string) => {
                not: (c: string, op: string, v: null) => {
                  select: (s: string) => Promise<{ data: Array<{ id: string }> | null; error: { message: string } | null }>;
                };
              };
            };
          };
        };
      };
    })
      .from("finance_transactions")
      .update({ status: "atrasado", updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("status", "previsto")
      .lt("due_date", today)
      .not("due_date", "is", null)
      .select("id");

    if (error) {
      errors.push(`Update overdue: ${error.message}`);
    } else {
      updated = data?.length ?? 0;
    }
  } catch (err) {
    errors.push(`updateOverdueStatuses: ${err instanceof Error ? err.message : String(err)}`);
  }

  log.info("Overdue statuses updated", { updated, errors: errors.length });
  return { updated, errors };
}

// ── 4. Derive business_unit from omie_categoria_codigo ──────────────────────

export async function deriveBUsFromCategoryCode(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Fetch transactions with omie_categoria_codigo but no business_unit
    const { data: txs } = await (supabase as never as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (c: string, v: string) => {
            not: (c: string, op: string, v: null) => {
              is: (c: string, v: null) => Promise<{ data: Array<{ id: string; omie_categoria_codigo: string }> | null }>;
            };
          };
        };
      };
    })
      .from("finance_transactions")
      .select("id, omie_categoria_codigo")
      .eq("tenant_id", tenantId)
      .not("omie_categoria_codigo", "is", null)
      .is("business_unit", null);

    if (!txs?.length) {
      log.info("No transactions need BU derivation");
      return { updated: 0, errors };
    }

    // Group by BU for batch updates
    const buMap = new Map<string, string[]>();
    for (const tx of txs) {
      const bu = inferBUFromCategoryCode(tx.omie_categoria_codigo);
      if (bu) {
        const ids = buMap.get(bu) ?? [];
        ids.push(tx.id);
        buMap.set(bu, ids);
      }
    }

    for (const [bu, txIds] of buMap) {
      for (let i = 0; i < txIds.length; i += 200) {
        const chunk = txIds.slice(i, i + 200);
        const { error } = await (supabase as never as {
          from: (t: string) => {
            update: (d: unknown) => {
              in: (c: string, v: string[]) => Promise<{ error: { message: string } | null }>;
            };
          };
        })
          .from("finance_transactions")
          .update({ business_unit: bu, updated_at: new Date().toISOString() })
          .in("id", chunk);

        if (error) {
          errors.push(`Derive BU batch: ${error.message}`);
        } else {
          updated += chunk.length;
        }
      }
    }
  } catch (err) {
    errors.push(`deriveBUsFromCategoryCode: ${err instanceof Error ? err.message : String(err)}`);
  }

  log.info("Business units derived", { updated, errors: errors.length });
  return { updated, errors };
}

// ── 5. Compute daily snapshots ──────────────────────────────────────────────

export async function computeDailySnapshots(
  supabase: SupabaseClient,
  tenantId: string,
  daysBack = 90
): Promise<{ upserted: number; errors: string[] }> {
  const errors: string[] = [];
  let upserted = 0;

  try {
    const today = new Date();
    const sinceDate = new Date(today);
    sinceDate.setDate(sinceDate.getDate() - daysBack);
    const sinceStr = sinceDate.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    // Fetch all paid/liquidado transactions in the period
    const { data: txs } = await (supabase as never as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (c: string, v: string) => {
            gte: (c: string, v: string) => {
              lte: (c: string, v: string) => Promise<{
                data: Array<{
                  type: string;
                  status: string;
                  amount: number;
                  paid_amount: number;
                  date: string;
                  due_date: string | null;
                }> | null;
              }>;
            };
          };
        };
      };
    })
      .from("finance_transactions")
      .select("type, status, amount, paid_amount, date, due_date")
      .eq("tenant_id", tenantId)
      .gte("date", sinceStr)
      .lte("date", todayStr);

    if (!txs?.length) {
      log.info("No transactions for snapshots");
      return { upserted: 0, errors };
    }

    // Build daily aggregations
    const dayMap = new Map<string, {
      receitas: number;
      despesas: number;
      payablesOpen: number;
      receivablesOpen: number;
    }>();

    // Initialize all days
    for (let d = new Date(sinceDate); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      dayMap.set(key, { receitas: 0, despesas: 0, payablesOpen: 0, receivablesOpen: 0 });
    }

    for (const tx of txs) {
      const dateKey = tx.date;
      const entry = dayMap.get(dateKey);
      if (!entry) continue;

      const val = tx.paid_amount || tx.amount || 0;
      const isPaid = ["pago", "liquidado", "parcial"].includes(tx.status);
      const isOpen = ["previsto", "provisionado", "atrasado"].includes(tx.status);

      if (tx.type === "receita") {
        if (isPaid) entry.receitas += val;
        if (isOpen) entry.receivablesOpen += val;
      } else if (tx.type === "despesa") {
        if (isPaid) entry.despesas += val;
        if (isOpen) entry.payablesOpen += val;
      }
    }

    // Compute running balance (saldo_acumulado)
    const sortedDays = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let saldoAcumulado = 0;
    const records: Record<string, unknown>[] = [];

    for (const [date, agg] of sortedDays) {
      const saldoDia = agg.receitas - agg.despesas;
      saldoAcumulado += saldoDia;

      records.push({
        tenant_id: tenantId,
        snapshot_date: date,
        total_receitas: Math.round(agg.receitas * 100) / 100,
        total_despesas: Math.round(agg.despesas * 100) / 100,
        saldo_dia: Math.round(saldoDia * 100) / 100,
        saldo_acumulado: Math.round(saldoAcumulado * 100) / 100,
        payables_open: Math.round(agg.payablesOpen * 100) / 100,
        receivables_open: Math.round(agg.receivablesOpen * 100) / 100,
      });
    }

    // Batch upsert (200 per batch)
    for (let i = 0; i < records.length; i += 200) {
      const batch = records.slice(i, i + 200);
      const { error } = await (supabase as never as {
        from: (t: string) => {
          upsert: (d: unknown, o: { onConflict: string; ignoreDuplicates: boolean }) => Promise<{ error: { message: string } | null }>;
        };
      })
        .from("finance_snapshots_daily")
        .upsert(batch, { onConflict: "tenant_id,snapshot_date", ignoreDuplicates: false });

      if (error) {
        errors.push(`Snapshot batch [${i}-${i + batch.length}]: ${error.message}`);
      } else {
        upserted += batch.length;
      }
    }
  } catch (err) {
    errors.push(`computeDailySnapshots: ${err instanceof Error ? err.message : String(err)}`);
  }

  log.info("Daily snapshots computed", { upserted, errors: errors.length });
  return { upserted, errors };
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export interface PostSyncResult {
  categoriesCreated: number;
  transactionsRelinked: number;
  overdueUpdated: number;
  busUpdated: number;
  snapshotsUpserted: number;
  errors: string[];
}

export async function runPostSyncReconciliation(
  supabase: SupabaseClient,
  tenantId: string
): Promise<PostSyncResult> {
  const allErrors: string[] = [];

  log.info("Starting post-sync reconciliation", { tenantId });

  // Step 1: Create missing categories
  const catResult = await reconcileCategories(supabase, tenantId);
  allErrors.push(...catResult.errors);

  // Step 2: Re-link transactions to categories
  const linkResult = await relinkTransactionCategories(supabase, tenantId);
  allErrors.push(...linkResult.errors);

  // Step 3: Update overdue statuses
  const overdueResult = await updateOverdueStatuses(supabase, tenantId);
  allErrors.push(...overdueResult.errors);

  // Step 4: Derive business units from category codes
  const buResult = await deriveBUsFromCategoryCode(supabase, tenantId);
  allErrors.push(...buResult.errors);

  // Step 5: Compute daily snapshots
  const snapResult = await computeDailySnapshots(supabase, tenantId);
  allErrors.push(...snapResult.errors);

  const result: PostSyncResult = {
    categoriesCreated: catResult.created,
    transactionsRelinked: linkResult.linked,
    overdueUpdated: overdueResult.updated,
    busUpdated: buResult.updated,
    snapshotsUpserted: snapResult.upserted,
    errors: allErrors,
  };

  log.info("Post-sync reconciliation complete", result as unknown as Record<string, unknown>);
  return result;
}
