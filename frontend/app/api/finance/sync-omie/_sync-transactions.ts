import type {
  SupabaseClient,
  OmieCredentials,
  SyncResult,
  LookupMap,
  CostCenterInfoMap,
  ClientNameMap,
} from "./_shared";
import {
  PAGE_SIZE,
  INTER_PAGE_DELAY_MS,
  sleep,
  omieCall,
  batchUpsert,
  parseOmieDate,
  hasTimeRemaining,
} from "./_shared";
import {
  resolveCategoryId,
  resolveCostCenterId,
  deriveBUFromCostCenter,
} from "./_lookups";
import { createSyncLogger } from "./_logger";

const log = createSyncLogger("sync-transactions");

// ── Helper: filter out records already reconciled natively ───────────────

async function filterReconciledRecords(
  supabase: SupabaseClient,
  tenantId: string,
  records: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const omieIds = records
    .map((r) => r.omie_id as string)
    .filter(Boolean);

  if (omieIds.length === 0) return records;

  // Fetch omie_ids that are already reconciled via manual or auto (not OMIE)
  const { data } = await supabase
    .from("finance_transactions")
    .select("omie_id")
    .eq("tenant_id", tenantId)
    .in("omie_id", omieIds)
    .in("reconciled_source", ["manual", "auto"]);

  if (!data?.length) return records;

  const protectedIds = new Set(
    (data as unknown as Array<{ omie_id: string }>).map((r) => r.omie_id)
  );

  const filtered = records.filter((r) => !protectedIds.has(r.omie_id as string));
  const skipped = records.length - filtered.length;

  if (skipped > 0) {
    log.info("Skipped natively reconciled records", { skipped, protectedIds: protectedIds.size });
  }

  return filtered;
}

// ── Sync contas a pagar → finance_transactions ──────────────────────────────

export async function syncContasPagar(
  supabase: SupabaseClient,
  tenantId: string,
  creds: OmieCredentials,
  userId: string,
  catLookup: LookupMap,
  ccLookup: LookupMap,
  ccInfoLookup: CostCenterInfoMap,
  baLookup: LookupMap,
  startTime: number,
  maxDurationSec: number
): Promise<SyncResult> {
  const errors: string[] = [];
  const allRecords: Record<string, unknown>[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      if (!hasTimeRemaining(startTime, maxDurationSec)) {
        log.warn("Contas a Pagar aborting, time limit approaching");
        errors.push("Contas a pagar: abortado por limite de tempo");
        break;
      }

      log.info("Contas a Pagar fetching page", { page });

      const data = await omieCall(
        creds,
        "financas/contapagar/",
        "ListarContasPagar",
        [{ pagina: page, registros_por_pagina: PAGE_SIZE }]
      );

      const contas = (data.conta_pagar_cadastro || []) as Array<Record<string, unknown>>;
      const totalRecords = (data.total_de_registros as number) || 0;
      log.info("Contas a Pagar page fetched", { page, count: contas.length, total: totalRecords });

      for (const conta of contas) {
        const rawOmieId = String(conta.codigo_lancamento_omie || "");
        if (!rawOmieId) continue;

        // PREFIXED omie_id to avoid collision with receivables
        const omieId = `payable_${rawOmieId}`;

        const statusOmie = String(conta.status_titulo || "").toLowerCase();
        const rawPagoForStatus = Number(conta.valor_pago || 0);
        const valorDocForStatus = Number(conta.valor_documento || 0);

        let status = "previsto";
        if (statusOmie === "liquidado" || statusOmie === "pago") {
          // Detect partial payment: paid but valor_pago < valor_documento
          if (rawPagoForStatus > 0 && rawPagoForStatus < valorDocForStatus) {
            status = "parcial";
          } else {
            status = "pago";
          }
        } else if (statusOmie === "atrasado" || statusOmie === "vencido") {
          // Even if overdue, check if there was a partial payment
          if (rawPagoForStatus > 0 && rawPagoForStatus < valorDocForStatus) {
            status = "parcial";
          } else {
            status = "atrasado";
          }
        } else if (statusOmie === "cancelado") {
          status = "cancelado";
        }

        const bankAccountOmieId = conta.codigo_conta_corrente
          ? String(conta.codigo_conta_corrente)
          : null;

        // Calculate real paid_amount: valor_pago if available, else derive from valor_documento + juros + multa - desconto
        const rawPago = Number(conta.valor_pago || 0);
        const valorDoc = Number(conta.valor_documento || 0);
        const juros = Number(conta.nValorJuros || 0);
        const multa = Number(conta.nValorMulta || 0);
        const desconto = Number(conta.nValorDesconto || 0);
        const computedPaidAmount = rawPago > 0
          ? rawPago
          : (status === "pago" || status === "parcial")
            ? valorDoc + juros + multa - desconto
            : 0;

        allRecords.push({
          tenant_id: tenantId,
          type: "despesa",
          status,
          description: String(conta.observacao || conta.complemento || "Conta a pagar"),
          amount: valorDoc,
          paid_amount: computedPaidAmount,
          date:
            parseOmieDate(conta.data_emissao) ||
            parseOmieDate(conta.data_vencimento) ||
            new Date().toISOString().split("T")[0],
          due_date: parseOmieDate(conta.data_vencimento),
          paid_date: parseOmieDate(conta.data_pagamento) || (status === "pago" ? parseOmieDate(conta.data_previsao) : null),
          counterpart: conta.nome_fornecedor
            ? String(conta.nome_fornecedor)
            : (conta.observacao || conta.complemento ? String(conta.observacao || conta.complemento) : null),
          counterpart_doc: conta.cnpj_cpf_fornecedor ? String(conta.cnpj_cpf_fornecedor) : null,
          category_id: resolveCategoryId(conta, catLookup),
          cost_center_id: resolveCostCenterId(conta, ccLookup),
          business_unit: deriveBUFromCostCenter(conta, ccInfoLookup),
          bank_account: bankAccountOmieId,
          bank_account_id: bankAccountOmieId ? (baLookup.get(bankAccountOmieId) ?? null) : null,
          payment_method: conta.id_meio_pagamento ? String(conta.id_meio_pagamento) : null,
          omie_id: omieId,
          omie_synced_at: new Date().toISOString(),
          omie_raw: conta,
          omie_juros: Number(conta.nValorJuros || 0),
          omie_multa: Number(conta.nValorMulta || 0),
          omie_desconto: Number(conta.nValorDesconto || 0),
          omie_num_titulo: conta.cNumTitulo ? String(conta.cNumTitulo) : null,
          omie_categoria_codigo: (() => {
            // Primary: direct field
            if (conta.codigo_categoria) return String(conta.codigo_categoria);
            // Fallback: first entry in categorias array
            const cats = conta.categorias as Array<{ codigo_categoria?: string }> | undefined;
            if (cats?.[0]?.codigo_categoria) return String(cats[0].codigo_categoria);
            return null;
          })(),
          omie_departamento_codigo: (() => {
            // Primary: direct field
            if (conta.codigo_departamento) return String(conta.codigo_departamento);
            // Fallback: first entry in distribuicao array
            const dist = conta.distribuicao as Array<{ codigo_departamento?: string }> | undefined;
            if (dist?.[0]?.codigo_departamento) return String(dist[0].codigo_departamento);
            return null;
          })(),
          created_by: userId,
          updated_by: userId,
        });
      }

      const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
      hasMore = page < totalPages;
      page++;
      if (hasMore) await sleep(INTER_PAGE_DELAY_MS);
    }
  } catch (err) {
    errors.push(`Contas a pagar: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Skip records already reconciled natively (manual/auto) to prevent OMIE overwrite
  const safeRecords = await filterReconciledRecords(supabase, tenantId, allRecords);
  const result = await batchUpsert(supabase, "finance_transactions", safeRecords, "tenant_id,omie_id");
  errors.push(...result.errors);

  log.info("Contas a Pagar done", { upserted: result.inserted, errors: errors.length });
  return { inserted: result.inserted, updated: 0, errors };
}

// ── Sync contas a receber → finance_transactions ────────────────────────────

export async function syncContasReceber(
  supabase: SupabaseClient,
  tenantId: string,
  creds: OmieCredentials,
  userId: string,
  catLookup: LookupMap,
  ccLookup: LookupMap,
  ccInfoLookup: CostCenterInfoMap,
  baLookup: LookupMap,
  clientNameMap: ClientNameMap,
  startTime: number,
  maxDurationSec: number
): Promise<SyncResult> {
  const errors: string[] = [];
  const allRecords: Record<string, unknown>[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      if (!hasTimeRemaining(startTime, maxDurationSec)) {
        log.warn("Contas a Receber aborting, time limit approaching");
        errors.push("Contas a receber: abortado por limite de tempo");
        break;
      }

      log.info("Contas a Receber fetching page", { page });

      const data = await omieCall(
        creds,
        "financas/contareceber/",
        "ListarContasReceber",
        [{ pagina: page, registros_por_pagina: PAGE_SIZE }]
      );

      const contas = (data.conta_receber_cadastro || []) as Array<Record<string, unknown>>;
      const totalRecords = (data.total_de_registros as number) || 0;
      log.info("Contas a Receber page fetched", { page, count: contas.length, total: totalRecords });

      for (const conta of contas) {
        const rawOmieId = String(conta.codigo_lancamento_omie || "");
        if (!rawOmieId) continue;

        // PREFIXED omie_id to avoid collision with payables
        const omieId = `receivable_${rawOmieId}`;

        const statusOmie = String(conta.status_titulo || "").toLowerCase();
        const rawRecebidoForStatus = Number(conta.valor_recebido || conta.valor_pago || 0);
        const valorDocForStatusAR = Number(conta.valor_documento || 0);

        let status = "previsto";
        if (statusOmie === "liquidado" || statusOmie === "recebido") {
          if (rawRecebidoForStatus > 0 && rawRecebidoForStatus < valorDocForStatusAR) {
            status = "parcial";
          } else {
            status = "pago";
          }
        } else if (statusOmie === "atrasado" || statusOmie === "vencido") {
          if (rawRecebidoForStatus > 0 && rawRecebidoForStatus < valorDocForStatusAR) {
            status = "parcial";
          } else {
            status = "atrasado";
          }
        } else if (statusOmie === "cancelado") {
          status = "cancelado";
        }

        const bankAccountOmieId = conta.codigo_conta_corrente
          ? String(conta.codigo_conta_corrente)
          : null;

        // Calculate real paid_amount: valor_recebido/valor_pago if available, else derive
        const rawRecebido = Number(conta.valor_recebido || conta.valor_pago || 0);
        const valorDocAR = Number(conta.valor_documento || 0);
        const jurosAR = Number(conta.nValorJuros || 0);
        const multaAR = Number(conta.nValorMulta || 0);
        const descontoAR = Number(conta.nValorDesconto || 0);
        const computedPaidAmountAR = rawRecebido > 0
          ? rawRecebido
          : (status === "pago" || status === "parcial")
            ? valorDocAR + jurosAR + multaAR - descontoAR
            : 0;

        allRecords.push({
          tenant_id: tenantId,
          type: "receita",
          status,
          description: String(conta.observacao || conta.complemento || "Conta a receber"),
          amount: valorDocAR,
          paid_amount: computedPaidAmountAR,
          date:
            parseOmieDate(conta.data_emissao) ||
            parseOmieDate(conta.data_vencimento) ||
            new Date().toISOString().split("T")[0],
          due_date: parseOmieDate(conta.data_vencimento),
          paid_date: parseOmieDate(conta.data_recebimento) || parseOmieDate(conta.data_pagamento) || (status === "pago" ? parseOmieDate(conta.data_previsao) : null),
          counterpart: (() => {
            // OMIE ListarContasReceber doesn't return nome_cliente — resolve via lookup
            if (conta.nome_cliente) return String(conta.nome_cliente);
            const codCliForn = conta.codigo_cliente_fornecedor ? String(conta.codigo_cliente_fornecedor) : null;
            if (codCliForn) {
              const client = clientNameMap.get(codCliForn);
              if (client) return client.name;
            }
            return null;
          })(),
          counterpart_doc: (() => {
            if (conta.cnpj_cpf_cliente) return String(conta.cnpj_cpf_cliente);
            const codCliForn = conta.codigo_cliente_fornecedor ? String(conta.codigo_cliente_fornecedor) : null;
            if (codCliForn) {
              const client = clientNameMap.get(codCliForn);
              if (client?.cnpj) return client.cnpj;
            }
            return null;
          })(),
          category_id: resolveCategoryId(conta, catLookup),
          cost_center_id: resolveCostCenterId(conta, ccLookup),
          business_unit: deriveBUFromCostCenter(conta, ccInfoLookup),
          bank_account: bankAccountOmieId,
          bank_account_id: bankAccountOmieId ? (baLookup.get(bankAccountOmieId) ?? null) : null,
          payment_method: conta.id_meio_pagamento ? String(conta.id_meio_pagamento) : null,
          omie_id: omieId,
          omie_synced_at: new Date().toISOString(),
          omie_raw: conta,
          omie_juros: Number(conta.nValorJuros || 0),
          omie_multa: Number(conta.nValorMulta || 0),
          omie_desconto: Number(conta.nValorDesconto || 0),
          omie_num_titulo: conta.cNumTitulo ? String(conta.cNumTitulo) : null,
          omie_categoria_codigo: (() => {
            if (conta.codigo_categoria) return String(conta.codigo_categoria);
            const cats = conta.categorias as Array<{ codigo_categoria?: string }> | undefined;
            if (cats?.[0]?.codigo_categoria) return String(cats[0].codigo_categoria);
            return null;
          })(),
          omie_departamento_codigo: (() => {
            if (conta.codigo_departamento) return String(conta.codigo_departamento);
            const dist = conta.distribuicao as Array<{ codigo_departamento?: string }> | undefined;
            if (dist?.[0]?.codigo_departamento) return String(dist[0].codigo_departamento);
            return null;
          })(),
          created_by: userId,
          updated_by: userId,
        });
      }

      const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
      hasMore = page < totalPages;
      page++;
      if (hasMore) await sleep(INTER_PAGE_DELAY_MS);
    }
  } catch (err) {
    errors.push(`Contas a receber: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Skip records already reconciled natively (manual/auto) to prevent OMIE overwrite
  const safeRecords = await filterReconciledRecords(supabase, tenantId, allRecords);
  const result = await batchUpsert(supabase, "finance_transactions", safeRecords, "tenant_id,omie_id");
  errors.push(...result.errors);

  log.info("Contas a Receber done", { upserted: result.inserted, errors: errors.length });
  return { inserted: result.inserted, updated: 0, errors };
}
