/**
 * Gera arquivos SQL em lotes a partir de tmp_mailchimp/leads-import.json,
 * pronto para inserir em crm_deals via execute_sql do MCP.
 *
 * Filtra emails ja existentes (lista hardcoded vinda do Supabase).
 *
 * Saida: tmp_mailchimp/leads-import-batch-*.sql
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const TENANT_ID = "89080d1a-bc79-4c3f-8fce-20aabc561c0d";
const BATCH_SIZE = 150;

const EXISTING_EMAILS = new Set([
  "adrempreendimentos@gmail.com",
  "felipe@construtorahorizonte.com.br",
  "assistentemkt@asramos.com.br",
  "marketing@quadraconstrutora.com.br",
  "anapaulads1987@gmail.com",
  "luciana@tektonconstrutora.com",
  "marketing@cimaempreendimentos.com.br",
  "luiza@mdibrasil.com.br",
  "alanys.trevisol@halsten.com.br",
  "patricia@grpborges.com.br",
  "marketing@cibea.com.br",
  "matheus.souza@hiexempreendimentos.com.br",
  "miriam.parmezani@prcempreendimentos.com.br",
  "janderson@enkan.com.br",
  "marcos.silva@monterre.com.br",
  "comercial@construtoraviplan.com.br",
  "rogerio.heilmeier@hotmail.com",
  "marketing@construtoraviplan.com.br",
  "edi@tektonconstrutora.com.br",
  "laura@3sp.com.br",
  "antonio@realiza.com",
  "construtoraeincorporadora3ap@hotmail.com",
  "arquiteturafrechal@frechalnetcom.br",
  "patricia@elephant-skin.com",
  "comercial@arthursilveira.com.br",
  "luciana@tektonconstrutora.com.br",
  "gustavobientinezi@gmail.com",
  "natalia.garcia@empreendimentosms.com.br",
  "fernando.freitas@jalgp.com.br",
  "comercial@criarempreendimentos.com.br",
  "andrei@giacomazzi.com.br",
  "marketing@treele.com.br",
]);

const UF_MAP = {
  "paraná": "PR", "parana": "PR", "pr": "PR",
  "são paulo": "SP", "sao paulo": "SP", "sp": "SP",
  "santa catarina": "SC", "sc": "SC",
  "rio grande do sul": "RS", "rs": "RS",
  "rio de janeiro": "RJ", "rj": "RJ",
  "minas gerais": "MG", "mg": "MG",
  "espírito santo": "ES", "espirito santo": "ES", "es": "ES",
  "bahia": "BA", "ba": "BA",
  "paraíba": "PB", "paraiba": "PB", "pb": "PB",
  "pernambuco": "PE", "pe": "PE",
  "ceará": "CE", "ceara": "CE", "ce": "CE",
  "rio grande do norte": "RN", "rn": "RN",
  "goiás": "GO", "goias": "GO", "go": "GO",
  "distrito federal": "DF", "df": "DF",
  "mato grosso": "MT", "mt": "MT",
  "mato grosso do sul": "MS", "ms": "MS",
  "tocantins": "TO", "to": "TO",
  "rondônia": "RO", "rondonia": "RO", "ro": "RO",
  "amazonas": "AM", "am": "AM",
  "pará": "PA", "para": "PA", "pa": "PA",
  "amapá": "AP", "amapa": "AP", "ap": "AP",
  "roraima": "RR", "rr": "RR",
  "acre": "AC", "ac": "AC",
  "piauí": "PI", "piaui": "PI", "pi": "PI",
  "maranhão": "MA", "maranhao": "MA", "ma": "MA",
  "alagoas": "AL", "al": "AL",
  "sergipe": "SE", "se": "SE",
};

function normUf(uf) {
  if (!uf) return null;
  const k = uf.toLowerCase().trim();
  return UF_MAP[k] || (uf.length === 2 ? uf.toUpperCase() : null);
}

function sqlStr(v) {
  if (v == null || v === "") return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlNum(v) {
  if (v == null || v === "") return "NULL";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "NULL";
}

function buildNotes(lead) {
  const parts = [];
  if (lead.status_funil) parts.push(`St:${lead.status_funil}`);
  if (lead.bus) parts.push(`BU:${lead.bus}`);
  if (lead.porte) parts.push(`Porte:${lead.porte}`);
  if (lead.padrao) parts.push(`Pad:${lead.padrao}`);
  if (lead.temperatura) parts.push(`T:${lead.temperatura}`);
  if (lead.role) parts.push(`Cargo:${lead.role}`);
  if (lead.score != null) parts.push(`Score:${lead.score}`);
  parts.push(`F:${lead.sources.join(",")}`);
  return parts.join("|");
}

function buildName(lead) {
  if (lead.company) return lead.company;
  if (lead.contact) return lead.contact;
  return lead.email;
}

function buildSource(lead) {
  if (lead.sources.includes("radar_v2")) return "radar_v2";
  return "import_2026_04";
}

const all = JSON.parse(readFileSync(resolve(ROOT, "tmp_mailchimp/leads-import.json"), "utf-8"));
const fresh = all.filter((l) => !EXISTING_EMAILS.has(l.email.toLowerCase()));
console.log(`Total: ${all.length} | Ja existentes (skip): ${all.length - fresh.length} | Novos: ${fresh.length}`);

const outDir = resolve(ROOT, "tmp_mailchimp/sql");
mkdirSync(outDir, { recursive: true });
// limpar sql antigos
for (const f of readdirSync(outDir)) {
  if (f.startsWith("leads-batch-") && f.endsWith(".sql")) {
    unlinkSync(resolve(outDir, f));
  }
}

const cols = [
  "tenant_id", "name", "company", "contact", "contact_email", "contact_phone",
  "stage", "priority", "source", "notes",
];

let batchIdx = 0;
for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
  batchIdx++;
  const slice = fresh.slice(i, i + BATCH_SIZE);
  const values = slice.map((lead) => {
    const phone = lead.phone || lead.whatsapp || null;
    return `(${sqlStr(TENANT_ID)}, ${sqlStr(buildName(lead))}, ${sqlStr(lead.company)}, ${sqlStr(lead.contact)}, ${sqlStr(lead.email)}, ${sqlStr(phone)}, ${sqlStr(lead.stage)}, ${sqlStr(lead.priority)}, ${sqlStr(buildSource(lead))}, ${sqlStr(buildNotes(lead))})`;
  }).join(",\n  ");
  const sql = `INSERT INTO crm_deals (${cols.join(", ")}) VALUES\n  ${values};\n`;
  const file = resolve(outDir, `leads-batch-${String(batchIdx).padStart(2, "0")}.sql`);
  writeFileSync(file, sql, "utf-8");
  console.log(`  ✓ batch ${batchIdx}: ${slice.length} linhas → ${file.split(/[/\\]/).slice(-2).join("/")}`);
}

console.log(`\n✓ ${batchIdx} arquivo(s) SQL em tmp_mailchimp/sql/`);
console.log(`Total a inserir: ${fresh.length} deals`);
