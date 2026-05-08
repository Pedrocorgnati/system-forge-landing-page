/**
 * fix-hreflang-reciprocity.ts
 * Targeted patch for the 19 hreflang reciprocity errors identified by validate:hreflang.
 *
 * Usage: npx ts-node scripts/fix-hreflang-reciprocity.ts [--dry-run]
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DRY_RUN = process.argv.includes('--dry-run')
const CONTENT_ROOT = path.resolve(__dirname, '../content')

interface HreflangPair {
  locale: string
  slug: string
}

interface Patch {
  file: string // relative to CONTENT_ROOT
  description: string
  apply: (data: Record<string, unknown>) => void
}

// --- Helpers ---

function filePath(locale: string, slug: string): string {
  return path.join(CONTENT_ROOT, locale, 'blog', `${slug}.mdx`)
}

function applyPatch(patch: Patch): boolean {
  const full = path.join(CONTENT_ROOT, patch.file)
  if (!fs.existsSync(full)) {
    console.error(`  SKIP (not found): ${patch.file}`)
    return false
  }
  const raw = fs.readFileSync(full, 'utf-8')
  const parsed = matter(raw)
  patch.apply(parsed.data)
  if (!DRY_RUN) {
    fs.writeFileSync(full, matter.stringify(parsed.content, parsed.data), 'utf-8')
  }
  console.log(`  ${DRY_RUN ? '[dry]' : 'PATCHED'}: ${patch.file}`)
  return true
}

function replaceSlug(data: Record<string, unknown>, locale: string, oldSlug: string, newSlug: string): void {
  const pairs = data.hreflang_pair as HreflangPair[] | undefined
  if (!Array.isArray(pairs)) return
  const entry = pairs.find(p => p.locale === locale && p.slug === oldSlug)
  if (entry) {
    entry.slug = newSlug
  } else {
    console.warn(`    WARN: did not find ${locale}:${oldSlug} to replace`)
  }
}

function addPair(data: Record<string, unknown>, locale: string, slug: string): void {
  if (!Array.isArray(data.hreflang_pair)) {
    data.hreflang_pair = []
  }
  const pairs = data.hreflang_pair as HreflangPair[]
  if (pairs.some(p => p.locale === locale)) {
    console.warn(`    WARN: ${locale} already present, skipping add`)
    return
  }
  pairs.push({ locale, slug })
}

function removePair(data: Record<string, unknown>, locale: string): void {
  if (!Array.isArray(data.hreflang_pair)) return
  const before = (data.hreflang_pair as HreflangPair[]).length
  data.hreflang_pair = (data.hreflang_pair as HreflangPair[]).filter(p => p.locale !== locale)
  if ((data.hreflang_pair as HreflangPair[]).length === before) {
    console.warn(`    WARN: ${locale} not found to remove`)
  }
}

function makeExclusive(data: Record<string, unknown>): void {
  data.exclusive = true
  data.hreflang_pair = []
}

// --- Patch definitions ---

const PATCHES: Patch[] = [

  // ────────────────────────────────────────────────
  // GROUP 1: software-house-vs-freelancer
  // Authority: it-IT/software-house-vs-freelance
  //   → pt-BR: software-house-vs-freelancer-qual-escolher
  //   → en:    software-agency-vs-freelancer-which-to-choose
  //   → es-ES: agencia-software-vs-freelance-cual-elegir  (NO 2026)
  //
  // Problem: pt-BR, en, es-ES use wrong it-IT slug "software-house-vs-freelance-quale-scegliere"
  //          pt-BR also has wrong es-ES slug with 2026 suffix
  // ────────────────────────────────────────────────

  {
    file: 'pt-BR/blog/software-house-vs-freelancer-qual-escolher.mdx',
    description: 'Fix it-IT slug (quale-scegliere→vs-freelance) and es-ES slug (drop -2026)',
    apply: (data) => {
      replaceSlug(data, 'it-IT', 'software-house-vs-freelance-quale-scegliere', 'software-house-vs-freelance')
      replaceSlug(data, 'es-ES', 'agencia-software-vs-freelance-cual-elegir-2026', 'agencia-software-vs-freelance-cual-elegir')
    },
  },
  {
    file: 'en/blog/software-agency-vs-freelancer-which-to-choose.mdx',
    description: 'Fix it-IT slug (quale-scegliere→software-house-vs-freelance)',
    apply: (data) => {
      replaceSlug(data, 'it-IT', 'software-house-vs-freelance-quale-scegliere', 'software-house-vs-freelance')
    },
  },
  {
    file: 'es-ES/blog/agencia-software-vs-freelance-cual-elegir.mdx',
    description: 'Fix it-IT slug (quale-scegliere→software-house-vs-freelance)',
    apply: (data) => {
      replaceSlug(data, 'it-IT', 'software-house-vs-freelance-quale-scegliere', 'software-house-vs-freelance')
    },
  },

  // ────────────────────────────────────────────────
  // GROUP 2: ERP
  // Root cause: gestionale (it-IT NEW) and holded-vs-erp (es-ES NEW) claim membership
  //             in the OLD ERP group (tiny-erp ↔ danea-fatture ↔ quickbooks-vs-custom-erp ↔ holded-contasol)
  //             which does not reciprocate them.
  //             quickbooks-zoho also claims pt-BR tiny-erp which doesn't reciprocate.
  //
  // Minimal fix: make gestionale and holded-vs-erp exclusive;
  //              remove pt-BR from quickbooks-zoho (old group is intact).
  // ────────────────────────────────────────────────

  {
    file: 'it-IT/blog/gestionale-vs-erp-personalizzato.mdx',
    description: 'Make exclusive — not reciprocated by any article in its declared group',
    apply: makeExclusive,
  },
  {
    file: 'en/blog/quickbooks-zoho-vs-custom-erp-which-is-better.mdx',
    description: 'Remove pt-BR reference (tiny-erp does not back-reference this slug)',
    apply: (data) => removePair(data, 'pt-BR'),
  },
  {
    file: 'es-ES/blog/holded-vs-erp-personalizado.mdx',
    description: 'Make exclusive — pt-BR tiny-erp does not back-reference this slug',
    apply: makeExclusive,
  },

  // ────────────────────────────────────────────────
  // GROUP 3: saas-pricing-models-2026
  // it-IT and en already have full 3-way pairs.
  // pt-BR and es-ES each have only 1 pair (each other via Jaccard primary pass).
  // Fix: add missing it-IT and en references to both.
  // ────────────────────────────────────────────────

  {
    file: 'pt-BR/blog/modelos-precificacao-saas-como-definir-testar-2026.mdx',
    description: 'Add missing it-IT and en hreflang pairs',
    apply: (data) => {
      addPair(data, 'it-IT', 'modelli-prezzo-saas-come-definire-testare-2026')
      addPair(data, 'en', 'saas-pricing-models-how-to-define-and-test-2026')
    },
  },
  {
    file: 'es-ES/blog/modelos-precios-saas-como-definir-probar-2026.mdx',
    description: 'Add missing it-IT and en hreflang pairs',
    apply: (data) => {
      addPair(data, 'it-IT', 'modelli-prezzo-saas-come-definire-testare-2026')
      addPair(data, 'en', 'saas-pricing-models-how-to-define-and-test-2026')
    },
  },

  // ────────────────────────────────────────────────
  // GROUP 4: medical-clinic-cost-2026
  // en already has full 3-way pairs (pt-BR + it-IT + es-ES).
  // pt-BR has it-IT and es-ES but NOT en.
  // it-IT has pt-BR and es-ES but NOT en.
  // es-ES has pt-BR and it-IT but NOT en.
  // ────────────────────────────────────────────────

  {
    file: 'pt-BR/blog/quanto-custa-site-para-clinica-medica-2026.mdx',
    description: 'Add missing en hreflang pair',
    apply: (data) => {
      addPair(data, 'en', 'how-much-does-a-website-for-medical-clinic-cost-2026')
    },
  },
  {
    file: 'it-IT/blog/quanto-costa-sito-web-per-studio-medico-2026.mdx',
    description: 'Add missing en hreflang pair',
    apply: (data) => {
      addPair(data, 'en', 'how-much-does-a-website-for-medical-clinic-cost-2026')
    },
  },
  {
    file: 'es-ES/blog/cuanto-cuesta-web-para-clinica-medica-2026.mdx',
    description: 'Add missing en hreflang pair',
    apply: (data) => {
      addPair(data, 'en', 'how-much-does-a-website-for-medical-clinic-cost-2026')
    },
  },

  // ────────────────────────────────────────────────
  // GROUP 5: software-contract
  // it-IT already has full 3-way pairs (pt-BR + en + es-ES).
  // pt-BR has en and es-ES but NOT it-IT.
  // en has pt-BR and es-ES but NOT it-IT.
  // es-ES has pt-BR and en but NOT it-IT.
  // ────────────────────────────────────────────────

  {
    file: 'pt-BR/blog/contrato-desenvolvimento-software-o-que-precisa-ter.mdx',
    description: 'Add missing it-IT hreflang pair',
    apply: (data) => {
      addPair(data, 'it-IT', 'contratto-sviluppo-software-cosa-deve-contenere')
    },
  },
  {
    file: 'en/blog/software-development-contract-what-must-include.mdx',
    description: 'Add missing it-IT hreflang pair',
    apply: (data) => {
      addPair(data, 'it-IT', 'contratto-sviluppo-software-cosa-deve-contenere')
    },
  },
  {
    file: 'es-ES/blog/contrato-desarrollo-software-que-debe-incluir.mdx',
    description: 'Add missing it-IT hreflang pair',
    apply: (data) => {
      addPair(data, 'it-IT', 'contratto-sviluppo-software-cosa-deve-contenere')
    },
  },

  // ────────────────────────────────────────────────
  // ROUND 2: Duplicate articles surfaced after round 1 patches.
  // These are slug variants of articles already in canonical groups.
  // The canonical group no longer references them → make exclusive.
  // ────────────────────────────────────────────────

  {
    file: 'it-IT/blog/software-house-vs-freelance-quale-scegliere.mdx',
    description: 'Make exclusive — duplicate of software-house-vs-freelance; canonical group no longer references this slug',
    apply: makeExclusive,
  },
  {
    file: 'es-ES/blog/agencia-software-vs-freelance-cual-elegir-2026.mdx',
    description: 'Make exclusive — duplicate of agencia-software-vs-freelance-cual-elegir; pt-BR no longer references this slug',
    apply: makeExclusive,
  },
]

// --- Run ---

let ok = 0
let fail = 0

console.log(`\nfix-hreflang-reciprocity — ${DRY_RUN ? 'DRY RUN' : 'WRITE MODE'}\n`)

for (const patch of PATCHES) {
  console.log(`[${patch.file}]\n  ${patch.description}`)
  if (applyPatch(patch)) ok++
  else fail++
  console.log()
}

console.log(`=== SUMMARY ===`)
console.log(`Patched: ${ok}`)
console.log(`Failed:  ${fail}`)
if (DRY_RUN) console.log('(dry run — no files written)')
