// OMIE: READ-ONLY — Finança Azul manages OMIE data. This integration ONLY reads from OMIE.
// All writes go to Supabase local tables. NEVER call POST/PUT/DELETE on OMIE endpoints.

import { createClient } from "@/lib/supabase/server";

// ── Constants ────────────────────────────────────────────────────────────────

export const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";
// OMIE cap implícito: endpoints de Clientes/Fornecedores/ContasReceber retornam
// no máximo 100 por página e mentem total_de_registros quando pedimos mais.
// Manter em 100 garante paginação honesta em todos os endpoints.
export const PAGE_SIZE = 100;
export const BATCH_SIZE = 500;
export const MAX_RETRIES = 5;
export const INTER_PAGE_DELAY_MS = 2000;
export const INTER_PHASE_DELAY_MS = 4000;

// ── Circuit Breaker ──────────────────────────────────────────────────────────

/** Circuit breaker state — in-memory per Edge Function instance */
interface CircuitBreakerState {
  failures: number;
  openedAt: number | null;
}

const _cb: CircuitBreakerState = { failures: 0, openedAt: null };
const CB_THRESHOLD = 3;
const CB_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function isCircuitOpen(): boolean {
  if (!_cb.openedAt) return false;
  if (Date.now() - _cb.openedAt > CB_COOLDOWN_MS) {
    // Auto-reset after cooldown
    _cb.failures = 0;
    _cb.openedAt = null;
    return false;
  }
  return true;
}

export function getCircuitState(): { open: boolean; failures: number; openedAt: number | null; remainingMs: number | null } {
  const open = isCircuitOpen();
  const remainingMs = open && _cb.openedAt
    ? Math.max(0, CB_COOLDOWN_MS - (Date.now() - _cb.openedAt))
    : null;
  return { open, failures: _cb.failures, openedAt: _cb.openedAt, remainingMs };
}

function recordCircuitSuccess(): void {
  _cb.failures = 0;
  _cb.openedAt = null;
}

function recordCircuitFailure(): void {
  _cb.failures++;
  if (_cb.failures >= CB_THRESHOLD && !_cb.openedAt) {
    _cb.openedAt = Date.now();
    // Note: we can't call log here (defined later) — caller logs the open event
  }
}

export function wasCircuitJustOpened(prevOpen: boolean): boolean {
  return !prevOpen && isCircuitOpen();
}

// ── Types ────────────────────────────────────────────────────────────────────

export type SupabaseClient = ReturnType<typeof createClient> extends Promise<infer T>
  ? T
  : never;

export type LookupMap = Map<string, string>; // omie_id → our UUID

export interface CostCenterInfo {
  name: string;
  override: string | null;
}
export type CostCenterInfoMap = Map<string, CostCenterInfo>;

export interface SyncResult {
  inserted: number;
  updated: number;
  errors: string[];
}

export interface SyncLogError {
  entity: string;
  message: string;
}

export interface OmieCredentials {
  app_key: string;
  app_secret: string;
}

export type ClientNameInfo = { name: string; cnpj: string | null };
export type ClientNameMap = Map<string, ClientNameInfo>;

// ── Helpers ──────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseOmieWaitSeconds(text: string): number {
  const m = text.match(/Aguarde (\d+) segundos/i);
  return m ? Math.min(Number(m[1]) + 2, 30) : 15;
}

/** Check if we have enough time remaining (30s safety margin) */
export function hasTimeRemaining(startTime: number, maxDurationSec: number): boolean {
  const elapsed = Date.now() - startTime;
  const maxMs = (maxDurationSec - 30) * 1000;
  return elapsed < maxMs;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export function parseOmieDate(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return null;
}

/** Format date as DD/MM/YYYY for Omie API params */
export function formatOmieDateParam(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ── Omie API caller ──────────────────────────────────────────────────────────

import { createSyncLogger } from "./_logger";

const log = createSyncLogger("omie-api");

// OMIE: READ-ONLY — this function only sends read requests (ListarXxx calls)
export async function omieCall(
  creds: OmieCredentials,
  endpoint: string,
  call: string,
  params: Record<string, unknown>[]
): Promise<Record<string, unknown>> {
  // Circuit breaker guard
  if (isCircuitOpen()) {
    const state = getCircuitState();
    const remainSec = state.remainingMs ? Math.ceil(state.remainingMs / 1000) : "?";
    throw new Error(`Omie circuit breaker OPEN — aguardar ${remainSec}s antes de tentar novamente`);
  }

  // Exponential backoff delays (ms): 1s, 3s, 9s for transient errors
  const BACKOFF_MS = [1000, 3000, 9000];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    let text: string;

    try {
      res = await fetch(`${OMIE_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call,
          app_key: creds.app_key,
          app_secret: creds.app_secret,
          param: params,
        }),
        signal: AbortSignal.timeout(30_000), // 30s per request
      });
      text = await res.text().catch(() => "");
    } catch (networkErr) {
      // Network error — retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        const waitMs = BACKOFF_MS[attempt] ?? 9000;
        log.warn("Network error, retrying", { call, attempt: attempt + 1, waitMs, error: String(networkErr) });
        await sleep(waitMs);
        continue;
      }
      recordCircuitFailure();
      throw new Error(`Omie network error for ${call}: ${String(networkErr)}`);
    }

    if (
      !res.ok &&
      text.includes("Consumo redundante") &&
      attempt < MAX_RETRIES
    ) {
      const waitSec = parseOmieWaitSeconds(text);
      log.warn("Rate limited", { call, waitSec, attempt: attempt + 1, maxRetries: MAX_RETRIES });
      await sleep(waitSec * 1000);
      continue;
    }

    if (!res.ok) {
      // Transient server error (5xx) — retry with exponential backoff
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        const waitMs = BACKOFF_MS[attempt] ?? 9000;
        log.warn("Server error, retrying", { call, status: res.status, attempt: attempt + 1, waitMs });
        await sleep(waitMs);
        continue;
      }
      recordCircuitFailure();
      throw new Error(`Omie HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      recordCircuitFailure();
      throw new Error(`Omie invalid JSON: ${text.slice(0, 200)}`);
    }

    if (data.faultstring) {
      const fault = String(data.faultstring);
      if (fault.includes("Consumo redundante") && attempt < MAX_RETRIES) {
        const waitSec = parseOmieWaitSeconds(fault);
        log.warn("Rate limited (fault)", { call, waitSec, attempt: attempt + 1, maxRetries: MAX_RETRIES });
        await sleep(waitSec * 1000);
        continue;
      }
      recordCircuitFailure();
      throw new Error(`Omie error: ${fault}`);
    }

    // Success — reset circuit breaker
    recordCircuitSuccess();
    return data;
  }

  recordCircuitFailure();
  throw new Error(`Omie: max retries exceeded for ${call}`);
}

// ── Batch upsert ─────────────────────────────────────────────────────────────

export async function batchUpsert(
  supabase: SupabaseClient,
  table: string,
  records: Record<string, unknown>[],
  onConflict: string
): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await (supabase as never as { from: (t: string) => { upsert: (d: unknown, o: { onConflict: string; ignoreDuplicates: boolean }) => Promise<{ error: { message: string } | null }> } })
      .from(table)
      .upsert(batch as never, { onConflict, ignoreDuplicates: false });

    if (error) {
      errors.push(`Batch ${table} [${i}-${i + batch.length}]: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

// ── Progress update ──────────────────────────────────────────────────────────

export async function updateSyncProgress(
  supabase: SupabaseClient,
  syncLogId: string | null,
  updates: Record<string, unknown>
): Promise<void> {
  if (!syncLogId) return;
  await (supabase as never as { from: (t: string) => { update: (d: unknown) => { eq: (c: string, v: string) => Promise<unknown> } } })
    .from("omie_sync_log")
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq("id", syncLogId);
}
