import type { SupabaseClient, OmieCredentials, SyncResult } from "./_shared";
import {
  PAGE_SIZE,
  INTER_PAGE_DELAY_MS,
  sleep,
  omieCall,
  batchUpsert,
} from "./_shared";
import { createSyncLogger } from "./_logger";

const log = createSyncLogger("sync-entities");

// ── Sync vendors → finance_vendors ───────────────────────────────────────────

export async function syncVendors(
  supabase: SupabaseClient,
  tenantId: string,
  creds: OmieCredentials
): Promise<SyncResult> {
  const errors: string[] = [];
  const allRecords: Record<string, unknown>[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      log.info("Vendors fetching page", { page });

      const data = await omieCall(
        creds,
        "geral/clientes/",
        "ListarClientes",
        [{ pagina: page, registros_por_pagina: PAGE_SIZE }]
      );

      const registros = (data.clientes_cadastro || []) as Array<Record<string, unknown>>;
      const totalRecords = (data.total_de_registros as number) || 0;
      log.info("Vendors page fetched", { page, count: registros.length, total: totalRecords });

      for (const f of registros) {
        const omieId = String(f.codigo_cliente_omie || "");
        if (!omieId) continue;

        allRecords.push({
          tenant_id: tenantId,
          omie_id: omieId,
          name: String(f.razao_social || f.nome_fantasia || `Fornecedor ${omieId}`),
          cnpj: f.cnpj_cpf ? String(f.cnpj_cpf) : null,
          email: f.email ? String(f.email) : null,
          phone: f.telefone1_numero ? String(f.telefone1_numero) : null,
          is_active: String(f.inativo || "N").toUpperCase() !== "S",
          omie_synced_at: new Date().toISOString(),
        });
      }

      const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
      hasMore = page < totalPages;
      page++;
      if (hasMore) await sleep(INTER_PAGE_DELAY_MS);
    }
  } catch (err) {
    errors.push(`Vendors: ${err instanceof Error ? err.message : String(err)}`);
  }

  const result = await batchUpsert(supabase, "finance_vendors", allRecords, "tenant_id,omie_id");
  errors.push(...result.errors);

  log.info("Vendors done", { upserted: result.inserted, errors: errors.length });
  return { inserted: result.inserted, updated: 0, errors };
}

// ── Sync clients → finance_clients ───────────────────────────────────────────

export async function syncClients(
  supabase: SupabaseClient,
  tenantId: string,
  creds: OmieCredentials
): Promise<SyncResult> {
  const errors: string[] = [];
  const allRecords: Record<string, unknown>[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      log.info("Clients fetching page", { page });

      const data = await omieCall(
        creds,
        "geral/clientes/",
        "ListarClientes",
        [{ pagina: page, registros_por_pagina: PAGE_SIZE }]
      );

      const clientes = (data.clientes_cadastro || []) as Array<Record<string, unknown>>;
      const totalRecords = (data.total_de_registros as number) || 0;
      log.info("Clients page fetched", { page, count: clientes.length, total: totalRecords });

      for (const c of clientes) {
        const omieId = String(c.codigo_cliente_omie || "");
        if (!omieId) continue;

        allRecords.push({
          tenant_id: tenantId,
          omie_id: omieId,
          name: String(c.razao_social || c.nome_fantasia || `Cliente ${omieId}`),
          cnpj: c.cnpj_cpf ? String(c.cnpj_cpf) : null,
          email: c.email ? String(c.email) : null,
          phone: c.telefone1_numero ? String(c.telefone1_numero) : null,
          contact_name: c.contato ? String(c.contato) : null,
          is_active: String(c.inativo || "N").toUpperCase() !== "S",
          omie_synced_at: new Date().toISOString(),
        });
      }

      const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
      hasMore = page < totalPages;
      page++;
      if (hasMore) await sleep(INTER_PAGE_DELAY_MS);
    }
  } catch (err) {
    errors.push(`Clients: ${err instanceof Error ? err.message : String(err)}`);
  }

  const result = await batchUpsert(supabase, "finance_clients", allRecords, "tenant_id,omie_id");
  errors.push(...result.errors);

  log.info("Clients done", { upserted: result.inserted, errors: errors.length });
  return { inserted: result.inserted, updated: 0, errors };
}

// ── Sync bank accounts → finance_bank_accounts ──────────────────────────────

export async function syncBankAccounts(
  supabase: SupabaseClient,
  tenantId: string,
  creds: OmieCredentials
): Promise<SyncResult> {
  const errors: string[] = [];
  const allRecords: Record<string, unknown>[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      log.info("Bank Accounts fetching page", { page });

      const data = await omieCall(
        creds,
        "geral/contacorrente/",
        "ListarContasCorrentes",
        [{ pagina: page, registros_por_pagina: PAGE_SIZE }]
      );

      const contas = (data.ListarContasCorrentes || data.conta_corrente_lista || []) as Array<Record<string, unknown>>;
      const totalRecords = (data.total_de_registros as number) || 0;
      log.info("Bank Accounts page fetched", { page, count: contas.length, total: totalRecords });

      for (const cc of contas) {
        const omieId = String(cc.nCodCC || cc.cCodCCInt || "");
        if (!omieId) continue;

        allRecords.push({
          tenant_id: tenantId,
          omie_id: omieId,
          name: String(cc.descricao || cc.cDescricao || `Conta ${omieId}`),
          bank_code: cc.codigo_banco ? String(cc.codigo_banco) : (cc.nCodBanco ? String(cc.nCodBanco) : null),
          bank_name: cc.descricao_banco ? String(cc.descricao_banco) : (cc.cDescricaoBanco ? String(cc.cDescricaoBanco) : null),
          agency: cc.agencia ? String(cc.agencia) : (cc.cNumAgencia ? String(cc.cNumAgencia) : null),
          account_number: cc.numero_conta ? String(cc.numero_conta) : (cc.cNumConta ? String(cc.cNumConta) : null),
          account_type: cc.tipo_conta_corrente ? String(cc.tipo_conta_corrente) : (cc.cTipo ? String(cc.cTipo) : "corrente"),
          balance: Number(cc.saldo_inicial || cc.nSaldo || 0),
          is_active: String(cc.cInativo || "N").toUpperCase() !== "S",
          omie_synced_at: new Date().toISOString(),
        });
      }

      const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
      hasMore = page < totalPages;
      page++;
      if (hasMore) await sleep(INTER_PAGE_DELAY_MS);
    }
  } catch (err) {
    errors.push(`BankAccounts: ${err instanceof Error ? err.message : String(err)}`);
  }

  const result = await batchUpsert(supabase, "finance_bank_accounts", allRecords, "tenant_id,omie_id");
  errors.push(...result.errors);

  log.info("Bank Accounts done", { upserted: result.inserted, errors: errors.length });
  return { inserted: result.inserted, updated: 0, errors };
}

// ── Sync categories → finance_categories ─────────────────────────────────────

export async function syncCategories(
  supabase: SupabaseClient,
  tenantId: string,
  creds: OmieCredentials
): Promise<SyncResult> {
  const errors: string[] = [];
  const allRecords: Record<string, unknown>[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      log.info("Categorias fetching page", { page });

      const data = await omieCall(
        creds,
        "geral/categorias/",
        "ListarCategorias",
        [{ pagina: page, registros_por_pagina: PAGE_SIZE }]
      );

      const categorias = (data.categoria_cadastro || []) as Array<{
        codigo: string;
        descricao: string;
        id_tipo_lancamento?: string;
      }>;

      log.info("Categorias page fetched", { page, count: categorias.length });

      for (const cat of categorias) {
        // OMIE id_tipo_lancamento is unreliable (often empty).
        // Derive type from code prefix: "1." = receita, "2." = despesa, "0." = transfer.
        const codePrefix = (cat.codigo || "").charAt(0);
        const tipo: "receita" | "despesa" =
          cat.id_tipo_lancamento === "R" || codePrefix === "1"
            ? "receita"
            : "despesa";

        allRecords.push({
          tenant_id: tenantId,
          name: cat.descricao,
          type: tipo,
          omie_id: cat.codigo,
          is_active: true,
        });
      }

      const totalPages = Math.ceil(
        ((data.total_de_registros as number) || 0) / PAGE_SIZE
      );
      hasMore = page < totalPages;
      page++;
      if (hasMore) await sleep(INTER_PAGE_DELAY_MS);
    }
  } catch (err) {
    errors.push(`Categorias: ${err instanceof Error ? err.message : String(err)}`);
  }

  const result = await batchUpsert(supabase, "finance_categories", allRecords, "tenant_id,omie_id");
  errors.push(...result.errors);

  log.info("Categorias done", { upserted: result.inserted, errors: errors.length });
  return { inserted: result.inserted, updated: 0, errors };
}

// ── Sync cost centers → finance_cost_centers ─────────────────────────────────

export async function syncCostCenters(
  supabase: SupabaseClient,
  tenantId: string,
  creds: OmieCredentials
): Promise<SyncResult> {
  const errors: string[] = [];
  const allRecords: Record<string, unknown>[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      log.info("Departamentos fetching page", { page });

      const data = await omieCall(
        creds,
        "geral/departamentos/",
        "ListarDepartamentos",
        [{ pagina: page, registros_por_pagina: PAGE_SIZE }]
      );

      const departamentos = (data.departamentos || []) as Array<{
        codigo: string;
        descricao: string;
        inativo?: string;
      }>;

      log.info("Departamentos page fetched", { page, count: departamentos.length });

      for (const dep of departamentos) {
        const omieId = String(dep.codigo || "");
        if (!omieId) continue;

        allRecords.push({
          tenant_id: tenantId,
          code: omieId,
          name: dep.descricao || `Departamento ${omieId}`,
          omie_id: omieId,
          is_active: dep.inativo !== "S",
        });
      }

      const totalPages = Math.ceil(
        ((data.total_de_registros as number) || 0) / PAGE_SIZE
      );
      hasMore = page < totalPages;
      page++;
      if (hasMore) await sleep(INTER_PAGE_DELAY_MS);
    }
  } catch (err) {
    errors.push(`Departamentos: ${err instanceof Error ? err.message : String(err)}`);
  }

  const result = await batchUpsert(supabase, "finance_cost_centers", allRecords, "tenant_id,omie_id");
  errors.push(...result.errors);

  log.info("Departamentos done", { upserted: result.inserted, errors: errors.length });
  return { inserted: result.inserted, updated: 0, errors };
}
