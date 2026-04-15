/**
 * fiscal-service.ts
 * Supabase CRUD functions for NF-e and fiscal configuration.
 * Split from fiscal-engine.ts for the 300-line limit.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
  TaxConfig,
  TaxCalculationInput,
  TaxCalculationResult,
  NotaFiscal,
  NotaFiscalCreateInput,
  NotaFiscalFilters,
  NotaFiscalStatus,
  FiscalSummary,
  FiscalMonthlyReport,
} from "./fiscal-types";
import { calcularImpostos } from "./fiscal-calculator";

type Sb = SupabaseClient<Database>;

/** Busca ou cria configuração fiscal do tenant */
export async function getTaxConfig(sb: Sb): Promise<TaxConfig | null> {
  const { data, error } = await sb
    .from("finance_tax_config")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as TaxConfig | null;
}

/** Upsert configuração fiscal */
export async function upsertTaxConfig(
  sb: Sb,
  tenantId: string,
  payload: Partial<Omit<TaxConfig, "id" | "tenant_id" | "created_at" | "updated_at">>
): Promise<TaxConfig> {
  const { data, error } = await sb
    .from("finance_tax_config")
    .upsert({ ...payload, tenant_id: tenantId } as never, {
      onConflict: "tenant_id",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as TaxConfig;
}

/** Lista notas fiscais com filtros e paginação */
export async function listNotasFiscais(
  sb: Sb,
  filters: NotaFiscalFilters = {}
): Promise<{ data: NotaFiscal[]; count: number }> {
  const {
    status,
    tipo,
    competencia,
    dateFrom,
    dateTo,
    search,
    page = 1,
    pageSize = 50,
  } = filters;

  let query = sb
    .from("finance_notas_fiscais")
    .select("*", { count: "exact" })
    .order("data_emissao", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (tipo) query = query.eq("tipo", tipo);
  if (competencia) query = query.eq("data_competencia", competencia);
  if (dateFrom) query = query.gte("data_emissao", dateFrom);
  if (dateTo) query = query.lte("data_emissao", dateTo);
  if (search) {
    query = query.or(
      `tomador_razao.ilike.%${search}%,numero.ilike.%${search}%,tomador_cnpj.ilike.%${search}%`
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data ?? []) as NotaFiscal[], count: count ?? 0 };
}

/** Cria rascunho de NF-e com impostos calculados automaticamente */
export async function createNotaFiscal(
  sb: Sb,
  tenantId: string,
  userId: string,
  input: NotaFiscalCreateInput
): Promise<NotaFiscal> {
  const config = await getTaxConfig(sb);

  const defaultConfig: TaxCalculationInput["config"] = config ?? {
    aliquota_iss: 5,
    aliquota_pis: 0.65,
    aliquota_cofins: 3,
    aliquota_ir: 1.5,
    aliquota_csll: 1,
    optante_simples: true,
    regime_tributario: "simples_nacional",
  };

  const taxes = calcularImpostos({
    valor_servicos: input.valor_servicos,
    valor_deducoes: input.valor_deducoes,
    valor_desconto_incondicionado: input.valor_desconto_incondicionado,
    iss_retido: input.iss_retido,
    config: defaultConfig,
  });

  const payload = {
    tenant_id: tenantId,
    transaction_id: input.transaction_id ?? null,
    tipo: input.tipo ?? "nfse",
    status: "rascunho" as const,
    prestador_cnpj: input.prestador_cnpj ?? config?.cnpj ?? null,
    prestador_razao: input.prestador_razao ?? config?.razao_social ?? null,
    prestador_im: input.prestador_im ?? null,
    tomador_cnpj: input.tomador_cnpj ?? null,
    tomador_cpf: input.tomador_cpf ?? null,
    tomador_razao: input.tomador_razao ?? null,
    tomador_email: input.tomador_email ?? null,
    tomador_endereco: input.tomador_endereco ?? null,
    valor_servicos: input.valor_servicos,
    valor_deducoes: input.valor_deducoes ?? 0,
    valor_desconto_incondicionado: input.valor_desconto_incondicionado ?? 0,
    valor_desconto_condicionado: input.valor_desconto_condicionado ?? 0,
    iss_retido: input.iss_retido ?? false,
    discriminacao: input.discriminacao ?? null,
    codigo_municipio: input.codigo_municipio ?? config?.codigo_municipio ?? null,
    codigo_cnae: input.codigo_cnae ?? config?.codigo_cnae ?? null,
    codigo_tributacao_municipio: input.codigo_tributacao_municipio ?? null,
    natureza_operacao: input.natureza_operacao ?? 1,
    regime_especial_tributacao: input.regime_especial_tributacao ?? null,
    data_emissao: input.data_emissao ?? new Date().toISOString().slice(0, 10),
    data_competencia:
      input.data_competencia ??
      new Date().toISOString().slice(0, 7),
    numero_rps: input.numero_rps ?? null,
    serie_rps: input.serie_rps ?? null,
    created_by: userId,
    ...taxes,
  };

  const { data, error } = await sb
    .from("finance_notas_fiscais")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) throw error;
  return data as NotaFiscal;
}

/** Atualiza uma NF-e (recalcula impostos se valor_servicos mudar) */
export async function updateNotaFiscal(
  sb: Sb,
  id: string,
  userId: string,
  patch: Partial<NotaFiscalCreateInput> & { status?: NotaFiscalStatus }
): Promise<NotaFiscal> {
  const { data: current, error: fetchErr } = await sb
    .from("finance_notas_fiscais")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr) throw fetchErr;
  const nf = current as NotaFiscal;

  let taxUpdate: Partial<TaxCalculationResult> = {};
  if (patch.valor_servicos !== undefined) {
    const config = await getTaxConfig(sb);
    const defaultConfig: TaxCalculationInput["config"] = config ?? {
      aliquota_iss: 5,
      aliquota_pis: 0.65,
      aliquota_cofins: 3,
      aliquota_ir: 1.5,
      aliquota_csll: 1,
      optante_simples: true,
      regime_tributario: "simples_nacional",
    };
    taxUpdate = calcularImpostos({
      valor_servicos: patch.valor_servicos,
      valor_deducoes: patch.valor_deducoes ?? nf.valor_deducoes,
      valor_desconto_incondicionado:
        patch.valor_desconto_incondicionado ?? nf.valor_desconto_incondicionado,
      iss_retido: patch.iss_retido ?? nf.iss_retido,
      config: defaultConfig,
    });
  }

  const { data, error } = await sb
    .from("finance_notas_fiscais")
    .update({ ...patch, ...taxUpdate, updated_by: userId } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as NotaFiscal;
}

/** Relatório fiscal mensal (summary + lista de NF-e) */
export async function getFiscalMonthlyReport(
  sb: Sb,
  competencia: string
): Promise<FiscalMonthlyReport> {
  const { data, error } = await sb
    .from("finance_notas_fiscais")
    .select("*")
    .eq("data_competencia", competencia)
    .neq("status", "cancelada")
    .order("data_emissao", { ascending: false });

  if (error) throw error;
  const notas = (data ?? []) as NotaFiscal[];

  const summary: FiscalSummary = notas.reduce<FiscalSummary>(
    (acc, nf) => ({
      total_nfs: acc.total_nfs + 1,
      total_autorizadas:
        acc.total_autorizadas + (nf.status === "autorizada" ? 1 : 0),
      total_canceladas:
        acc.total_canceladas + (nf.status === "cancelada" ? 1 : 0),
      valor_servicos_total: acc.valor_servicos_total + nf.valor_servicos,
      valor_iss_total: acc.valor_iss_total + nf.valor_iss,
      valor_pis_total: acc.valor_pis_total + nf.valor_pis,
      valor_cofins_total: acc.valor_cofins_total + nf.valor_cofins,
      valor_ir_total: acc.valor_ir_total + nf.valor_ir,
      valor_csll_total: acc.valor_csll_total + nf.valor_csll,
      valor_total_impostos: acc.valor_total_impostos + nf.valor_total_impostos,
      valor_liquido_total: acc.valor_liquido_total + nf.valor_liquido,
    }),
    {
      total_nfs: 0,
      total_autorizadas: 0,
      total_canceladas: 0,
      valor_servicos_total: 0,
      valor_iss_total: 0,
      valor_pis_total: 0,
      valor_cofins_total: 0,
      valor_ir_total: 0,
      valor_csll_total: 0,
      valor_total_impostos: 0,
      valor_liquido_total: 0,
    }
  );

  return { competencia, summary, notas };
}

/** Cancela uma NF-e */
export async function cancelarNF(
  sb: Sb,
  id: string,
  userId: string,
  motivo: string
): Promise<NotaFiscal> {
  const { data, error } = await sb
    .from("finance_notas_fiscais")
    .update({
      status: "cancelada",
      motivo_cancelamento: motivo,
      data_cancelamento: new Date().toISOString(),
      updated_by: userId,
    } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as NotaFiscal;
}
