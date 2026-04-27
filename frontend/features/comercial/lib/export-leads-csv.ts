import type { Database } from "@/lib/supabase/types";
import { parseLeadNotes, inferUf } from "./parse-lead-notes";

type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];
// parseLeadNotes/inferUf usados como fallback para deals sem colunas backfilladas

const COLUMNS = [
  "Empresa",
  "Contato",
  "Email",
  "Telefone",
  "UF",
  "Etapa",
  "Origem",
  "Status Funil",
  "BU Interesse",
  "Porte",
  "Padrão",
  "Temperatura",
  "Score Radar",
  "Cargo",
  "Valor",
  "Probabilidade",
  "Responsável",
  "Criado em",
  "Atualizado em",
] as const;

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportLeadsToCsv(deals: DealRow[], filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`): void {
  const rows: string[] = [COLUMNS.map(csvEscape).join(",")];

  for (const d of deals) {
    const fallback = d.bu || d.porte || d.uf ? null : parseLeadNotes(d.notes);
    const uf = d.uf ?? inferUf({ contact_phone: d.contact_phone, notes: d.notes });
    rows.push([
      csvEscape(d.company),
      csvEscape(d.contact),
      csvEscape(d.contact_email),
      csvEscape(d.contact_phone),
      csvEscape(uf),
      csvEscape(d.stage),
      csvEscape(d.source),
      csvEscape(d.status_funil ?? fallback?.status_funil ?? null),
      csvEscape(d.bu ?? fallback?.bu ?? null),
      csvEscape(d.porte ?? fallback?.porte ?? null),
      csvEscape(d.padrao ?? fallback?.padrao ?? null),
      csvEscape(d.temperatura ?? fallback?.temperatura ?? null),
      csvEscape(d.radar_score ?? fallback?.score_radar ?? null),
      csvEscape(d.cargo ?? fallback?.cargo ?? null),
      csvEscape(d.value),
      csvEscape(d.probability),
      csvEscape(d.owner_name),
      csvEscape(d.created_at),
      csvEscape(d.updated_at),
    ].join(","));
  }

  const csv = "﻿" + rows.join("\n"); // BOM para Excel reconhecer UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
