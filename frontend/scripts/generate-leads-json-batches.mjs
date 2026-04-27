/**
 * Gera JSONs minimalistas (n,c,co,e,p,s,pr,sc,nt) para batches 6+
 * dos leads ainda não inseridos. Saida: tmp_mailchimp/json/leads-batch-NN.json
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const BATCH_SIZE = 100;
const SKIP_BATCHES = 5; // Já inseri batches 1-5 (150 cada = 750 leads)
const SKIP_LEADS = 5 * 150;

const EXISTING_EMAILS = new Set([
  "adrempreendimentos@gmail.com","felipe@construtorahorizonte.com.br","assistentemkt@asramos.com.br",
  "marketing@quadraconstrutora.com.br","anapaulads1987@gmail.com","luciana@tektonconstrutora.com",
  "marketing@cimaempreendimentos.com.br","luiza@mdibrasil.com.br","alanys.trevisol@halsten.com.br",
  "patricia@grpborges.com.br","marketing@cibea.com.br","matheus.souza@hiexempreendimentos.com.br",
  "miriam.parmezani@prcempreendimentos.com.br","janderson@enkan.com.br","marcos.silva@monterre.com.br",
  "comercial@construtoraviplan.com.br","rogerio.heilmeier@hotmail.com","marketing@construtoraviplan.com.br",
  "edi@tektonconstrutora.com.br","laura@3sp.com.br","antonio@realiza.com",
  "construtoraeincorporadora3ap@hotmail.com","arquiteturafrechal@frechalnetcom.br",
  "patricia@elephant-skin.com","comercial@arthursilveira.com.br","luciana@tektonconstrutora.com.br",
  "gustavobientinezi@gmail.com","natalia.garcia@empreendimentosms.com.br","fernando.freitas@jalgp.com.br",
  "comercial@criarempreendimentos.com.br","andrei@giacomazzi.com.br","marketing@treele.com.br",
]);

function mapStageFromStatus(status) {
  const s = (status||"").toLowerCase().replace(/[ãâáàä]/g,"a").replace(/[éêèë]/g,"e").replace(/[íîìï]/g,"i").replace(/[óôòõö]/g,"o").replace(/[úûùü]/g,"u").replace(/[ç]/g,"c");
  if (!s) return "lead";
  if (s.includes("agencia tbo")) return "qualificacao";
  if (s.includes("lost") || s.includes("perdido")) return "fechado_perdido";
  if (s.includes("ganho")) return "fechado_ganho";
  if (s.includes("interesse") || s.includes("conversa") || s.includes("apresenta") ||
      s.includes("primeiro contato") || s.includes("segundo contato") || s.includes("retomar")) {
    return "qualificacao";
  }
  return "lead";
}

function mapPriority(t) {
  const x = (t||"").toLowerCase();
  if (x.includes("quente")) return "alta";
  if (x.includes("morno")) return "media";
  if (x.includes("frio")) return "baixa";
  return "media";
}

function buildName(l) { return l.company || l.contact || l.email; }

function buildNotes(l) {
  const p = [];
  if (l.status_funil) p.push(`St:${l.status_funil}`);
  if (l.bus) p.push(`BU:${l.bus}`);
  if (l.porte) p.push(`Porte:${l.porte}`);
  if (l.padrao) p.push(`Pad:${l.padrao}`);
  if (l.temperatura) p.push(`T:${l.temperatura}`);
  if (l.role) p.push(`Cargo:${l.role}`);
  if (l.score != null) p.push(`Score:${l.score}`);
  p.push(`F:${l.sources.join(",")}`);
  return p.join("|");
}

const all = JSON.parse(readFileSync(resolve(ROOT, "tmp_mailchimp/leads-import.json"), "utf-8"));
const fresh = all.filter((l) => !EXISTING_EMAILS.has(l.email.toLowerCase()));
const remaining = fresh.slice(SKIP_LEADS);
console.log(`Total fresh: ${fresh.length} | Já inseridos (skip): ${SKIP_LEADS} | Pendentes: ${remaining.length}`);

const outDir = resolve(ROOT, "tmp_mailchimp/json");
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) {
  if (f.startsWith("leads-batch-") && f.endsWith(".json")) unlinkSync(resolve(outDir, f));
}

let batchIdx = SKIP_BATCHES;
for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
  batchIdx++;
  const slice = remaining.slice(i, i + BATCH_SIZE);
  const minimal = slice.map((l) => ({
    n: buildName(l),
    co: l.company || null,
    c: l.contact || null,
    e: l.email,
    p: l.phone || l.whatsapp || null,
    s: l.stage,
    pr: l.priority,
    sc: l.sources.includes("radar_v2") ? "radar_v2" : "import_2026_04",
    nt: buildNotes(l),
  }));
  const file = resolve(outDir, `leads-batch-${String(batchIdx).padStart(2, "0")}.json`);
  writeFileSync(file, JSON.stringify(minimal), "utf-8");
  console.log(`  ✓ batch ${batchIdx}: ${slice.length} leads → ${file.split(/[/\\]/).slice(-2).join("/")} (${(JSON.stringify(minimal).length/1024).toFixed(1)} KB)`);
}

console.log(`\nTotal batches gerados: ${batchIdx - SKIP_BATCHES}`);
