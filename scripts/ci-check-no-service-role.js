#!/usr/bin/env node
/**
 * CI Guardrail: Verifica que NÃO existe service_role key em código frontend.
 *
 * Escaneia frontend/ (excluindo node_modules/, .next/, supabase/, archive/, etc.).
 * API routes (frontend/app/api/) são server-side e podem usar service_role.
 *
 * Retorna exit code 1 se encontrar violação.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['frontend'];
const SKIP_DIRS = ['node_modules', '.next', 'supabase', 'archive', 'database', 'docs', '.git', 'scripts'];
// API routes são server-side e podem usar service_role legitimamente
const SKIP_PATHS = ['frontend/app/api', 'frontend/app/auth'];
const SCAN_EXTS = ['.js', '.html', '.htm', '.ts', '.tsx'];

function normalize(p) { return p.replace(/\\/g, '/'); }

// Padrões que indicam service_role no frontend
const PATTERNS = [
  /service_role/gi,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6[A-Za-z0-9+/=]+\.eyJyb2xlIjoic2VydmljZV9yb2xlIn0/g,
];

let violations = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(content);
    if (match) {
      const relPath = normalize(filePath.replace(ROOT + '/', '').replace(ROOT + '\\', ''));
      console.error(`  FAIL: ${relPath} — contém "${match[0].substring(0, 40)}..."`);
      violations++;
    }
  }
}

function scanDir(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.includes(entry)) continue;
    const fullPath = path.join(dirPath, entry);
    const relPath = normalize(fullPath.replace(ROOT + '/', '').replace(ROOT + '\\', ''));
    // Skip server-side API routes (they can legitimately use service_role)
    if (SKIP_PATHS.some(sp => relPath.startsWith(sp))) continue;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (SCAN_EXTS.includes(path.extname(entry).toLowerCase())) {
      scanFile(fullPath);
    }
  }
}

console.log('=== CI: Verificando ausência de service_role no frontend ===\n');

// Escanear root files
for (const entry of fs.readdirSync(ROOT)) {
  if (SKIP_DIRS.includes(entry)) continue;
  const fullPath = path.join(ROOT, entry);
  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory() && SCAN_EXTS.includes(path.extname(entry).toLowerCase())) {
    scanFile(fullPath);
  }
}

// Escanear subdirs
for (const dir of SCAN_DIRS) {
  scanDir(path.join(ROOT, dir));
}

console.log('');
if (violations > 0) {
  console.error(`FALHOU: ${violations} violação(ões) de service_role encontrada(s).`);
  process.exit(1);
} else {
  console.log('PASSOU: Nenhuma service_role key no código frontend.');
  process.exit(0);
}
