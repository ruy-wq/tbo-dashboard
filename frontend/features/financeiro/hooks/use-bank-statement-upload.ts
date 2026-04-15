"use client";

// ── use-bank-statement-upload ─────────────────────────────────────────────────
// Hook que orquestra: detect format → parse → preview → insert no Supabase.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { createLogger } from "@/lib/logger";
import { parseOFX, type OFXStatement } from "@/features/financeiro/services/ofx-parser";
import { parseCNAB240, type CNAB240File } from "@/features/financeiro/services/cnab-parser";
import {
  insertBankTransactions,
  listBankAccounts,
  createBankAccount,
} from "@/features/financeiro/services/bank-reconciliation";
import type { BankTransactionInsert, BankAccount } from "@/lib/supabase/types/bank-reconciliation";

const logger = createLogger("bank-statement-upload");

// ── Types ────────────────────────────────────────────────────────────────────

export type StatementFormat = "ofx" | "cnab240";

export interface ParsedStatement {
  format: StatementFormat;
  /** Identificador da conta (número) extraído do arquivo */
  accountId: string;
  bankCode: string;
  agency?: string;
  /** Data inicial do período */
  startDate: string;
  /** Data final do período */
  endDate: string;
  /** Total de transações parseadas */
  transactionCount: number;
  /** Soma de créditos */
  totalCredits: number;
  /** Soma de débitos */
  totalDebits: number;
  /** Saldo informado no arquivo (OFX only) */
  balance?: number;
  /** Transações prontas para insert */
  transactions: BankTransactionInsert[];
  /** Dados brutos para referência */
  raw: OFXStatement | CNAB240File;
}

export interface UploadState {
  /** Etapa do fluxo */
  step: "idle" | "parsing" | "preview" | "importing" | "done" | "error";
  /** Arquivo selecionado */
  file: File | null;
  /** Statement parseado (disponível em step=preview) */
  parsed: ParsedStatement | null;
  /** Conta bancária selecionada para vincular */
  bankAccountId: string | null;
  /** Erro (disponível em step=error) */
  error: string | null;
  /** Resultado do import */
  result: { inserted: number; skipped: number } | null;
}

const INITIAL_STATE: UploadState = {
  step: "idle",
  file: null,
  parsed: null,
  bankAccountId: null,
  error: null,
  result: null,
};

// ── Format detection ────────────────────────────────────────────────────────

function detectFormat(content: string, fileName: string): StatementFormat | null {
  const ext = fileName.toLowerCase().split(".").pop();

  // OFX: has <OFX> tag or .ofx extension
  if (ext === "ofx" || content.toUpperCase().includes("<OFX>")) return "ofx";

  // CNAB 240: first line has exactly 240 chars, or .ret/.rem extension
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  if (firstLine.length === 240) return "cnab240";
  if (ext === "ret" || ext === "rem") return "cnab240";

  return null;
}

// ── OFX → BankTransactionInsert[] ───────────────────────────────────────────

function ofxToInserts(
  statement: OFXStatement,
  tenantId: string,
  bankAccountId: string
): BankTransactionInsert[] {
  return statement.transactions.map((tx) => ({
    tenant_id: tenantId,
    bank_account_id: bankAccountId,
    transaction_date: tx.date,
    amount: tx.amount,
    type: tx.type,
    description: tx.description,
    ofx_id: tx.fitid,
  }));
}

// ── CNAB → BankTransactionInsert[] ──────────────────────────────────────────

function cnabToInserts(
  file: CNAB240File,
  tenantId: string,
  bankAccountId: string
): BankTransactionInsert[] {
  return file.transactions.map((tx, idx) => ({
    tenant_id: tenantId,
    bank_account_id: bankAccountId,
    transaction_date: tx.date,
    amount: tx.amount,
    type: tx.type,
    description: tx.name,
    reference_id: tx.documentNumber ?? null,
    ofx_id: `cnab-${tx.lot}-${tx.sequence}-${idx}`,
  }));
}

// ── Bank name resolver ──────────────────────────────────────────────────────

const BANK_NAMES: Record<string, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "104": "Caixa Econômica",
  "237": "Bradesco",
  "341": "Itaú Unibanco",
  "356": "Banco Real (ABN)",
  "389": "Banco Mercantil",
  "399": "HSBC",
  "422": "Banco Safra",
  "453": "Banco Rural",
  "745": "Citibank",
  "748": "Sicredi",
  "756": "Sicoob",
};

function getBankName(code: string): string {
  return BANK_NAMES[code] ?? `Banco ${code}`;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useBankStatementUpload() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  // ── Parse file ────────────────────────────────────────────────────────────
  const parseFile = useCallback(
    async (file: File) => {
      if (!tenantId) {
        setState((s) => ({ ...s, step: "error", error: "Tenant não identificado." }));
        return;
      }

      setState({ ...INITIAL_STATE, step: "parsing", file });

      try {
        const content = await file.text();
        const format = detectFormat(content, file.name);

        if (!format) {
          setState((s) => ({
            ...s,
            step: "error",
            error: "Formato não reconhecido. Aceitos: OFX (.ofx) e CNAB 240 (.ret, .rem).",
          }));
          return;
        }

        let parsed: ParsedStatement;

        if (format === "ofx") {
          const result = parseOFX(content);
          if (!result.success) {
            setState((s) => ({ ...s, step: "error", error: result.error.message }));
            return;
          }
          const d = result.data;
          const credits = d.transactions.filter((t) => t.type === "credit").reduce((a, t) => a + t.amount, 0);
          const debits = d.transactions.filter((t) => t.type === "debit").reduce((a, t) => a + t.amount, 0);

          parsed = {
            format: "ofx",
            accountId: d.accountId,
            bankCode: d.bankId,
            agency: d.agencyId,
            startDate: d.startDate,
            endDate: d.endDate,
            transactionCount: d.transactions.length,
            totalCredits: credits,
            totalDebits: debits,
            balance: d.balance,
            transactions: [], // preenchido no import
            raw: d,
          };
        } else {
          const result = parseCNAB240(content);
          if (!result.success) {
            setState((s) => ({ ...s, step: "error", error: result.error.message }));
            return;
          }
          const d = result.data;
          const credits = d.transactions.filter((t) => t.type === "credit").reduce((a, t) => a + t.amount, 0);
          const debits = d.transactions.filter((t) => t.type === "debit").reduce((a, t) => a + t.amount, 0);
          const dates = d.transactions.map((t) => t.date).sort();

          parsed = {
            format: "cnab240",
            accountId: "",
            bankCode: d.header.bankCode,
            startDate: dates[0] ?? d.header.generationDate,
            endDate: dates[dates.length - 1] ?? d.header.generationDate,
            transactionCount: d.transactions.length,
            totalCredits: credits,
            totalDebits: debits,
            transactions: [],
            raw: d,
          };
        }

        if (parsed.transactionCount === 0) {
          setState((s) => ({
            ...s,
            step: "error",
            error: "Nenhuma transação encontrada no arquivo.",
          }));
          return;
        }

        // Auto-match bank account by account number
        const supabase = createClient();
        const accounts = await listBankAccounts(supabase, tenantId);
        const matched = accounts.find(
          (a) =>
            a.account_number === parsed.accountId ||
            (a.bank_code === parsed.bankCode && a.agency === parsed.agency)
        );

        logger.info("Statement parsed", {
          format: parsed.format,
          txCount: parsed.transactionCount,
          matchedAccount: matched?.id ?? null,
        });

        setState((s) => ({
          ...s,
          step: "preview",
          parsed,
          bankAccountId: matched?.id ?? null,
        }));
      } catch (err) {
        logger.error("Parse failed", { error: err instanceof Error ? err.message : String(err) });
        setState((s) => ({
          ...s,
          step: "error",
          error: err instanceof Error ? err.message : "Erro ao processar arquivo.",
        }));
      }
    },
    [tenantId]
  );

  // ── Select bank account ───────────────────────────────────────────────────
  const selectBankAccount = useCallback((accountId: string) => {
    setState((s) => ({ ...s, bankAccountId: accountId }));
  }, []);

  // ── Import mutation ───────────────────────────────────────────────────────
  const importMutation = useMutation<
    { inserted: number; skipped: number },
    Error,
    { bankAccountId: string }
  >({
    mutationFn: async ({ bankAccountId }) => {
      if (!tenantId || !state.parsed) throw new Error("Estado inválido para importação.");

      const supabase = createClient();
      let inserts: BankTransactionInsert[];

      if (state.parsed.format === "ofx") {
        inserts = ofxToInserts(state.parsed.raw as OFXStatement, tenantId, bankAccountId);
      } else {
        inserts = cnabToInserts(state.parsed.raw as CNAB240File, tenantId, bankAccountId);
      }

      // Batch insert (upsert com dedup por ofx_id)
      const result = await insertBankTransactions(supabase, inserts);

      // Update last_sync_at on account
      await supabase
        .from("finance_bank_accounts")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", bankAccountId);

      logger.info("Import complete", result);
      return result;
    },
    onSuccess: (result) => {
      setState((s) => ({ ...s, step: "done", result }));
      // Invalidate all reconciliation queries
      queryClient.invalidateQueries({ queryKey: ["reconciliation-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation-summary"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
    onError: (err) => {
      setState((s) => ({ ...s, step: "error", error: err.message }));
    },
  });

  // ── Confirm import ────────────────────────────────────────────────────────
  const confirmImport = useCallback(() => {
    if (!state.bankAccountId || !state.parsed) return;
    setState((s) => ({ ...s, step: "importing" }));
    importMutation.mutate({ bankAccountId: state.bankAccountId });
  }, [state.bankAccountId, state.parsed, importMutation]);

  // ── Create new account + import ───────────────────────────────────────────
  const createAccountAndImport = useCallback(async () => {
    if (!tenantId || !state.parsed) return;

    try {
      setState((s) => ({ ...s, step: "importing" }));
      const supabase = createClient();
      const newAccount = await createBankAccount(supabase, {
        tenant_id: tenantId,
        bank_code: state.parsed.bankCode,
        bank_name: getBankName(state.parsed.bankCode),
        agency: state.parsed.agency ?? "",
        account_number: state.parsed.accountId,
        account_type: "corrente",
      });
      setState((s) => ({ ...s, bankAccountId: newAccount.id }));
      importMutation.mutate({ bankAccountId: newAccount.id });
    } catch (err) {
      setState((s) => ({
        ...s,
        step: "error",
        error: err instanceof Error ? err.message : "Erro ao criar conta bancária.",
      }));
    }
  }, [tenantId, state.parsed, importMutation]);

  return {
    state,
    parseFile,
    selectBankAccount,
    confirmImport,
    createAccountAndImport,
    reset,
    isImporting: importMutation.isPending,
  };
}
