/**
 * src/types/consent.types.ts
 * Tipos base do sistema de cookie consent — multi-framework.
 *
 * INT-056 — Cookie banner diferenciado por compliance (LGPD/GDPR/CAN-SPAM)
 * module-11-cookie-compliance TASK-0/ST002
 */

/**
 * Supported legal compliance frameworks.
 *
 * - LGPD:     Brazil — Lei 13.709/2018 — accept/reject, explicit opt-in
 * - GDPR:     EU — GDPR Art. 7 — granular per-category consent, revocable
 * - CAN-SPAM: US — informational banner only, dismiss sufficient
 */
export type ComplianceFramework = 'LGPD' | 'GDPR' | 'CAN-SPAM'

/**
 * User consent decision outcome.
 * - `null`      — no decision taken yet (banner visible)
 * - `accepted`  — all categories accepted
 * - `rejected`  — all categories rejected
 * - `partial`   — GDPR only: some categories accepted, some rejected
 */
export type ConsentDecision = 'accepted' | 'rejected' | 'partial' | null

/**
 * A single cookie/tracking category the user can toggle.
 * Used primarily by the GDPR variant to render the preferences modal.
 */
export interface ConsentCategory {
  /** Unique identifier (e.g. "analytics", "marketing") */
  id: string
  /** Human-readable label shown in the preferences UI */
  label: string
  /** Explanation of what this category covers */
  description: string
  /** Whether this category is mandatory and cannot be toggled off */
  required: boolean
  /** Initial toggle state when no prior consent exists */
  defaultValue: boolean
}

/**
 * Persisted consent state stored in localStorage.
 * Storage key: `cookie-consent-{locale}` (isolated per market/build).
 */
export interface ConsentState {
  /** Aggregate decision outcome */
  decision: ConsentDecision
  /** Per-category consent flags */
  categories: { essential: boolean; analytics: boolean; marketing: boolean }
  /** Unix timestamp (ms) when consent was recorded — used for expiry (395 days) */
  timestamp: number | null
  /** Framework active when consent was given */
  framework: ComplianceFramework
  /** Schema version — used for migration/invalidation of stale consent */
  version: string
}

/**
 * UI text strings for the cookie banner.
 * All text must be supplied by the consumer to support any locale.
 */
export interface CookieBannerMessages {
  /** Banner title */
  title: string
  /** Banner description paragraph */
  description: string
  /** "Accept all" button label (LGPD / GDPR) */
  acceptAll: string
  /** "Reject" button label (LGPD / GDPR) — omitted for CAN-SPAM */
  reject?: string
  /** "Manage preferences" button label (GDPR only) */
  managePreferences?: string
  /** "Got it" dismiss label (CAN-SPAM) */
  gotIt?: string
  /** Privacy policy link text */
  privacyLink: string
  /** Legal reference shown below description (e.g. "Lei 13.709/2018 — LGPD") */
  legalReference?: string
}
