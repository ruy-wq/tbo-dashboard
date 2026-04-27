/**
 * Extrai dados estruturados das notes embutidas no import 2026-04.
 * Formato: "St:X|BU:Y|Porte:Z|Pad:W|T:V|Cargo:C|Score:N|F:src1,src2"
 */
export interface ParsedLeadNotes {
  status_funil: string | null;
  bu: string | null;
  porte: string | null;
  padrao: string | null;
  temperatura: string | null;
  cargo: string | null;
  score_radar: number | null;
  fontes: string[];
  is_radar: boolean;
}

const KEY_MAP: Record<string, keyof Omit<ParsedLeadNotes, "fontes" | "is_radar" | "score_radar">> = {
  St: "status_funil",
  BU: "bu",
  Porte: "porte",
  Pad: "padrao",
  T: "temperatura",
  Cargo: "cargo",
};

export function parseLeadNotes(notes: string | null): ParsedLeadNotes {
  const empty: ParsedLeadNotes = {
    status_funil: null,
    bu: null,
    porte: null,
    padrao: null,
    temperatura: null,
    cargo: null,
    score_radar: null,
    fontes: [],
    is_radar: false,
  };
  if (!notes) return empty;

  const result = { ...empty };
  const parts = notes.split("|");
  for (const part of parts) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!value) continue;

    if (key === "Score") {
      const n = Number(value);
      if (Number.isFinite(n)) result.score_radar = n;
    } else if (key === "F") {
      result.fontes = value.split(",").map((s) => s.trim()).filter(Boolean);
      result.is_radar = result.fontes.some((f) => f.includes("radar"));
    } else if (key in KEY_MAP) {
      result[KEY_MAP[key]] = value;
    }
  }
  return result;
}

export function inferUf(deal: { contact_phone: string | null; notes: string | null }): string | null {
  // Tenta extrair UF do DDD do telefone
  const phone = deal.contact_phone || "";
  const m = phone.match(/\(?(\d{2})\)?/);
  if (m) {
    const ddd = m[1];
    return DDD_TO_UF[ddd] ?? null;
  }
  return null;
}

const DDD_TO_UF: Record<string, string> = {
  "11": "SP", "12": "SP", "13": "SP", "14": "SP", "15": "SP", "16": "SP", "17": "SP", "18": "SP", "19": "SP",
  "21": "RJ", "22": "RJ", "24": "RJ",
  "27": "ES", "28": "ES",
  "31": "MG", "32": "MG", "33": "MG", "34": "MG", "35": "MG", "37": "MG", "38": "MG",
  "41": "PR", "42": "PR", "43": "PR", "44": "PR", "45": "PR", "46": "PR",
  "47": "SC", "48": "SC", "49": "SC",
  "51": "RS", "53": "RS", "54": "RS", "55": "RS",
  "61": "DF",
  "62": "GO", "64": "GO",
  "63": "TO",
  "65": "MT", "66": "MT",
  "67": "MS",
  "68": "AC",
  "69": "RO",
  "71": "BA", "73": "BA", "74": "BA", "75": "BA", "77": "BA",
  "79": "SE",
  "81": "PE", "87": "PE",
  "82": "AL",
  "83": "PB",
  "84": "RN",
  "85": "CE", "88": "CE",
  "86": "PI", "89": "PI",
  "91": "PA", "93": "PA", "94": "PA",
  "92": "AM", "97": "AM",
  "95": "RR",
  "96": "AP",
  "98": "MA", "99": "MA",
};
