// ── AI Reconciliation Service ────────────────────────────────────────────────
// Barrel file + utility functions for the AI financial analyst agent.
// Used by the /api/ai/conciliacao API route (server-side only).
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

export * from "./ai-reconciliation-schemas";
export * from "./ai-reconciliation-prompts";

// ── Response parser (safe) ──────────────────────────────────────────────────

export function parseAIResponse<T>(
  raw: string,
  schema: z.ZodSchema<T>
): { ok: true; data: T } | { ok: false; error: string } {
  // Extract JSON from potential markdown code blocks
  let jsonStr = raw.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed: unknown = JSON.parse(jsonStr);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return { ok: true, data: result.data };
    }
    return { ok: false, error: `Validation failed: ${result.error.message}` };
  } catch {
    return { ok: false, error: `Invalid JSON: ${jsonStr.slice(0, 100)}...` };
  }
}

// ── Input hash (for deduplication) ──────────────────────────────────────────

export function computeInputHash(ids: string[]): string {
  const sorted = [...ids].sort();
  // Simple hash — good enough for dedup within tenant
  let hash = 0;
  const str = sorted.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
