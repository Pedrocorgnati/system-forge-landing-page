/**
 * src/lib/tracking/ga4.ts — Wrapper GA4 minimal (task-009 conversion-machine-plan).
 *
 * Mantido em paralelo apenas para sinal de SEO/Search Console (Google Tag Manager
 * + Universal Analytics descontinuado em jul/2023 — Search Console ainda consome
 * GA4 measurement). Autoritativo para custom events de funil e produto e PostHog
 * (ver src/lib/tracking/posthog.ts).
 *
 * Escopo deste arquivo: APENAS pageview. NUNCA dispara custom events daqui —
 * `trackEvent` legado em src/lib/analytics.ts segue valido para retrocompat
 * (CTAButton.tsx), porem novos eventos canonicos de funil entram via PostHog.
 *
 * O loader real do GA4 vive em src/components/analytics/Analytics.tsx (script
 * injetado com consent gate). Este modulo expoe apenas a primitiva de pageview
 * para uso futuro (ex: navegacao programatica em SPA route changes).
 */

import { trackPageView } from '@/lib/analytics'

export function trackPageviewGA4(path: string): void {
  trackPageView(path)
}
