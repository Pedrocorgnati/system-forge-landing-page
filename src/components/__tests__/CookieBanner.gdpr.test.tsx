// @vitest-environment jsdom
/**
 * CookieBanner — GDPR variant tests
 *
 * INT-056 — Cookie banner diferenciado por compliance
 * module-11-cookie-compliance TASK-2/ST005
 *
 * Scenarios:
 * 1. Banner with 3 buttons: "Accetta tutti", "Rifiuta", "Gestisci preferenze"
 * 2. Modal opens on "Gestisci preferenze" click
 * 3. Modal closes on X button without saving
 * 4. Modal closes on Escape without saving
 * 5. GDPR legal reference visible
 * 6. "Accetta tutti" calls acceptAll
 * 7. "Rifiuta" calls rejectAll
 * 8. savePreferences called when modal saves
 * 9. Cookie necessari toggle is disabled in modal
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
    compliance: 'GDPR',
    routes: { privacy: '/privacy' },
    ga4MeasurementId: undefined,
  }),
}))

vi.mock('@config/content', () => ({
  loadMessages: () => ({
    cookie: {
      title: 'Informativa sui Cookie',
      description: 'Utilizziamo i cookie per migliorare la tua esperienza.',
      privacyLink: 'Informativa sulla Privacy',
      acceptAll: 'Accetta tutti',
      reject: 'Rifiuta',
      managePreferences: 'Gestisci preferenze',
      legalReference: 'GDPR Art. 7',
    },
    cookieModal: {
      title: 'Impostazioni Cookie',
      subtitle: 'Gestisci le tue preferenze sui cookie.',
      close: 'Chiudi',
      necessary: { label: 'Cookie necessari', description: 'Essenziali.', badge: 'Sempre attivi' },
      analytics: { label: 'Cookie analytics', description: 'Analisi traffico.' },
      marketing: { label: 'Cookie marketing', description: 'Annunci pertinenti.' },
      save: 'Salva preferenze',
    },
  }),
}))

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

function modalClosedState() {
  return {
    hasConsented: false,
    consent: {
      decision: null as null,
      categories: { analytics: false, marketing: false },
      timestamp: null,
      framework: 'GDPR' as const,
    },
    isModalOpen: false,
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
    acceptAll: mockAcceptAll,
    rejectAll: mockRejectAll,
    savePreferences: mockSavePreferences,
  }
}

function modalOpenState() {
  return { ...modalClosedState(), isModalOpen: true }
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

import { CookieBanner } from '@/components/ui/CookieBanner'

describe('CookieBanner — GDPR (IT)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 3 buttons: accept, reject, manage', () => {
    mockUseCookieConsent.mockReturnValue(modalClosedState())
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-banner-accept-button')).toHaveTextContent('Accetta tutti')
    expect(screen.getByTestId('cookie-banner-reject-button')).toHaveTextContent('Rifiuta')
    expect(screen.getByTestId('cookie-banner-manage-button')).toHaveTextContent('Gestisci preferenze')
  })

  it('calls openModal when "Gestisci preferenze" is clicked', () => {
    mockUseCookieConsent.mockReturnValue(modalClosedState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-banner-manage-button'))
    expect(mockOpenModal).toHaveBeenCalledOnce()
  })

  it('calls acceptAll when "Accetta tutti" is clicked', () => {
    mockUseCookieConsent.mockReturnValue(modalClosedState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-banner-accept-button'))
    expect(mockAcceptAll).toHaveBeenCalledOnce()
  })

  it('calls rejectAll when "Rifiuta" is clicked', () => {
    mockUseCookieConsent.mockReturnValue(modalClosedState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-banner-reject-button'))
    expect(mockRejectAll).toHaveBeenCalledOnce()
  })

  it('shows the GDPR legal reference', () => {
    mockUseCookieConsent.mockReturnValue(modalClosedState())
    render(<CookieBanner />)
    expect(screen.getByText('GDPR Art. 7')).toBeInTheDocument()
  })

  // --- Modal tests ---

  it('renders the modal when isModalOpen is true', () => {
    mockUseCookieConsent.mockReturnValue(modalOpenState())
    render(<CookieBanner />)
    expect(screen.getByTestId('cookie-modal')).toBeInTheDocument()
  })

  it('does not render the modal when isModalOpen is false', () => {
    mockUseCookieConsent.mockReturnValue(modalClosedState())
    render(<CookieBanner />)
    expect(screen.queryByTestId('cookie-modal')).not.toBeInTheDocument()
  })

  it('calls closeModal when modal X button is clicked (without saving)', () => {
    mockUseCookieConsent.mockReturnValue(modalOpenState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-modal-close-button'))
    expect(mockCloseModal).toHaveBeenCalledOnce()
    expect(mockSavePreferences).not.toHaveBeenCalled()
  })

  it('calls closeModal when Escape is pressed (without saving)', () => {
    mockUseCookieConsent.mockReturnValue(modalOpenState())
    render(<CookieBanner />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockCloseModal).toHaveBeenCalledOnce()
    expect(mockSavePreferences).not.toHaveBeenCalled()
  })

  it('calls savePreferences when "Salva preferenze" is clicked', () => {
    mockUseCookieConsent.mockReturnValue(modalOpenState())
    render(<CookieBanner />)
    fireEvent.click(screen.getByTestId('cookie-modal-save-button'))
    expect(mockSavePreferences).toHaveBeenCalledOnce()
    expect(mockSavePreferences).toHaveBeenCalledWith({ analytics: false, marketing: false })
  })

  it('the "Cookie necessari" toggle is disabled and cannot be toggled', () => {
    mockUseCookieConsent.mockReturnValue(modalOpenState())
    render(<CookieBanner />)
    const necessarySection = screen.getByTestId('cookie-modal-necessary')
    const toggle = necessarySection.querySelector('[role="switch"]') as HTMLButtonElement
    expect(toggle).toBeDisabled()
  })

  it('modal has role="dialog" and aria-modal="true"', () => {
    mockUseCookieConsent.mockReturnValue(modalOpenState())
    render(<CookieBanner />)
    const modal = screen.getByTestId('cookie-modal')
    expect(modal).toHaveAttribute('role', 'dialog')
    expect(modal).toHaveAttribute('aria-modal', 'true')
  })

  it('traps focus within modal on Tab press (focus does not escape)', () => {
    mockUseCookieConsent.mockReturnValue(modalOpenState())
    render(<CookieBanner />)
    const modal = screen.getByTestId('cookie-modal')
    const focusable = modal.querySelectorAll<HTMLElement>('button:not([disabled])')
    expect(focusable.length).toBeGreaterThanOrEqual(2)
    // Focus last focusable, press Tab → should wrap to first
    const last = focusable[focusable.length - 1]
    last.focus()
    fireEvent.keyDown(modal, { key: 'Tab', shiftKey: false })
    // After tab, focus should be on the first element (wrapped)
    expect(document.activeElement).toBe(focusable[0])
  })
})
