/**
 * fix-stockpile-hreflang-selfref.ts
 *
 * Repara os `reviewed.md` do stockpile que falham no PostFrontmatterSchema com
 * "hreflang_pair[i] self-reference proibida": a geração quad-market adicionou ao
 * `hreflang_pair` de cada artigo uma entrada apontando para o PRÓPRIO locale do
 * artigo (self-reference) — o schema (src/lib/blog/post-schema.ts) proíbe isso,
 * então a promoção (scripts/promote-from-stockpile.ts) descarta o artigo e o
 * pipeline vira no-op (não publica nada).
 *
 * Correção (surgical, preserva o resto do frontmatter byte-a-byte):
 *   - remove entradas `- { locale: "<own>", slug: ... }` cujo locale == locale do
 *     artigo (self-reference);
 *   - remove entradas com locale duplicado (mantém a primeira);
 *   - se `exclusive: true`, esvazia o bloco hreflang_pair (regra do schema).
 *
 * Uso:  npx tsx scripts/fix-stockpile-hreflang-selfref.ts [--dry-run]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STOCKPILE = path.resolve(__dirname, '../.claude/blog/data/stockpile/packages');
const DRY = process.argv.includes('--dry-run');

function listReviewed(): string[] {
  const out: string[] = [];
  if (!fs.existsSync(STOCKPILE)) return out;
  for (const pkg of fs.readdirSync(STOCKPILE)) {
    const pkgDir = path.join(STOCKPILE, pkg);
    if (!fs.statSync(pkgDir).isDirectory()) continue;
    for (const loc of fs.readdirSync(pkgDir)) {
      const f = path.join(pkgDir, loc, 'reviewed.md');
      if (fs.existsSync(f)) out.push(f);
    }
  }
  return out;
}

/** Locale de uma entrada flow-style `- { locale: "x", slug: "y" }`. */
function entryLocale(line: string): string | null {
  const m = line.match(/^\s*-\s*\{[^}]*\blocale:\s*["']?([\w-]+)["']?/);
  return m ? m[1]! : null;
}

let filesChanged = 0;
let selfRemoved = 0;
let dupRemoved = 0;
const perLocale: Record<string, number> = {};

for (const file of listReviewed()) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.startsWith('---')) continue;
  const end = raw.indexOf('\n---', 3);
  if (end < 0) continue;
  const fm = raw.slice(0, end);
  const rest = raw.slice(end);
  const lines = fm.split('\n');

  // locale do artigo = chave top-level (sem indentação) `locale:`
  const ownLocale = lines
    .map((l) => l.match(/^locale:\s*["']?([\w-]+)["']?/))
    .find(Boolean)?.[1];
  if (!ownLocale) continue;

  // localizar bloco hreflang_pair
  const start = lines.findIndex((l) => /^hreflang_pair:\s*$/.test(l));
  if (start < 0) continue;
  let i = start + 1;
  const seen = new Set<string>();
  let changed = false;
  const kept: string[] = [];
  for (; i < lines.length; i++) {
    const l = lines[i]!;
    if (!/^\s*-\s*\{/.test(l)) break; // fim do bloco (próxima chave/linha)
    const loc = entryLocale(l);
    if (loc && loc === ownLocale) {
      selfRemoved++; changed = true; perLocale[ownLocale] = (perLocale[ownLocale] ?? 0) + 1; continue;
    }
    if (loc && seen.has(loc)) { dupRemoved++; changed = true; continue; }
    if (loc) seen.add(loc);
    kept.push(l);
  }
  if (!changed) continue;

  const newLines = [...lines.slice(0, start + 1), ...kept, ...lines.slice(i)];
  const out = newLines.join('\n') + rest;
  filesChanged++;
  if (!DRY) fs.writeFileSync(file, out, 'utf8');
}

console.log(`[fix-hreflang-selfref] ${DRY ? 'DRY-RUN ' : ''}arquivos alterados: ${filesChanged}`);
console.log(`  self-reference removidas: ${selfRemoved} (por locale: ${JSON.stringify(perLocale)})`);
console.log(`  duplicados removidos: ${dupRemoved}`);
