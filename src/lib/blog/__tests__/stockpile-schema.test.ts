/**
 * src/lib/blog/__tests__/stockpile-schema.test.ts
 *
 * Testes unitários do stockpile-schema.ts.
 * Cobre: schema canônico, rejeição de campos faltantes, UUID, enum, tipos exportados.
 *
 * F1.1 — critério de aceite: ≥90% coverage, validação de pacote canônico e rejeição de inválidos.
 */

import { describe, it, expect } from 'vitest'
import {
  StockpilePackageSchema,
  InvalidationEventSchema,
  StockpileIndexSchema,
  StockpileOriginSchema,
  StockpileIndexEntrySchema,
  FreshnessPolicySchema,
  BriefFingerprintSchema,
  LifecycleSchema,
  PromotionLockSchema,
} from '../stockpile-schema'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_UUID_2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
const VALID_ISO = '2026-05-06T14:00:00Z'
const VALID_ISO_2 = '2026-05-06T14:30:00Z'
const VALID_SHA256 = 'a'.repeat(64)

const validLifecycle = {
  created_at: VALID_ISO,
  quality_gated_at: VALID_ISO_2,
  freshness_checked_at: null,
  promoted_at: null,
  promoted_in_commit: null,
}

const validFreshnessPolicy = {
  max_age_days: 21,
  rewrite_required_above_days: 45,
  freshness_gate_signals: ['pricing_check'],
}

const validBriefFingerprint = {
  cluster_id: 'cluster-001',
  primary_keywords: ['desenvolvimento web', 'next.js'],
  intent: 'comercial' as const,
  hash_sha256: VALID_SHA256,
}

const validPackage = {
  equivalence_id: VALID_UUID,
  stockpile_version: 1 as const,
  type: 'universal' as const,
  locales_present: ['pt-BR', 'en'] as const,
  primary_locale: 'pt-BR' as const,
  volatility_class: 'vendor' as const,
  freshness_policy: validFreshnessPolicy,
  scores: {
    'pt-BR': { seo: 82, conversion: 75, quality_gate: 88 },
    'en':    { seo: 79, conversion: 70, quality_gate: 84 },
  },
  brief_fingerprint: validBriefFingerprint,
  lifecycle: validLifecycle,
  promotion_state: 'available' as const,
  promotion_lock: null,
  invalidation_reason: null,
  internal_links_resolved: false,
}

const validInvalidationEvent = {
  event_id: VALID_UUID,
  event_type: 'invalidated' as const,
  equivalence_id: VALID_UUID_2,
  timestamp: VALID_ISO,
  reason: 'pricing data outdated',
  triggered_by: 'auto-blog-routine',
  affected_locales: ['pt-BR'],
}

// ---------------------------------------------------------------------------
// StockpilePackageSchema
// ---------------------------------------------------------------------------

describe('StockpilePackageSchema', () => {
  it('aceita pacote canônico válido', () => {
    const result = StockpilePackageSchema.safeParse(validPackage)
    expect(result.success).toBe(true)
  })

  it('rejeita equivalence_id que não é UUID', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      equivalence_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('equivalence_id'))).toBe(true)
    }
  })

  it('rejeita volatility_class fora do enum', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      volatility_class: 'unknown-class',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('volatility_class'))).toBe(true)
    }
  })

  it('rejeita promotion_state fora do enum', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      promotion_state: 'pending',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita type fora do enum', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      type: 'quadrilingual',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita stockpile_version diferente de 1', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      stockpile_version: 2,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita locales_present vazio', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      locales_present: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita locale inválido em locales_present', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      locales_present: ['pt-BR', 'fr-FR'],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita quando equivalence_id está ausente', () => {
    const { equivalence_id: _, ...data } = validPackage
    const result = StockpilePackageSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('aceita pacote exclusive (1 locale)', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      type: 'exclusive',
      locales_present: ['it-IT'],
    })
    expect(result.success).toBe(true)
  })

  it('aceita promotion_lock preenchido', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      promotion_state: 'locked',
      promotion_lock: {
        locked_by: 'blog-routine-daily',
        locked_at: VALID_ISO,
        expires_at: VALID_ISO_2,
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejeita promotion_lock com locked_at inválido', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      promotion_lock: {
        locked_by: 'routine',
        locked_at: '2026-05-06',  // sem hora — inválido
        expires_at: VALID_ISO,
      },
    })
    expect(result.success).toBe(false)
  })

  it('aceita scores com subconjunto de locales', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      locales_present: ['pt-BR'],
      scores: { 'pt-BR': { seo: 90, conversion: 80, quality_gate: 85 } },
    })
    expect(result.success).toBe(true)
  })

  it('rejeita scores com valor fora de 0-100', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      scores: { 'pt-BR': { seo: 101, conversion: 75, quality_gate: 88 } },
    })
    expect(result.success).toBe(false)
  })

  it('rejeita scores negativos', () => {
    const result = StockpilePackageSchema.safeParse({
      ...validPackage,
      scores: { 'pt-BR': { seo: -1, conversion: 75, quality_gate: 88 } },
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// BriefFingerprintSchema
// ---------------------------------------------------------------------------

describe('BriefFingerprintSchema', () => {
  it('aceita fingerprint válido', () => {
    expect(BriefFingerprintSchema.safeParse(validBriefFingerprint).success).toBe(true)
  })

  it('rejeita hash_sha256 com tamanho errado', () => {
    const result = BriefFingerprintSchema.safeParse({
      ...validBriefFingerprint,
      hash_sha256: 'abc123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('hash_sha256'))).toBe(true)
    }
  })

  it('rejeita hash_sha256 com chars não-hex', () => {
    const result = BriefFingerprintSchema.safeParse({
      ...validBriefFingerprint,
      hash_sha256: 'g'.repeat(64),
    })
    expect(result.success).toBe(false)
  })

  it('rejeita intent fora do enum', () => {
    const result = BriefFingerprintSchema.safeParse({
      ...validBriefFingerprint,
      intent: 'transacional',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita primary_keywords vazio', () => {
    const result = BriefFingerprintSchema.safeParse({
      ...validBriefFingerprint,
      primary_keywords: [],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// LifecycleSchema
// ---------------------------------------------------------------------------

describe('LifecycleSchema', () => {
  it('aceita lifecycle com timestamps nulos opcionais', () => {
    expect(LifecycleSchema.safeParse(validLifecycle).success).toBe(true)
  })

  it('aceita lifecycle completamente preenchido', () => {
    const result = LifecycleSchema.safeParse({
      created_at: VALID_ISO,
      quality_gated_at: VALID_ISO_2,
      freshness_checked_at: VALID_ISO,
      promoted_at: VALID_ISO_2,
      promoted_in_commit: 'abc1234',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita created_at com formato inválido (só data, sem hora)', () => {
    const result = LifecycleSchema.safeParse({
      ...validLifecycle,
      created_at: '2026-05-06',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita quality_gated_at ausente', () => {
    const { quality_gated_at: _, ...data } = validLifecycle
    const result = LifecycleSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// FreshnessPolicySchema
// ---------------------------------------------------------------------------

describe('FreshnessPolicySchema', () => {
  it('aceita policy válida', () => {
    expect(FreshnessPolicySchema.safeParse(validFreshnessPolicy).success).toBe(true)
  })

  it('rejeita max_age_days não-inteiro', () => {
    const result = FreshnessPolicySchema.safeParse({
      ...validFreshnessPolicy,
      max_age_days: 21.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita max_age_days negativo', () => {
    const result = FreshnessPolicySchema.safeParse({
      ...validFreshnessPolicy,
      max_age_days: -1,
    })
    expect(result.success).toBe(false)
  })

  it('aceita lista vazia de signals', () => {
    const result = FreshnessPolicySchema.safeParse({
      ...validFreshnessPolicy,
      freshness_gate_signals: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejeita signal fora do enum', () => {
    const result = FreshnessPolicySchema.safeParse({
      ...validFreshnessPolicy,
      freshness_gate_signals: ['unknown_signal'],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// InvalidationEventSchema
// ---------------------------------------------------------------------------

describe('InvalidationEventSchema', () => {
  it('aceita evento de invalidação válido', () => {
    expect(InvalidationEventSchema.safeParse(validInvalidationEvent).success).toBe(true)
  })

  it('rejeita event_id que não é UUID', () => {
    const result = InvalidationEventSchema.safeParse({
      ...validInvalidationEvent,
      event_id: 'not-uuid',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('event_id'))).toBe(true)
    }
  })

  it('rejeita event_type fora do enum', () => {
    const result = InvalidationEventSchema.safeParse({
      ...validInvalidationEvent,
      event_type: 'updated',
    })
    expect(result.success).toBe(false)
  })

  it('aceita todos os event_types válidos', () => {
    const types = ['invalidated', 'quarantine', 'refreshed', 'promoted', 'deleted'] as const
    for (const type of types) {
      const result = InvalidationEventSchema.safeParse({
        ...validInvalidationEvent,
        event_id: VALID_UUID_2,
        event_type: type,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejeita reason vazio', () => {
    const result = InvalidationEventSchema.safeParse({
      ...validInvalidationEvent,
      reason: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita locale inválido em affected_locales', () => {
    const result = InvalidationEventSchema.safeParse({
      ...validInvalidationEvent,
      affected_locales: ['pt-BR', 'xx-XX'],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// StockpileIndexSchema
// ---------------------------------------------------------------------------

describe('StockpileIndexSchema', () => {
  const validEntry: object = {
    equivalence_id: VALID_UUID,
    type: 'universal',
    locales_present: ['pt-BR', 'en'],
    promotion_state: 'available',
    volatility_class: 'vendor',
    quality_gated_at: VALID_ISO,
    freshness_checked_at: null,
  }

  const validIndex = {
    generated_at: VALID_ISO,
    total_packages: 1,
    by_state: { available: 1, locked: 0, invalidated: 0, quarantine: 0 },
    by_type: { exclusive: 0, bilingual: 0, trilingual: 0, universal: 1 },
    packages: [validEntry],
  }

  it('aceita index válido com 1 pacote', () => {
    expect(StockpileIndexSchema.safeParse(validIndex).success).toBe(true)
  })

  it('aceita index vazio (0 pacotes)', () => {
    const result = StockpileIndexSchema.safeParse({
      ...validIndex,
      total_packages: 0,
      packages: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejeita total_packages negativo', () => {
    const result = StockpileIndexSchema.safeParse({
      ...validIndex,
      total_packages: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita generated_at sem componente de hora', () => {
    const result = StockpileIndexSchema.safeParse({
      ...validIndex,
      generated_at: '2026-05-06',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// StockpileOriginSchema (frontmatter MDX)
// ---------------------------------------------------------------------------

describe('StockpileOriginSchema', () => {
  const validOrigin = {
    equivalence_id: VALID_UUID,
    quality_gated_at: VALID_ISO,
    promoted_at: VALID_ISO_2,
    volatility_class: 'evergreen' as const,
  }

  it('aceita origin válido', () => {
    expect(StockpileOriginSchema.safeParse(validOrigin).success).toBe(true)
  })

  it('rejeita equivalence_id não-UUID em origin', () => {
    const result = StockpileOriginSchema.safeParse({
      ...validOrigin,
      equivalence_id: 'slug-instead-of-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('aceita todas as volatility_class no origin', () => {
    const classes = ['evergreen', 'versioned', 'pricing', 'regulatory', 'vendor', 'trend'] as const
    for (const vc of classes) {
      const result = StockpileOriginSchema.safeParse({ ...validOrigin, volatility_class: vc })
      expect(result.success).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// PromotionLockSchema
// ---------------------------------------------------------------------------

describe('PromotionLockSchema', () => {
  it('aceita lock válido', () => {
    const result = PromotionLockSchema.safeParse({
      locked_by: 'routine',
      locked_at: VALID_ISO,
      expires_at: VALID_ISO_2,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita locked_by vazio', () => {
    const result = PromotionLockSchema.safeParse({
      locked_by: '',
      locked_at: VALID_ISO,
      expires_at: VALID_ISO_2,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// StockpileIndexEntrySchema
// ---------------------------------------------------------------------------

describe('StockpileIndexEntrySchema', () => {
  it('aceita entry válida com freshness_checked_at nulo', () => {
    const result = StockpileIndexEntrySchema.safeParse({
      equivalence_id: VALID_UUID,
      type: 'bilingual',
      locales_present: ['pt-BR', 'it-IT'],
      promotion_state: 'available',
      volatility_class: 'evergreen',
      quality_gated_at: VALID_ISO,
      freshness_checked_at: null,
    })
    expect(result.success).toBe(true)
  })

  it('aceita entry com freshness_checked_at preenchido', () => {
    const result = StockpileIndexEntrySchema.safeParse({
      equivalence_id: VALID_UUID,
      type: 'trilingual',
      locales_present: ['pt-BR', 'en', 'es-ES'],
      promotion_state: 'locked',
      volatility_class: 'trend',
      quality_gated_at: VALID_ISO,
      freshness_checked_at: VALID_ISO_2,
    })
    expect(result.success).toBe(true)
  })
})
