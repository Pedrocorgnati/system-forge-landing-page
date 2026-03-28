// @vitest-environment jsdom
// Requires: npm i -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock getSiteConfig — locale-specific configs
const mockGetSiteConfig = vi.fn()
const mockLoadMessages = vi.fn()
const mockInterpolate = vi.fn((tpl: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((r, [k, v]) => r.replace(`{${k}}`, v), tpl),
)

vi.mock('@config', () => ({
  getSiteConfig: () => mockGetSiteConfig(),
}))

vi.mock('@config/content', () => ({
  loadMessages: () => mockLoadMessages(),
  interpolate: (tpl: string, vars: Record<string, string>) => mockInterpolate(tpl, vars),
}))

// Shared message fixtures
const MSG_BR = {
  heading: 'Receba artigos sobre engenharia de software',
  submit: 'Inscrever-se',
  loading: 'Aguarde...',
  success: 'Obrigado! Em breve você receberá nossos conteúdos.',
  pendingConfirmation: '',
  error: 'Algo deu errado. Tente novamente.',
  retry: 'Tentar novamente',
  placeholder: 'seu@email.com',
  ariaLabel: 'Seu email',
  emailInvalid: 'Por favor, insira um email válido',
  consentRequired: 'Você precisa aceitar a Política de Privacidade para continuar',
  consentLabel: 'Concordo com a {privacyLink} e com o uso dos meus dados para a newsletter.',
  consentInfo: '',
  privacyLinkText: 'Política de Privacidade',
  timeoutError: 'A requisição excedeu o tempo limite. Verifique sua conexão.',
  retryButton: 'Tentar novamente',
}

const MSG_IT = {
  ...MSG_BR,
  heading: 'Ricevi articoli su ingegneria del software',
  submit: 'Iscriviti',
  loading: 'Attendere...',
  success: 'Grazie! La tua iscrizione è stata confermata.',
  pendingConfirmation: "Abbiamo inviato un'email di conferma a {email}. Clicca sul link per completare l'iscrizione.",
  error: 'Qualcosa è andato storto. Riprova.',
  consentRequired: "Devi accettare l'informativa sulla privacy per continuare",
  consentLabel: 'Acconsento al trattamento dei dati personali (GDPR Art. 6). {privacyLink}',
  privacyLinkText: 'Informativa sulla Privacy',
  retryButton: 'Riprova',
}

const MSG_EN = {
  ...MSG_BR,
  heading: 'Get articles on software engineering',
  submit: 'Subscribe',
  loading: 'Please wait...',
  success: 'Thank you! Check your email for a welcome message.',
  error: 'Something went wrong. Please try again.',
  consentRequired: '',
  consentLabel: '',
  consentInfo: 'By subscribing, you agree to our {privacyLink}. Unsubscribe anytime.',
  privacyLinkText: 'Privacy Policy',
  retryButton: 'Try again',
}

function makeConfig(overrides: Partial<{
  compliance: string
  workerUrl: string
  privacy: string
}> = {}) {
  return {
    compliance: overrides.compliance ?? 'LGPD',
    newsletter: { workerUrl: overrides.workerUrl ?? 'https://worker-br.example.com' },
    routes: { privacy: overrides.privacy ?? '/privacidade' },
  }
}

// Dynamic import so mocks are resolved before module-level code runs
async function renderComponent() {
  // Clear module cache to re-evaluate module-level getSiteConfig()/loadMessages()
  vi.resetModules()
  const mod = await import('../NewsletterOptIn')
  return render(<mod.NewsletterOptIn />)
}

describe('NewsletterOptIn', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    mockGetSiteConfig.mockReturnValue(makeConfig())
    mockLoadMessages.mockReturnValue({ newsletter: MSG_BR })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- TC1: Render per locale ---

  describe('TC1: Render by locale', () => {
    it('BR (LGPD) — shows consent checkbox', async () => {
      mockGetSiteConfig.mockReturnValue(makeConfig({ compliance: 'LGPD' }))
      mockLoadMessages.mockReturnValue({ newsletter: MSG_BR })
      await renderComponent()

      expect(screen.getByTestId('newsletter-consent-checkbox')).toBeInTheDocument()
      expect(screen.getByText(/Política de Privacidade/)).toBeInTheDocument()
    })

    it('IT (GDPR) — shows consent checkbox', async () => {
      mockGetSiteConfig.mockReturnValue(makeConfig({ compliance: 'GDPR' }))
      mockLoadMessages.mockReturnValue({ newsletter: MSG_IT })
      await renderComponent()

      expect(screen.getByTestId('newsletter-consent-checkbox')).toBeInTheDocument()
      expect(screen.getByText(/Informativa sulla Privacy/)).toBeInTheDocument()
    })

    it('EN (CAN-SPAM) — shows informational text, no checkbox', async () => {
      mockGetSiteConfig.mockReturnValue(makeConfig({ compliance: 'CAN-SPAM' }))
      mockLoadMessages.mockReturnValue({ newsletter: MSG_EN })
      await renderComponent()

      expect(screen.queryByTestId('newsletter-consent-checkbox')).not.toBeInTheDocument()
      expect(screen.getByText(/Privacy Policy/)).toBeInTheDocument()
    })
  })

  // --- TC2: Submit valid BR → success ---

  it('TC2: Submit valid BR → loading → success (201)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.com')
    await user.click(screen.getByTestId('newsletter-consent-checkbox'))
    await user.click(screen.getByTestId('newsletter-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-success')).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  // --- TC3: Submit valid IT → pending-confirmation (202) ---

  it('TC3: Submit valid IT → loading → pending-confirmation (202)', async () => {
    mockGetSiteConfig.mockReturnValue(makeConfig({ compliance: 'GDPR' }))
    mockLoadMessages.mockReturnValue({ newsletter: MSG_IT })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.it')
    await user.click(screen.getByTestId('newsletter-consent-checkbox'))
    await user.click(screen.getByTestId('newsletter-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-pending')).toBeInTheDocument()
    })
  })

  // --- TC4: Submit without consent BR/IT → validation blocks ---

  it('TC4: Submit without consent BR → validation prevents submit', async () => {
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.com')
    // Do NOT check consent checkbox
    await user.click(screen.getByTestId('newsletter-submit-button'))

    expect(screen.getByText(MSG_BR.consentRequired)).toBeInTheDocument()
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  // --- TC5: Worker returns 400 → error state ---

  it('TC5: Worker returns 400 → error with message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Email already subscribed' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.com')
    await user.click(screen.getByTestId('newsletter-consent-checkbox'))
    await user.click(screen.getByTestId('newsletter-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-error')).toBeInTheDocument()
      expect(screen.getByText('Email already subscribed')).toBeInTheDocument()
    })
  })

  // --- TC6: Worker returns 503 → error with retry ---

  it('TC6: Worker returns 503 → error with retry button', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.com')
    await user.click(screen.getByTestId('newsletter-consent-checkbox'))
    await user.click(screen.getByTestId('newsletter-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-error')).toBeInTheDocument()
      expect(screen.getByText(MSG_BR.retryButton)).toBeInTheDocument()
    })
  })

  // --- TC7: Double-submit blocked during loading ---

  it('TC7: Double-submit blocked in submitting state', async () => {
    let resolveFirst!: (v: Response) => void
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => { resolveFirst = resolve }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.com')
    await user.click(screen.getByTestId('newsletter-consent-checkbox'))
    await user.click(screen.getByTestId('newsletter-submit-button'))

    // Button should be disabled during submitting
    expect(screen.getByTestId('newsletter-submit-button')).toBeDisabled()

    // Resolve to clean up
    resolveFirst(new Response(JSON.stringify({}), { status: 201 }))
  })

  // --- TC8: Retry button resets to idle ---

  it('TC8: Retry button resets form to idle state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.com')
    await user.click(screen.getByTestId('newsletter-consent-checkbox'))
    await user.click(screen.getByTestId('newsletter-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-error')).toBeInTheDocument()
    })

    await user.click(screen.getByText(MSG_BR.retryButton))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-form')).toBeInTheDocument()
      expect(screen.queryByTestId('newsletter-error')).not.toBeInTheDocument()
    })
  })

  // --- TC9: Honeypot filled → silently succeed ---

  it('TC9: Honeypot filled → silently shows success without fetch', async () => {
    await renderComponent()

    await user.type(screen.getByTestId('newsletter-email-input'), 'test@email.com')
    await user.click(screen.getByTestId('newsletter-consent-checkbox'))

    // Fill the honeypot (hidden website field)
    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement
    await user.type(honeypot, 'spam-bot-value')

    await user.click(screen.getByTestId('newsletter-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-success')).toBeInTheDocument()
    })
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })
})
