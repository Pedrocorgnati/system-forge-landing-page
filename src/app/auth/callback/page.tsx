'use client'

/**
 * Callback OIDC (multibackend Modelo B). O IdP central redireciona de volta a
 * https://{dominio}/auth/callback?code=...; aqui o oidc-client-ts troca o code
 * por tokens (PKCE S256) e estabelece a sessao client-side, depois leva o usuario
 * ao dashboard central. 4 estados renderizaveis (Zero Estados Indefinidos) + regra
 * anti-cascade para o CTA "Voltar" (R-22). Static-export-safe: tudo client-side.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSiteConfig } from '@config'
import { getUserManager } from '@/lib/auth/oidc-user-manager'

type CbState = 'loading' | 'success' | 'error'

const locale = getSiteConfig().locale

const STRINGS: Record<string, { loading: string; success: string; error: string; back: string }> = {
  'pt-BR': { loading: 'Concluindo seu login...', success: 'Login efetuado. Redirecionando...', error: 'Nao foi possivel concluir o login.', back: 'Voltar ao inicio' },
  'it-IT': { loading: 'Completamento dell’accesso...', success: 'Accesso effettuato. Reindirizzamento...', error: 'Impossibile completare l’accesso.', back: 'Torna alla home' },
  'es-ES': { loading: 'Completando tu inicio de sesion...', success: 'Sesion iniciada. Redirigiendo...', error: 'No se pudo completar el inicio de sesion.', back: 'Volver al inicio' },
  en: { loading: 'Completing your sign in...', success: 'Signed in. Redirecting...', error: 'Could not complete sign in.', back: 'Back to home' },
}
const T = STRINGS[locale] ?? STRINGS['pt-BR']!

export default function AuthCallbackPage() {
  const [state, setState] = useState<CbState>('loading')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const um = await getUserManager()
        await um.signinRedirectCallback()
        if (!active) return
        setState('success')
        window.location.assign(`${getSiteConfig().oidc.authority}/dashboard`)
      } catch {
        if (active) setState('error')
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <main
      data-testid="auth-callback"
      data-mb-state={state}
      style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}
    >
      {/* anti-cascade (R-22): o CTA "Voltar" usa `hidden`; garante que author CSS
          com display nao o mantenha visivel no estado loading/success. */}
      <style>{`[data-testid="auth-callback"] [hidden]{display:none!important}`}</style>

      <p data-mb-state-for="loading" data-testid="auth-callback-loading" hidden={state !== 'loading'}>
        {T.loading}
      </p>
      <p data-mb-state-for="success" data-testid="auth-callback-success" hidden={state !== 'success'}>
        {T.success}
      </p>
      <p data-mb-state-for="error" data-testid="auth-callback-error" role="alert" hidden={state !== 'error'}>
        {T.error}
      </p>

      <Link data-testid="auth-callback-back" href="/" hidden={state !== 'error'}>
        {T.back}
      </Link>
    </main>
  )
}
