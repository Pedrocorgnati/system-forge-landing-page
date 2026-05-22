/**
 * scripts/promote-from-stockpile.ts
 *
 * Promove pacotes elegiveis do stockpile para content/{locale}/blog/{slug}.mdx
 * e faz commit + push para main. Idempotente via promotion_state.
 *
 * Fluxo (8 passos):
 *   1. acquire run lock TTL 30min
 *   2. ler packages/{uuid}/package.json
 *   3. filtrar promotion_state==available && fresh && !invalidated
 *   4. agrupar por locale, sort FIFO por lifecycle.created_at, pick top MAX_PER_LOCALE
 *   5. copiar reviewed.md -> content/{locale}/blog/{slug}.mdx; validar PostFrontmatterSchema
 *      + compilar o corpo MDX (guard contra post que quebraria o build do velite)
 *   6. marcar promotion_state=promoted + promoted_at=now (uma vez por pacote)
 *   7. git config + add + commit + pull --rebase + push origin main
 *   8. release lock (try/finally, sempre)
 *
 * Env vars (todos com default):
 *   MAX_PER_LOCALE (default 3)
 *   LOCALES (default "pt-BR,it-IT,en,es-ES")
 *   STOCKPILE_DIR (default ".claude/blog/data/stockpile")
 *   CONTENT_DIR (default "content")
 *   GIT_REMOTE (default "origin")
 *   GIT_BRANCH (default "main")
 */

import fs from 'fs'
import path from 'path'
import { execSync, execFileSync } from 'child_process'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { acquireRunLock, releaseRunLock } from '../src/lib/blog/stockpile-locks'
import { evaluateFreshness } from '../src/lib/blog/freshness-gate'
import { checkInvalidation } from '../src/lib/blog/stockpile-invalidation-check'
import { PostFrontmatterSchema } from '../src/lib/blog/post-schema'
import type { StockpilePackage, SupportedLocale } from '../src/lib/blog/stockpile-schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const MAX_PER_LOCALE = Number(process.env.MAX_PER_LOCALE ?? 3)
const LOCALES = (process.env.LOCALES ?? 'pt-BR,it-IT,en,es-ES').split(',').map((l) => l.trim()) as SupportedLocale[]
const STOCKPILE_DIR = path.resolve(REPO_ROOT, process.env.STOCKPILE_DIR ?? '.claude/blog/data/stockpile')
const CONTENT_DIR = path.resolve(REPO_ROOT, process.env.CONTENT_DIR ?? 'content')
const GIT_REMOTE = process.env.GIT_REMOTE ?? 'origin'
const GIT_BRANCH = process.env.GIT_BRANCH ?? 'main'
const DRY_RUN = process.env.DRY_RUN === '1'

/**
 * T011 — agregacao de motivos de descarte.
 *
 * Conjunto canonico de motivos de skip. Os 9 primeiros sao o conjunto definido
 * na TASKLIST T011 (a tabela `Conjunto canonico de motivos de skip`); os 3
 * ultimos — `invalidated`, `package_parse_error`, `reviewed_missing` — sao
 * extensoes congruentes: cobrem caminhos de skip REAIS no codigo que a TASKLIST
 * nao enumerou (o filtro `checkInvalidation`, o `catch` de JSON.parse e o
 * `reviewed.md` ausente). Skipa-los sem contar violaria Zero Silencio — e
 * exatamente o defeito que T011 corrige. Ver PROGRESS.md T011.
 *
 * Particao pacote-vs-locale: os de pacote descartam o pacote inteiro; os de
 * locale descartam so um locale de um pacote que segue elegivel nos demais.
 */
type DiscardReason =
  | 'missing_package_json'
  | 'package_parse_error'
  | 'not_available'
  | 'already_promoted'
  | 'freshness_expired'
  | 'invalidated'
  | 'schema_invalid'
  | 'mdx_compile_error'
  | 'slug_collision'
  | 'frontmatter_invalid'
  | 'reviewed_missing'

const PACKAGE_REASONS: DiscardReason[] = [
  'missing_package_json',
  'package_parse_error',
  'not_available',
  'already_promoted',
  'freshness_expired',
  'invalidated',
]
const LOCALE_REASONS: DiscardReason[] = [
  'schema_invalid',
  'mdx_compile_error',
  'slug_collision',
  'frontmatter_invalid',
  'reviewed_missing',
]

type StageHealth = 'healthy' | 'degraded' | 'broken'
type PipelineHealth = 'pending' | 'healthy' | 'degraded' | 'broken'

/** Snapshot de metricas de um run de promote — schema `blog-metrics/v1` (T009). */
interface PromoteMetricsV1 {
  schema: 'blog-metrics/v1'
  run_type: 'promote'
  run_id: string
  ts: string
  promotion_commit_sha: string | null
  packages_consumed: string[]
  packages_available: number
  packages_orphan: number
  articles_promoted: number
  articles_expected_to_promote: number
  articles_promoted_by_locale: Record<string, number>
  expected_locales: string[]
  promoted_locales: string[]
  discard_reasons: Record<string, number>
  stage_health: StageHealth
  pipeline_health: PipelineHealth
}

function emptyDiscards(): Record<DiscardReason, number> {
  return Object.fromEntries(
    [...PACKAGE_REASONS, ...LOCALE_REASONS].map((r) => [r, 0]),
  ) as Record<DiscardReason, number>
}

function git(args: string): string {
  return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: 'utf8' })
}

/**
 * Compila o corpo MDX (sem frontmatter) para detectar erros que so apareceriam
 * no build do velite — ex.: `<` seguido de digito lido como tag JSX, ou `{...}`
 * cru lido como expressao acorn. Com o velite em strict mode um post quebrado
 * ABORTA o build inteiro; este guard impede que ele seja sequer promovido e
 * commitado em main (Zero Silencio: drift detectado antes do push).
 *
 * A compilacao real roda em `scripts/check-mdx.mjs` via node PURO como
 * subprocesso. Motivo: `@mdx-js/mdx` puxa `estree-walker` (ESM-only, sem
 * condicao `require` em `exports`), que o resolver do tsx 4.x — runtime deste
 * script no CI — nao consegue resolver (ERR_PACKAGE_PATH_NOT_EXPORTED). Isolar
 * a cadeia de import num processo `node` separado contorna isso.
 */
function mdxBodyCompiles(body: string): { ok: true } | { ok: false; error: string } {
  const checker = path.join(REPO_ROOT, 'scripts', 'check-mdx.mjs')
  try {
    execFileSync(process.execPath, [checker], {
      cwd: REPO_ROOT,
      input: body,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true }
  } catch (e) {
    const err = e as { status?: number | null; code?: string; stderr?: string | Buffer; message?: string }
    const stderr = err.stderr ? err.stderr.toString().trim() : ''
    // exit 3 = check-mdx.mjs compilou e o MDX genuinamente nao passa. Skipavel.
    if (err.status === 3) {
      return { ok: false, error: stderr.split('\n')[0] || 'MDX nao compila' }
    }
    // Qualquer outro exit (helper ausente, `@mdx-js/mdx` nao instalado, node
    // ausente, erro de sintaxe no proprio checker) e falha de INFRAESTRUTURA,
    // nao um post quebrado. Tratar como skip transformaria o run num promote
    // no-op silencioso que para a publicacao inteira sem ninguem ver. Lancar
    // aborta o run, falha o step do CI e dispara o auto-issue (Zero Silencio).
    throw new Error(
      `guard de compilacao MDX inoperante (exit=${err.status ?? err.code ?? '?'}): ` +
        `${stderr || err.message || 'erro desconhecido'}. ` +
        `Confirme que scripts/check-mdx.mjs existe e que '@mdx-js/mdx' esta instalado (npm ci).`
    )
  }
}

/**
 * Varre `packages/` e carrega os `package.json` validos. Mutaciona `discards`
 * com os motivos de skip de NIVEL PACOTE detectados na varredura
 * (`missing_package_json`, `package_parse_error`). Retorna `scanned` = total de
 * diretorios varridos (inclui orfaos e corrompidos) para o denominador do
 * resumo agregado (T011).
 */
function loadPackages(
  discards: Record<DiscardReason, number>,
): { packages: Array<{ pkg: StockpilePackage; dir: string }>; scanned: number } {
  const root = path.join(STOCKPILE_DIR, 'packages')
  if (!fs.existsSync(root)) return { packages: [], scanned: 0 }
  const dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())
  const packages: Array<{ pkg: StockpilePackage; dir: string }> = []
  for (const d of dirs) {
    const dir = path.join(root, d.name)
    const pkgPath = path.join(dir, 'package.json')
    if (!fs.existsSync(pkgPath)) {
      // Zero Silencio: dir de pacote sem package.json e orfao (geracao
      // abortada). Skipar em silencio escondia pacotes nao-promoveis.
      console.warn(`[promote] skip ${d.name}: diretorio sem package.json (orfao)`)
      discards.missing_package_json++
      continue
    }
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as StockpilePackage
      packages.push({ pkg, dir })
    } catch (e) {
      // Zero Silencio: package.json existe mas e JSON corrompido. Antes este
      // ramo era `return null` mudo — o pacote sumia da contagem sem rastro.
      console.warn(`[promote] skip ${d.name}: package.json invalido (${(e as Error).message})`)
      discards.package_parse_error++
    }
  }
  return { packages, scanned: dirs.length }
}

/**
 * T011 — emite o resumo agregado de um run de promote.
 *
 * Imprime SEMPRE 3 linhas estruturadas (`[PROMOTE] Resumo` + 2 linhas de skips)
 * para que a causa de "zero elegiveis" seja lida em <10s sem abrir os logs por
 * pacote. Quando `metrics` != null (run real, nao dry-run) tambem grava o
 * snapshot `blog-metrics/v1` no diretorio efemero `metrics/` — consumido pelo
 * step `Detectar no-op recorrente` (T010) no mesmo job de CI.
 *
 * D6 (decidida nesta task): orfao (`missing_package_json > 0`) NAO falha o run.
 * Mantem `exit 0` e sinaliza por tres canais: (a) WARN destacado aqui, (b)
 * uma anotacao `::error::` no stdout — visivel na pagina do run do GitHub
 * Actions mesmo com exit 0, sinal deterministico que o step de no-op (T010)
 * e um operador humano enxergam sem abrir os logs — e (c) `stage_health`
 * = `broken` no metrics JSON. Falhar o step dispararia a issue `promote-failure`
 * (execucao quebrada), conflando com `promote-noop` (verde-mas-silencioso) —
 * ver DECISION-LOG D6.
 */
function emitRunTelemetry(args: {
  scanned: number
  eligible: number
  promoted: number
  discards: Record<DiscardReason, number>
  metrics: PromoteMetricsV1 | null
}): void {
  const { scanned, eligible, promoted, discards, metrics } = args
  console.log(
    `[PROMOTE] Resumo: ${eligible} elegiveis de ${scanned} diretorios varridos | ` +
      `${promoted} artigos promovidos`,
  )
  console.log(
    '[PROMOTE] Skips (pacote): ' +
      PACKAGE_REASONS.map((r) => `${r}=${discards[r]}`).join(', '),
  )
  console.log(
    '[PROMOTE] Skips (locale): ' +
      LOCALE_REASONS.map((r) => `${r}=${discards[r]}`).join(', '),
  )
  if (discards.missing_package_json > 0) {
    console.warn(
      `[PROMOTE] ATENCAO: ${discards.missing_package_json} diretorio(s) orfao(s) sem ` +
        `package.json — bug upstream no gerador do stockpile (ver T002/T003). ` +
        `stage_health=broken. O run mantem exit 0 (D6): orfao nao e no-op legitimo, ` +
        `mas falhar o step dispararia 'promote-failure' em vez de 'promote-noop'.`,
    )
    // F4 (Codex review T011): anotacao `::error::` — o GitHub Actions a renderiza
    // na pagina do run mesmo com exit 0, dando um sinal deterministico de orfao
    // que nao depende de alguem abrir os logs do step. Complementa o WARN acima.
    console.log(
      `::error title=Stockpile orfao::${discards.missing_package_json} diretorio(s) ` +
        `sem package.json no stockpile — bug upstream no gerador (T002/T003). ` +
        `Run mantido verde (D6), mas stage_health=broken.`,
    )
  }
  if (metrics) {
    // F1 (Codex review T011): contrato de handoff same-job. Este JSON e efemero
    // (gitignored) e existe apenas para ser lido pelo step `Detectar no-op
    // recorrente` (T010) DENTRO DO MESMO job de CI, na mesma checkout. Nao ha
    // consumidor cross-run: o historico duravel do pipeline e o `git log` dos
    // commits de promote, nao esta serie. Se o step de T010 for movido para
    // outro job, este contrato quebra e o arquivo precisa virar artifact.
    const metricsDir = path.join(STOCKPILE_DIR, 'metrics')
    fs.mkdirSync(metricsDir, { recursive: true })
    const fsTs = metrics.ts.replace(/[:.]/g, '-')
    const file = path.join(metricsDir, `promote-${fsTs}-${metrics.run_id}.json`)
    fs.writeFileSync(file, JSON.stringify(metrics, null, 2) + '\n', 'utf8')
    console.log(
      `[PROMOTE] metrics: ${path.relative(REPO_ROOT, file)} ` +
        `(schema blog-metrics/v1, stage_health=${metrics.stage_health}, ` +
        `pipeline_health=${metrics.pipeline_health})`,
    )
  }
}

function main(): void {
  const runId = randomUUID()
  const lock = acquireRunLock(STOCKPILE_DIR, runId, 30)
  if (!lock.acquired) {
    console.error(`[promote] outra execucao detem o lock: ${JSON.stringify(lock.existing_lock)}`)
    process.exit(2)
  }

  try {
    // T011: acumulador unico de motivos de descarte, somado em toda a varredura
    // e no loop de promocao. Substitui logs por-pacote dispersos por um resumo.
    const discards = emptyDiscards()
    const { packages: all, scanned } = loadPackages(discards)
    // Classificacao de elegibilidade por pacote — cada ramo de rejeicao conta um
    // motivo canonico. Antes era um `.filter()` que descartava em silencio
    // (`not_available`/`already_promoted`/`freshness_expired`/`invalidated` nao
    // deixavam rastro).
    // PRECEDENCIA FIRST-MATCH: cada ramo termina em `continue`, entao um pacote
    // conta EXATAMENTE um motivo — o primeiro que casa, na ordem de cima para
    // baixo. A soma de `discards` (pacote) + `eligible.length` == `scanned`
    // sempre fecha. Por isso a ordem importa: `promoted` vem antes de
    // `not_available` para nao conflar "ja publicado" (caso saudavel) com
    // "estado nao-promovivel"; `invalidated` antes de `freshness_expired`
    // porque invalidacao explicita prevalece sobre expiracao por idade.
    const eligible: Array<{ pkg: StockpilePackage; dir: string }> = []
    for (const entry of all) {
      const { pkg } = entry
      if (pkg.promotion_state === 'promoted') {
        discards.already_promoted++
        continue
      }
      if (pkg.promotion_state !== 'available') {
        discards.not_available++
        continue
      }
      if (checkInvalidation(pkg.equivalence_id, STOCKPILE_DIR).blocked) {
        discards.invalidated++
        continue
      }
      if (evaluateFreshness(pkg).action !== 'promote') {
        discards.freshness_expired++
        continue
      }
      eligible.push(entry)
    }
    // FIFO real: pacote mais antigo primeiro por lifecycle.created_at (ISO 8601,
    // ordenavel lexicograficamente). equivalence_id e o desempate deterministico
    // quando dois pacotes compartilham o mesmo created_at. Antes a ordenacao era
    // so por equivalence_id (UUID) — deterministica, porem nao temporal: um UUID
    // alto podia inanir indefinidamente se o stockpile vivesse cheio.
    eligible.sort((a, b) => {
      const ca = a.pkg.lifecycle.created_at
      const cb = b.pkg.lifecycle.created_at
      if (ca !== cb) return ca < cb ? -1 : 1
      return a.pkg.equivalence_id.localeCompare(b.pkg.equivalence_id)
    })

    // Denominadores (T009): quanto se ESPERA promover = soma dos `locales_present`
    // dos pacotes elegiveis, intersectados com os LOCALES configurados (um locale
    // fora de LOCALES nunca seria promovido). Tornam a falha parcial mensuravel.
    const expectedLocaleSet = new Set<string>()
    let articlesExpected = 0
    for (const { pkg } of eligible) {
      for (const loc of pkg.locales_present) {
        if (!LOCALES.includes(loc)) continue
        articlesExpected++
        expectedLocaleSet.add(loc)
      }
    }

    const promotedIds = new Set<string>()
    const writes: Array<{ pkgDir: string; locale: SupportedLocale; slug: string; target: string }> = []
    const counts: Record<string, number> = Object.fromEntries(LOCALES.map((l) => [l, 0]))

    for (const locale of LOCALES) {
      for (const { pkg, dir } of eligible) {
        if (counts[locale]! >= MAX_PER_LOCALE) break
        if (!pkg.locales_present.includes(locale)) continue
        const reviewed = path.join(dir, locale, 'reviewed.md')
        if (!fs.existsSync(reviewed)) {
          // `locales_present` declara o locale mas o reviewed.md nao existe:
          // pacote malformado. Antes era `continue` mudo (Zero Silencio).
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: reviewed.md ausente`)
          discards.reviewed_missing++
          continue
        }
        const raw = fs.readFileSync(reviewed, 'utf8')
        const parsed = matter(raw)
        // Compat shim: stockpile gerador emite `description` mas PostFrontmatterSchema
        // (e velite.config.ts) exigem `excerpt`. Mapear sem truncar — falhar
        // validacao se >300 e melhor que cortar mid-sentence.
        let injectedExcerpt = false
        if (!parsed.data.excerpt && typeof parsed.data.description === 'string') {
          parsed.data.excerpt = parsed.data.description
          injectedExcerpt = true
        }
        const schemaResult = PostFrontmatterSchema.safeParse(parsed.data)
        if (!schemaResult.success) {
          const issues = schemaResult.error.issues
            .slice(0, 5)
            .map((i) => `${i.path?.join('.') || '?'} -> ${i.message}`)
            .join('; ')
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: ${issues}`)
          discards.schema_invalid++
          continue
        }
        const mdxCheck = mdxBodyCompiles(parsed.content)
        if (!mdxCheck.ok) {
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: MDX nao compila — ${mdxCheck.error}`)
          discards.mdx_compile_error++
          continue
        }
        const slug = String(parsed.data.slug)
        const target = path.join(CONTENT_DIR, locale, 'blog', `${slug}.mdx`)
        if (fs.existsSync(target)) {
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: slug-collision em ${target}`)
          discards.slug_collision++
          continue
        }
        // Splice `excerpt:` no raw apos `description:` (evita matter.stringify
        // que reformatra todo o YAML e gera diffs barulhentos).
        let finalRaw = raw
        if (injectedExcerpt) {
          const yamlValue = JSON.stringify(String(parsed.data.excerpt))
          const spliced = raw.replace(/^(description:[^\n]*\n)/m, `$1excerpt: ${yamlValue}\n`)
          if (spliced === raw) {
            console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: nao encontrou linha 'description:' no frontmatter para inserir excerpt`)
            discards.frontmatter_invalid++
            continue
          }
          finalRaw = spliced
        }
        if (DRY_RUN) {
          console.log(`[promote][dry-run] would write ${path.relative(REPO_ROOT, target)} (excerpt_injected=${injectedExcerpt}, bytes=${finalRaw.length})`)
        } else {
          fs.mkdirSync(path.dirname(target), { recursive: true })
          fs.writeFileSync(target, finalRaw, { encoding: 'utf8', flag: 'wx' })
        }
        writes.push({ pkgDir: dir, locale, slug, target })
        promotedIds.add(pkg.equivalence_id)
        counts[locale] = counts[locale]! + 1
      }
    }

    // Constroi o snapshot blog-metrics/v1 do run. `promotionCommitSha` so e
    // conhecido apos o push (no-op e dry-run passam null). `stage_health` segue
    // as regras de T009; `pipeline_health` fica `pending` quando ha commit (o
    // run de deploy resolve depois), `broken`/`degraded` quando nao ha commit.
    const makeMetrics = (promotionCommitSha: string | null): PromoteMetricsV1 => {
      const orphan = discards.missing_package_json
      let stageHealth: StageHealth
      if (orphan > 0) stageHealth = 'broken'
      // F2 (Codex review T011): no-op por estoque vazio mapeia para `degraded`,
      // nao `healthy` — segue T009, que trata "nada a fazer" como sub-otimo
      // (o pipeline ideal sempre tem estoque). NAO conflar com `broken`: o
      // consumidor distingue os dois casos por `articles_expected_to_promote`
      // === 0 (estoque vazio, este ramo) vs > 0 com `articles_promoted` === 0
      // (havia expectativa e falhou, ramo seguinte).
      else if (articlesExpected === 0) stageHealth = 'degraded' // no-op: estoque vazio
      else if (writes.length === 0) stageHealth = 'broken' // havia expectativa, promoveu 0
      else if (writes.length < articlesExpected) stageHealth = 'degraded' // parcial
      else stageHealth = 'healthy'
      let pipelineHealth: PipelineHealth
      if (promotionCommitSha) pipelineHealth = 'pending'
      else if (stageHealth === 'broken') pipelineHealth = 'broken'
      else pipelineHealth = 'degraded'
      const discardReasons: Record<string, number> = {}
      for (const r of [...PACKAGE_REASONS, ...LOCALE_REASONS]) {
        if (discards[r] > 0) discardReasons[r] = discards[r]
      }
      return {
        schema: 'blog-metrics/v1',
        run_type: 'promote',
        run_id: process.env.GITHUB_RUN_ID ?? runId,
        ts: new Date().toISOString(),
        promotion_commit_sha: promotionCommitSha,
        packages_consumed: Array.from(promotedIds),
        packages_available: eligible.length,
        packages_orphan: orphan,
        articles_promoted: writes.length,
        articles_expected_to_promote: articlesExpected,
        articles_promoted_by_locale: { ...counts },
        expected_locales: Array.from(expectedLocaleSet),
        promoted_locales: LOCALES.filter((l) => (counts[l] ?? 0) > 0),
        discard_reasons: discardReasons,
        stage_health: stageHealth,
        pipeline_health: pipelineHealth,
      }
    }

    if (writes.length === 0) {
      console.log('[promote] nenhum pacote elegivel — no-op')
      // Resumo agregado SEMPRE (T011) — torna a causa do no-op legivel em <10s.
      // Metrics JSON so em run real (dry-run nao polui a serie consumida por T010).
      emitRunTelemetry({
        scanned,
        eligible: eligible.length,
        promoted: 0,
        discards,
        metrics: DRY_RUN ? null : makeMetrics(null),
      })
      return
    }

    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const touchedPkgPaths = new Set<string>()
    for (const { pkgDir } of writes) {
      const pkgPath = path.join(pkgDir, 'package.json')
      if (touchedPkgPaths.has(pkgPath)) continue
      touchedPkgPaths.add(pkgPath)
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as StockpilePackage
      if (pkg.promotion_state === 'promoted') continue
      if (DRY_RUN) {
        console.log(`[promote][dry-run] would mark ${pkg.equivalence_id} as promoted`)
        continue
      }
      pkg.promotion_state = 'promoted'
      pkg.lifecycle.promoted_at = now
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    }

    const summary = LOCALES.map((l) => `${l}=${counts[l] ?? 0}`).join(' ')
    if (DRY_RUN) {
      console.log(`[promote][dry-run] OK: ${writes.length} arquivos | ${summary}`)
      emitRunTelemetry({
        scanned,
        eligible: eligible.length,
        promoted: writes.length,
        discards,
        metrics: null,
      })
      return
    }

    git('config user.name "github-actions[bot]"')
    git('config user.email "41898282+github-actions[bot]@users.noreply.github.com"')
    const pathspecs = [
      ...writes.map((w) => path.relative(REPO_ROOT, w.target)),
      ...Array.from(touchedPkgPaths).map((p) => path.relative(REPO_ROOT, p)),
    ]
      .map((p) => JSON.stringify(p))
      .join(' ')
    git(`add -- ${pathspecs}`)
    const msg = `content(multilanguage): promote daily batch (${summary})`
    git(`commit -m ${JSON.stringify(msg)}`)
    git(`pull --rebase --autostash ${GIT_REMOTE} ${GIT_BRANCH}`)
    git(`push ${GIT_REMOTE} HEAD:${GIT_BRANCH}`)

    // SHA do commit de promote APOS o push (pull --rebase pode te-lo movido).
    // E a chave de correlacao promote->deploy no metrics (T009).
    const promotionCommitSha = git('rev-parse HEAD').trim()
    console.log(`[promote] OK: ${writes.length} arquivos | ${summary}`)
    emitRunTelemetry({
      scanned,
      eligible: eligible.length,
      promoted: writes.length,
      discards,
      metrics: makeMetrics(promotionCommitSha),
    })
  } finally {
    releaseRunLock(STOCKPILE_DIR, runId)
  }
}

main()
