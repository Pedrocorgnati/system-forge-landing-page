/**
 * tests/e2e/fixtures/a11y.ts
 *
 * Wrapper de axe-core para Playwright. Usa @axe-core/playwright quando
 * instalado; degradado para `axe-core` puro carregado via injecao de script
 * quando o adaptador nao estiver disponivel.
 *
 * Padrao: avaliar APENAS WCAG A/AA (alinhado ao cenario 5 da task-011).
 */
import type { Page } from '@playwright/test'

export type A11yViolation = {
  id: string
  impact: string | null
  description: string
  help: string
  helpUrl: string
  nodes: Array<{ target: string[]; html: string }>
}

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const

async function runWithAdapter(page: Page): Promise<A11yViolation[]> {
  // Lazy import to allow runtime fallback when adapter ausente.
  const mod = await import('@axe-core/playwright').catch(() => null)
  if (!mod) return runWithCdn(page)
  const { AxeBuilder } = mod
  const result = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze()
  return result.violations as unknown as A11yViolation[]
}

async function runWithCdn(page: Page): Promise<A11yViolation[]> {
  // Fallback: injeta axe-core a partir do CDN e roda axe.run no contexto da pagina.
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js',
  })
  const result = (await page.evaluate(async (tags) => {
    type AxeResult = { violations: unknown[] }
    const w = window as unknown as {
      axe?: { run: (ctx: unknown, opts: unknown) => Promise<AxeResult> }
    }
    if (!w.axe) throw new Error('axe-core nao carregou via CDN; verificar conectividade ou instalar @axe-core/playwright localmente')
    return w.axe.run(document, { runOnly: { type: 'tag', values: tags } })
  }, WCAG_TAGS)) as { violations: A11yViolation[] }
  return result.violations
}

export async function getA11yViolations(page: Page): Promise<A11yViolation[]> {
  return runWithAdapter(page)
}

export function formatViolations(violations: A11yViolation[]): string {
  if (violations.length === 0) return '(nenhuma)'
  return violations
    .map((v) => `- [${v.impact ?? 'unknown'}] ${v.id}: ${v.help} (${v.nodes.length} no(s))`)
    .join('\n')
}
