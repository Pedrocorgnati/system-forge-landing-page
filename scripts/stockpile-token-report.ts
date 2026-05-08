/**
 * scripts/stockpile-token-report.ts
 *
 * F5.4.a — Mede consumo real de tokens entre dias `generate` vs `promote_only`
 * e atualiza BASELINE-TOKENS.md com dados de produção.
 *
 * Fontes de dados:
 *   .claude/blog/data/telemetry/mode-used-{DATE}.json  — modo usado por dia
 *   .claude/blog/data/telemetry/tokens-{DATE}.json     — tokens usados por dia (gravado pela routine)
 *
 * Uso:
 *   npx tsx scripts/stockpile-token-report.ts
 *   npx tsx scripts/stockpile-token-report.ts --days 60
 *   npx tsx scripts/stockpile-token-report.ts --write      # atualiza BASELINE-TOKENS.md
 *
 * Exit code 0 → relatório gerado; exit code 1 → dados insuficientes (<3 dias de cada modo)
 */

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TELEMETRY_DIR = path.join(ROOT, '.claude', 'blog', 'data', 'telemetry')
const BASELINE_PATH = path.join(ROOT, 'scheduled-updates', 'auto-blog', 'BASELINE-TOKENS.md')

const MIN_SAMPLES_PER_MODE = 3

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModeEntry {
  date: string
  mode_used: 'promote_only' | 'generate'
  packages_promoted?: number
}

interface TokenEntry {
  date: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  mode_used: 'promote_only' | 'generate'
  packages_promoted?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    write: args.includes('--write'),
    days: parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] ?? '') || 30,
  }
}

function readModeEntries(days: number): ModeEntry[] {
  if (!fs.existsSync(TELEMETRY_DIR)) return []
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const entries: ModeEntry[] = []
  for (const file of fs.readdirSync(TELEMETRY_DIR)) {
    if (!file.startsWith('mode-used-') || !file.endsWith('.json')) continue
    try {
      const data = JSON.parse(fs.readFileSync(path.join(TELEMETRY_DIR, file), 'utf8')) as ModeEntry
      if (new Date(data.date).getTime() >= cutoff) entries.push(data)
    } catch { /* skip */ }
  }
  return entries
}

function readTokenEntries(days: number): TokenEntry[] {
  if (!fs.existsSync(TELEMETRY_DIR)) return []
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const entries: TokenEntry[] = []
  for (const file of fs.readdirSync(TELEMETRY_DIR)) {
    if (!file.startsWith('tokens-') || !file.endsWith('.json')) continue
    try {
      const data = JSON.parse(fs.readFileSync(path.join(TELEMETRY_DIR, file), 'utf8')) as TokenEntry
      if (new Date(data.date).getTime() >= cutoff) entries.push(data)
    } catch { /* skip */ }
  }
  return entries
}

/**
 * Grava um registro de tokens para o dia atual.
 * Chamado pela routine cloud ao final de cada execução.
 */
export function recordDailyTokens(entry: Omit<TokenEntry, 'date'> & { date?: string }): void {
  if (!fs.existsSync(TELEMETRY_DIR)) {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true })
  }
  const date = entry.date ?? new Date().toISOString().slice(0, 10)
  const outPath = path.join(TELEMETRY_DIR, `tokens-${date}.json`)
  fs.writeFileSync(outPath, JSON.stringify({ ...entry, date }, null, 2) + '\n', 'utf8')
}

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

interface TokenStats {
  count: number
  avgTotal: number
  avgInput: number
  avgOutput: number
  minTotal: number
  maxTotal: number
  samples: TokenEntry[]
}

function computeStats(entries: TokenEntry[]): TokenStats {
  if (entries.length === 0) {
    return { count: 0, avgTotal: 0, avgInput: 0, avgOutput: 0, minTotal: 0, maxTotal: 0, samples: [] }
  }
  const totals = entries.map(e => e.total_tokens)
  return {
    count: entries.length,
    avgTotal: Math.round(entries.reduce((s, e) => s + e.total_tokens, 0) / entries.length),
    avgInput: Math.round(entries.reduce((s, e) => s + e.input_tokens, 0) / entries.length),
    avgOutput: Math.round(entries.reduce((s, e) => s + e.output_tokens, 0) / entries.length),
    minTotal: Math.min(...totals),
    maxTotal: Math.max(...totals),
    samples: entries,
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function buildReport(
  tokenEntries: TokenEntry[],
  modeEntries: ModeEntry[],
  days: number,
  hasEnoughData: boolean,
): string {
  const now = new Date()
  const generateEntries = tokenEntries.filter(e => e.mode_used === 'generate')
  const promoteEntries = tokenEntries.filter(e => e.mode_used === 'promote_only')
  const genStats = computeStats(generateEntries)
  const promoStats = computeStats(promoteEntries)

  const savingPct = genStats.avgTotal > 0 && promoStats.avgTotal > 0
    ? (((genStats.avgTotal - promoStats.avgTotal) / genStats.avgTotal) * 100).toFixed(1)
    : 'N/A'

  const promoteOnlyRate = modeEntries.length > 0
    ? ((modeEntries.filter(e => e.mode_used === 'promote_only').length / modeEntries.length) * 100).toFixed(1)
    : 'N/A'

  const lines: string[] = [
    '# Baseline de Tokens — Stockpile V2',
    '',
    `> Atualizado em: ${now.toISOString().slice(0, 10)} | Janela: últimos ${days} dias`,
    `> Gerado por: \`npm run stockpile:token-report\` (F5.4.a)`,
    '',
  ]

  if (!hasEnoughData) {
    lines.push(
      '## Status: DADOS INSUFICIENTES',
      '',
      `Amostras disponíveis: ${generateEntries.length} generate, ${promoteEntries.length} promote_only.`,
      `Mínimo necessário: ${MIN_SAMPLES_PER_MODE} de cada modo.`,
      '',
      '**Ação:** aguardar mais execuções em produção (F5.5 deve estar ativo).',
      '',
    )
  }

  lines.push(
    '## Resumo Executivo',
    '',
    '| Métrica | Valor |',
    '|---------|-------|',
    `| Dias analisados | ${days} |`,
    `| Runs com dados de token | ${tokenEntries.length} |`,
    `| Taxa promote_only | ${promoteOnlyRate}% (${modeEntries.filter(e => e.mode_used === 'promote_only').length}/${modeEntries.length} runs) |`,
    `| Saving líquido por dia promote_only | ${savingPct}% vs generate |`,
    '',
    '## Consumo por Modo',
    '',
    '### Modo `generate` (geração completa)',
    '',
    '| Métrica | Valor |',
    '|---------|-------|',
    `| Amostras | ${genStats.count} |`,
    `| Média total | ${genStats.avgTotal.toLocaleString()} tokens |`,
    `| Média input | ${genStats.avgInput.toLocaleString()} tokens |`,
    `| Média output | ${genStats.avgOutput.toLocaleString()} tokens |`,
    `| Min / Max | ${genStats.minTotal.toLocaleString()} / ${genStats.maxTotal.toLocaleString()} |`,
    '',
    '### Modo `promote_only` (promoção sem geração)',
    '',
    '| Métrica | Valor |',
    '|---------|-------|',
    `| Amostras | ${promoStats.count} |`,
    `| Média total | ${promoStats.avgTotal.toLocaleString()} tokens |`,
    `| Média input | ${promoStats.avgInput.toLocaleString()} tokens |`,
    `| Média output | ${promoStats.avgOutput.toLocaleString()} tokens |`,
    `| Min / Max | ${promoStats.minTotal.toLocaleString()} / ${promoStats.maxTotal.toLocaleString()} |`,
    '',
  )

  if (savingPct !== 'N/A') {
    const weeklyGen = genStats.avgTotal * 7
    const weeklyMixed = genStats.avgTotal * (modeEntries.filter(e => e.mode_used === 'generate').length / modeEntries.length) * 7
      + promoStats.avgTotal * (modeEntries.filter(e => e.mode_used === 'promote_only').length / modeEntries.length) * 7
    const weeklyNetSaving = weeklyGen - weeklyMixed

    lines.push(
      '## Projeção Semanal',
      '',
      '| Cenário | Tokens/semana |',
      '|---------|---------------|',
      `| 100% generate (baseline) | ${Math.round(weeklyGen).toLocaleString()} |`,
      `| Mix real (${promoteOnlyRate}% promote_only) | ${Math.round(weeklyMixed).toLocaleString()} |`,
      `| Economia semanal líquida | ${Math.round(weeklyNetSaving).toLocaleString()} (${savingPct}% saving) |`,
      '',
    )
  }

  lines.push(
    '## Como Gravar Dados',
    '',
    'A routine cloud (`blog-daily`) deve gravar o consumo de tokens ao final de cada execução:',
    '',
    '```typescript',
    "import { recordDailyTokens } from '../../scripts/stockpile-token-report'",
    '',
    'recordDailyTokens({',
    '  input_tokens: usage.input_tokens,',
    '  output_tokens: usage.output_tokens,',
    '  total_tokens: usage.input_tokens + usage.output_tokens,',
    '  mode_used: currentMode,           // "generate" | "promote_only"',
    '  packages_promoted: promotedCount, // opcional',
    '})',
    '```',
    '',
    'Arquivo gravado em: `.claude/blog/data/telemetry/tokens-{DATE}.json`',
    '',
    '---',
    '',
    '_Gerado por `npm run stockpile:token-report` — F5.4.a_',
  )

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { write, days } = parseArgs()

  const modeEntries = readModeEntries(days)
  const tokenEntries = readTokenEntries(days)

  const generateCount = tokenEntries.filter(e => e.mode_used === 'generate').length
  const promoteCount = tokenEntries.filter(e => e.mode_used === 'promote_only').length
  const hasEnoughData = generateCount >= MIN_SAMPLES_PER_MODE && promoteCount >= MIN_SAMPLES_PER_MODE

  console.log(`[stockpile-token-report] Modo entries: ${modeEntries.length} | Token entries: ${tokenEntries.length}`)
  console.log(`[stockpile-token-report] Generate: ${generateCount} samples | Promote_only: ${promoteCount} samples`)

  if (!hasEnoughData) {
    console.warn(`[stockpile-token-report] Dados insuficientes (min ${MIN_SAMPLES_PER_MODE} amostras por modo). Gerando relatório parcial.`)
  }

  const report = buildReport(tokenEntries, modeEntries, days, hasEnoughData)
  console.log('\n' + report)

  if (write) {
    fs.writeFileSync(BASELINE_PATH, report + '\n', 'utf8')
    console.error(`\nRelatório salvo em: ${BASELINE_PATH}`)
  }

  process.exit(hasEnoughData ? 0 : 1)
}

main()
