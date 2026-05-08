/**
 * src/lib/blog/__tests__/freshness-gate.test.ts
 *
 * F4.3 — 6 classes × 3 idades = 18 cenários + sinais ortogonais.
 */

import { describe, it, expect } from 'vitest'
import { evaluateFreshness, batchEvaluateFreshness } from '../freshness-gate'
import type { StockpilePackage } from '../stockpile-schema'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_SHA256 = 'a'.repeat(64)

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
}

function makePackage(
  volatilityClass: StockpilePackage['volatility_class'],
  maxAgeDays: number,
  qualityGatedDaysAgo: number,
  extraSignals: StockpilePackage['freshness_policy']['freshness_gate_signals'] = [],
): StockpilePackage {
  return {
    equivalence_id: '00000000-0000-0000-0000-000000000000',
    stockpile_version: 1,
    type: 'exclusive',
    locales_present: ['pt-BR'],
    primary_locale: 'pt-BR',
    volatility_class: volatilityClass,
    freshness_policy: {
      max_age_days: maxAgeDays,
      rewrite_required_above_days: 0,  // DEC-4: desativado
      freshness_gate_signals: extraSignals,
    },
    scores: { 'pt-BR': { seo: 82, conversion: 71, quality_gate: 85 } },
    brief_fingerprint: {
      cluster_id: 'test',
      primary_keywords: ['test'],
      intent: 'comercial',
      hash_sha256: VALID_SHA256,
    },
    lifecycle: {
      created_at: daysAgo(qualityGatedDaysAgo + 1),
      quality_gated_at: daysAgo(qualityGatedDaysAgo),
      freshness_checked_at: null,
      promoted_at: null,
      promoted_in_commit: null,
    },
    promotion_state: 'available',
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }
}

// ---------------------------------------------------------------------------
// 18 class × age scenarios (ADR-004 max_age values)
// Classes: evergreen(180), versioned(60), pricing(30), regulatory(14), vendor(21), trend(7)
// Ages: young (50% of max), borderline (at max), stale (150% of max)
// ---------------------------------------------------------------------------

const CLASS_MAX: Array<[StockpilePackage['volatility_class'], number]> = [
  ['evergreen',   180],
  ['versioned',   60],
  ['pricing',     30],
  ['regulatory',  14],
  ['vendor',      21],
  ['trend',       7],
]

describe('18 scenarios: 6 classes × 3 ages', () => {
  for (const [cls, maxAge] of CLASS_MAX) {
    const young = Math.floor(maxAge * 0.5)
    const atMax = maxAge + 1       // just past the max
    const stale = Math.floor(maxAge * 1.5)

    it(`${cls} — young (${young}d): promote`, () => {
      const pkg = makePackage(cls, maxAge, young)
      const result = evaluateFreshness(pkg)
      expect(result.action).toBe('promote')
    })

    it(`${cls} — borderline past max (${atMax}d): re_review`, () => {
      const pkg = makePackage(cls, maxAge, atMax)
      const result = evaluateFreshness(pkg)
      expect(result.action).toBe('re_review')
      expect(result.reasons[0]).toContain('max_age_days')
    })

    it(`${cls} — stale (${stale}d): re_review`, () => {
      const pkg = makePackage(cls, maxAge, stale)
      const result = evaluateFreshness(pkg)
      expect(result.action).toBe('re_review')
    })
  }
})

// ---------------------------------------------------------------------------
// Orthogonal signals — force re_review even with age=0
// ---------------------------------------------------------------------------

describe('orthogonal signals', () => {
  it('pricing_check signal forces re_review on vendor package at age 0', () => {
    const pkg = makePackage('vendor', 21, 0, ['pricing_check'])
    const result = evaluateFreshness(pkg, Date.now(), ['pricing_check'])
    expect(result.action).toBe('re_review')
    expect(result.signals_triggered).toContain('pricing_check')
    expect(result.reasons[0]).toContain('pricing_check')
  })

  it('regulatory_check signal forces re_review on evergreen package', () => {
    const pkg = makePackage('evergreen', 180, 10, ['regulatory_check'])
    const result = evaluateFreshness(pkg, Date.now(), ['regulatory_check'])
    expect(result.action).toBe('re_review')
    expect(result.signals_triggered).toContain('regulatory_check')
  })

  it('broken_links signal forces re_review', () => {
    const pkg = makePackage('vendor', 21, 1, ['broken_links'])
    const result = evaluateFreshness(pkg, Date.now(), ['broken_links'])
    expect(result.action).toBe('re_review')
  })

  it('signal not in freshness_gate_signals is ignored', () => {
    // Package subscribes to pricing_check only — broken_links should be ignored
    const pkg = makePackage('vendor', 21, 1, ['pricing_check'])
    const result = evaluateFreshness(pkg, Date.now(), ['broken_links'])
    expect(result.action).toBe('promote')
    expect(result.signals_triggered).toHaveLength(0)
  })

  it('multiple signals: all subscribed = re_review with all in triggered list', () => {
    const pkg = makePackage('pricing', 30, 5, ['pricing_check', 'broken_links'])
    const result = evaluateFreshness(pkg, Date.now(), ['pricing_check', 'broken_links', 'regulatory_check'])
    expect(result.action).toBe('re_review')
    expect(result.signals_triggered).toContain('pricing_check')
    expect(result.signals_triggered).toContain('broken_links')
    expect(result.signals_triggered).not.toContain('regulatory_check')
  })
})

// ---------------------------------------------------------------------------
// DEC-4: rewrite gate disabled
// ---------------------------------------------------------------------------

describe('DEC-4 — rewrite gate disabled', () => {
  it('rewrite_required_above_days=0 never triggers rewrite action', () => {
    const pkg = makePackage('vendor', 21, 9999) // 9999 days old
    // rewrite_required is 0 (disabled), max_age is 21 → re_review, not rewrite
    const result = evaluateFreshness(pkg)
    expect(result.action).toBe('re_review')
    expect(result.action).not.toBe('rewrite')
  })

  it('rewrite triggers if rewrite_required_above_days > 0 and exceeded', () => {
    const pkg = makePackage('vendor', 21, 10)
    pkg.freshness_policy.rewrite_required_above_days = 5  // manual override
    const result = evaluateFreshness(pkg)
    expect(result.action).toBe('rewrite')
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('returns promote when quality_gated_at is null', () => {
    const pkg = makePackage('vendor', 21, 5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(pkg.lifecycle as any).quality_gated_at = null
    const result = evaluateFreshness(pkg)
    expect(result.action).toBe('promote')
    expect(result.reasons[0]).toContain('quality_gated_at ausente')
  })

  it('accepts Date object as now parameter', () => {
    const pkg = makePackage('vendor', 21, 100)
    const result = evaluateFreshness(pkg, new Date())
    expect(result.action).toBe('re_review')
  })

  it('age_days is correctly calculated', () => {
    const pkg = makePackage('vendor', 21, 10)
    const result = evaluateFreshness(pkg)
    expect(result.age_days).toBeGreaterThanOrEqual(9.9)
    expect(result.age_days).toBeLessThan(11)
  })
})

// ---------------------------------------------------------------------------
// batchEvaluateFreshness
// ---------------------------------------------------------------------------

describe('batchEvaluateFreshness', () => {
  it('separates eligible from stale packages', () => {
    const fresh = makePackage('vendor', 21, 5)
    const stale = makePackage('vendor', 21, 30)
    fresh.equivalence_id = '11111111-1111-1111-1111-111111111111'
    stale.equivalence_id = '22222222-2222-2222-2222-222222222222'

    const result = batchEvaluateFreshness([fresh, stale])
    expect(result.eligible).toHaveLength(1)
    expect(result.eligible[0]!.equivalence_id).toBe(fresh.equivalence_id)
    expect(result.stale).toHaveLength(1)
    expect(result.stale[0]!.pkg.equivalence_id).toBe(stale.equivalence_id)
    expect(result.stale[0]!.result.action).toBe('re_review')
  })

  it('returns all eligible when all packages are fresh', () => {
    const pkgs = [makePackage('vendor', 21, 1), makePackage('evergreen', 180, 10)]
    const result = batchEvaluateFreshness(pkgs)
    expect(result.eligible).toHaveLength(2)
    expect(result.stale).toHaveLength(0)
  })
})
