// ── Boleto Generator — CNAB 400 / Banco do Brasil ─────────────────────────────
// Barrel file: re-exports barcode utilities and CNAB 400 operations,
// plus validation schema and the main createBoletoData function.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import type { BoletoGenerateParams } from "@/lib/supabase/types/boletos";
import { generateBarcode, generateDigitableLine, generateNossoNumero } from "./boleto-barcode";

export * from "./boleto-barcode";
export * from "./boleto-cnab400";

// ── Validation schemas ────────────────────────────────────────────────────────

export const BoletoParamsSchema = z.object({
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD"),
  payerName: z.string().min(1).max(60),
  payerDocument: z.string().min(11).max(14).regex(/^\d+$/),
  payerAddress: z.string().min(1).max(80),
  instructions: z.string().max(80).optional(),
  bankConvenio: z.string().length(7).regex(/^\d+$/),
  bankAgency: z.string().min(4).max(4).regex(/^\d+$/),
  bankAccount: z.string().min(8).max(8).regex(/^\d+$/),
  bankCarteira: z.string().default("017"),
  beneficiaryName: z.string().min(1).max(30),
  nossoNumero: z.string().min(1).max(10).regex(/^\d+$/).optional(),
});

// ── Full boleto generation ────────────────────────────────────────────────────

export function createBoletoData(params: BoletoGenerateParams): {
  nossoNumero: string;
  barcode: string;
  digitableLine: string;
} {
  const validated = BoletoParamsSchema.parse(params);
  const nossoNumero = validated.nossoNumero ?? generateNossoNumero();

  const barcode = generateBarcode({
    convenio: validated.bankConvenio,
    nossoNumero,
    carteira: validated.bankCarteira,
    dueDate: validated.dueDate,
    amount: validated.amount,
  });

  const digitableLine = generateDigitableLine(barcode);

  return { nossoNumero, barcode, digitableLine };
}
