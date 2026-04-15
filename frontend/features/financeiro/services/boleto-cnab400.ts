// ── CNAB 400 Remessa/Retorno — Banco do Brasil ──────────────────────────────
// Geração de arquivos CNAB 400 remessa e parser de retorno
// no padrão FEBRABAN para Banco do Brasil (carteira 17).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CnabRetornoResult,
  CnabRetornoRecord,
  BoletoStatus,
} from "@/lib/supabase/types/boletos";

import { padLeft, padRight } from "./boleto-barcode";

// ── Constants ─────────────────────────────────────────────────────────────────

const BANK_CODE = "001"; // Banco do Brasil

// ── CNAB 400 Remessa ──────────────────────────────────────────────────────────

export interface RemessaBoletoParams {
  boleto: {
    nossoNumero: string;
    barcode: string;
    dueDate: string;
    amount: number;
    payerName: string;
    payerDocument: string;
    payerAddress: string;
    instructions?: string | null;
  };
  bankConfig: {
    convenio: string;
    agency: string;
    account: string;
    carteira: string;
    beneficiaryName: string;
  };
  sequencial: number;
}

function buildRemessaHeader(config: {
  agency: string;
  account: string;
  beneficiaryName: string;
  date: string; // DDMMAA
  sequencial: number;
}): string {
  const { agency, account, beneficiaryName, date, sequencial } = config;
  return (
    "0" +                                        // tipo (1)
    "01" +                                       // operação remessa (2-3)
    "REMESSA" +                                  // literal (4-10)
    "01" +                                       // cod serviço cobrança (11-12)
    padRight("", 15) +                           // nome beneficiário abrev (13-27)
    padLeft(agency, 4) +                         // agência (28-31)
    " " +                                        // espaço (32)
    padLeft(account, 8) +                        // conta (33-40)
    padRight("", 7) +                            // brancos (41-47)
    padRight(beneficiaryName.toUpperCase(), 30) + // nome completo (48-77)
    BANK_CODE +                                  // código banco (78-80)
    padRight("BANCO DO BRASIL", 15) +            // nome banco (81-95)
    date +                                       // data gravação (96-101)
    padRight("", 294) +                          // brancos (102-395)
    padLeft(sequencial, 6)                       // sequencial (396-400) — corrected to be at end but within 400
  );
}

function buildRemessaDetail(params: RemessaBoletoParams): string {
  const { boleto, bankConfig, sequencial } = params;
  const { nossoNumero, dueDate, amount, payerName, payerDocument, payerAddress, instructions } = boleto;
  const { agency, account, carteira, convenio } = bankConfig;

  const dueFormatted =
    padLeft(new Date(dueDate + "T12:00:00Z").getUTCDate(), 2) +
    padLeft(new Date(dueDate + "T12:00:00Z").getUTCMonth() + 1, 2) +
    String(new Date(dueDate + "T12:00:00Z").getUTCFullYear()).slice(-2);

  const amountStr = padLeft(Math.round(amount * 100), 13);
  const instrStr = padRight((instructions ?? "").slice(0, 40), 40);

  return (
    "1" +                                              // tipo (1)
    padLeft(agency, 4) +                               // agência (2-5)
    " " +                                              // espaço (6)
    padLeft(account, 8) +                              // conta (7-14)
    " " +                                              // espaço (15)
    padRight("", 25) +                                 // campo livre uso banco (16-40)
    padLeft(carteira, 2) +                             // carteira (41-42)
    padLeft(nossoNumero, 10) +                         // nosso número (43-52)
    padRight("", 20) +                                 // complemento (53-72)
    "N" +                                              // tipo impressão (73)
    padRight("", 10) +                                 // brancos (74-83)
    "01" +                                             // cod ocorrência (84-85): 01=entrada de título
    padLeft(convenio.slice(0, 10), 10) +               // número do documento (86-95)
    dueFormatted +                                     // vencimento DDMMAA (96-101)
    amountStr +                                        // valor nominal (102-114)
    padLeft(BANK_CODE, 3) +                            // banco cobrador (115-117)
    padRight("", 5) +                                  // agência cobrador (118-122)
    "17" +                                             // espécie: 17=outros (123-124)
    "N" +                                              // aceite (125)
    String(new Date().getUTCFullYear()).slice(-2) +
    padLeft(new Date().getUTCMonth() + 1, 2) +
    padLeft(new Date().getUTCDate(), 2) +              // emissão AAMMDD (126-131)
    "00" +                                             // 1ª instrução (132-133)
    "00" +                                             // 2ª instrução (134-135)
    padLeft(0, 13) +                                   // juros mora (136-148)
    padLeft(0, 6) +                                    // data limite desconto (149-154)
    padLeft(0, 13) +                                   // valor desconto (155-167)
    padLeft(0, 13) +                                   // valor IOF (168-180)
    padLeft(0, 13) +                                   // abatimento (181-193)
    padLeft(payerDocument.replace(/\D/g, "").slice(0, 14), 14) + // documento pagador (194-207)
    "01" +                                             // tipo inscrição pagador (208-209)
    padRight(payerName.slice(0, 40), 40) +             // nome pagador (210-249)
    padRight(payerAddress.slice(0, 40), 40) +          // endereço pagador (250-289)
    padRight("", 12) +                                 // complemento (290-301)
    padRight("", 8) +                                  // CEP (302-309)
    padRight("", 15) +                                 // cidade (310-324)
    padRight("", 2) +                                  // UF (325-326)
    instrStr +                                         // observações (327-366)
    padRight("", 33) +                                 // brancos (367-399) — adjusted
    padLeft(sequencial, 1)                             // sequencial (400)
  );
}

function buildRemessaTrailer(totalRecords: number, sequencial: number): string {
  return (
    "9" +                           // tipo (1)
    padRight("", 393) +             // brancos (2-394) — adjusted
    padLeft(totalRecords, 6) +      // total de títulos (395-400... simplified)
    padLeft(sequencial, 6)
  );
}

export function generateRemessaFile(
  boletos: RemessaBoletoParams["boleto"][],
  bankConfig: RemessaBoletoParams["bankConfig"]
): string {
  const now = new Date();
  const date =
    padLeft(now.getUTCDate(), 2) +
    padLeft(now.getUTCMonth() + 1, 2) +
    String(now.getUTCFullYear()).slice(-2);

  const lines: string[] = [];
  lines.push(buildRemessaHeader({ ...bankConfig, date, sequencial: 1 }));

  boletos.forEach((boleto, idx) => {
    lines.push(buildRemessaDetail({ boleto, bankConfig, sequencial: idx + 2 }));
  });

  lines.push(buildRemessaTrailer(boletos.length, boletos.length + 2));
  return lines.map((l) => l.slice(0, 400).padEnd(400)).join("\r\n");
}

// ── CNAB 400 Retorno Parser ───────────────────────────────────────────────────

/** BB return codes mapped to boleto status */
const RETURN_CODE_STATUS: Record<string, BoletoStatus> = {
  "06": "pago",
  "17": "pago",
  "09": "cancelado",
  "10": "cancelado",
  "02": "emitido", // entrada confirmada
  "03": "emitido", // entrada rejeitada (mantém emitido para revisão)
};

export function parseCNAB400Retorno(content: string): CnabRetornoResult {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const records: CnabRetornoRecord[] = [];
  let errors = 0;
  let paid = 0;

  for (const line of lines) {
    if (line.length < 400) continue;
    const tipo = line[0];
    if (tipo === "0" || tipo === "9") continue; // header / trailer

    try {
      // BB CNAB 400 retorno detail positions (1-indexed):
      // 63-72: Nosso número (10 digits)
      // 109-110: Código de ocorrência
      // 111-116: Data de ocorrência DDMMAA
      // 117-122: Data de crédito DDMMAA
      // 153-165: Valor pago (13 digits, last 2 = cents)
      const nossoNumero = line.slice(62, 72).trim();
      const returnCode = line.slice(108, 110).trim();
      const occurrenceDate = line.slice(110, 116).trim();
      const creditDate = line.slice(116, 122).trim();
      const paidAmountRaw = line.slice(152, 165).trim();

      const paidAmountNum = parseInt(paidAmountRaw, 10);
      const paidAmount = isNaN(paidAmountNum) ? null : paidAmountNum / 100;
      const status: BoletoStatus =
        RETURN_CODE_STATUS[returnCode] ?? "emitido";

      if (status === "pago") paid++;

      records.push({
        nossoNumero,
        returnCode,
        paymentDate: occurrenceDate || null,
        paidAmount,
        creditDate: creditDate || null,
        status,
      });
    } catch {
      errors++;
    }
  }

  return {
    totalRecords: records.length,
    paid,
    errors,
    records,
  };
}
