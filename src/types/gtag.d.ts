/**
 * src/types/gtag.d.ts
 * Declaração de tipo para window.gtag (Google Analytics 4).
 *
 * INT-012 — Tipagem para trackEvent() em analytics.ts.
 * module-9-seo-sitemaps TASK-4/ST008
 */

interface Window {
  // gtag is optional - may not exist before GA4 script loads (test and SSR scenarios)
  gtag?: (
    command: 'event' | 'config' | 'set' | 'js',
    target: string | Date,
    params?: Record<string, string | number | boolean | undefined>,
  ) => void
}

declare function gtag(
  command: 'event' | 'config' | 'set' | 'js',
  target: string | Date,
  params?: Record<string, string | number | boolean | undefined>,
): void
