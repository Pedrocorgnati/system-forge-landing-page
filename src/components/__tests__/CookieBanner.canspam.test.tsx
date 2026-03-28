// @vitest-environment jsdom
/**
 * CookieBanner — CAN-SPAM variant tests
 *
 * INT-056 — Cookie banner diferenciado por compliance
 * module-11-cookie-compliance TASK-3/ST003
 *
 * Scenarios:
 * 1. Banner shows only "Got it" (no reject, no manage)
 * 2. "Got it" calls acceptAll and hides banner
 * 3. Banner hidden after dismiss (hasConsented = true)
 * 4. Privacy link present
 * 5. No GDPR/LGPD buttons rendered
 * 6. aria-label "Cookie notice" present
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
    compliance: 'CAN-SPAM',
    routes: { privacy: '/privacy' },
    ga4MeasurementId: undefined,
  }),
}))

vi.mock('@config/content', () => ({
  loadMessages: () => ({
    cookie: {
      title: 'Cookie Notice',
      description: 'We use cookies to improve your browsing experience.',
      privacyLink: 'Privacy Policy',
      acceptAll: 'Got it',
      reject: '',
      gotIt: 'Got it',
      legalReference: '',
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
      framework: 'CAN-SPAM' as const,
    },
    isModalOpen: false,
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
    acceptAll: mockAcceptAll,
    rejectAll: mockRejectAll,
    savePreferences: mockSavePreferences,
  }
}

function dismissedState() {
  return {
    ...noConsentState(),
    hasConsented: true,
    consent: {
      decision: 'accepted' as const,
      categories: { analytics: true, marketing: true },
      timestamp: Date.now(),
      framework: 'CAN-SPAM' as const,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

import { CookieBanner } from '@/components/ui/CookieBanner'

describe('CookieBanner — CAN-SPAM (EN)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the banner on first visit', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument()
  })

  it('shows only the "Got it" button (no reject or manage)', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-banner-accept-button')).toHaveTextContent('Got it')
    expect(screen.queryByTestId('cookie-banner-reject-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cookie-banner-manage-button')).not.toBeInTheDocument()
  })

  it('calls acceptAll when "Got it" is clicked', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-banner-accept-button'))
    expect(mockAcceptAll).toHaveBeenCalledOnce()
  })

  it('hides the banner after dismiss (anti-flash)', () => {
    mockUseCookieConsent.mockReturnValue(dismissedState())
    const { container } = render(<CookieBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the privacy policy link', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('does NOT render the GDPR modal', () => {
    mockUseCookieConsent.mockReturnValue(noConsentState())
    render(<CookieBanner />)
    expect(screen.queryByTestId('cookie-modal')).not.toBeInTheDocument()
  })
})
