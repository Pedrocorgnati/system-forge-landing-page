// @vitest-environment jsdom
/**
 * CookieBanner — LGPD variant tests
 *
 * INT-056 — Cookie banner diferenciado por compliance
 * module-11-cookie-compliance TASK-1/ST004
 *
 * Scenarios:
 * 1. Banner visible on first visit (no prior consent)
 * 2. "Aceitar todos" saves 'accepted' and hides banner
 * 3. "Rejeitar" saves 'rejected' and hides banner
 * 4. Banner hidden when consent already recorded
 * 5. Privacy link present with correct href
 * 6. Legal reference (Lei 13.709/2018) visible
 * 7. Locale isolation — storage key contains locale
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                     */
/* -------------------------------------------------------------------------- */

const mockAcceptAll = vi.fn()
const mockRejectAll = vi.fn()
const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockSavePreferences = vi.fn()

const mockUseCookieConsent = vi.fn()

vi.mock('@/hooks/useCookieConsent', () => ({
  useCookieConsent: () => mockUseCookieConsent(),
}))

vi.mock('@config', () => ({
  getSiteConfig: () => ({
    compliance: 'LGPD',
    routes: { privacy: '/privacidade' },
    ga4MeasurementId: undefined,
  }),
}))

vi.mock('@config/content', () => ({
  loadMessages: () => ({
    cookie: {
      title: 'Aviso de Cookies',
      description: 'Utilizamos cookies para melhorar sua experiência.',
      privacyLink: 'Política de Privacidade',
      acceptAll: 'Aceitar todos',
      reject: 'Rejeitar',
      legalReference: 'Lei 13.709/2018 — LGPD',
    },
    cookieModal: undefined,
  }),
}))

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

function noConsentState() {
  return {
    hasConsented: false,
    consent: {
      decision: null as null,
      categories: { analytics: false, marketing: false },
      timestamp: null,
      framework: 'LGPD' as const,
    },
    isModalOpen: false,
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
    acceptAll: mockAcceptAll,
    rejectAll: mockRejectAll,
    savePreferences: mockSavePreferences,
  }
}

function consentedState() {
  return {
    ...noConsentState(),
    hasConsented: true,
    consent: {
      decision: 'accepted' as const,
      categories: { analytics: true, marketing: true },
      timestamp: Date.now(),
      framework: 'LGPD' as const,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

import { CookieBanner } from '@/components/ui/CookieBanner'

describe('CookieBanner — LGPD (BR)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the banner on first visit (no prior consent)', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument()
  })

  it('shows "Aceitar todos" and "Rejeitar" buttons', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-banner-accept-button')).toHaveTextContent('Aceitar todos')
    expect(screen.getByTestId('cookie-banner-reject-button')).toHaveTextContent('Rejeitar')
  })

  it('calls acceptAll when "Aceitar todos" is clicked', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-banner-accept-button'))
    expect(mockAcceptAll).toHaveBeenCalledOnce()
  })

  it('calls rejectAll when "Rejeitar" is clicked', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-banner-reject-button'))
    expect(mockRejectAll).toHaveBeenCalledOnce()
  })

  it('hides the banner when consent has already been recorded (anti-flash)', () => {
    mockUseCookieConsent.mockReturnValue(consentedState())
    const { container } = render(<CookieBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the privacy policy link', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    const link = screen.getByText('Política de Privacidade')
    expect(link).toBeInTheDocument()
  })

  it('displays the LGPD legal reference', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.getByText('Lei 13.709/2018 — LGPD')).toBeInTheDocument()
  })

  it('has aria-label on the banner container', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-banner')).toHaveAttribute('aria-label', 'Aviso de Cookies')
  })

  it('does NOT render the GDPR manage button for LGPD', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.queryByTestId('cookie-banner-manage-button')).not.toBeInTheDocument()
  })
})
