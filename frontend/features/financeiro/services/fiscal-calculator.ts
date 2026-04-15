/**
 * fiscal-calculator.ts
 * Tax calculation engine for NF-e.
 * Split from fiscal-engine.ts for the 300-line limit.
 */

import type { TaxCalculationInput, TaxCalculationResult } from "./fiscal-types";

/**
 * Calcula todos os impostos sobre serviços para uma NF-e.
 * Simples Nacional: ISS apenas (PIS/COFINS incluídos no DAS).
 * Lucro Presumido / Real: ISS + PIS + COFINS + IR + CSLL.
 */
export function calcularImpostos(input: TaxCalculationInput): TaxCalculationResult {
  const {
    valor_servicos,
    valor_deducoes = 0,
    valor_desconto_incondicionado = 0,
    iss_retido = false,
    config,
  } = input;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const base = round2(
    Math.max(0, valor_servicos - valor_deducoes - valor_desconto_incondicionado)
  );

  // ISS — todos os regimes
  const aliquota_iss = config.aliquota_iss / 100;
  const valor_iss = iss_retido ? round2(base * aliquota_iss) : 0;

  // Simples Nacional: PIS/COFINS/IR/CSLL já incluídos no DAS
  const isSimples =
    config.optante_simples || config.regime_tributario === "simples_nacional";

  const aliquota_pis = isSimples ? 0 : config.aliquota_pis / 100;
  const valor_pis = round2(base * aliquota_pis);

  const aliquota_cofins = isSimples ? 0 : config.aliquota_cofins / 100;
  const valor_cofins = round2(base * aliquota_cofins);

  const aliquota_ir = isSimples ? 0 : config.aliquota_ir / 100;
  const valor_ir = round2(base * aliquota_ir);

  const aliquota_csll = isSimples ? 0 : config.aliquota_csll / 100;
  const valor_csll = round2(base * aliquota_csll);

  const valor_total_impostos = round2(
    valor_iss + valor_pis + valor_cofins + valor_ir + valor_csll
  );
  const valor_liquido = round2(valor_servicos - valor_total_impostos);

  return {
    valor_base_calculo: base,
    aliquota_iss: config.aliquota_iss,
    valor_iss,
    aliquota_pis: config.aliquota_pis,
    valor_pis,
    aliquota_cofins: config.aliquota_cofins,
    valor_cofins,
    aliquota_ir: config.aliquota_ir,
    valor_ir,
    aliquota_csll: config.aliquota_csll,
    valor_csll,
    valor_total_impostos,
    valor_liquido,
  };
}
