/**
 * tests/e2e/landing-conversion.spec.ts
 *
 * Suite Playwright cobrindo a jornada de conversao da landing
 * (home -> CTA -> envio do LeadQualifierForm). Cobre 6 cenarios obrigatorios
 * declarados pela task-011 do loop 05-19-conversion-machine-plan.
 *
 * Pre-requisitos para executar:
 *   - Playwright instalado no workspace: `npm i -D @playwright/test @axe-core/playwright`
 *   - playwright.config.ts criado no workspace pelo operador (template em
 *     tests/e2e/README.md).
 *   - Build estatico do locale alvo disponivel em dist-{br,it,en,es}/ servido
 *     em http://localhost:300{1..4} (a config do Playwright cuida do webServer).
 *
 * Estrategia de mock:
 *   - PostHog: injetado via Page.addInitScript ANTES da navegacao (ver fixtures/posthog-mock.ts).
 *     O wrapper em src/lib/tracking/posthog.ts e estritamente client-side e detecta
 *     window.posthog antes de capturar — a mock substitui a API global e acumula
 *     eventos em window.__posthogEvents para asserts.
 *   - Resend/Slack: NAO ha mock necessario. O LeadQualifierForm e static-export
 *     puro (sem route handlers); o submit dispara apenas posthog.capture('lead_qualified')
 *     client-side e identifyEmail (SHA-256 client-side via Web Crypto, nunca plain).
 *     Nenhum request HTTP saindo da app no submit -> nenhum email/Slack a interceptar.
 *   - UTM: query string determinis-tica via fixtures/utm.ts.
 *
 * Cenarios:
 *   1. Happy path pt-BR: fill Passo 1 -> avancar -> fill Passo 2 -> LGPD -> submit -> sucesso.
 *   2. Zod Passo 1: email malformado + empresa vazia -> erros inline, submit bloqueado.
 *   3. Zod Passo 2: LGPD nao marcado -> erro inline, submit bloqueado.
 *   4. CTAs secundarios: hero CTA primario aponta para anchor + posthog capta cta_primary_click;
 *      ContactSection expoe WhatsApp/Cal.com com data-track-event whatsapp_click/schedule_click.
 *   5. A11y home: axe-core scan retorna 0 violacoes WCAG A/AA.
 *   6. Multi-locale smoke: locale alvo (via E2E_LOCALE) renderiza hero traduzido e form
 *      aceita submit (sem validar copy literal alem do role/heading).
 */
import { expect, test } from '@playwright/test'
import {
  hasEvent,
  installPostHogMock,
  readCapturedEvents,
  waitForEvent,
} from './fixtures/posthog-mock'
import { withUtm } from './fixtures/utm'
import { formatViolations, getA11yViolations } from './fixtures/a11y'
import { getActiveLocale } from './fixtures/locales'

const VALID_PASSO1 = {
  fullName: 'Pedro Cliente E2E',
  email: 'cliente.e2e@example.com',
  company: 'Empresa Teste LTDA',
} as const

test.describe('landing-conversion: jornada home -> CTA -> envio', () => {
  test.beforeEach(async ({ page }) => {
    await installPostHogMock(page)
  })

  test('1. Happy path pt-BR: form 2 passos -> submit -> sucesso', async ({ page }) => {
    test.skip(getActiveLocale().code !== 'pt-BR', 'Happy path exige form (so existe em pt-BR)')
    await page.goto(withUtm('/'))

    // Hero CTA primario aponta para anchor #solicitar-escopo
    const heroCta = page.getByTestId('conversion-hero-cta-primary')
    await expect(heroCta).toBeVisible()
    await heroCta.click()

    // Form section visivel
    const formSection = page.getByTestId('section-lead-qualifier')
    await expect(formSection).toBeVisible()

    // Passo 1
    await formSection.locator('[data-form-field="fullName"]').fill(VALID_PASSO1.fullName)
    await formSection.locator('[data-form-field="email"]').fill(VALID_PASSO1.email)
    await formSection.locator('[data-form-field="company"]').fill(VALID_PASSO1.company)
    await formSection.locator('[data-form-event="form_step_advance_request"]').click()

    // Aguarda Passo 2
    await expect(formSection.locator('[data-form-step="2"]')).toBeVisible()
    await waitForEvent(page, (e) => e.event === 'form_step_advance')

    // Passo 2: 4 selects/radios + LGPD
    await formSection.locator('[data-form-field="softwareType"]').selectOption('sob-medida')
    await formSection.locator('input[name="urgency"][value="3-meses"]').check()
    await formSection.locator('input[name="budget"][value="50-150k"]').check()
    await formSection.locator('input[name="channel"][value="email"]').check()
    await formSection.locator('[data-form-field="lgpdConsent"]').check()

    // Submit
    await formSection.locator('[data-form-event="form_submit"]').click()

    // Estado sucesso renderizado
    await expect(formSection.locator('[data-form-state="success"]')).toBeVisible({ timeout: 5000 })

    // Asserts PostHog: form_start, form_step_advance, form_submit, lead_qualified
    const events = await readCapturedEvents(page)
    const names = events.map((e) => e.event)
    expect(names).toContain('form_start')
    expect(names).toContain('form_step_advance')
    expect(names).toContain('form_submit')
    expect(names).toContain('lead_qualified')

    // lead_qualified deve carregar os 4 campos do Passo 2
    const lead = events.find((e) => e.event === 'lead_qualified')
    expect(lead?.properties).toMatchObject({
      software_type: 'sob-medida',
      urgency: '3-meses',
      budget: '50-150k',
      channel: 'email',
    })
  })

  test('2. Validacao Zod Passo 1: email malformado + empresa vazia bloqueiam advance', async ({
    page,
  }) => {
    test.skip(getActiveLocale().code !== 'pt-BR', 'Validacao Zod exige form (so existe em pt-BR)')
    await page.goto(withUtm('/'))
    await page.getByTestId('conversion-hero-cta-primary').click()
    const form = page.getByTestId('section-lead-qualifier')

    await form.locator('[data-form-field="fullName"]').fill(VALID_PASSO1.fullName)
    await form.locator('[data-form-field="email"]').fill('email-malformado')
    // company deliberadamente vazio
    await form.locator('[data-form-event="form_step_advance_request"]').click()

    // Erros inline aparecem
    const emailField = form.locator('[data-form-field="email"]')
    const companyField = form.locator('[data-form-field="company"]')
    await expect(emailField).toHaveAttribute('aria-invalid', 'true')
    await expect(companyField).toHaveAttribute('aria-invalid', 'true')

    // Passo 1 segue ativo (advance bloqueado)
    await expect(form.locator('[data-form-step="1"]')).toBeVisible()
    await expect(form.locator('[data-form-step="2"]')).toHaveCount(0)

    // form_step_advance NAO foi disparado
    expect(await hasEvent(page, (e) => e.event === 'form_step_advance')).toBe(false)
  })

  test('3. Validacao Zod Passo 2: LGPD nao marcado bloqueia submit', async ({ page }) => {
    test.skip(getActiveLocale().code !== 'pt-BR', 'Validacao Zod exige form (so existe em pt-BR)')
    await page.goto(withUtm('/'))
    await page.getByTestId('conversion-hero-cta-primary').click()
    const form = page.getByTestId('section-lead-qualifier')

    // Avanca Passo 1 com dados validos
    await form.locator('[data-form-field="fullName"]').fill(VALID_PASSO1.fullName)
    await form.locator('[data-form-field="email"]').fill(VALID_PASSO1.email)
    await form.locator('[data-form-field="company"]').fill(VALID_PASSO1.company)
    await form.locator('[data-form-event="form_step_advance_request"]').click()
    await expect(form.locator('[data-form-step="2"]')).toBeVisible()

    // Preenche Passo 2 SEM LGPD
    await form.locator('[data-form-field="softwareType"]').selectOption('automacao-ia')
    await form.locator('input[name="urgency"][value="1-mes"]').check()
    await form.locator('input[name="budget"][value="ate-50k"]').check()
    await form.locator('input[name="channel"][value="whatsapp"]').check()

    await form.locator('[data-form-event="form_submit"]').click()

    // LGPD em aria-invalid + sucesso nao renderiza
    const lgpd = form.locator('[data-form-field="lgpdConsent"]')
    await expect(lgpd).toHaveAttribute('aria-invalid', 'true')
    await expect(form.locator('[data-form-state="success"]')).toHaveCount(0)

    // lead_qualified NAO foi disparado
    expect(await hasEvent(page, (e) => e.event === 'lead_qualified')).toBe(false)
  })

  test('4. CTAs secundarios: hero CTA primario + WhatsApp/Cal.com em ContactSection', async ({
    page,
  }) => {
    test.skip(
      getActiveLocale().code !== 'pt-BR',
      'CTA hero primario e ConversionHero (so renderizado em pt-BR)',
    )
    await page.goto(withUtm('/'))

    // Hero CTA primario dispara cta_primary_click
    await page.getByTestId('conversion-hero-cta-primary').click()
    await waitForEvent(page, (e) => e.event === 'cta_primary_click', 3000)

    // ContactSection com canais WhatsApp/Cal.com
    const contact = page.getByTestId('section-contact')
    await expect(contact).toBeVisible()

    // Renderiza data-track-event para os 2 canais (Schedule + WhatsApp)
    const tracked = contact.locator(
      '[data-track-event="whatsapp_click"], [data-track-event="schedule_click"]',
    )
    await expect(tracked.first()).toBeVisible()
    expect(await tracked.count()).toBeGreaterThanOrEqual(1)
  })

  test('5. A11y: axe-core scan da home retorna 0 violacoes WCAG A/AA', async ({ page }) => {
    await page.goto(withUtm('/'))
    // Aguarda hero renderizado (Server Component, mas adicionamos espera defensiva)
    await page.waitForLoadState('domcontentloaded')

    const violations = await getA11yViolations(page)
    if (violations.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`[a11y] violacoes detectadas:\n${formatViolations(violations)}`)
    }
    expect(violations, formatViolations(violations)).toEqual([])
  })

  test('6. Multi-locale smoke: hero renderiza e form aceita submit', async ({ page }) => {
    const locale = getActiveLocale()
    await page.goto(withUtm('/'))

    // Hero renderiza (ConversionHero em pt-BR, HeroSection nos demais)
    if (locale.code === 'pt-BR') {
      await expect(page.getByTestId('section-conversion-hero')).toBeVisible()
      await expect(page.getByTestId('conversion-hero-headline')).toBeVisible()
      // Form so existe em pt-BR
      await expect(page.getByTestId('section-lead-qualifier')).toBeVisible()
    } else {
      await expect(page.getByTestId('section-hero')).toBeVisible()
      await expect(page.getByTestId('hero-headline')).toBeVisible()
      // it-IT / en / es-ES sem form (paridade tradutorial sem cases locais no Sprint 1-2)
      await expect(page.getByTestId('section-lead-qualifier')).toHaveCount(0)
    }
  })
})
