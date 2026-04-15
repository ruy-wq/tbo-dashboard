import { describe, it, expect } from "vitest";
import { parseAIResponse, computeInputHash } from "../services/ai-reconciliation";
import {
  AIMatchSuggestionSchema,
  AIMatchResponseSchema,
  AICategorySuggestionSchema,
  AIAnomalySchema,
  AISummaryResponseSchema,
} from "../services/ai-reconciliation-schemas";

// ── parseAIResponse ──────────────────────────────────────────────────────────

describe("parseAIResponse", () => {
  const simpleSchema = AIMatchSuggestionSchema;

  const validMatch = {
    bankTxId: "bank-1",
    financeTxId: "fin-1",
    confidence: 85,
    reasoning: "Same amount and date",
  };

  it("valid JSON matching schema → { ok: true, data }", () => {
    const raw = JSON.stringify(validMatch);
    const result = parseAIResponse(raw, simpleSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bankTxId).toBe("bank-1");
      expect(result.data.confidence).toBe(85);
    }
  });

  it("JSON wrapped in markdown code block → extracted and parsed", () => {
    const raw = "```json\n" + JSON.stringify(validMatch) + "\n```";
    const result = parseAIResponse(raw, simpleSchema);
    expect(result.ok).toBe(true);
  });

  it("JSON wrapped in bare code block → extracted and parsed", () => {
    const raw = "```\n" + JSON.stringify(validMatch) + "\n```";
    const result = parseAIResponse(raw, simpleSchema);
    expect(result.ok).toBe(true);
  });

  it("invalid JSON → { ok: false, error }", () => {
    const result = parseAIResponse("not json at all {", simpleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Invalid JSON");
    }
  });

  it("valid JSON but wrong shape → { ok: false, error }", () => {
    const raw = JSON.stringify({ foo: "bar" });
    const result = parseAIResponse(raw, simpleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Validation failed");
    }
  });

  it("empty string → error", () => {
    const result = parseAIResponse("", simpleSchema);
    expect(result.ok).toBe(false);
  });

  it("works with AIMatchResponseSchema (array of matches)", () => {
    const raw = JSON.stringify({
      matches: [validMatch],
      insights: "All looks good",
    });
    const result = parseAIResponse(raw, AIMatchResponseSchema);
    expect(result.ok).toBe(true);
  });
});

// ── computeInputHash ─────────────────────────────────────────────────────────

describe("computeInputHash", () => {
  it("same IDs in different order → same hash (sorted)", () => {
    const h1 = computeInputHash(["a", "b", "c"]);
    const h2 = computeInputHash(["c", "a", "b"]);
    expect(h1).toBe(h2);
  });

  it("different IDs → different hash", () => {
    const h1 = computeInputHash(["a", "b"]);
    const h2 = computeInputHash(["x", "y"]);
    expect(h1).not.toBe(h2);
  });

  it("empty array → consistent hash", () => {
    const h1 = computeInputHash([]);
    const h2 = computeInputHash([]);
    expect(h1).toBe(h2);
    expect(typeof h1).toBe("string");
  });
});

// ── Schema validation ────────────────────────────────────────────────────────

describe("AIMatchSuggestionSchema", () => {
  it("accepts valid match", () => {
    const result = AIMatchSuggestionSchema.safeParse({
      bankTxId: "b-1",
      financeTxId: "f-1",
      confidence: 90,
      reasoning: "exact match",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = AIMatchSuggestionSchema.safeParse({
      bankTxId: "b-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const result = AIMatchSuggestionSchema.safeParse({
      bankTxId: "b-1",
      financeTxId: "f-1",
      confidence: 150,
      reasoning: "test",
    });
    expect(result.success).toBe(false);
  });
});

describe("AICategorySuggestionSchema", () => {
  it("accepts valid categorization", () => {
    const result = AICategorySuggestionSchema.safeParse({
      bankTxId: "b-1",
      suggestedCategory: "Marketing",
      suggestedCostCenter: "MKT",
      suggestedType: "despesa",
      confidence: 75,
      reasoning: "Pattern matches marketing expenses",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null cost center", () => {
    const result = AICategorySuggestionSchema.safeParse({
      bankTxId: "b-1",
      suggestedCategory: "Receita",
      suggestedCostCenter: null,
      suggestedType: "receita",
      confidence: 80,
      reasoning: "Revenue",
    });
    expect(result.success).toBe(true);
  });
});

describe("AIAnomalySchema", () => {
  it("accepts valid anomaly with all severity/type enums", () => {
    for (const severity of ["info", "alerta", "critico"] as const) {
      for (const type of [
        "duplicata",
        "valor_atipico",
        "padrao_irregular",
        "ausencia",
        "divergencia",
      ] as const) {
        const result = AIAnomalySchema.safeParse({
          id: `anomaly-${severity}-${type}`,
          severity,
          type,
          title: "Test anomaly",
          description: "Description",
          affectedTxIds: ["tx-1"],
          suggestedAction: "Investigate",
        });
        expect(result.success).toBe(true);
      }
    }
  });
});

describe("AISummaryResponseSchema", () => {
  it("accepts valid summary", () => {
    const result = AISummaryResponseSchema.safeParse({
      diagnostico: "Financeiro saudável",
      destaques: [
        { tipo: "positivo", texto: "Receita cresceu 10%" },
        { tipo: "atencao", texto: "Custos fixos altos" },
        { tipo: "risco", texto: "Inadimplência subiu" },
      ],
      acoes: ["Revisar custos", "Cobrar inadimplentes"],
      metricas: {
        receitaPeriodo: 100000,
        despesaPeriodo: 80000,
        margemPct: 20,
        conciliacaoPct: 85,
        inadimplenciaPct: 5,
      },
    });
    expect(result.success).toBe(true);
  });
});
