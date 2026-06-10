/**
 * tests/e2e/fixtures/posthog-mock.ts
 *
 * Mock determinis-tico de window.posthog para os testes e2e da landing.
 *
 * Estrategia: instalar via Page.addInitScript() ANTES do first navigation
 * para que (a) o wrapper em src/lib/tracking/posthog.ts ja encontre
 * window.posthog.capture como funcao e dispare normalmente, e (b) o array
 * window.__posthogEvents acumule {event, properties} para asserts no spec.
 *
 * Sem dependencia externa. Compativel com static export (output: 'export').
 */
import type { Page } from '@playwright/test'

export type CapturedEvent = {
  event: string
  properties?: Record<string, unknown>
}

export async function installPostHogMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type CapturedEventInternal = {
      event: string
      properties?: Record<string, unknown>
    }
    const events: CapturedEventInternal[] = []
    const registered: Record<string, unknown> = {}
    const identified: string[] = []
    const w = window as unknown as {
      posthog?: unknown
      __posthogEvents?: CapturedEventInternal[]
      __posthogRegistered?: Record<string, unknown>
      __posthogIdentified?: string[]
    }
    w.__posthogEvents = events
    w.__posthogRegistered = registered
    w.__posthogIdentified = identified
    w.posthog = {
      __mock: true,
      capture(event: string, properties?: Record<string, unknown>) {
        events.push({ event, properties })
      },
      register(props: Record<string, unknown>) {
        Object.assign(registered, props)
      },
      identify(distinctId: string) {
        identified.push(distinctId)
      },
      reset() {
        events.length = 0
        identified.length = 0
        for (const k of Object.keys(registered)) delete registered[k]
      },
    }
  })
}

export async function readCapturedEvents(page: Page): Promise<CapturedEvent[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __posthogEvents?: CapturedEvent[] }
    return Array.isArray(w.__posthogEvents) ? [...w.__posthogEvents] : []
  })
}

export async function waitForEvent(
  page: Page,
  predicate: (e: CapturedEvent) => boolean,
  timeoutMs = 5000,
): Promise<CapturedEvent> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const events = await readCapturedEvents(page)
    const hit = events.find(predicate)
    if (hit) return hit
    await page.waitForTimeout(50)
  }
  throw new Error(
    `[posthog-mock] event predicate did not match within ${timeoutMs}ms; events captured so far: ${JSON.stringify(
      await readCapturedEvents(page),
    )}`,
  )
}

export async function hasEvent(
  page: Page,
  predicate: (e: CapturedEvent) => boolean,
): Promise<boolean> {
  const events = await readCapturedEvents(page)
  return events.some(predicate)
}
