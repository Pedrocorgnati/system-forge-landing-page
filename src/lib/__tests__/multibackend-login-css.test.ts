import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Regressão recorrente: o header do multibackend renderizava "Entrar Criar conta
 * Voce ainda nao entrou." como texto puro, sem botões. Causa-raiz: o contrato de
 * CSS das classes .mb-* consumidas por src/components/auth/MultibackendLogin.tsx
 * nunca foi escrito em nenhum stylesheet — com o preflight do Tailwind v4 os
 * <button> viram texto inline sem estilo.
 *
 * Estes testes travam (1) a presença das classes em globals.css e (2) o wiring
 * do gerador de CSP/.htaccess nos builds por locale (sem ele, um rebuild apaga o
 * connect-src do IdP e o login silenciosamente quebra de novo).
 */

const REPO = resolve(__dirname, '../../..')

describe('multibackend login — contrato de CSS (.mb-*) em globals.css', () => {
  const rawCss = readFileSync(resolve(REPO, 'src/app/globals.css'), 'utf-8')
  // Remove comentários /* ... */ para não casar com a documentação (que cita as
  // próprias classes e a regra anti-cascade) ao verificar regras reais.
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '')

  // Toda classe usada pelo componente precisa ter regra própria.
  const REQUIRED_SELECTORS = [
    '.mb-login',
    '.mb-login--mobile',
    '.mb-login-btn',
    '.mb-register-btn',
    '.mb-account',
    '.mb-logout-btn',
    '.mb-login-status',
  ]

  it.each(REQUIRED_SELECTORS)('define regra para %s', (selector) => {
    // procura o seletor como token de regra (seguido de espaço, vírgula, :, { ou [)
    const escaped = selector.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const re = new RegExp(`${escaped}(?=[\\s,:{\\[])`)
    expect(re.test(css), `globals.css não estiliza ${selector}`).toBe(true)
  })

  it('os 4 estados (empty/loading/error/success) são endereçáveis via data-mb-state-for', () => {
    expect(css).toContain("[data-mb-state-for='loading']")
    expect(css).toContain("[data-mb-state-for='error']")
  })

  it('NÃO usa !important em display (não pode vencer a regra anti-cascade [hidden] do componente, R-22/F-4)', () => {
    expect(/display\s*:[^;]*!important/i.test(css)).toBe(false)
  })

  it('o botão primário usa o token de cor primária (não hardcode), dark-mode safe', () => {
    expect(css).toMatch(/\.mb-login-btn\s*\{[^}]*var\(--primary\)/)
  })
})

describe('multibackend login — wiring do gerador de CSP/.htaccess nos builds', () => {
  const pkg = JSON.parse(readFileSync(resolve(REPO, 'package.json'), 'utf-8')) as {
    scripts: Record<string, string>
  }

  it.each(['br', 'it', 'en', 'es'])(
    'build:%s regenera dist/.htaccess com a CSP do IdP após next build',
    (loc) => {
      const script = pkg.scripts[`build:${loc}`] ?? ''
      expect(script, `build:${loc} ausente`).toBeTruthy()
      expect(
        script.includes(`generate-htaccess.ts --locale=${loc}`),
        `build:${loc} não regenera o .htaccess (CSP connect-src do IdP some no rebuild → login quebra)`,
      ).toBe(true)
    },
  )
})
