/**
 * tests/e2e/fixtures/utm.ts
 *
 * UTMs determinis-ticos para cenarios e2e. Adicione ao path da home antes
 * de navegar (`/?utm_source=test&utm_medium=e2e&utm_campaign=conversion`).
 *
 * O wrapper em src/lib/tracking/posthog.ts ja le esses parametros de
 * window.location.search e registra como super-properties via posthog.register.
 * Estes valores ajudam a auditar funil sem precisar de fonte de trafego real.
 */
export const DETERMINISTIC_UTM = {
  utm_source: 'test',
  utm_medium: 'e2e',
  utm_campaign: 'conversion-journey',
} as const

export function withUtm(pathname: string): string {
  const sp = new URLSearchParams(DETERMINISTIC_UTM as unknown as Record<string, string>)
  const sep = pathname.includes('?') ? '&' : '?'
  return `${pathname}${sep}${sp.toString()}`
}
