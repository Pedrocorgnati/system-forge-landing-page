/**
 * tests/e2e/fixtures/locales.ts
 *
 * Configuracao dos 4 locales da landing para o matrix do Playwright.
 *
 * O builds sao por-locale (output: 'export'), entao os e2e precisam apontar
 * para o build correto via baseURL. O test runner Playwright pode rodar com
 * `--project=br|it|en|es` ou ler de env var `E2E_LOCALE` para servir o build
 * adequado em paralelo.
 */
export type LocaleCode = 'pt-BR' | 'it-IT' | 'en' | 'es-ES'

export type LocaleConfig = {
  code: LocaleCode
  short: 'br' | 'it' | 'en' | 'es'
  distDir: string
  defaultPort: number
}

export const LOCALES: readonly LocaleConfig[] = [
  { code: 'pt-BR', short: 'br', distDir: 'dist-br', defaultPort: 3001 },
  { code: 'it-IT', short: 'it', distDir: 'dist-it', defaultPort: 3002 },
  { code: 'en', short: 'en', distDir: 'dist-en', defaultPort: 3003 },
  { code: 'es-ES', short: 'es', distDir: 'dist-es', defaultPort: 3004 },
] as const

export function getActiveLocale(): LocaleConfig {
  const env = process.env.E2E_LOCALE
  if (env) {
    const hit = LOCALES.find((l) => l.code === env || l.short === env)
    if (hit) return hit
    throw new Error(`[locales] E2E_LOCALE='${env}' nao corresponde a nenhum locale suportado`)
  }
  // Default: pt-BR (locale primary com copy artesanal + form)
  const first = LOCALES[0]
  if (!first) throw new Error('[locales] lista LOCALES vazia')
  return first
}
