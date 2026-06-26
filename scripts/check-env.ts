/**
 * scripts/check-env.ts
 * Gate de build-time das variáveis públicas obrigatórias do quote-wizard.
 *
 * Materializa o critério de aceite do Item 018 ("falha explícita, não silenciosa"):
 * o build ABORTA (exit 1) com mensagem determinística quando qualquer variável
 * pública obrigatória estiver ausente ou malformada. Roda ANTES de `next build`
 * nos scripts build:{br,it,en,es} (ver package.json), pois o `next build` inlina
 * as NEXT_PUBLIC_* silenciosamente — sem este gate, uma env ausente vira `''`
 * (config/sites/*.ts: `?? ''`) e o submit do wizard falha em produção sem aviso.
 *
 * Como as NEXT_PUBLIC_* vêm dos arquivos .env (que o `next build` carrega mas o
 * tsx NÃO), este script faz um carregamento mínimo de .env / .env.production /
 * .env.local respeitando a precedência do Next (process.env vence sempre).
 *
 * Variáveis validadas (todas obrigatórias):
 *   NEXT_PUBLIC_QUOTE_WORKER_URL_BR  -> https://quote.forjadesistemas.com.br
 *   NEXT_PUBLIC_QUOTE_WORKER_URL_IT  -> https://quote.systemforge.it
 *   NEXT_PUBLIC_QUOTE_WORKER_URL_EN  -> https://quote.systemforgesoftware.com
 *   NEXT_PUBLIC_QUOTE_WORKER_URL_ES  -> https://quote.systemforge.es
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   -> site key pública do Turnstile (não-vazia)
 *
 * Segredos dos Workers (TURNSTILE_SECRET_KEY, QUOTE_INGEST_SECRET) NÃO são checados
 * aqui: vivem no Worker (wrangler secret put), nunca no bundle do front-end.
 *
 * Usage:
 *   npx tsx scripts/check-env.ts
 *
 * Exit codes:
 *   0 — todas as variáveis públicas obrigatórias presentes e válidas
 *   1 — ao menos uma ausente/malformada (lista todos os erros antes de abortar)
 *
 * Item 018, module-12-compliance-seo
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// ---------------------------------------------------------------------------
// Carregamento mínimo de .env (sem dependência externa)
// ---------------------------------------------------------------------------

/**
 * Carrega pares KEY=VALUE de um arquivo .env para `target`, SEM sobrescrever
 * chaves já presentes (precedência: quem chega primeiro vence). Ignora comentários
 * (#) e linhas em branco. Remove aspas simples/duplas externas do valor.
 */
function loadEnvFile(file: string, target: Record<string, string>): void {
  if (!fs.existsSync(file)) return
  const content = fs.readFileSync(file, 'utf-8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    if (!key || key in target) continue
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    target[key] = value
  }
}

/**
 * Monta o ambiente efetivo respeitando a precedência do Next.js (maior primeiro):
 *   process.env > .env.production.local > .env.local > .env.production > .env
 */
function resolveEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v
  }
  const cwd = process.cwd()
  for (const f of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    loadEnvFile(path.join(cwd, f), env)
  }
  return env
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

const REQUIRED_HTTPS_URLS = [
  'NEXT_PUBLIC_QUOTE_WORKER_URL_BR',
  'NEXT_PUBLIC_QUOTE_WORKER_URL_IT',
  'NEXT_PUBLIC_QUOTE_WORKER_URL_EN',
  'NEXT_PUBLIC_QUOTE_WORKER_URL_ES',
] as const

const REQUIRED_NON_EMPTY = ['NEXT_PUBLIC_TURNSTILE_SITE_KEY'] as const

const PLACEHOLDER_MARKERS = ['[PRODUCTION]', 'xxx.workers.dev', 'SEU_', 'seu_', 'PLACEHOLDER']

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

function looksLikePlaceholder(value: string): boolean {
  return PLACEHOLDER_MARKERS.some(m => value.includes(m))
}

function main(): void {
  const env = resolveEnv()
  const errors: string[] = []

  for (const key of REQUIRED_HTTPS_URLS) {
    const value = (env[key] ?? '').trim()
    if (!value) {
      errors.push(`  - ${key}: ausente (obrigatória para o submit do quote-wizard)`)
      continue
    }
    if (looksLikePlaceholder(value)) {
      errors.push(`  - ${key}: valor placeholder não resolvido ("${value}")`)
      continue
    }
    if (!isHttpsUrl(value)) {
      errors.push(`  - ${key}: deve ser uma URL https válida (recebido: "${value}")`)
    }
  }

  for (const key of REQUIRED_NON_EMPTY) {
    const value = (env[key] ?? '').trim()
    if (!value) {
      errors.push(`  - ${key}: ausente (site key pública do Turnstile é obrigatória)`)
      continue
    }
    if (looksLikePlaceholder(value)) {
      errors.push(`  - ${key}: valor placeholder não resolvido ("${value}")`)
    }
  }

  if (errors.length > 0) {
    console.error(
      '\n❌ [check-env] Variáveis públicas obrigatórias ausentes ou inválidas:\n' +
        errors.join('\n') +
        '\n\nDefina-as no .env / .env.production OU nas variáveis de CI do build.\n' +
        'Tabela canônica: tasks/items/task-018-configurar-envs-csp-workers.md\n'
    )
    process.exit(1)
  }

  console.log(
    '✅ [check-env] Variáveis públicas do quote-wizard OK (4 quote-worker URLs + Turnstile site key).'
  )
  process.exit(0)
}

main()
