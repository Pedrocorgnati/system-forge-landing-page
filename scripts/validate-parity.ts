/**
 * scripts/validate-parity.ts
 * Validates cross-locale ID parity and invariant fields for portfolio,
 * testimonials, and services content files.
 * Run: npx tsx scripts/validate-parity.ts
 * Exit code 0 = all pass, 1 = failures found.
 */

import path from 'path'
import fs from 'fs'

const LOCALES = ['pt-BR', 'it-IT', 'en'] as const
const errors: string[] = []

function loadJson<T>(locale: string, type: string): T {
  const filePath = path.join(process.cwd(), 'content', locale, 'pages', `${type}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  categories: string[]
  technologies: string[]
  deliveryCountry?: string
  imageUrl?: string
  projectUrl?: string
}

interface TestimonialItem {
  id: string
  author: string
  role: string
  company: string
  content: string
  locale: string
}

interface ServiceItem {
  id: string
  category: string
  title: string
  description: string
  features: string[]
}

// ─── Portfolio Parity ────────────────────────────────────────────────────────

console.log('\n━━━ Portfolio Parity ━━━')

const portfolios = Object.fromEntries(
  LOCALES.map(l => [l, loadJson<PortfolioItem[]>(l, 'portfolio')])
)

const ptPortfolioIds = portfolios['pt-BR'].map(p => p.id).sort()
for (const locale of ['it-IT', 'en'] as const) {
  const localeIds = portfolios[locale].map(p => p.id).sort()
  if (JSON.stringify(ptPortfolioIds) !== JSON.stringify(localeIds)) {
    const missing = ptPortfolioIds.filter(id => !localeIds.includes(id))
    const extra = localeIds.filter(id => !ptPortfolioIds.includes(id))
    errors.push(`Portfolio ID mismatch pt-BR vs ${locale}: missing=[${missing}] extra=[${extra}]`)
  }
}

// Check invariant fields
for (const ptProj of portfolios['pt-BR']) {
  for (const locale of ['it-IT', 'en'] as const) {
    const localeProj = portfolios[locale].find(p => p.id === ptProj.id)
    if (!localeProj) continue

    const ptCat = (ptProj.categories || []).sort().join(',')
    const lCat = (localeProj.categories || []).sort().join(',')
    if (ptCat !== lCat) {
      errors.push(`Portfolio ${ptProj.id}: categories differ pt-BR vs ${locale}`)
    }

    const ptTech = (ptProj.technologies || []).sort().join(',')
    const lTech = (localeProj.technologies || []).sort().join(',')
    if (ptTech !== lTech) {
      errors.push(`Portfolio ${ptProj.id}: technologies differ pt-BR vs ${locale}`)
    }

    if (ptProj.deliveryCountry !== localeProj.deliveryCountry) {
      errors.push(`Portfolio ${ptProj.id}: deliveryCountry differs pt-BR vs ${locale}`)
    }
  }
}

console.log(`  Portfolio: ${portfolios['pt-BR'].length} projects × 3 locales`)
console.log(`  IDs: ${errors.filter(e => e.includes('Portfolio ID')).length === 0 ? '✓ parity' : '✗ mismatch'}`)
console.log(`  Invariants: ${errors.filter(e => e.includes('Portfolio') && !e.includes('ID')).length === 0 ? '✓ consistent' : '✗ divergent'}`)

// ─── Testimonials Parity ─────────────────────────────────────────────────────

console.log('\n━━━ Testimonials Parity ━━━')

const testimonials = Object.fromEntries(
  LOCALES.map(l => [l, loadJson<TestimonialItem[]>(l, 'testimonials')])
)

const ptTestIds = testimonials['pt-BR'].map(t => t.id).sort()
for (const locale of ['it-IT', 'en'] as const) {
  const localeIds = testimonials[locale].map(t => t.id).sort()
  if (JSON.stringify(ptTestIds) !== JSON.stringify(localeIds)) {
    errors.push(`Testimonial ID mismatch pt-BR vs ${locale}`)
  }
}

// Check invariant fields (author, company)
for (const ptTest of testimonials['pt-BR']) {
  for (const locale of ['it-IT', 'en'] as const) {
    const localeTest = testimonials[locale].find(t => t.id === ptTest.id)
    if (!localeTest) continue
    if (ptTest.author !== localeTest.author) {
      errors.push(`Testimonial ${ptTest.id}: author differs pt-BR(${ptTest.author}) vs ${locale}(${localeTest.author})`)
    }
    if (ptTest.company !== localeTest.company) {
      errors.push(`Testimonial ${ptTest.id}: company differs pt-BR(${ptTest.company}) vs ${locale}(${localeTest.company})`)
    }
  }
}

console.log(`  Testimonials: ${testimonials['pt-BR'].length} entries × 3 locales`)
console.log(`  IDs: ${errors.filter(e => e.includes('Testimonial ID')).length === 0 ? '✓ parity' : '✗ mismatch'}`)
console.log(`  Invariants: ${errors.filter(e => e.includes('Testimonial') && !e.includes('ID')).length === 0 ? '✓ consistent' : '✗ divergent'}`)

// ─── Services Parity ─────────────────────────────────────────────────────────

console.log('\n━━━ Services Parity ━━━')

const services = Object.fromEntries(
  LOCALES.map(l => [l, loadJson<ServiceItem[]>(l, 'services')])
)

const ptServiceIds = services['pt-BR'].map(s => s.id).sort()
for (const locale of ['it-IT', 'en'] as const) {
  const localeIds = services[locale].map(s => s.id).sort()
  if (JSON.stringify(ptServiceIds) !== JSON.stringify(localeIds)) {
    errors.push(`Service ID mismatch pt-BR vs ${locale}`)
  }
}

console.log(`  Services: ${services['pt-BR'].length} categories × 3 locales`)
console.log(`  IDs: ${errors.filter(e => e.includes('Service ID')).length === 0 ? '✓ parity' : '✗ mismatch'}`)

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n━━━ Parity Validation Summary ━━━')
if (errors.length > 0) {
  console.log(`\n${errors.length} error(s):`)
  errors.forEach(e => console.log(`  ✗ ${e}`))
  process.exit(1)
} else {
  console.log('All parity checks passed ✓')
  process.exit(0)
}
