// @vitest-environment jsdom
/**
 * Analytics — GA4 consent gate tests
 *
 * INT-027 (COMP-005) — GA4 consent gate
 * module-11-cookie-compliance TASK-4/ST004
 *
 * Scenarios:
 * 1. document.createElement NOT called with 'script' when consent = null
 * 2. document.createElement NOT called when analytics = false
 * 3. document.createElement('script') called when analytics = true
 * 4. Script NOT injected when measurementId is missing
 * 5. GDPR partial: script loaded when analytics=true, marketing=false
 * 6. GDPR partial: script NOT loaded when analytics=false
 * 7. script.src contains the correct measurement ID
 * 8. Duplicate script guard — only one script injected per session
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import '@testing-library/jest-dom'

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                     */
/* -------------------------------------------------------------------------- */

const mockUseCookieConsent = vi.fn()

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => mockUseCookieConsent(),
}))

const mockGetSiteConfig = vi.fn()

vi.mock('@config', () => ({
  getSiteConfig: () => mockGetSiteConfig(),
}))

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

function makeConsentState(analytics: boolean, measurementId?: string) {
  mockGetSiteConfig.mockReturnValue({
    compliance: analytics ? 'LGPD' : 'LGPD',
    ga4MeasurementId: measurementId,
    routes: { privacy: '/privacidade' },
  })
  return {
    hasConsented: analytics,
    consent: {
      decision: analytics ? ('accepted' as const) : (null as null),
      categories: { analytics, marketing: false },
      timestamp: analytics ? Date.now() : null,
      framework: 'LGPD' as const,
    },
    isModalOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    acceptAll: vi.fn(),
    rejectAll: vi.fn(),
    savePreferences: vi.fn(),
  }
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

import { Analytics } from '@/components/analytics/Analytics'

describe('Analytics — GA4 consent gate', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Remove any previously injected gtag script
    document.getElementById('gtag-script')?.remove()
    // Spy on DOM methods
    createElementSpy = vi.spyOn(document, 'createElement')
    appendChildSpy = vi.spyOn(document.head, 'appendChild')
  })

  afterEach(() => {
    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    document.getElementById('gtag-script')?.remove()
  })

  it('does NOT create a script element when consent is null (first visit)', async () => {
    mockUseCookieConsent.mockReturnValue(makeConsentState(false, 'G-TEST123'))
    await act(async () => { render(<Analytics />) })
    expect(createElementSpy).not.toHaveBeenCalledWith('script')
  })

  it('does NOT inject the gtag script when analytics consent = false', async () => {
    mockUseCookieConsent.mockReturnValue(makeConsentState(false, 'G-TEST123'))
    await act(async () => { render(<Analytics />) })
    expect(document.getElementById('gtag-script')).toBeNull()
  })

  it('injects the gtag script when analytics consent = true', async () => {
    mockUseCookieConsent.mockReturnValue(makeConsentState(true, 'G-TEST123'))
    await act(async () => { render(<Analytics />) })
    expect(createElementSpy).toHaveBeenCalledWith('script')
  })

  it('sets the correct src on the injected script', async () => {
    mockUseCookieConsent.mockReturnValue(makeConsentState(true, 'G-TEST123'))
    await act(async () => { render(<Analytics />) })
    // Check that a script with the correct src was appended
    const appendedScript = (appendChildSpy.mock.calls as Node[][])
      .flatMap((call: Node[]) => call)
      .find((el: Node) => el instanceof HTMLScriptElement) as HTMLScriptElement | undefined
    expect(appendedScript?.src).toContain('G-TEST123')
  })

  it('does NOT inject the gtag script when measurementId is undefined', async () => {
    mockUseCookieConsent.mockReturnValue(makeConsentState(true, undefined))
    await act(async () => { render(<Analytics />) })
    expect(createElementSpy).not.toHaveBeenCalledWith('script')
  })

  it('does NOT inject the gtag script when measurementId is empty string', async () => {
    mockUseCookieConsent.mockReturnValue(makeConsentState(true, ''))
    await act(async () => { render(<Analytics />) })
    expect(createElementSpy).not.toHaveBeenCalledWith('script')
  })

  it('GDPR partial — loads when analytics=true, marketing=false', async () => {
    mockGetSiteConfig.mockReturnValue({
      compliance: 'GDPR',
      ga4MeasurementId: 'G-GDPR99',
      routes: { privacy: '/privacy' },
    })
    mockUseCookieConsent.mockReturnValue({
      hasConsented: true,
      consent: {
        decision: 'partial' as const,
        categories: { analytics: true, marketing: false },
        timestamp: Date.now(),
        framework: 'GDPR' as const,
      },
      isModalOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      acceptAll: vi.fn(),
      rejectAll: vi.fn(),
      savePreferences: vi.fn(),
    })
    await act(async () => { render(<Analytics />) })
    expect(createElementSpy).toHaveBeenCalledWith('script')
  })

  it('GDPR partial — does NOT load when analytics=false', async () => {
    mockGetSiteConfig.mockReturnValue({
      compliance: 'GDPR',
      ga4MeasurementId: 'G-GDPR99',
      routes: { privacy: '/privacy' },
    })
    mockUseCookieConsent.mockReturnValue({
      hasConsented: true,
      consent: {
        decision: 'partial' as const,
        categories: { analytics: false, marketing: true },
        timestamp: Date.now(),
        framework: 'GDPR' as const,
      },
      isModalOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      acceptAll: vi.fn(),
      rejectAll: vi.fn(),
      savePreferences: vi.fn(),
    })
    await act(async () => { render(<Analytics />) })
    expect(createElementSpy).not.toHaveBeenCalledWith('script')
  })
})
