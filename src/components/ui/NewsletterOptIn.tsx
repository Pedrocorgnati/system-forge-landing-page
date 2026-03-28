'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { getSiteConfig } from '@config'
import { loadMessages, interpolate } from '@config/content'

// Local interfaces — NOT exported to lib/types.ts (ARCH-001: types.ts FROZEN after module-2/TASK-1)
interface NewsletterFormData {
  email: string
  consent: boolean
  website: string // honeypot
}

interface NewsletterApiResponse {
  success: boolean
  message: string
  error?: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'pending-confirmation' | 'error'

const config = getSiteConfig()
const msg = loadMessages().newsletter
const requiresCheckbox = config.compliance === 'LGPD' || config.compliance === 'GDPR'
const isGDPR = config.compliance === 'GDPR'
const privacyHref = config.routes.privacy

/** Builds the privacy link element used inside consent text */
function PrivacyLink() {
  return (
    <a
      href={privacyHref}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {msg.privacyLinkText}
    </a>
  )
}

/**
 * Renders consent text that may contain a {privacyLink} placeholder.
 * Splits on the placeholder and inserts an <a> element.
 */
function ConsentText({ template }: { template: string }) {
  if (!template) return null
  const parts = template.split('{privacyLink}')
  if (parts.length === 1) return <>{template}</>
  return (
    <>
      {parts[0]}
      <PrivacyLink />
      {parts[1]}
    </>
  )
}

export function NewsletterOptIn() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [consentError, setConsentError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState<NewsletterFormData>({
    email: '',
    consent: false,
    website: '',
  })
  const abortRef = useRef<AbortController | null>(null)

  function validateForm(): boolean {
    let valid = true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(formData.email)) {
      setEmailError(msg.emailInvalid)
      valid = false
    } else {
      setEmailError('')
    }

    if (requiresCheckbox && !formData.consent) {
      setConsentError(msg.consentRequired)
      valid = false
    } else {
      setConsentError('')
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateForm()) return

    // Honeypot check — silently succeed if bot filled the hidden field (client-side)
    if (formData.website.trim() !== '') {
      setStatus('success')
      return
    }

    setStatus('submitting')

    const workerUrl = config.newsletter?.workerUrl

    if (!workerUrl) {
      setErrorMessage(msg.error)
      setStatus('error')
      return
    }

    const subscribeUrl = workerUrl.endsWith('/subscribe')
      ? workerUrl
      : `${workerUrl.replace(/\/$/, '')}/subscribe`

    // AbortController com timeout de 10 segundos
    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(subscribeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          consent: requiresCheckbox ? formData.consent : true,
          website: formData.website,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as NewsletterApiResponse
        setErrorMessage(json.error ?? msg.error)
        setStatus('error')
        return
      }

      // GDPR: show pending-confirmation state (double opt-in — Worker retorna 202)
      if (isGDPR || response.status === 202) {
        setSubmittedEmail(formData.email)
        setStatus('pending-confirmation')
      } else {
        setStatus('success')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMessage(msg.timeoutError ?? msg.error)
      } else {
        setErrorMessage(msg.error)
      }
      setStatus('error')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // GDPR pending-confirmation state
  if (status === 'pending-confirmation') {
    return (
      <section data-testid="newsletter-pending" aria-live="polite" className="my-6">
        <div className="flex items-center gap-2">
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning/20"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-3.5 h-3.5 text-warning"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <p role="status" className="text-sm font-medium text-foreground">
            {interpolate(msg.pendingConfirmation, { email: submittedEmail })}
          </p>
        </div>
      </section>
    )
  }

  // Error state — mensagem inline + botão retry
  if (status === 'error') {
    return (
      <section data-testid="newsletter-error" aria-live="assertive" className="my-6">
        <div className="flex items-start gap-2">
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/20"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-3.5 h-3.5 text-destructive"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <div className="flex flex-col gap-2">
            <p role="alert" className="text-sm font-medium text-destructive">
              {errorMessage || msg.error}
            </p>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setErrorMessage('') }}
              className="text-xs text-primary hover:underline text-left w-fit"
            >
              {msg.retryButton ?? 'Tentar novamente'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (status === 'success') {
    return (
      <section data-testid="newsletter-success" aria-live="polite" className="my-6">
        <div className="flex items-center gap-2">
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/20"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-3.5 h-3.5 text-success"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <p role="status" className="text-sm font-medium text-foreground">
            {msg.success}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section data-testid="newsletter-section" className="my-6 max-w-md">
      <h3 className="text-base font-semibold text-foreground mb-3">
        {msg.heading}
      </h3>
      <form data-testid="newsletter-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        {/* Campo de email */}
        <div>
          <input
            data-testid="newsletter-email-input"
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={status === 'submitting'}
            placeholder={msg.placeholder}
            aria-label={msg.ariaLabel}
            aria-invalid={emailError ? 'true' : 'false'}
            aria-describedby={emailError ? 'newsletter-email-error' : undefined}
            className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          />
          {emailError && (
            <span
              id="newsletter-email-error"
              role="alert"
              className="text-destructive text-xs mt-1 block"
            >
              {emailError}
            </span>
          )}
        </div>

        {/* Checkbox — LGPD/GDPR only */}
        {requiresCheckbox && (
          <div>
            <label
              htmlFor="newsletter-consent"
              className="flex items-start gap-2 cursor-pointer"
            >
              <input
                data-testid="newsletter-consent-checkbox"
                type="checkbox"
                id="newsletter-consent"
                name="consent"
                required
                checked={formData.consent}
                onChange={e =>
                  setFormData(prev => ({ ...prev, consent: e.target.checked }))
                }
                disabled={status === 'submitting'}
                aria-describedby={consentError ? 'newsletter-consent-error' : undefined}
                className="mt-0.5 h-4 w-4 accent-primary flex-shrink-0 disabled:opacity-50"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                <ConsentText template={msg.consentLabel} />
              </span>
            </label>
            {consentError && (
              <span
                id="newsletter-consent-error"
                role="alert"
                className="text-destructive text-xs mt-1 block"
              >
                {consentError}
              </span>
            )}
          </div>
        )}

        {/* Informational text — CAN-SPAM only (no checkbox) */}
        {!requiresCheckbox && msg.consentInfo && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            <ConsentText template={msg.consentInfo} />
          </p>
        )}

        {/* Honeypot — invisivel para humanos, armadilha para bots */}
        <input
          type="text"
          name="website"
          value={formData.website}
          onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
        />

        {/* Botao de submit */}
        <Button
          data-testid="newsletter-submit-button"
          type="submit"
          loading={status === 'submitting'}
          disabled={status === 'submitting'}
          className="w-full sm:w-auto"
        >
          {status === 'submitting' ? msg.loading : msg.submit}
        </Button>
      </form>
    </section>
  )
}
