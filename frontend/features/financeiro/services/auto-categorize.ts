/**
 * auto-categorize.ts — Engine de auto-categorização e auto-vinculação a centros de custo.
 * Matching + main engine logic. Data/mappings in auto-categorize-mappings.ts.
 */

import type { FinanceCategory, FinanceCostCenter } from "./finance-types";
import type { AutoCategorizeResult } from "./auto-categorize-helpers";
import { normalize, normalizeAggressive, stripOmiePrefix } from "./auto-categorize-helpers";
import {
  COUNTERPART_CC_MAP,
  FALLBACK_RULES,
  BU_KEYWORDS_CC,
  inferCCFromCategoryName,
  inferCCFromDescription,
  inferCCFromBusinessUnit,
} from "./auto-categorize-mappings";

// Re-export types and helpers for backward compatibility
export type { AutoCategorizeResult } from "./auto-categorize-helpers";

function matchCategoryByName(
  description: string,
  categories: FinanceCategory[]
): FinanceCategory | null {
  const normalizedDesc = normalize(description);

  // 1. Exact match (description === category name)
  const exact = categories.find((c) => normalize(c.name) === normalizedDesc);
  if (exact) return exact;

  // 2. Description starts with category name (after stripping prefix)
  // e.g., description "(-) Pessoal - Salários" matches category "(-) Pessoal - Salários"
  const startsWith = categories.find((c) => {
    const catNorm = normalize(c.name);
    return catNorm.length > 5 && normalizedDesc.startsWith(catNorm);
  });
  if (startsWith) return startsWith;

  // 3. Category name starts with description
  const catStartsWith = categories.find((c) => {
    const catNorm = normalize(c.name);
    return normalizedDesc.length > 5 && catNorm.startsWith(normalizedDesc);
  });
  if (catStartsWith) return catStartsWith;

  // 4. Substantial overlap: stripped category name contained in description
  // Sort by name length descending to prefer more specific matches
  const sorted = [...categories].sort((a, b) => b.name.length - a.name.length);
  for (const cat of sorted) {
    const catStripped = normalize(stripOmiePrefix(cat.name));
    if (catStripped.length < 5) continue; // skip too-short names
    if (normalizedDesc.includes(catStripped)) return cat;
  }

  // 5. Description stripped text contained in category name
  const descStripped = normalize(stripOmiePrefix(description));
  if (descStripped.length >= 5) {
    for (const cat of sorted) {
      const catNorm = normalize(cat.name);
      if (catNorm.includes(descStripped)) return cat;
    }
  }

  // 6. Aggressive fuzzy match (handles OMIE broken encoding like "ServiAos" vs "Serviços")
  const aggressiveDesc = normalizeAggressive(description);
  if (aggressiveDesc.length >= 6) {
    // Try aggressive match: strip everything non-alphanumeric
    for (const cat of sorted) {
      const aggressiveCat = normalizeAggressive(cat.name);
      if (aggressiveCat.length < 6) continue;
      if (aggressiveDesc === aggressiveCat) return cat;
    }
    // Partial aggressive match (description contains category or vice versa)
    for (const cat of sorted) {
      const aggressiveCat = normalizeAggressive(stripOmiePrefix(cat.name));
      if (aggressiveCat.length < 5) continue;
      if (aggressiveDesc.includes(aggressiveCat) || aggressiveCat.includes(aggressiveDesc)) {
        return cat;
      }
    }
  }

  return null;
}

function matchCategoryByOmieHierarchy(
  description: string,
  type: "receita" | "despesa" | "transferencia",
  categories: FinanceCategory[]
): FinanceCategory | null {
  // Filter by type
  const filtered = categories.filter(
    (c) => c.type === type || type === "transferencia"
  );

  const normalizedDesc = normalize(description);

  // Try to find the most specific category whose stripped name appears in the description
  const candidates = filtered
    .filter((c) => {
      const stripped = normalize(stripOmiePrefix(c.name));
      return stripped.length >= 4 && normalizedDesc.includes(stripped);
    })
    .sort((a, b) => {
      // Prefer longer (more specific) matches
      const aLen = stripOmiePrefix(a.name).length;
      const bLen = stripOmiePrefix(b.name).length;
      return bLen - aLen;
    });

  return candidates[0] ?? null;
}

function matchByKeywordFallback(
  description: string,
  counterpart: string | null,
  type: "receita" | "despesa" | "transferencia",
  categories: FinanceCategory[],
  costCenters: FinanceCostCenter[]
): { category: FinanceCategory | null; cc: FinanceCostCenter | null; rule: string } | null {
  const text = normalize(`${description} ${counterpart ?? ""}`);

  for (const rule of FALLBACK_RULES) {
    const matchedKw = rule.keywords.find((kw) => text.includes(kw));
    if (!matchedKw) continue;

    const searchNorm = normalize(rule.categorySearch);
    const filtered = categories.filter((c) => c.type === type || type === "transferencia");

    // Find category by search pattern in stripped name
    const cat = filtered.find((c) => {
      const stripped = normalize(stripOmiePrefix(c.name));
      return stripped.includes(searchNorm) || searchNorm.includes(stripped);
    });

    const cc = rule.ccCode
      ? costCenters.find((c) => c.code === rule.ccCode) ?? null
      : null;

    if (cat || cc) {
      return { category: cat ?? null, cc, rule: `keyword: "${matchedKw}"` };
    }
  }

  return null;
}

export function autoCategorize(
  description: string,
  type: "receita" | "despesa" | "transferencia",
  counterpart: string | null,
  businessUnit: string | null,
  categories: FinanceCategory[],
  costCenters: FinanceCostCenter[]
): AutoCategorizeResult | null {
  if (!description.trim()) return null;

  let matchedCategory: FinanceCategory | null = null;
  let matchedCC: FinanceCostCenter | null = null;
  let confidence: "high" | "medium" | "low" = "low";
  let matchedRule = "";

  // Step 1: Direct name match (highest confidence)
  matchedCategory = matchCategoryByName(description, categories);
  if (matchedCategory) {
    confidence = "high";
    matchedRule = "nome direto";

    // Infer CC from the matched category's prefix
    matchedCC = inferCCFromCategoryName(matchedCategory.name, costCenters);
  }

  // Step 2: OMIE hierarchy match
  if (!matchedCategory) {
    matchedCategory = matchCategoryByOmieHierarchy(description, type, categories);
    if (matchedCategory) {
      confidence = "medium";
      matchedRule = "hierarquia OMIE";
      matchedCC = inferCCFromCategoryName(matchedCategory.name, costCenters);
    }
  }

  // Step 3: Keyword fallback
  if (!matchedCategory) {
    const fallback = matchByKeywordFallback(
      description, counterpart, type, categories, costCenters
    );
    if (fallback) {
      matchedCategory = fallback.category;
      matchedCC = fallback.cc;
      confidence = "medium";
      matchedRule = fallback.rule;
    }
  }

  // Step 4: CC from counterpart (collaborators → their BU)
  if (counterpart) {
    const cpNorm = normalize(counterpart);
    for (const { patterns, ccCode } of COUNTERPART_CC_MAP) {
      if (patterns.some((p) => cpNorm.includes(p))) {
        const ccFromCounterpart = costCenters.find((cc) => cc.code === ccCode) ?? null;
        if (ccFromCounterpart) {
          matchedCC = ccFromCounterpart;
          break;
        }
      }
    }
  }

  // Step 5: Cost center from BU field
  if (!matchedCC) {
    matchedCC = inferCCFromBusinessUnit(businessUnit, costCenters);
  }

  // Step 6: CC from BU keywords in description
  if (!matchedCC) {
    const descNorm = normalize(description);
    for (const { keywords, ccCode } of BU_KEYWORDS_CC) {
      if (keywords.some((kw) => descNorm.includes(kw))) {
        matchedCC = costCenters.find((cc) => cc.code === ccCode) ?? null;
        if (matchedCC) break;
      }
    }
  }

  // Step 7: Fallback CC from description prefix
  if (!matchedCC) {
    matchedCC = inferCCFromDescription(description, costCenters);
  }

  if (!matchedCategory && !matchedCC) return null;

  return {
    category_id: matchedCategory?.id ?? null,
    category_name: matchedCategory?.name ?? null,
    cost_center_id: matchedCC?.id ?? null,
    cost_center_name: matchedCC ? `${matchedCC.code} - ${matchedCC.name}` : null,
    confidence,
    matched_rule: matchedRule,
  };
}

export function batchAutoCategorize(
  transactions: Array<{
    id: string;
    description: string;
    type: "receita" | "despesa" | "transferencia";
    counterpart: string | null;
    business_unit: string | null;
    category_id: string | null;
    cost_center_id: string | null;
  }>,
  categories: FinanceCategory[],
  costCenters: FinanceCostCenter[]
): Array<{
  id: string;
  category_id: string | null;
  cost_center_id: string | null;
  confidence: "high" | "medium" | "low";
  matched_rule: string;
}> {
  const results: Array<{
    id: string;
    category_id: string | null;
    cost_center_id: string | null;
    confidence: "high" | "medium" | "low";
    matched_rule: string;
  }> = [];

  for (const tx of transactions) {
    if (tx.category_id && tx.cost_center_id) continue;

    const suggestion = autoCategorize(
      tx.description,
      tx.type,
      tx.counterpart,
      tx.business_unit,
      categories,
      costCenters
    );

    if (!suggestion) continue;

    const update = {
      id: tx.id,
      category_id: !tx.category_id ? suggestion.category_id : null,
      cost_center_id: !tx.cost_center_id ? suggestion.cost_center_id : null,
      confidence: suggestion.confidence,
      matched_rule: suggestion.matched_rule,
    };

    if (update.category_id || update.cost_center_id) {
      results.push(update);
    }
  }

  return results;
}
