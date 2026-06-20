'use client'

/**
 * Widget de login OIDC (multibackend Modelo B). Vincula o site estatico ao IdP
 * central (config.oidc.authority) via PKCE S256, com a moeda/idioma corretos
 * resolvidos no backend pelo client_id (este widget so carrega o client_id publico).
 *
 * Contrato (ai-forge/rules/multibackend-rules.md):
 *  - marker estavel data-testid="multibackend-login" (R-20);
 *  - 4 estados empty/loading/error/success (R-23, Zero Estados Indefinidos);
 *  - regra anti-cascade [hidden]{display:none!important} (R-22/F-4);
 *  - handlers reais signinRedirect / prompt=create / removeUser (Zero Orfaos, R-25);
 *  - paridade responsiva: instanciado no header desktop E no menu mobile (R-26),
 *    com estado sincronizado entre instancias via pub/sub (R-24);
 *  - textos no idioma do build (config.locale).
 *
 * SSR/static-export-safe: oidc-client-ts (APIs de browser) so e carregado via
 * dynamic import dentro de handlers/effects; o render inicial e o estado 'empty'.
 */

import { useCallback, useEffect, useState } from 'react'
import { getSiteConfig } from '@config'
import { getUserManager } from '@/lib/auth/oidc-user-manager'

type MbState = 'empty' | 'loading' | 'error' | 'success'
type Variant = 'desktop' | 'mobile'

const locale = getSiteConfig().locale

type Strings = {
  login: string
  register: string
  logout: string
  account: string
  empty: string
  loading: string
  error: string
  success: string
}

const STRINGS: Record<string, Strings> = {
  'pt-BR': {
    login: 'Entrar', register: 'Criar conta', logout: 'Sair', account: 'Minha conta',
    empty: 'Voce ainda nao entrou.', loading: 'Redirecionando para o login...',
    error: 'Nao foi possivel iniciar o login. Tente novamente.', success: 'Sessao iniciada.',
  },
  'it-IT': {
    login: 'Accedi', register: 'Crea account', logout: 'Esci', account: 'Il mio account',
    empty: 'Non hai ancora effettuato l’accesso.', loading: 'Reindirizzamento al login...',
    error: 'Impossibile avviare l’accesso. Riprova.', success: 'Sessione avviata.',
  },
  'es-ES': {
    login: 'Iniciar sesion', register: 'Crear cuenta', logout: 'Salir', account: 'Mi cuenta',
    empty: 'Aun no has iniciado sesion.', loading: 'Redirigiendo al inicio de sesion...',
    error: 'No se pudo iniciar sesion. Intentalo de nuevo.', success: 'Sesion iniciada.',
  },
  en: {
    login: 'Sign in', register: 'Create account', logout: 'Sign out', account: 'My account',
    empty: 'You are not signed in.', loading: 'Redirecting to sign in...',
    error: 'Could not start sign in. Please try again.', success: 'Signed in.',
  },
}

const T: Strings = STRINGS[locale] ?? STRINGS['pt-BR']!

type UM = import('oidc-client-ts').User

// pub/sub para sincronizar todas as instancias montadas (R-24/R-26).
const listeners = new Set<() => void>()
function notifyAll(): void {
  listeners.forEach((fn) => fn())
}

function extraParams(includePromptCreate: boolean): Record<string, string> {
  const o = getSiteConfig().oidc
  const extra: Record<string, string> = {}
  if (includePromptCreate) extra.prompt = 'create'
  if (o.uiLocale) extra.ui_locales = o.uiLocale
  return extra
}

export function MultibackendLogin({ variant = 'desktop' }: { variant?: Variant }) {
  const [state, setState] = useState<MbState>('empty')
  const [accountLabel, setAccountLabel] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const um = await getUserManager()
      const user: UM | null = await um.getUser()
      if (user && !user.expired) {
        const p = user.profile as { name?: string; email?: string }
        setAccountLabel(p.name || p.email || T.account)
        setState('success')
      } else {
        setAccountLabel(null)
        setState('empty')
      }
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    let active = true
    const tick = () => {
      if (active) void refresh()
    }
    listeners.add(tick)
    void refresh()
    return () => {
      active = false
      listeners.delete(tick)
    }
  }, [refresh])

  const startLogin = useCallback(async (register: boolean) => {
    setState('loading')
    try {
      const um = await getUserManager()
      await um.signinRedirect({ extraQueryParams: extraParams(register) })
    } catch {
      setState('error')
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const um = await getUserManager()
      await um.removeUser()
    } finally {
      notifyAll()
    }
  }, [])

  const dashboardHref = `${getSiteConfig().oidc.authority}/dashboard`
  const loggedIn = state === 'success'
  const root = variant === 'mobile' ? 'mb-login mb-login--mobile' : 'mb-login'

  return (
    <div
      className={root}
      data-testid="multibackend-login-widget"
      data-mb-variant={variant}
      data-mb-state={state}
    >
      {/* CONTRATO DE VISIBILIDADE anti-cascade (R-22/F-4) — NAO REMOVER. */}
      <style>{`[data-testid="multibackend-login-widget"] [hidden]{display:none!important}`}</style>

      <button
        type="button"
        data-testid="multibackend-login"
        onClick={() => void startLogin(false)}
        hidden={loggedIn}
        className="mb-login-btn"
      >
        {T.login}
      </button>
      <button
        type="button"
        data-testid="multibackend-register"
        onClick={() => void startLogin(true)}
        hidden={loggedIn}
        className="mb-register-btn"
      >
        {T.register}
      </button>

      <span className="mb-account" hidden={!loggedIn}>
        <a data-testid="multibackend-account" href={dashboardHref}>
          {accountLabel ?? T.account}
        </a>
        <button type="button" data-testid="multibackend-logout" onClick={() => void logout()} className="mb-logout-btn">
          {T.logout}
        </button>
      </span>

      {/* 4 estados (R-23) — sempre no DOM, dirigidos por `hidden`. */}
      <p className="mb-login-status" data-mb-state-for="empty" data-testid="multibackend-login-empty" hidden={state !== 'empty'}>
        {T.empty}
      </p>
      <p className="mb-login-status" data-mb-state-for="loading" data-testid="multibackend-login-loading" aria-live="polite" hidden={state !== 'loading'}>
        {T.loading}
      </p>
      <p className="mb-login-status" data-mb-state-for="error" data-testid="multibackend-login-error" role="alert" hidden={state !== 'error'}>
        {T.error}
      </p>
      <p className="mb-login-status" data-mb-state-for="success" data-testid="multibackend-login-success" hidden={state !== 'success'}>
        {T.success}
      </p>
    </div>
  )
}
