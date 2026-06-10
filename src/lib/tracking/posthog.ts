/**
 * src/lib/tracking/posthog.ts — Wrapper PostHog (task-009 conversion-machine-plan).
 *
 * Camada de tracking centralizada autoritativa da landing. Carrega o snippet
 * via injecao dinamica de <script> (mesmo padrao do GA4 em Analytics.tsx),
 * usando o objeto global window.posthog. Evita adicionar `posthog-js` como
 * dependencia npm — o snippet bootstrapa uma fila que o script remoto consome,
 * compativel com `output: 'export'` (static export).
 *
 * Regras canonicas:
 *   - SSR-safe: todas as funcoes NOOP em ambiente server-side.
 *   - Defer/lazy: init so dispara quando chamado por client (apos consent + mount).
 *   - Super-properties globais: locale, utm_source, utm_medium, utm_campaign, referrer.
 *   - identifyEmail() hasheia SHA-256 client-side via Web Crypto — NUNCA email plain.
 *   - Session replay opt-in: so habilita quando explicitamente passado em init opts.
 *   - Zero blog-impact: este wrapper nao decide quando rodar; quem decide e o
 *     AnalyticsProvider (que checa pathname.startsWith('/blog')).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    posthog?: any
  }
}

type PostHogInitOptions = {
  apiKey: string
  apiHost: string
  locale: string
  enableSessionReplay: boolean
  superProperties?: Record<string, string>
}

let initStarted = false

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function readUtmAndReferrer(): Record<string, string> {
  const props: Record<string, string> = {}
  if (!isBrowser()) return props
  try {
    const sp = new URLSearchParams(window.location.search)
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    for (const k of keys) {
      const v = sp.get(k)
      if (v) props[k] = v
    }
    if (document.referrer) props.referrer = document.referrer
  } catch {
    /* ignore — URLSearchParams pode falhar em URLs malformadas */
  }
  return props
}

/**
 * Injeta o snippet PostHog (forma "array.js" canonica documentada em
 * posthog.com/docs/libraries/js), que cria window.posthog como fila e carrega
 * o bundle real de forma async. Idempotente via guard initStarted + DOM id.
 */
export function initPostHog(opts: PostHogInitOptions): void {
  if (!isBrowser()) return
  if (initStarted) return
  if (!opts.apiKey) return

  initStarted = true

  if (document.getElementById('posthog-snippet')) {
    return
  }

  const w = window as Window & { posthog?: any }
  // Snippet oficial PostHog (forma reduzida) — bootstrapa fila ate o bundle carregar.
  if (!w.posthog) {
    w.posthog = []
    const ph: any = w.posthog
    const methods = [
      'init',
      'capture',
      'identify',
      'alias',
      'people.set',
      'people.set_once',
      'register',
      'register_once',
      'unregister',
      'reset',
      'group',
      'startSessionRecording',
      'stopSessionRecording',
      'opt_in_capturing',
      'opt_out_capturing',
      'has_opted_in_capturing',
      'has_opted_out_capturing',
      'set_config',
    ]
    for (const m of methods) {
      const parts = m.split('.')
      let target: any = ph
      while (parts.length > 1) {
        const head = parts.shift() as string
        if (!target[head]) target[head] = {}
        target = target[head]
      }
      const leaf = parts[0] as string
      target[leaf] = (...args: unknown[]) => {
        ph._q = ph._q || []
        ph._q.push([m === leaf ? leaf : m, ...args])
      }
    }
    ph._q = ph._q || []
  }

  const superProps: Record<string, string> = {
    locale: opts.locale,
    ...readUtmAndReferrer(),
    ...(opts.superProperties ?? {}),
  }

  w.posthog.init(opts.apiKey, {
    api_host: opts.apiHost,
    capture_pageview: false,
    persistence: 'localStorage+cookie',
    autocapture: false,
    disable_session_recording: !opts.enableSessionReplay,
    loaded: (instance: any) => {
      try {
        instance.register(superProps)
      } catch {
        /* defensive: register pode falhar se SDK ainda nao expoe register */
      }
    },
  })

  const script = document.createElement('script')
  script.id = 'posthog-snippet'
  script.async = true
  script.src = `${opts.apiHost.replace(/\/$/, '')}/static/array.js`
  script.onerror = () => {
    /* ad-blocker / falha de rede — site segue normal */
  }
  document.head.appendChild(script)
}

export function capture(event: string, properties?: Record<string, unknown>): void {
  if (!isBrowser()) return
  const w = window as Window & { posthog?: any }
  if (!w.posthog || typeof w.posthog.capture !== 'function') return
  try {
    w.posthog.capture(event, properties)
  } catch {
    /* defensive: never throw from tracking */
  }
}

export function register(props: Record<string, unknown>): void {
  if (!isBrowser()) return
  const w = window as Window & { posthog?: any }
  if (!w.posthog || typeof w.posthog.register !== 'function') return
  try {
    w.posthog.register(props)
  } catch {
    /* defensive */
  }
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  const bytes = Array.from(new Uint8Array(buf))
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Identifica o usuario por SHA-256(email normalizado).
 * NUNCA passa o email plain para o PostHog.
 */
export async function identifyEmail(email: string): Promise<void> {
  if (!isBrowser()) return
  if (!email) return
  const w = window as Window & { posthog?: any }
  if (!w.posthog || typeof w.posthog.identify !== 'function') return
  try {
    const normalized = email.trim().toLowerCase()
    const hash = await sha256Hex(normalized)
    w.posthog.identify(hash)
  } catch {
    /* defensive: crypto.subtle pode falhar em contexto inseguro */
  }
}

export function enableSessionReplayOptIn(): void {
  if (!isBrowser()) return
  const w = window as Window & { posthog?: any }
  if (!w.posthog) return
  try {
    if (typeof w.posthog.startSessionRecording === 'function') {
      w.posthog.startSessionRecording()
    } else if (typeof w.posthog.set_config === 'function') {
      w.posthog.set_config({ disable_session_recording: false })
    }
  } catch {
    /* defensive */
  }
}

export function isReady(): boolean {
  if (!isBrowser()) return false
  const w = window as Window & { posthog?: any }
  return Boolean(w.posthog && typeof w.posthog.capture === 'function')
}
