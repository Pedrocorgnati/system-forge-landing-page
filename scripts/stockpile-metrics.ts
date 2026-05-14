/**
 * scripts/stockpile-metrics.ts
 *
 * F6.1 — Métricas do Stockpile V2. Calcula KPIs a partir dos dados em disco e gera
 * relatório markdown semanal em .claude/blog/data/stockpile/METRICS-{YYYY-WW}.md.
 *
 * Uso:
 *   npx tsx scripts/stockpile-metrics.ts
 *   npx tsx scripts/stockpile-metrics.ts --write          # salva o relatório
 *   npx tsx scripts/stockpile-metrics.ts --days 60        # janela de análise
 *
 * Exit code 0 → métricas calculadas; exit code 1 → erro crítico (stockpile não inicializado).
 */

import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..')
const STOCKPILE_DIR = path.join(ROOT, '.claude', 'blog', 'data', 'stockpile')
const TELEMETRY_DIR = path.join(ROOT, '.claude', 'blog', 'data', 'telemetry')

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    write: args.includes('--write'),
    days: parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] ?? '') || 30,
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PackageSummary {
  equivalence_id: string
  promotion_state: string
  volatility_class: string
  type: string
  quality_gated_at: string | null
  promoted_at: string | null
  created_at: string | null
  invalidation_reason: string | null
}

interface InvalidationEvent {
  event_type: string
  timestamp: string
  reason: string
  triggered_by: string
}

interface TelemetryEntry {
  date: string
  mode_used: 'promote_only' | 'generate'
  packages_promoted?: number
}

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

function readPackages(): PackageSummary[] {
  const packagesDir = path.join(STOCKPILE_DIR, 'packages')
  if (!fs.existsSync(packagesDir)) return []

  const summaries: PackageSummary[] = []
  for (const entry of fs.readdirSync(packagesDir)) {
    const pkgPath = path.join(packagesDir, entry, 'package.json')
    if (!fs.existsSync(pkgPath)) continue
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
      const lifecycle = pkg['lifecycle'] as Record<string, unknown> | undefined
      summaries.push({
        equivalence_id: entry,
        promotion_state: String(pkg['promotion_state'] ?? 'unknown'),
        volatility_class: String(pkg['volatility_class'] ?? 'unknown'),
        type: String(pkg['type'] ?? 'unknown'),
        quality_gated_at: typeof lifecycle?.['quality_gated_at'] === 'string' ? lifecycle['quality_gated_at'] : null,
        promoted_at: typeof lifecycle?.['promoted_at'] === 'string' ? lifecycle['promoted_at'] : null,
        created_at: typeof lifecycle?.['created_at'] === 'string' ? lifecycle['created_at'] : null,
        invalidation_reason: typeof pkg['invalidation_reason'] === 'string' ? pkg['invalidation_reason'] : null,
      })
    } catch {
      // skip corrupt packages
    }
  }
  return summaries
}

function readInvalidationEvents(days: number): InvalidationEvent[] {
  const logPath = path.join(STOCKPILE_DIR, 'invalidation-log.jsonl')
  if (!fs.existsSync(logPath)) return []

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const events: InvalidationEvent[] = []
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean)
  for (const line of lines) {
    try {
      const ev = JSON.parse(line) as InvalidationEvent
      if (new Date(ev.timestamp).getTime() >= cutoff) events.push(ev)
    } catch {
      // skip malformed lines
    }
  }
  return events
}

function readTelemetry(days: number): TelemetryEntry[] {
  if (!fs.existsSync(TELEMETRY_DIR)) return []

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const entries: TelemetryEntry[] = []

  for (const file of fs.readdirSync(TELEMETRY_DIR)) {
    if (!file.startsWith('mode-used-') || !file.endsWith('.json')) continue
    try {
      const data = JSON.parse(fs.readFileSync(path.join(TELEMETRY_DIR, file), 'utf8')) as TelemetryEntry
      if (new Date(data.date).getTime() >= cutoff) entries.push(data)
    } catch {
      // skip corrupt files
    }
  }
  return entries
}

// ---------------------------------------------------------------------------
// Week number helper
// ---------------------------------------------------------------------------

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Metrics computation
// ---------------------------------------------------------------------------

function computeMetrics(days: number) {
  const packages = readPackages()
  const events = readInvalidationEvents(days)
  const telemetry = readTelemetry(days)

  // State breakdown
  const byState = packages.reduce<Record<string, number>>((acc, p) => {
    acc[p.promotion_state] = (acc[p.promotion_state] ?? 0) + 1
    return acc
  }, {})

  const available = byState['available'] ?? 0
  const promoted = byState['promoted'] ?? 0
  const invalidated = byState['invalidated'] ?? 0
  const locked = byState['locked'] ?? 0
  const total = packages.length

  // Promote_only rate
  const runsTotal = telemetry.length
  const runsPromoteOnly = telemetry.filter(t => t.mode_used === 'promote_only').length
  const promoteOnlyRate = runsTotal > 0 ? (runsPromoteOnly / runsTotal * 100).toFixed(1) : 'N/A'

  // Average age in stock at promotion (days)
  const promotedPkgs = packages.filter(p => p.promoted_at && p.created_at)
  const avgAgeDays = promotedPkgs.length > 0
    ? (promotedPkgs.reduce((sum, p) => {
        const age = (new Date(p.promoted_at!).getTime() - new Date(p.created_at!).getTime()) / (24 * 3600 * 1000)
        return sum + age
      }, 0) / promotedPkgs.length).toFixed(1)
    : 'N/A'

  // Invalidation rate (last N days)
  const invalidationEvents = events.filter(e => e.event_type === 'invalidated')
  const invalidationRate = promoted > 0
    ? ((invalidationEvents.length / (promoted + invalidationEvents.length)) * 100).toFixed(1)
    : 'N/A'

  // Invalidation sources
  const byTrigger = invalidationEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.triggered_by] = (acc[e.triggered_by] ?? 0) + 1
    return acc
  }, {})

  // Volatility breakdown (available packages)
  const availablePkgs = packages.filter(p => p.promotion_state === 'available')
  const byVolatility = availablePkgs.reduce<Record<string, number>>((acc, p) => {
    acc[p.volatility_class] = (acc[p.volatility_class] ?? 0) + 1
    return acc
  }, {})

  // Type breakdown (available)
  const byType = availablePkgs.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1
    return acc
  }, {})

  return {
    total, available, promoted, invalidated, locked,
    promoteOnlyRate, runsTotal, runsPromoteOnly,
    avgAgeDays,
    invalidationRate, invalidationEvents: invalidationEvents.length, byTrigger,
    byVolatility, byType,
    packages, events, telemetry,
  }
}

// ---------------------------------------------------------------------------
// Report formatter
// ---------------------------------------------------------------------------

function buildReport(metrics: ReturnType<typeof computeMetrics>, days: number): string {
  const now = new Date()
  const week = isoWeek(now)
  const date = now.toISOString().slice(0, 10)

  const lines: string[] = [
    `# Stockpile Metrics — ${week} (${date})`,
    '',
    `> Janela de análise: últimos ${days} dias | Gerado em: ${now.toISOString()}`,
    '',
    '## Estado do estoque',
    '',
    '| Estado | Pacotes |',
    '|--------|---------|',
    `| available | ${metrics.available} |`,
    `| locked | ${metrics.locked} |`,
    `| invalidated | ${metrics.invalidated} |`,
    `| promoted | ${metrics.promoted} |`,
    `| **total** | **${metrics.total}** |`,
    '',
    '## KPIs de eficiência',
    '',
    '| Métrica | Valor |',
    '|---------|-------|',
    `| Taxa promote_only | ${metrics.promoteOnlyRate}% (${metrics.runsPromoteOnly}/${metrics.runsTotal} runs) |`,
    `| Idade média no estoque na promoção | ${metrics.avgAgeDays} dias |`,
    `| Taxa de invalidação | ${metrics.invalidationRate}% (${metrics.invalidationEvents} eventos) |`,
    '',
  ]

  if (Object.keys(metrics.byTrigger).length > 0) {
    lines.push('## Fontes de invalidação (últimos ' + days + ' dias)', '')
    lines.push('| Trigger | Eventos |', '|---------|---------|')
    for (const [trigger, count] of Object.entries(metrics.byTrigger)) {
      lines.push(`| ${trigger} | ${count} |`)
    }
    lines.push('')
  }

  if (metrics.available > 0) {
    lines.push('## Estoque disponível por classe de volatilidade', '')
    lines.push('| Classe | Pacotes |', '|--------|---------|')
    for (const [cls, count] of Object.entries(metrics.byVolatility).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${cls} | ${count} |`)
    }
    lines.push('')

    lines.push('## Estoque disponível por tipo', '')
    lines.push('| Tipo | Pacotes |', '|------|---------|')
    for (const [type, count] of Object.entries(metrics.byType).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${type} | ${count} |`)
    }
    lines.push('')
  }

  lines.push('## Alertas', '')
  const alerts: string[] = []
  if (metrics.available < 5) alerts.push(`⚠ Estoque baixo: apenas ${metrics.available} pacotes disponíveis (threshold: 5)`)
  if (metrics.runsTotal > 0 && metrics.runsPromoteOnly === 0) alerts.push('⚠ Nenhuma run em modo promote_only — estoque pode estar subutilizado')
  if (metrics.total === 0) alerts.push('⚠ Stockpile vazio — executar /auto-flow blog stockpile para gerar conteúdo')

  if (alerts.length === 0) {
    lines.push('Nenhum alerta ativo.', '')
  } else {
    for (const a of alerts) lines.push(a)
    lines.push('')
  }

  lines.push('---', '', `_Gerado por \`npm run stockpile:metrics\` — F6.1_`)

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { write, days } = parseArgs()

  if (!fs.existsSync(STOCKPILE_DIR)) {
    console.error(`[stockpile-metrics] STOCKPILE_DIR não encontrado: ${STOCKPILE_DIR}`)
    console.error('Execute /blog:stockpile-status para verificar se o stockpile está inicializado.')
    process.exit(1)
  }

  const metrics = computeMetrics(days)
  const report = buildReport(metrics, days)

  console.log(report)

  if (write) {
    const week = isoWeek(new Date())
    const outPath = path.join(STOCKPILE_DIR, `METRICS-${week}.md`)
    fs.writeFileSync(outPath, report + '\n', 'utf8')
    console.error(`\nRelatorio salvo em: ${outPath}`)
  }
}

main()
