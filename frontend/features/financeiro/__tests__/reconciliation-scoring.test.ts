import { describe, it, expect } from "vitest";
import {
  calculateMatchScore,
  type MatchCandidate,
} from "../services/reconciliation-scoring";

// descriptionSimilarity is not exported, so we test it indirectly through calculateMatchScore

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCandidate(
  overrides: Partial<MatchCandidate> = {}
): MatchCandidate {
  return {
    bankAmount: 1500,
    bankDate: "2026-03-15",
    bankDescription: "Pagamento servico design",
    financeAmount: 1500,
    financeDate: "2026-03-15",
    financeDescription: "Pagamento servico design",
    ruleMatches: false,
    ...overrides,
  };
}

// ── calculateMatchScore ──────────────────────────────────────────────────────

describe("calculateMatchScore", () => {
  it("perfect match → score close to 85-100", () => {
    const result = calculateMatchScore(makeCandidate());
    // amount=40 + date=25 + desc=20 + rule=0 = 85
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.tier).toBe("alta");
  });

  it("amount exact match (+40 pts): differ by <= 0.01", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankAmount: 100.005, financeAmount: 100.00 })
    );
    expect(result.breakdown.amount).toBe(40);
  });

  it("amount near match (+30 pts): differ by <= 0.10", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankAmount: 100.08, financeAmount: 100.00 })
    );
    expect(result.breakdown.amount).toBe(30);
  });

  it("amount approximate (+15 pts): differ by <= 1.00", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankAmount: 100.50, financeAmount: 100.00 })
    );
    expect(result.breakdown.amount).toBe(15);
  });

  it("amount mismatch (0 pts): differ by > 1.00", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankAmount: 200, financeAmount: 100 })
    );
    expect(result.breakdown.amount).toBe(0);
  });

  it("same day (+25 pts)", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankDate: "2026-03-15", financeDate: "2026-03-15" })
    );
    expect(result.breakdown.date).toBe(25);
  });

  it("within 3 days (+15 pts)", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankDate: "2026-03-15", financeDate: "2026-03-17" })
    );
    expect(result.breakdown.date).toBe(15);
  });

  it("within 7 days (+5 pts)", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankDate: "2026-03-15", financeDate: "2026-03-21" })
    );
    expect(result.breakdown.date).toBe(5);
  });

  it("beyond 7 days (0 pts)", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankDate: "2026-03-01", financeDate: "2026-03-20" })
    );
    expect(result.breakdown.date).toBe(0);
  });

  it("description similarity: high overlap → up to 20 pts", () => {
    const result = calculateMatchScore(
      makeCandidate({
        bankDescription: "Pagamento servico design branding",
        financeDescription: "Pagamento servico design branding TBO",
      })
    );
    expect(result.breakdown.description).toBeGreaterThanOrEqual(10);
  });

  it("description similarity: no overlap → 0 pts", () => {
    const result = calculateMatchScore(
      makeCandidate({
        bankDescription: "ABC XYZ",
        financeDescription: "QWE RTY",
      })
    );
    expect(result.breakdown.description).toBe(0);
  });

  it("rule matches (+15 pts bonus)", () => {
    const result = calculateMatchScore(makeCandidate({ ruleMatches: true }));
    expect(result.breakdown.rule).toBe(15);
  });

  it("no rule match → 0 rule pts", () => {
    const result = calculateMatchScore(makeCandidate({ ruleMatches: false }));
    expect(result.breakdown.rule).toBe(0);
  });

  it("tier: score >= 80 → alta", () => {
    const result = calculateMatchScore(makeCandidate({ ruleMatches: false }));
    // 40+25+20+0 = 85
    expect(result.tier).toBe("alta");
  });

  it("tier: score >= 50 → media", () => {
    const result = calculateMatchScore(
      makeCandidate({
        bankAmount: 200,
        financeAmount: 100,
        bankDescription: "Pagamento servico design",
        financeDescription: "Pagamento servico design",
        bankDate: "2026-03-15",
        financeDate: "2026-03-17",
      })
    );
    // amount=0 + date=15 + desc=20 + rule=0 = 35 → baixa
    // Adjust to get media range
    const result2 = calculateMatchScore(
      makeCandidate({
        bankAmount: 100.50,
        financeAmount: 100,
        bankDate: "2026-03-15",
        financeDate: "2026-03-17",
        ruleMatches: true,
      })
    );
    // amount=15 + date=15 + desc≈20 + rule=15 = 65
    expect(result2.tier).toBe("media");
  });

  it("tier: score < 50 → baixa", () => {
    const result = calculateMatchScore(
      makeCandidate({
        bankAmount: 5000,
        financeAmount: 100,
        bankDate: "2026-01-01",
        financeDate: "2026-03-15",
        bankDescription: "ABC",
        financeDescription: "XYZ",
      })
    );
    expect(result.tier).toBe("baixa");
    expect(result.score).toBeLessThan(50);
  });

  it("score is capped at 100", () => {
    const result = calculateMatchScore(makeCandidate({ ruleMatches: true }));
    // 40+25+20+15 = 100
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles negative bank amount (debit) correctly", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankAmount: -1500, financeAmount: 1500 })
    );
    // Math.abs(-1500) - Math.abs(1500) = 0 → 40 pts
    expect(result.breakdown.amount).toBe(40);
  });
});

// ── descriptionSimilarity (tested indirectly) ────────────────────────────────

describe("descriptionSimilarity (via calculateMatchScore)", () => {
  it("identical strings → max description pts (20)", () => {
    const result = calculateMatchScore(
      makeCandidate({
        bankDescription: "Nota fiscal servico",
        financeDescription: "Nota fiscal servico",
      })
    );
    expect(result.breakdown.description).toBe(20);
  });

  it("empty strings → 0 description pts", () => {
    const result = calculateMatchScore(
      makeCandidate({ bankDescription: "", financeDescription: "" })
    );
    expect(result.breakdown.description).toBe(0);
  });

  it("accent-insensitive comparison", () => {
    const result = calculateMatchScore(
      makeCandidate({
        bankDescription: "serviço prestação",
        financeDescription: "servico prestacao",
      })
    );
    expect(result.breakdown.description).toBe(20);
  });

  it("partial overlap → between 0 and 20", () => {
    const result = calculateMatchScore(
      makeCandidate({
        bankDescription: "pagamento servico design branding",
        financeDescription: "recebimento servico consultoria branding",
      })
    );
    expect(result.breakdown.description).toBeGreaterThan(0);
    expect(result.breakdown.description).toBeLessThan(20);
  });
});
