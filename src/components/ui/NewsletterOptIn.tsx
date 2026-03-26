'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

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

type FormStatus = 'idle' | 'submitting' | 'success'

export function NewsletterOptIn() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [emailError, setEmailError] = useState('')
  const [consentError, setConsentError] = useState('')
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
      setEmailError('Por favor, insira um email válido')
      valid = false
    } else {
      setEmailError('')
    }

    if (!formData.consent) {
      setConsentError('Você precisa aceitar a Política de Privacidade para continuar')
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

    const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL

    if (!apiUrl) {
      setStatus('idle')
      toast.error('Erro ao se inscrever. Tente novamente.')
      return
    }

    // AbortController com timeout de 10 segundos
    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          consent: formData.consent,
          website: formData.website,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as NewsletterApiResponse
        throw new Error(json.error ?? `HTTP ${response.status}`)
      }

      setStatus('success')
    } catch (err) {
      setStatus('idle')
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('A requisição excedeu o tempo limite. Verifique sua conexão.')
      } else {
        toast.error('Erro ao se inscrever. Tente novamente.')
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  if (status === 'success') {
    return (
      <section aria-live="polite" className="my-6">
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
            Verifique seu email para confirmar sua inscrição!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="my-6 max-w-md">
      <h3 className="text-base font-semibold text-foreground mb-3">
        Receba artigos sobre engenharia de software
      </h3>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        {/* Campo de email */}
        <div>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={status === 'submitting'}
            placeholder="seu@email.com"
            aria-label="Seu email"
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

        {/* Checkbox LGPD */}
        <div>
          <label
            htmlFor="newsletter-consent"
            className="flex items-start gap-2 cursor-pointer"
          >
            <input
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
              Aceito receber comunicações da SystemForge e a{' '}
              <a
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Política de Privacidade
              </a>
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

        {/* Honeypot — invisível para humanos, armadilha para bots */}
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

        {/* Botão de submit */}
        <Button
          type="submit"
          loading={status === 'submitting'}
          disabled={status === 'submitting'}
          className="w-full sm:w-auto"
        >
          {status === 'submitting' ? 'Enviando...' : 'Inscrever-se'}
        </Button>
      </form>
    </section>
  )
}
