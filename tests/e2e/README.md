# tests/e2e — Playwright suite (task-011 conversion-machine-plan)

Suite e2e cobrindo a jornada de conversao da landing (home -> CTA -> envio).

## Status atual

- **Suite criada**: `landing-conversion.spec.ts` com 6 cenarios obrigatorios (happy path pt-BR, validacao Zod Passo 1 e Passo 2, CTAs secundarios, a11y WCAG A/AA, multi-locale smoke).
- **Fixtures criadas**: `fixtures/posthog-mock.ts`, `fixtures/utm.ts`, `fixtures/a11y.ts`, `fixtures/locales.ts`.
- **Playwright NAO instalado** no workspace (conferido via `package.json`). A suite e fixtures estao prontas mas nao executaveis ate que o operador faca o passo de bootstrap descrito abaixo.
- **`playwright.config.ts` NAO criado** (task-011 declara explicitamente "apenas se ja existe; nao criar do zero se nao houver"). Template canonico abaixo para o operador colar.
- **Script `test:e2e:conversion` NAO adicionado** ao `package.json` (task declara "se ja houver Playwright instalado").

## Bootstrap (1x por workspace)

```bash
npm install --save-dev @playwright/test @axe-core/playwright
npx playwright install --with-deps chromium
```

Adicione `playwright.config.ts` na raiz do workspace (template):

```ts
import { defineConfig, devices } from '@playwright/test'

const PORTS = { br: 3001, it: 3002, en: 3003, es: 3004 } as const

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'br',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORTS.br}` },
      metadata: { locale: 'pt-BR' },
    },
    {
      name: 'it',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORTS.it}` },
      metadata: { locale: 'it-IT' },
    },
    {
      name: 'en',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORTS.en}` },
      metadata: { locale: 'en' },
    },
    {
      name: 'es',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORTS.es}` },
      metadata: { locale: 'es-ES' },
    },
  ],
  // Builds estaticos servidos via `npx serve dist-{locale}/`.
  // Cada project precisa do build correspondente:
  //   npm run build:br && npm run build:it && npm run build:en && npm run build:es
  // Ou, em CI: rodar build do locale antes de invocar playwright test --project={br|it|en|es}.
})
```

Adicione ao `package.json` (campo `scripts`):

```json
"test:e2e:conversion": "playwright test tests/e2e/landing-conversion.spec.ts --reporter=list",
"test:e2e:conversion:br": "E2E_LOCALE=pt-BR playwright test tests/e2e/landing-conversion.spec.ts --project=br --reporter=list",
"test:e2e:conversion:it": "E2E_LOCALE=it-IT playwright test tests/e2e/landing-conversion.spec.ts --project=it --reporter=list",
"test:e2e:conversion:en": "E2E_LOCALE=en playwright test tests/e2e/landing-conversion.spec.ts --project=en --reporter=list",
"test:e2e:conversion:es": "E2E_LOCALE=es-ES playwright test tests/e2e/landing-conversion.spec.ts --project=es --reporter=list"
```

## Como rodar

Pre-requisito: build estatico do locale alvo + servidor local.

```bash
# 1. Build
SITE=br npm run build:br
# 2. Servir
npx serve dist-br -p 3001 &
# 3. Rodar
E2E_LOCALE=pt-BR npx playwright test tests/e2e/landing-conversion.spec.ts --project=br --reporter=list
```

Para rodar os 4 locales em paralelo, levantar 4 servidores nas portas 3001-3004 (matrix nos scripts acima).

## Notas de mocking

- **PostHog**: mockado via `Page.addInitScript()` em `fixtures/posthog-mock.ts`. O wrapper de tracking (`src/lib/tracking/posthog.ts`) detecta `window.posthog.capture` e dispara normal — o mock substitui a API global e acumula eventos em `window.__posthogEvents` para asserts.
- **Resend / Slack**: nao ha mock necessario. O `LeadQualifierForm` e static-export puro; o submit dispara apenas `posthog.capture('lead_qualified')` + `identifyEmail` (SHA-256 client-side via Web Crypto, jamais envia email plain). Nenhum request HTTP saindo da app no submit -> nenhum email/Slack a interceptar.
- **UTM**: query string determinis-tica via `fixtures/utm.ts` (`?utm_source=test&utm_medium=e2e&utm_campaign=conversion-journey`).

## Cobertura

| # | Cenario | Tipo | Locale |
|---|---------|------|--------|
| 1 | Happy path pt-BR (form 2 passos -> sucesso + 4 eventos PostHog) | functional | pt-BR |
| 2 | Zod Passo 1 (email malformado + empresa vazia -> erros inline, advance bloqueado) | validation | pt-BR |
| 3 | Zod Passo 2 (LGPD nao marcado -> erro inline, submit bloqueado) | validation | pt-BR |
| 4 | CTAs secundarios (hero CTA dispara cta_primary_click + ContactSection expoe whatsapp/schedule) | functional | pt-BR |
| 5 | A11y axe-core WCAG A/AA da home | accessibility | todos |
| 6 | Multi-locale smoke (hero traduzido + ausencia de form nos demais locales) | smoke | todos |

## tsconfig

`tests/e2e/` foi adicionado ao `tsconfig.json > exclude` para evitar quebrar `npm run type-check` enquanto `@playwright/test` nao estiver instalado. Apos instalar, removerlo se desejar type-check da suite.

## Deferred (fora do escopo da task-011)

- Snapshot/visual regression: explicitamente fora do escopo permitido pela task.
- Testes contra ambiente de producao: suite roda contra build local apenas.
- Mock de Resend/Slack: nao se aplica (form e client-side puro).
