/**
 * scripts/validate-content.ts
 * Validates all 40 JSON content files (4 locales × 10 types) against Zod schemas.
 * Run: npx tsx scripts/validate-content.ts
 * Exit code 0 = all pass, 1 = failures found.
 */

import path from 'path'
import fs from 'fs'
import {
  MessagesSchema,
  ServicesSchema,
  PortfolioSchema,
  TestimonialsSchema,
  HeroSchema,
  AboutSchema,
  AdvisorSchema,
  PrivacySchema,
  ContactSchema,
  FaqSchema,
} from '../src/lib/content/schemas'
import type { z } from 'zod'

const LOCALES = ['pt-BR', 'it-IT', 'en', 'es-ES'] as const

const schemaMap: Record<string, z.ZodSchema> = {
  messages: MessagesSchema,
  services: ServicesSchema,
  portfolio: PortfolioSchema,
  testimonials: TestimonialsSchema,
  hero: HeroSchema,
  about: AboutSchema,
  advisor: AdvisorSchema,
  privacy: PrivacySchema,
  contact: ContactSchema,
  faq: FaqSchema,
}

const CONTENT_TYPES = Object.keys(schemaMap)

let passed = 0
let failed = 0
const errors: string[] = []

for (const locale of LOCALES) {
  for (const type of CONTENT_TYPES) {
    const filePath = path.join(process.cwd(), 'content', locale, 'pages', `${type}.json`)

    if (!fs.existsSync(filePath)) {
      errors.push(`MISSING: ${locale}/pages/${type}.json`)
      failed++
      continue
    }

    let raw: unknown
    try {
      raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (err) {
      errors.push(`INVALID JSON: ${locale}/pages/${type}.json — ${(err as Error).message}`)
      failed++
      continue
    }

    const result = schemaMap[type].safeParse(raw)
    if (!result.success) {
      const issues = result.error.issues.map(i => `  ${i.path.join('.')} — ${i.message}`).join('\n')
      errors.push(`SCHEMA FAIL: ${locale}/pages/${type}.json\n${issues}`)
      failed++
    } else {
      passed++
    }
  }
}

// Placeholder check across non-BR locales
const PLACEHOLDER_PATTERNS = /\bTODO\b|\bTRADUZIR\b|\blorem ipsum\b|\bTBD\b|\bPLACEHOLDER\b|\[\.\.\.\]/i

for (const locale of ['it-IT', 'en', 'es-ES'] as const) {
  for (const type of CONTENT_TYPES) {
    const filePath = path.join(process.cwd(), 'content', locale, 'pages', `${type}.json`)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, 'utf-8')

    // Check string values only (not keys)
    const parsed = JSON.parse(content)
    const checkValues = (obj: unknown, path: string): void => {
      if (typeof obj === 'string') {
        if (PLACEHOLDER_PATTERNS.test(obj)) {
          errors.push(`PLACEHOLDER: ${locale}/pages/${type}.json at ${path} — "${obj.substring(0, 80)}"`)
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((v, i) => checkValues(v, `${path}[${i}]`))
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => checkValues(v, `${path}.${k}`))
      }
    }
    checkValues(parsed, '')
  }
}

console.log(`\n━━━ Content Validation ━━━`)
console.log(`Passed: ${passed}/${passed + failed}`)
if (errors.length > 0) {
  console.log(`\nErrors:`)
  errors.forEach(e => console.log(`  ✗ ${e}`))
  process.exit(1)
} else {
  console.log(`All ${passed} content files validated successfully ✓`)
  process.exit(0)
}
