/**
 * scripts/stockpile-alert-check.ts
 *
 * F6.2 — Verifica condições de alerta no estoque e abre issue via gh CLI quando
 * condição crítica é detectada (estoque < threshold por > 7 dias).
 *
 * Rate-limit: 1 issue por semana (evita spam). Controle via arquivo .last-alert-issue.json.
 *
 * Uso:
 *   npx tsx scripts/stockpile-alert-check.ts
 *   npx tsx scripts/stockpile-alert-check.ts --dry-run   # simula sem abrir issue
 *   npx tsx scripts/stockpile-alert-check.ts --force     # ignora rate-limit
 *
 * Exit code 0 → nenhum alerta; exit code 2 → alerta detectado (issue aberta ou sinalizada).
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const STOCKPILE_DIR = path.join(ROOT, '.claude', 'blog', 'data', 'stockpile')
const ALERT_STATE_FILE = path.join(STOCKPILE_DIR, '.last-alert-issue.json')

const LOW_STOCK_THRESHOLD = 5   // abaixo disso: alerta
const LOW_STOCK_PERSIST_DAYS = 7  // dias consecutivos abaixo do threshold para disparar issue
const RATE_LIMIT_DAYS = 7        // máximo 1 issue por 7 dias

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  }
}

function countAvailablePackages(): number {
  const packagesDir = path.join(STOCKPILE_DIR, 'packages')
  if (!fs.existsSync(packagesDir)) return 0

  let count = 0
  for (const entry of fs.readdirSync(packagesDir)) {
    const pkgPath = path.join(packagesDir, entry, 'package.json')
    if (!fs.existsSync(pkgPath)) continue
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
      if (pkg['promotion_state'] === 'available') count++
    } catch {
      // skip corrupt
    }
  }
  return count
}

interface AlertState {
  low_stock_since: string | null
  last_issue_opened_at: string | null
  last_issue_url: string | null
}

function readAlertState(): AlertState {
  if (!fs.existsSync(ALERT_STATE_FILE)) {
    return { low_stock_since: null, last_issue_opened_at: null, last_issue_url: null }
  }
  try {
    return JSON.parse(fs.readFileSync(ALERT_STATE_FILE, 'utf8')) as AlertState
  } catch {
    return { low_stock_since: null, last_issue_opened_at: null, last_issue_url: null }
  }
}

function writeAlertState(state: AlertState): void {
  fs.writeFileSync(ALERT_STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8')
}

function isRateLimited(state: AlertState): boolean {
  if (!state.last_issue_opened_at) return false
  const lastIssue = new Date(state.last_issue_opened_at).getTime()
  const daysSinceLastIssue = (Date.now() - lastIssue) / (24 * 3600 * 1000)
  return daysSinceLastIssue < RATE_LIMIT_DAYS
}

function openIssue(available: number, daysBelowThreshold: number, dryRun: boolean): string | null {
  const title = `[stockpile-alert] Estoque baixo: ${available} pacotes disponíveis por ${daysBelowThreshold.toFixed(0)} dias`
  const body = `## Alerta: Stockpile com estoque baixo

**Pacotes disponíveis:** ${available} (threshold: ${LOW_STOCK_THRESHOLD})
**Dias abaixo do threshold:** ${daysBelowThreshold.toFixed(0)} (limite: ${LOW_STOCK_PERSIST_DAYS})
**Data de detecção:** ${new Date().toISOString()}

## Ação recomendada

Execute o pipeline de geração para repor o estoque:
\`\`\`bash
# Local (recomendado)
/auto-flow blog stockpile --groups 35

# Ou via auto-flow daily (gera quando estoque insuficiente)
/auto-flow blog daily
\`\`\`

## Referências

- F6.2 — Alert check script: \`npm run stockpile:alert-check\`
- F6.1 — Métricas atuais: \`npm run stockpile:metrics\`
- /blog:stockpile-status — estado detalhado do estoque
`

  if (dryRun) {
    console.log('[DRY RUN] Iria abrir issue:')
    console.log(`  Title: ${title}`)
    console.log(`  Body: ${body.slice(0, 100)}...`)
    return 'dry-run-no-url'
  }

  try {
    const result = execSync(
      `gh issue create --repo Pedrocorgnati/systemForge --title "${title.replace(/"/g, '\\"')}" --label "stockpile-alert" --body "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`,
      { encoding: 'utf8', timeout: 30000 }
    )
    return result.trim()
  } catch (err) {
    console.error('[stockpile-alert] Falha ao abrir issue via gh CLI:', String(err))
    return null
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { dryRun, force } = parseArgs()

  if (!fs.existsSync(STOCKPILE_DIR)) {
    console.log('[stockpile-alert] Stockpile não inicializado. Nenhum alerta.')
    process.exit(0)
  }

  const available = countAvailablePackages()
  const state = readAlertState()
  const now = new Date()

  console.log(`[stockpile-alert] Pacotes disponíveis: ${available} (threshold: ${LOW_STOCK_THRESHOLD})`)

  if (available >= LOW_STOCK_THRESHOLD) {
    // Estoque saudável — resetar contador
    if (state.low_stock_since) {
      console.log('[stockpile-alert] Estoque recuperado. Resetando estado.')
      state.low_stock_since = null
      writeAlertState(state)
    } else {
      console.log('[stockpile-alert] Estoque saudável. Nenhuma ação necessária.')
    }
    process.exit(0)
  }

  // Estoque abaixo do threshold
  if (!state.low_stock_since) {
    // Primeiro dia abaixo — iniciar contagem
    state.low_stock_since = now.toISOString()
    writeAlertState(state)
    console.log(`[stockpile-alert] Estoque baixo detectado pela primeira vez. Monitorando por ${LOW_STOCK_PERSIST_DAYS} dias antes de abrir issue.`)
    process.exit(2)
  }

  const daysBelowThreshold = (now.getTime() - new Date(state.low_stock_since).getTime()) / (24 * 3600 * 1000)
  console.log(`[stockpile-alert] Estoque baixo por ${daysBelowThreshold.toFixed(1)} dias (limite: ${LOW_STOCK_PERSIST_DAYS})`)

  if (daysBelowThreshold < LOW_STOCK_PERSIST_DAYS) {
    console.log(`[stockpile-alert] Abaixo do threshold há ${daysBelowThreshold.toFixed(1)} dias. Aguardando ${LOW_STOCK_PERSIST_DAYS} dias antes de alertar.`)
    process.exit(2)
  }

  // Threshold de persistência atingido → verificar rate-limit
  if (!force && isRateLimited(state)) {
    const daysSince = (now.getTime() - new Date(state.last_issue_opened_at!).getTime()) / (24 * 3600 * 1000)
    console.log(`[stockpile-alert] Issue recente (${daysSince.toFixed(1)} dias atrás). Rate-limit ativo. Use --force para sobrescrever.`)
    console.log(`  Última issue: ${state.last_issue_url}`)
    process.exit(2)
  }

  // Abrir issue
  console.log(`[stockpile-alert] Condição de alerta atingida (${available} pacotes por ${daysBelowThreshold.toFixed(0)} dias). Abrindo issue...`)
  const issueUrl = openIssue(available, daysBelowThreshold, dryRun)

  if (issueUrl) {
    state.last_issue_opened_at = now.toISOString()
    state.last_issue_url = issueUrl
    if (!dryRun) writeAlertState(state)
    console.log(`[stockpile-alert] Issue aberta: ${issueUrl}`)
  }

  process.exit(2)
}

main()
