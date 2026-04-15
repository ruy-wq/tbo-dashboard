/**
 * fiscal-types.ts
 * Types and interfaces for the fiscal engine module.
 * Split from fiscal-engine.ts for the 300-line limit.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type NotaFiscalStatus =
  | "rascunho"
  | "processando"
  | "autorizada"
  | "cancelada"
  | "rejeitada";

export type NotaFiscalTipo = "nfse" | "nfe" | "nfce";

export type RegimeTributario =
  | "simples_nacional"
  | "lucro_presumido"
  | "lucro_real"
  | "mei";

export interface TaxConfig {
  id: string;
  tenant_id: string;
  cnpj: string | null;
  razao_social: string | null;
  codigo_municipio: string | null;
  codigo_cnae: string | null;
  regime_tributario: RegimeTributario;
  optante_simples: boolean;
  incentivador_cultural: boolean;
  aliquota_iss: number;
  aliquota_pis: number;
  aliquota_cofins: number;
  aliquota_ir: number;
  aliquota_csll: number;
  created_at: string;
  updated_at: string;
}

export interface TomadorEndereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface NotaFiscal {
  id: string;
  tenant_id: string;
  transaction_id: string | null;
  numero: string | null;
  serie: string | null;
  tipo: NotaFiscalTipo;
  status: NotaFiscalStatus;
  // Emitente
  prestador_cnpj: string | null;
  prestador_razao: string | null;
  prestador_im: string | null;
  // Tomador
  tomador_cnpj: string | null;
  tomador_cpf: string | null;
  tomador_razao: string | null;
  tomador_email: string | null;
  tomador_endereco: TomadorEndereco | null;
  // Valores
  valor_servicos: number;
  valor_deducoes: number;
  valor_desconto_incondicionado: number;
  valor_desconto_condicionado: number;
  valor_base_calculo: number;
  // Impostos
  aliquota_iss: number;
  valor_iss: number;
  iss_retido: boolean;
  aliquota_pis: number;
  valor_pis: number;
  aliquota_cofins: number;
  valor_cofins: number;
  aliquota_ir: number;
  valor_ir: number;
  aliquota_csll: number;
  valor_csll: number;
  valor_total_impostos: number;
  valor_liquido: number;
  // Serviço
  discriminacao: string | null;
  codigo_municipio: string | null;
  codigo_cnae: string | null;
  codigo_tributacao_municipio: string | null;
  natureza_operacao: number;
  regime_especial_tributacao: number | null;
  // Datas
  data_emissao: string | null;
  data_competencia: string | null;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
  // Externas
  chave_acesso: string | null;
  protocolo: string | null;
  numero_rps: string | null;
  serie_rps: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  // Auditoria
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxCalculationInput {
  valor_servicos: number;
  valor_deducoes?: number;
  valor_desconto_incondicionado?: number;
  iss_retido?: boolean;
  config: Pick<
    TaxConfig,
    | "aliquota_iss"
    | "aliquota_pis"
    | "aliquota_cofins"
    | "aliquota_ir"
    | "aliquota_csll"
    | "optante_simples"
    | "regime_tributario"
  >;
}

export interface TaxCalculationResult {
  valor_base_calculo: number;
  aliquota_iss: number;
  valor_iss: number;
  aliquota_pis: number;
  valor_pis: number;
  aliquota_cofins: number;
  valor_cofins: number;
  aliquota_ir: number;
  valor_ir: number;
  aliquota_csll: number;
  valor_csll: number;
  valor_total_impostos: number;
  valor_liquido: number;
}

export interface FiscalSummary {
  total_nfs: number;
  total_autorizadas: number;
  total_canceladas: number;
  valor_servicos_total: number;
  valor_iss_total: number;
  valor_pis_total: number;
  valor_cofins_total: number;
  valor_ir_total: number;
  valor_csll_total: number;
  valor_total_impostos: number;
  valor_liquido_total: number;
}

export interface FiscalMonthlyReport {
  competencia: string;
  summary: FiscalSummary;
  notas: NotaFiscal[];
}

export interface NotaFiscalCreateInput {
  transaction_id?: string;
  tipo?: NotaFiscalTipo;
  prestador_cnpj?: string;
  prestador_razao?: string;
  prestador_im?: string;
  tomador_cnpj?: string;
  tomador_cpf?: string;
  tomador_razao?: string;
  tomador_email?: string;
  tomador_endereco?: TomadorEndereco;
  valor_servicos: number;
  valor_deducoes?: number;
  valor_desconto_incondicionado?: number;
  valor_desconto_condicionado?: number;
  iss_retido?: boolean;
  discriminacao?: string;
  codigo_municipio?: string;
  codigo_cnae?: string;
  codigo_tributacao_municipio?: string;
  natureza_operacao?: number;
  regime_especial_tributacao?: number;
  data_emissao?: string;
  data_competencia?: string;
  numero_rps?: string;
  serie_rps?: string;
}

export interface NotaFiscalFilters {
  status?: NotaFiscalStatus;
  tipo?: NotaFiscalTipo;
  competencia?: string;     // YYYY-MM
  dateFrom?: string;
  dateTo?: string;
  search?: string;          // tomador_razao / numero
  page?: number;
  pageSize?: number;
}
