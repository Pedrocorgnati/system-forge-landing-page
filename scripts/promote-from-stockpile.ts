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

function loadPackages(): Array<{ pkg: StockpilePackage; dir: string }> {
  const root = path.join(STOCKPILE_DIR, 'packages')
  if (!fs.existsSync(root)) return []
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = path.join(root, d.name)
      const pkgPath = path.join(dir, 'package.json')
      if (!fs.existsSync(pkgPath)) {
        // Zero Silencio: dir de pacote sem package.json e orfao (geracao
        // abortada). Skipar em silencio escondia pacotes nao-promoveis.
        console.warn(`[promote] skip ${d.name}: diretorio sem package.json (orfao)`)
        return null
      }
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as StockpilePackage
        return { pkg, dir }
      } catch {
        return null
      }
    })
    .filter((x): x is { pkg: StockpilePackage; dir: string } => x !== null)
}

function main(): void {
  const runId = randomUUID()
  const lock = acquireRunLock(STOCKPILE_DIR, runId, 30)
  if (!lock.acquired) {
    console.error(`[promote] outra execucao detem o lock: ${JSON.stringify(lock.existing_lock)}`)
    process.exit(2)
  }

  try {
    const all = loadPackages()
    const eligible = all.filter(({ pkg }) => {
      if (pkg.promotion_state !== 'available') return false
      if (evaluateFreshness(pkg).action !== 'promote') return false
      if (checkInvalidation(pkg.equivalence_id, STOCKPILE_DIR).blocked) return false
      return true
    })
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

    const promotedIds = new Set<string>()
    const writes: Array<{ pkgDir: string; locale: SupportedLocale; slug: string; target: string }> = []
    const counts: Record<string, number> = Object.fromEntries(LOCALES.map((l) => [l, 0]))

    for (const locale of LOCALES) {
      for (const { pkg, dir } of eligible) {
        if (counts[locale]! >= MAX_PER_LOCALE) break
        if (!pkg.locales_present.includes(locale)) continue
        const reviewed = path.join(dir, locale, 'reviewed.md')
        if (!fs.existsSync(reviewed)) continue
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
          continue
        }
        const mdxCheck = mdxBodyCompiles(parsed.content)
        if (!mdxCheck.ok) {
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: MDX nao compila — ${mdxCheck.error}`)
          continue
        }
        const slug = String(parsed.data.slug)
        const target = path.join(CONTENT_DIR, locale, 'blog', `${slug}.mdx`)
        if (fs.existsSync(target)) {
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: slug-collision em ${target}`)
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

    if (writes.length === 0) {
      console.log('[promote] nenhum pacote elegivel — no-op')
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

    console.log(`[promote] OK: ${writes.length} arquivos | ${summary}`)
  } finally {
    releaseRunLock(STOCKPILE_DIR, runId)
  }
}

main()
