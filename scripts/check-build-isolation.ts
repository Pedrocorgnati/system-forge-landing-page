#!/usr/bin/env tsx
/**
 * scripts/check-build-isolation.ts
 * Verifica que cada build (dist-br/dist-it/dist-en) contém APENAS
 * conteúdo do locale correto. Zero strings de outros locales no HTML.
 *
 * Roda APÓS os 3 builds completarem (npm run build:br && build:it && build:en).
 * Pré-deploy gate — bloqueia deploys com cross-contamination de locale.
 *
 * Uso: npx tsx scripts/check-build-isolation.ts
 * INT-006..008 — module-14-integration / TASK-2
 */
import { readFileSync, existsSync } from 'fs'
import { globSync } from 'glob'

interface BuildCheck {
  locale: string
  outDir: string
  forbiddenStrings: string[]
  requiredStrings: string[]
  expectedLang: string
  expectedDomain: string
}

const checks: BuildCheck[] = [
  {
    locale: 'pt-BR',
    outDir: 'dist-br',
    forbiddenStrings: ['systemforge.it', 'systemforgesoftware.com', 'it-IT', 'en-US'],
    requiredStrings: ['forjadesistemas.com.br', 'pt-BR'],
    expectedLang: 'pt-BR',
    expectedDomain: 'forjadesistemas.com.br',
  },
  {
    locale: 'it-IT',
    outDir: 'dist-it',
    forbiddenStrings: ['forjadesistemas.com.br', 'systemforgesoftware.com', 'pt-BR', 'en-US'],
    requiredStrings: ['systemforge.it', 'it-IT'],
    expectedLang: 'it-IT',
    expectedDomain: 'systemforge.it',
  },
  {
    locale: 'en',
    outDir: 'dist-en',
    forbiddenStrings: ['forjadesistemas.com.br', 'systemforge.it', 'pt-BR', 'it-IT'],
    requiredStrings: ['systemforgesoftware.com', 'lang="en"'],
    expectedLang: 'en',
    expectedDomain: 'systemforgesoftware.com',
  },
]

let errors = 0
const errorMessages: string[] = []

function recordError(msg: string): void {
  console.error(`❌ ${msg}`)
  errorMessages.push(msg)
  errors++
}

// ─── Verificar que todos os builds existem ───────────────────────────────────

console.log('\n━━━ Verificando presença dos builds ━━━')
for (const { outDir } of checks) {
  if (!existsSync(outDir)) {
    recordError(`BUILD AUSENTE: ${outDir}/ — rode npm run build:${outDir.replace('dist-', '')} primeiro`)
  }
}
if (errors > 0) {
  console.error(`\n❌ ${errors} build(s) ausente(s). Execute npm run build:br && build:it && build:en antes deste script.`)
  process.exit(1)
}
console.log('✅ dist-br/ dist-it/ dist-en/ presentes')

// ─── Verificar cross-contamination de strings ────────────────────────────────

console.log('\n━━━ Verificando isolamento de strings por build ━━━')

for (const check of checks) {
  const htmlFiles = globSync(`${check.outDir}/**/*.html`)
  if (htmlFiles.length === 0) {
    recordError(`Nenhum HTML em ${check.outDir}/ — build vazio ou incorreto`)
    continue
  }

  let fileErrors = 0
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8')
    // Remove elementos legítimos com refs cross-domain antes de verificar:
    // - tags hreflang alternate
    // - JSON-LD scripts (sameAs, url de outros locales)
    // - language switcher (nav/footer com links para outros locales)
    const contentWithoutAlternate = content
      .replace(/<link[^>]*rel=["']alternate["'][^>]*>/gi, '')
      .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    for (const forbidden of check.forbiddenStrings) {
      if (contentWithoutAlternate.includes(forbidden)) {
        recordError(`${file}: string proibida fora de hreflang: "${forbidden}"`)
        fileErrors++
      }
    }
  }

  // Verificar strings obrigatórias no index
  const indexPath = `${check.outDir}/index.html`
  if (existsSync(indexPath)) {
    const indexContent = readFileSync(indexPath, 'utf-8')
    for (const required of check.requiredStrings) {
      if (!indexContent.includes(required)) {
        console.warn(`⚠️  ${check.outDir}/index.html: string esperada ausente: "${required}"`)
      }
    }
  }

  if (fileErrors === 0) {
    console.log(`✅ ${check.outDir}: isolamento OK (${htmlFiles.length} HTML files verificados)`)
  }
}

// ─── Verificar lang attribute e canonical ────────────────────────────────────

console.log('\n━━━ Verificando lang attribute e canonical por build ━━━')

for (const { outDir, expectedLang, expectedDomain } of checks) {
  const indexPath = `${outDir}/index.html`
  if (!existsSync(indexPath)) continue

  const indexHtml = readFileSync(indexPath, 'utf-8')

  // Verificar lang attribute
  if (!indexHtml.includes(`lang="${expectedLang}"`)) {
    recordError(`${outDir}/index.html: lang="${expectedLang}" ausente`)
  } else {
    console.log(`✅ ${outDir}: lang="${expectedLang}" presente`)
  }

  // Verificar canonical URL
  const canonicalMatch = indexHtml.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/)
    ?? indexHtml.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/)
  if (canonicalMatch) {
    if (!canonicalMatch[1].includes(expectedDomain)) {
      recordError(`${outDir}/index.html: canonical não aponta para ${expectedDomain}: ${canonicalMatch[1]}`)
    } else {
      console.log(`✅ ${outDir}: canonical → ${canonicalMatch[1].slice(0, 60)}`)
    }
  } else {
    console.warn(`⚠️  ${outDir}/index.html: tag canonical não encontrada`)
  }
}

// ─── Resumo ────────────────────────────────────────────────────────────────────

console.log('\n━━━ Resumo ━━━')
if (errors > 0) {
  console.error(`\n❌ ${errors} erro(s) de isolamento de build:`)
  errorMessages.forEach(m => console.error(`  • ${m}`))
  process.exit(1)
}
console.log('✅ Build isolation OK — zero cross-contamination de locale detectada')
process.exit(0)
