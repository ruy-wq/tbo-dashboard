import { describe, it, expect } from "vitest";
import { calcularImpostos } from "../services/fiscal-calculator";
import type { TaxCalculationInput } from "../services/fiscal-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(
  overrides: Partial<TaxCalculationInput["config"]> = {}
): TaxCalculationInput["config"] {
  return {
    aliquota_iss: 5,
    aliquota_pis: 0.65,
    aliquota_cofins: 3,
    aliquota_ir: 4.8,
    aliquota_csll: 2.88,
    optante_simples: false,
    regime_tributario: "lucro_presumido",
    ...overrides,
  };
}

// ── Simples Nacional ─────────────────────────────────────────────────────────

describe("calcularImpostos - Simples Nacional", () => {
  it("calculates ISS only, PIS/COFINS/IR/CSLL = 0 (included in DAS)", () => {
    const result = calcularImpostos({
      valor_servicos: 10000,
      iss_retido: true,
      config: makeConfig({ optante_simples: true }),
    });

    expect(result.valor_iss).toBeGreaterThan(0);
    expect(result.valor_pis).toBe(0);
    expect(result.valor_cofins).toBe(0);
    expect(result.valor_ir).toBe(0);
    expect(result.valor_csll).toBe(0);
  });

  it("also applies via regime_tributario = simples_nacional", () => {
    const result = calcularImpostos({
      valor_servicos: 10000,
      iss_retido: true,
      config: makeConfig({
        optante_simples: false,
        regime_tributario: "simples_nacional",
      }),
    });

    expect(result.valor_pis).toBe(0);
    expect(result.valor_cofins).toBe(0);
    expect(result.valor_ir).toBe(0);
    expect(result.valor_csll).toBe(0);
  });
});

// ── Lucro Presumido ──────────────────────────────────────────────────────────

describe("calcularImpostos - Lucro Presumido", () => {
  it("calculates all taxes (ISS + PIS + COFINS + IR + CSLL)", () => {
    const result = calcularImpostos({
      valor_servicos: 10000,
      iss_retido: true,
      config: makeConfig(),
    });

    expect(result.valor_iss).toBe(500); // 5% of 10000
    expect(result.valor_pis).toBe(65); // 0.65%
    expect(result.valor_cofins).toBe(300); // 3%
    expect(result.valor_ir).toBe(480); // 4.8%
    expect(result.valor_csll).toBe(288); // 2.88%
    expect(result.valor_total_impostos).toBe(1633);
    expect(result.valor_liquido).toBe(10000 - 1633);
  });
});

// ── ISS retido vs não retido ─────────────────────────────────────────────────

describe("calcularImpostos - ISS retido flag", () => {
  it("valor_iss = 0 when iss_retido = false", () => {
    const result = calcularImpostos({
      valor_servicos: 10000,
      iss_retido: false,
      config: makeConfig(),
    });

    expect(result.valor_iss).toBe(0);
  });

  it("valor_iss > 0 when iss_retido = true", () => {
    const result = calcularImpostos({
      valor_servicos: 10000,
      iss_retido: true,
      config: makeConfig(),
    });

    expect(result.valor_iss).toBe(500);
  });
});

// ── Deductions ───────────────────────────────────────────────────────────────

describe("calcularImpostos - deductions", () => {
  it("subtracts deductions and desconto_incondicionado from base", () => {
    const result = calcularImpostos({
      valor_servicos: 10000,
      valor_deducoes: 2000,
      valor_desconto_incondicionado: 500,
      iss_retido: true,
      config: makeConfig(),
    });

    expect(result.valor_base_calculo).toBe(7500);
    expect(result.valor_iss).toBe(375); // 5% of 7500
  });
});

// ── Edge cases ───────────────────────────────────────────────────────────────

describe("calcularImpostos - edge cases", () => {
  it("zero service value → all taxes = 0", () => {
    const result = calcularImpostos({
      valor_servicos: 0,
      iss_retido: true,
      config: makeConfig(),
    });

    expect(result.valor_base_calculo).toBe(0);
    expect(result.valor_iss).toBe(0);
    expect(result.valor_pis).toBe(0);
    expect(result.valor_cofins).toBe(0);
    expect(result.valor_ir).toBe(0);
    expect(result.valor_csll).toBe(0);
    expect(result.valor_total_impostos).toBe(0);
    expect(result.valor_liquido).toBe(0);
  });

  it("negative base after deductions → clamped to 0", () => {
    const result = calcularImpostos({
      valor_servicos: 1000,
      valor_deducoes: 800,
      valor_desconto_incondicionado: 500,
      iss_retido: true,
      config: makeConfig(),
    });

    expect(result.valor_base_calculo).toBe(0);
    expect(result.valor_iss).toBe(0);
    expect(result.valor_total_impostos).toBe(0);
    // valor_liquido = valor_servicos - total_impostos
    expect(result.valor_liquido).toBe(1000);
  });

  it("rounds values to 2 decimal places (R$0.01 precision)", () => {
    const result = calcularImpostos({
      valor_servicos: 999.99,
      iss_retido: true,
      config: makeConfig({ aliquota_iss: 3.5 }),
    });

    // base = 999.99, iss = 999.99 * 0.035 = 34.99965 → 35.00
    expect(result.valor_iss).toBe(35);
    // Every value should have at most 2 decimal places
    const check2dp = (n: number) =>
      expect(Math.round(n * 100) / 100).toBe(n);

    check2dp(result.valor_pis);
    check2dp(result.valor_cofins);
    check2dp(result.valor_ir);
    check2dp(result.valor_csll);
    check2dp(result.valor_total_impostos);
    check2dp(result.valor_liquido);
  });

  it("valor_liquido = valor_servicos - valor_total_impostos", () => {
    const result = calcularImpostos({
      valor_servicos: 5000,
      iss_retido: true,
      config: makeConfig(),
    });

    expect(result.valor_liquido).toBe(5000 - result.valor_total_impostos);
  });
});
