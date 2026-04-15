// ── Boleto Barcode Utilities — FEBRABAN / Banco do Brasil ───────────────────
// Barcode generation, digitable line, and nosso número for BB carteira 17.
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────

const BANK_CODE = "001"; // Banco do Brasil
const CURRENCY_CODE = "9"; // Real (BRL)
// Base date for due factor: 07/10/1997
const DUE_FACTOR_BASE = new Date("1997-10-07").getTime();
const MS_PER_DAY = 86_400_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function padLeft(value: string | number, length: number, char = "0"): string {
  return String(value).padStart(length, char);
}

export function padRight(value: string | number, length: number, char = " "): string {
  return String(value).padEnd(length, char);
}

/** Mod 10 check digit — used for digitable line blocks */
function mod10(num: string): number {
  let sum = 0;
  let multiplier = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    const digit = parseInt(num[i] ?? "0", 10);
    let result = digit * multiplier;
    if (result > 9) result -= 9;
    sum += result;
    multiplier = multiplier === 2 ? 1 : 2;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/** Mod 11 check digit — used for barcode overall check digit */
function mod11(num: string): number {
  const weights = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  const weightIndex = { current: 0 };
  for (let i = num.length - 1; i >= 0; i--) {
    const digit = parseInt(num[i] ?? "0", 10);
    const weight = weights[weightIndex.current % weights.length] ?? 2;
    sum += digit * weight;
    weightIndex.current++;
  }
  const remainder = sum % 11;
  if (remainder === 0 || remainder === 1) return 1;
  return 11 - remainder;
}

/** Convert YYYY-MM-DD to due factor (days since 07/10/1997) */
function dueDateToFactor(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00Z");
  const factor = Math.round((date.getTime() - DUE_FACTOR_BASE) / MS_PER_DAY);
  if (factor < 1 || factor > 9999) return "0000"; // sem vencimento
  return padLeft(factor, 4);
}

/** Convert factor back to date string DDMMAA */
export function factorToDateDDMMAA(factor: string): string | null {
  const days = parseInt(factor, 10);
  if (days === 0) return null;
  const date = new Date(DUE_FACTOR_BASE + days * MS_PER_DAY);
  const dd = padLeft(date.getUTCDate(), 2);
  const mm = padLeft(date.getUTCMonth() + 1, 2);
  const aa = String(date.getUTCFullYear()).slice(-2);
  return `${dd}${mm}${aa}`;
}

// ── Barcode generation ────────────────────────────────────────────────────────

/**
 * Generates a FEBRABAN barcode (44 digits) for BB Convênio 7 dígitos, carteira 17.
 * Campo livre (25 digits): 0 + convenio(7) + nossoNumero(10) + carteira(3) + 000 + 1
 */
export function generateBarcode(params: {
  convenio: string;
  nossoNumero: string;
  carteira: string;
  dueDate: string;
  amount: number;
}): string {
  const { convenio, nossoNumero, carteira, dueDate, amount } = params;

  const campoLivre =
    "0" +
    padLeft(convenio, 7) +
    padLeft(nossoNumero, 10) +
    padLeft(carteira, 3) +
    "0001";

  const dueFactor = dueDateToFactor(dueDate);
  const amountStr = padLeft(Math.round(amount * 100), 10);

  // Barcode without check digit (position 5 = placeholder '0')
  const barcodeWithout =
    BANK_CODE + CURRENCY_CODE + dueFactor + amountStr + campoLivre;

  const checkDigit = mod11(barcodeWithout);

  // Insert check digit at position 5 (index 4)
  return (
    barcodeWithout.slice(0, 4) + checkDigit + barcodeWithout.slice(4)
  );
}

/**
 * Converts a 44-digit barcode into the formatted digitable line.
 * Format: AAAAA.BBBBB CCCCC.CCCCCC DDDDD.DDDDDD E FFFFFFFFF GGGGGGGGGG
 */
export function generateDigitableLine(barcode: string): string {
  if (barcode.length !== 44) throw new Error("Barcode must be 44 digits");

  // Block 1: positions 1-3 + 20-24 (barcode indices 0-2 + 19-23) + check mod10
  const block1 = barcode.slice(0, 3) + barcode.slice(19, 24);
  const check1 = mod10(block1);
  const field1 = `${block1.slice(0, 5)}.${block1.slice(5)}${check1}`;

  // Block 2: positions 25-34 (barcode indices 24-33) + check mod10
  const block2 = barcode.slice(24, 34);
  const check2 = mod10(block2);
  const field2 = `${block2.slice(0, 5)}.${block2.slice(5)}${check2}`;

  // Block 3: positions 35-44 (barcode indices 34-43) + check mod10
  const block3 = barcode.slice(34, 44);
  const check3 = mod10(block3);
  const field3 = `${block3.slice(0, 5)}.${block3.slice(5)}${check3}`;

  // Check digit (position 5, barcode index 4)
  const checkDigit = barcode[4];

  // Due factor + amount (positions 6-19, barcode indices 5-18)
  const dueFactor = barcode.slice(5, 9);
  const amount = barcode.slice(9, 19);

  return `${field1} ${field2} ${field3} ${checkDigit} ${dueFactor}${amount}`;
}

/**
 * Generates a sequential nosso número (10 digits) based on timestamp.
 * In production, should be a DB-sequence-based value.
 */
export function generateNossoNumero(seed?: number): string {
  const base = seed ?? Date.now() % 10_000_000_000;
  return padLeft(base, 10);
}
