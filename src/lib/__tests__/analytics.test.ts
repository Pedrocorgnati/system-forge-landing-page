/**
 * src/lib/__tests__/analytics.test.ts
 * Testes unitarios para src/lib/analytics.ts
 *
 * GAP-003 — analytics.ts sem testes unitarios (US-015c)
 * module-9-seo-sitemaps TASK-5/ST002
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSiteConfig = vi.fn()

vi.mock('@config', () => ({
  getSiteConfig: () => mockGetSiteConfig(),
}))

// ---------------------------------------------------------------------------
// Import (after mocks)
// ---------------------------------------------------------------------------

import { trackEvent, trackPageView } from '../analytics'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('trackEvent()', () => {
  const originalWindow = globalThis.window

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore window
    if (originalWindow === undefined) {
      // @ts-expect-error — simulate SSR
      delete globalThis.window
    }
  })

  it('is a no-op in SSR (typeof window === undefined)', () => {
    const savedWindow = globalThis.window
    // @ts-expect-error — simulate SSR
    delete globalThis.window

    // Should not throw
    expect(() => trackEvent('test_event')).not.toThrow()
    // getSiteConfig should NOT be called (early return)
    expect(mockGetSiteConfig).not.toHaveBeenCalled()

    // Restore
    globalThis.window = savedWindow
  })

  it('is a no-op when ga4MeasurementId is empty', () => {
    mockGetSiteConfig.mockReturnValue({
      ga4MeasurementId: '',
    })

    // Ensure window exists
    if (typeof globalThis.window === 'undefined') {
      // @ts-expect-error — simulate browser
      globalThis.window = {}
    }

    expect(() => trackEvent('test_event')).not.toThrow()
  })

  it('is a no-op when ga4MeasurementId is undefined', () => {
    mockGetSiteConfig.mockReturnValue({
      ga4MeasurementId: undefined,
    })

    if (typeof globalThis.window === 'undefined') {
      // @ts-expect-error — simulate browser
      globalThis.window = {}
    }

    expect(() => trackEvent('test_event')).not.toThrow()
  })

  it('is a no-op when window.gtag is not a function', () => {
    mockGetSiteConfig.mockReturnValue({
      ga4MeasurementId: 'G-TEST123',
    })

    if (typeof globalThis.window === 'undefined') {
      // @ts-expect-error — simulate browser
      globalThis.window = {}
    }
    // gtag not defined on window (gtag is optional, so naturally undefined)

    expect(() => trackEvent('test_event')).not.toThrow()
  })

  it('calls window.gtag with correct params when GA4 is configured', () => {
    const mockGtag = vi.fn()
    mockGetSiteConfig.mockReturnValue({
      ga4MeasurementId: 'G-TEST123',
    })

    if (typeof globalThis.window === 'undefined') {
      // @ts-expect-error — simulate browser
      globalThis.window = {}
    }
    // gtag is now typed as optional, so assignment is straightforward
    globalThis.window.gtag = mockGtag

    trackEvent('cta_click', { label: 'whatsapp' })

    expect(mockGtag).toHaveBeenCalledWith('event', 'cta_click', {
      send_to: 'G-TEST123',
      label: 'whatsapp',
    })
  })
})

describe('trackPageView()', () => {
  it('delegates to trackEvent with page_view event', () => {
    mockGetSiteConfig.mockReturnValue({
      ga4MeasurementId: 'G-TEST123',
    })

    const mockGtag = vi.fn()
    if (typeof globalThis.window === 'undefined') {
      // @ts-expect-error — simulate browser
      globalThis.window = {}
    }
    // gtag is now typed as optional, so assignment is straightforward
    globalThis.window.gtag = mockGtag

    trackPageView('/servicos')

    expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
      send_to: 'G-TEST123',
      page_path: '/servicos',
    })
  })
})
