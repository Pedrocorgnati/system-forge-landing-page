import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * EnvSchema is not exported directly from env.ts, so we replicate the schema
 * here for isolated unit testing of the validation rules. This avoids coupling
 * tests to the singleton side-effects in env.ts (getValidatedEnv reads
 * process.env at import time in some setups).
 *
 * If the schema in env.ts changes, these tests must be updated accordingly.
 */
const EnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .min(1),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .min(1)
    .regex(/^\+[1-9]\d{1,14}$/),
  NEXT_PUBLIC_CALENDLY_URL: z
    .string()
    .url()
    .startsWith('https://calendly.com/'),
  NEXT_PUBLIC_BUDGET_ENGINE_URL: z
    .string()
    .url(),
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/)
    .optional(),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z
    .string()
    .optional(),
  NEXT_PUBLIC_CLOUDFLARE_ZONE_ID: z
    .string()
    .optional(),
  NEXT_PUBLIC_LOCALE: z
    .enum(['pt-BR', 'it-IT', 'en'] as const)
    .optional(),
  OUT_DIR: z.string().min(1).optional(),
})

/** Valid baseline env vars for all required fields */
const VALID_ENV = {
  NEXT_PUBLIC_SITE_URL: 'https://forjadesistemas.com.br',
  NEXT_PUBLIC_WHATSAPP_NUMBER: '+5548999999999',
  NEXT_PUBLIC_CALENDLY_URL: 'https://calendly.com/test-user',
  NEXT_PUBLIC_BUDGET_ENGINE_URL: 'https://budgetengine.app/api',
}

describe('EnvSchema', () => {
  it('succeeds with all valid env vars including optional fields', () => {
    const result = EnvSchema.safeParse({
      ...VALID_ENV,
      NEXT_PUBLIC_LOCALE: 'pt-BR',
      OUT_DIR: 'dist-br',
    })
    expect(result.success).toBe(true)
  })

  it('fails when NEXT_PUBLIC_LOCALE is an unsupported locale', () => {
    const result = EnvSchema.safeParse({
      ...VALID_ENV,
      NEXT_PUBLIC_LOCALE: 'de',
    })
    expect(result.success).toBe(false)
  })

  it('succeeds when NEXT_PUBLIC_LOCALE is omitted (optional)', () => {
    const result = EnvSchema.safeParse({ ...VALID_ENV })
    expect(result.success).toBe(true)
  })

  it('succeeds when OUT_DIR is omitted (optional)', () => {
    const result = EnvSchema.safeParse({ ...VALID_ENV })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.OUT_DIR).toBeUndefined()
    }
  })

  it('fails when OUT_DIR is an empty string', () => {
    const result = EnvSchema.safeParse({
      ...VALID_ENV,
      OUT_DIR: '',
    })
    expect(result.success).toBe(false)
  })
})
