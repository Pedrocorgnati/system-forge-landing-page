/**
 * src/lib/blog/stockpile-schema.ts
 *
 * Schema Zod + tipos TypeScript para o Stockpile V2.
 *
 * F1.1 — schema canônico do pacote de estoque.
 * Spec: scheduled-updates/auto-blog/STOCKPILE-FEATURE.md §3.2
 * ADR-004: volatility_class e freshness gates
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const VolatilityClassSchema = z.enum([
  'evergreen',
  'versioned',
  'pricing',
  'regulatory',
  'vendor',
  'trend',
])
export type VolatilityClass = z.infer<typeof VolatilityClassSchema>

export const StockpileTypeSchema = z.enum([
  'exclusive',
  'bilingual',
  'trilingual',
  'universal',
])
export type StockpileType = z.infer<typeof StockpileTypeSchema>

export const PromotionStateSchema = z.enum([
  'available',
  'locked',
  'invalidated',
  'quarantine',
  'promoted',
])
export type PromotionState = z.infer<typeof PromotionStateSchema>

export const SupportedLocaleSchema = z.enum(['pt-BR', 'it-IT', 'en', 'es-ES'])
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>

export const ContentIntentSchema = z.enum([
  'comercial',
  'informacional',
  'comparativo',
  'local',
])
export type ContentIntent = z.infer<typeof ContentIntentSchema>

export const FreshnessSignalSchema = z.enum([
  'pricing_check',
  'regulatory_check',
  'broken_links',
  'invalidation_log',
])
export type FreshnessSignal = z.infer<typeof FreshnessSignalSchema>

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const FreshnessPolicySchema = z.object({
  max_age_days: z.number().int().positive(),
  rewrite_required_above_days: z.number().int().min(0),  // 0 = desativado (DEC-4)
  freshness_gate_signals: z.array(FreshnessSignalSchema),
})
export type FreshnessPolicy = z.infer<typeof FreshnessPolicySchema>

export const LocaleScoresSchema = z.object({
  seo: z.number().int().min(0).max(100),
  conversion: z.number().int().min(0).max(100),
  quality_gate: z.number().int().min(0).max(100),
})
export type LocaleScores = z.infer<typeof LocaleScoresSchema>

export const BriefFingerprintSchema = z.object({
  cluster_id: z.string().min(1),
  primary_keywords: z.array(z.string().min(1)).min(1),
  intent: ContentIntentSchema,
  hash_sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/, 'hash_sha256 deve ser hex de 64 chars (SHA-256)'),
})
export type BriefFingerprint = z.infer<typeof BriefFingerprintSchema>

// ISO 8601 datetime string
const isoDatetimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/,
    'Formato ISO 8601: YYYY-MM-DDTHH:MM:SSZ',
  )

export const LifecycleSchema = z.object({
  created_at: isoDatetimeSchema,
  quality_gated_at: isoDatetimeSchema,
  freshness_checked_at: isoDatetimeSchema.nullable(),
  promoted_at: isoDatetimeSchema.nullable(),
  promoted_in_commit: z.string().nullable(),
})
export type Lifecycle = z.infer<typeof LifecycleSchema>

export const PromotionLockSchema = z.object({
  locked_by: z.string().min(1),
  locked_at: isoDatetimeSchema,
  expires_at: isoDatetimeSchema,
})
export type PromotionLock = z.infer<typeof PromotionLockSchema>

// ---------------------------------------------------------------------------
// StockpilePackage — contrato canônico do package.json
// ---------------------------------------------------------------------------

export const StockpilePackageSchema = z.object({
  equivalence_id: z.string().uuid('equivalence_id deve ser UUID v4'),
  stockpile_version: z.literal(1),
  type: StockpileTypeSchema,
  locales_present: z
    .array(SupportedLocaleSchema)
    .min(1, 'locales_present deve ter ao menos 1 locale'),
  primary_locale: SupportedLocaleSchema,
  volatility_class: VolatilityClassSchema,
  freshness_policy: FreshnessPolicySchema,
  scores: z.record(SupportedLocaleSchema, LocaleScoresSchema),
  brief_fingerprint: BriefFingerprintSchema,
  lifecycle: LifecycleSchema,
  promotion_state: PromotionStateSchema,
  promotion_lock: PromotionLockSchema.nullable(),
  invalidation_reason: z.string().nullable(),
  internal_links_resolved: z.boolean(),
})
export type StockpilePackage = z.infer<typeof StockpilePackageSchema>

// ---------------------------------------------------------------------------
// InvalidationEvent — linha do invalidation-log.jsonl
// ---------------------------------------------------------------------------

export const InvalidationEventSchema = z.object({
  event_id: z.string().uuid('event_id deve ser UUID v4'),
  event_type: z.enum([
    'invalidated',
    'quarantine',
    'refreshed',
    'promoted',
    'deleted',
  ]),
  equivalence_id: z.string().uuid(),
  timestamp: isoDatetimeSchema,
  reason: z.string().min(1),
  triggered_by: z.string().min(1),
  affected_locales: z.array(SupportedLocaleSchema),
})
export type InvalidationEvent = z.infer<typeof InvalidationEventSchema>

// ---------------------------------------------------------------------------
// StockpileIndex — index.json derivado (não é fonte de verdade)
// ---------------------------------------------------------------------------

export const StockpileIndexEntrySchema = z.object({
  equivalence_id: z.string().uuid(),
  type: StockpileTypeSchema,
  locales_present: z.array(SupportedLocaleSchema),
  promotion_state: PromotionStateSchema,
  volatility_class: VolatilityClassSchema,
  quality_gated_at: isoDatetimeSchema,
  freshness_checked_at: isoDatetimeSchema.nullable(),
})
export type StockpileIndexEntry = z.infer<typeof StockpileIndexEntrySchema>

export const StockpileIndexSchema = z.object({
  generated_at: isoDatetimeSchema,
  total_packages: z.number().int().min(0),
  by_state: z.record(PromotionStateSchema, z.number().int().min(0)),
  by_type: z.record(StockpileTypeSchema, z.number().int().min(0)),
  packages: z.array(StockpileIndexEntrySchema),
})
export type StockpileIndex = z.infer<typeof StockpileIndexSchema>

// ---------------------------------------------------------------------------
// stockpile_origin — campo opcional em frontmatter MDX de artigos promovidos
// ---------------------------------------------------------------------------

export const StockpileOriginSchema = z.object({
  equivalence_id: z.string().uuid(),
  quality_gated_at: isoDatetimeSchema,
  promoted_at: isoDatetimeSchema,
  volatility_class: VolatilityClassSchema,
})
export type StockpileOrigin = z.infer<typeof StockpileOriginSchema>
