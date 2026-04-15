/**
 * auto-categorize-helpers.ts
 * Normalization helpers and shared types for the auto-categorize engine.
 * Split from auto-categorize.ts for the 300-line limit.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AutoCategorizeResult {
  category_id: string | null;
  category_name: string | null;
  cost_center_id: string | null;
  cost_center_name: string | null;
  confidence: "high" | "medium" | "low";
  matched_rule: string;
}

// ── Normalization ──────────────────────────────────────────────────────────

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Handle OMIE broken encoding: "ServiAos" → "servicaos" → match "servicos"
    // Remove stray uppercase-turned-lowercase chars from broken UTF-8
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Aggressive normalization that strips ALL non-alphanumeric chars.
 * Used for fuzzy matching where OMIE encoding is broken
 * (e.g. "Serviços" stored as "ServiAos", "Mão" as "MAo").
 */
export function normalizeAggressive(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Strip OMIE prefix markers like (+), (-) and leading/trailing whitespace */
export function stripOmiePrefix(name: string): string {
  return name.replace(/^\s*\([+-]\)\s*/, "").trim();
}
