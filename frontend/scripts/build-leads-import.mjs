/**
 * Le Base_Unificada (CSV) + TBO_Radar (xlsx via Python helper) e gera um JSON
 * unificado de leads, deduplicando por email. Saida: tmp_mailchimp/leads-import.json
 *
 * Uso: node frontend/scripts/build-leads-import.mjs
 *
 * Mapeamento stage:
 *   Agencia Tbo                 -> qualificacao (cliente atual / parceiro)
 *   Orcamento - Lost            -> fechado_perdido
 *   Demonstrou Interesse,
 *   Conversa Iniciada,
 *   E-Mail de Apresentacao,
 *   Primeiro/Segundo Contato    -> qualificacao
 *   Nao / Nao E Perfil / vazio  -> lead
 *
 * Mapeamento temperatura -> priority:
 *   Quente -> alta | Morno -> media | Frio -> baixa
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const UNIFICADA_CSV = "C:/Users/WIN10/Downloads/Base_Unificada_TBO_v8.xlsx - Base Completa Final.csv";
const RADAR_JSON = resolve(ROOT, "tmp_mailchimp/radar-rows.json"); // gerado pelo Python helper

// ----- helpers -----
function parseCSV(text) {
  const rows = [];
  let i = 0;
  let cur = "";
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(cur);
      cur = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  const header = rows.shift();
  return rows
    .filter((r) => r.some((c) => c && c.trim()))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, (r[idx] ?? "").trim()])));
}

const norm = (s) => (s || "").trim();
const lower = (s) => norm(s).toLowerCase();

function isValidEmail(e) {
  return /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(e);
}

function splitEmails(raw) {
  if (!raw) return [];
  return raw
    .split(/[,;|]/)
    .map((e) => norm(e))
    .filter(isValidEmail);
}

function mapStageFromStatus(status) {
  const s = lower(status).replace(/[ãâá]/g, "a").replace(/[ç]/g, "c");
  if (!s) return "lead";
  if (s.includes("agencia tbo")) return "qualificacao";
  if (s.includes("lost") || s.includes("perdido")) return "fechado_perdido";
  if (s.includes("ganho") || s.includes("won")) return "fechado_ganho";
  if (
    s.includes("interesse") ||
    s.includes("conversa") ||
    s.includes("apresenta") ||
    s.includes("primeiro contato") ||
    s.includes("segundo contato") ||
    s.includes("retomar") ||
    s.includes("retomada")
  ) {
    return "qualificacao";
  }
  return "lead";
}

function mapPriority(temperatura) {
  const t = lower(temperatura);
  if (t.includes("quente")) return "alta";
  if (t.includes("morno")) return "media";
  if (t.includes("frio")) return "baixa";
  return "media";
}

function cleanString(s) {
  if (!s) return null;
  const v = norm(s);
  if (!v || v === "-" || v === "(Não identificado)" || v === "(Nao identificado)") return null;
  return v;
}

function cleanCompany(s) {
  const v = cleanString(s);
  if (!v) return null;
  // remove sufixos tipo "/ Curitiba/PR"
  return v.replace(/\s*\/\s*[^/]+\/[a-zA-Z]{2}\s*$/, "").trim();
}

// ----- merge logic -----
const leadsByEmail = new Map();

function ingest(record, sourceTag) {
  const emails = splitEmails(record.email);
  if (emails.length === 0) return;
  for (const email of emails) {
    const key = email.toLowerCase();
    const existing = leadsByEmail.get(key);
    if (existing) {
      // merge — preencher campos vazios
      for (const k of Object.keys(record)) {
        if (record[k] != null && (existing[k] == null || existing[k] === "")) {
          existing[k] = record[k];
        }
      }
      // tags merge
      const tags = new Set([...(existing.tags || []), ...(record.tags || [])]);
      existing.tags = [...tags];
      const sources = new Set([...(existing.sources || []), sourceTag]);
      existing.sources = [...sources];
      continue;
    }
    leadsByEmail.set(key, {
      ...record,
      email,
      sources: [sourceTag],
      tags: [...(record.tags || [])],
    });
  }
}

// ===== 1. BASE UNIFICADA (CSV) =====
const unif = parseCSV(readFileSync(UNIFICADA_CSV, "utf-8"));
console.log(`[unificada] ${unif.length} linhas`);

for (const row of unif) {
  const status = row["Status / Funil"] || "";
  ingest(
    {
      company: cleanCompany(row["Empresa"]),
      contact: cleanString(row["Nome do Contato"]),
      role: cleanString(row["Cargo"]),
      email: row["E-mail"],
      phone: cleanString(row["Telefone"]),
      whatsapp: cleanString(row["WhatsApp"]),
      city: cleanString(row["Cidade"]),
      uf: cleanString(row["Estado"]),
      status_funil: cleanString(status),
      porte: cleanString(row["Porte"]),
      padrao: cleanString(row["Padrão"]),
      temperatura: cleanString(row["Temperatura"]),
      bus: cleanString(row["BUs Interesse"]),
      linkedin: cleanString(row["LinkedIn Contato"]),
      observacoes: cleanString(row["Observações"]),
      stage: mapStageFromStatus(status),
      priority: mapPriority(row["Temperatura"]),
      tags: ["unificada_v8"],
    },
    "unificada_v8",
  );
}

// ===== 2. RADAR (json gerado pelo Python helper) =====
let radarCount = 0;
try {
  const radarRows = JSON.parse(readFileSync(RADAR_JSON, "utf-8"));
  console.log(`[radar] ${radarRows.length} linhas`);
  for (const row of radarRows) {
    const emails = splitEmails(row.email);
    if (emails.length === 0) continue;
    radarCount += emails.length;
    // Para Radar, o "Contato" pode conter MULTIPLOS contatos com "/// "
    // Ex: "Abade | (11) 98264-9538 /// SANDRO | (11) 94784-2342"
    // Cada email vira um lead separado pareado pelo indice
    const contatos = (row.contato || "").split("///").map((c) => c.trim());
    const phones = (row.telefone || "").split(",").map((p) => p.trim());
    emails.forEach((email, idx) => {
      const contatoStr = contatos[idx] || contatos[0] || "";
      const [nome] = contatoStr.split("|").map((s) => s.trim());
      const phone = phones[idx] || phones[0] || "";
      ingest(
        {
          company: cleanCompany(row.incorporadora),
          contact: cleanString(nome),
          role: null,
          email,
          phone: cleanString(phone),
          whatsapp: cleanString(phone),
          city: cleanString(row.cidade) || cleanString(row.cidades_atuacao),
          uf: cleanString(row.uf),
          status_funil: null,
          porte: cleanString(row.porte),
          padrao: cleanString(row.perfil),
          temperatura: null,
          bus: cleanString(row.nicho),
          linkedin: null,
          observacoes: cleanString(row.notas) || cleanString(row.nicho_detalhe),
          score: row.score || null,
          stage: "lead",
          priority: row.score >= 15 ? "alta" : row.score >= 8 ? "media" : "baixa",
          tags: ["radar_v2", row.fonte || "orulo"].filter(Boolean),
        },
        "radar_v2",
      );
    });
  }
} catch (e) {
  console.warn(`[radar] arquivo nao encontrado em ${RADAR_JSON} — pular Radar.`);
  console.warn(`Rode: python frontend/scripts/build-leads-radar.py`);
  process.exit(1);
}

// ===== output =====
const all = [...leadsByEmail.values()];
mkdirSync(resolve(ROOT, "tmp_mailchimp"), { recursive: true });
writeFileSync(
  resolve(ROOT, "tmp_mailchimp/leads-import.json"),
  JSON.stringify(all, null, 2),
  "utf-8",
);

console.log(`\n=== RESUMO ===`);
console.log(`Total emails unicos: ${all.length}`);
console.log(`Emails Unificada: ${unif.length}`);
console.log(`Emails extraidos do Radar: ${radarCount}`);
console.log(`\nStages:`);
const byStage = {};
for (const l of all) byStage[l.stage] = (byStage[l.stage] || 0) + 1;
for (const [s, c] of Object.entries(byStage)) console.log(`  ${s}: ${c}`);
console.log(`\nFontes:`);
const bySource = {};
for (const l of all) {
  for (const s of l.sources) bySource[s] = (bySource[s] || 0) + 1;
}
for (const [s, c] of Object.entries(bySource)) console.log(`  ${s}: ${c}`);
console.log(`\nUF top 10:`);
const byUf = {};
for (const l of all) {
  const uf = l.uf || "—";
  byUf[uf] = (byUf[uf] || 0) + 1;
}
const sortedUf = Object.entries(byUf).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [uf, c] of sortedUf) console.log(`  ${uf}: ${c}`);
console.log(`\n✓ Saida: tmp_mailchimp/leads-import.json`);
