# AUDIT-API-CONTRACTS.md

**Projeto:** SystemForge Landing Page
**Task:** module-9-integration / TASK-2
**Data:** 2026-03-25
**Auditor:** Claude Code (Sonnet 4.6)

---

## ST001 — ENV Vars: .env.example vs lib/env.ts

> Nota: A TASK-2 fazia referência a `NEXT_PUBLIC_GA4_ID`, porém o projeto usa `NEXT_PUBLIC_GA4_MEASUREMENT_ID` tanto no `.env.example` quanto em `lib/env.ts`. O nome correto é `NEXT_PUBLIC_GA4_MEASUREMENT_ID`.

| Variável | .env.example | Schema Zod (lib/env.ts) | Tipo | Obrigatório? | Status |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | ✅ `.url()` + `.min(1)` | string | Sim (fatal) | ✅ OK |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ | ✅ `.regex(/^\+[1-9]\d{1,14}$/)` | string | Sim | ✅ OK |
| `NEXT_PUBLIC_CALENDLY_URL` | ✅ | ✅ `.url()` + `.startsWith('https://calendly.com/')` | string | Sim | ✅ OK |
| `NEXT_PUBLIC_BUDGET_ENGINE_URL` | ✅ | ✅ `.url()` | string | Sim | ✅ OK |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | ✅ | ✅ `.regex(/^G-[A-Z0-9]+$/).optional()` | string? | Não | ✅ OK |
| `NEXT_PUBLIC_NEWSLETTER_API_URL` | ✅ | ✅ `.url().optional()` | string? | Não | ✅ OK |
| `NEXT_PUBLIC_SITE_URL` (allowlist) | — | ✅ `ALLOWED_CTA_DOMAINS` no mesmo arquivo | — | — | ✅ OK |

**Resultado ST001:** 6/6 variáveis presentes no `.env.example` e com schema Zod correspondente. Nenhuma ausência detectada.

---

## ST002 — Testes de CTAs

> Status: ⏳ aguardando ENV vars reais (`.env.local` não existe no workspace)

### Verificação estática do CTAButton

| Ponto | Arquivo | Resultado |
|---|---|---|
| `isAllowedCTAHref()` chamado antes de qualquer `window.open` | `src/components/ui/CTAButton.tsx:34` | ✅ OK |
| `WHATSAPP_NUMBER` → href via `lib/cta.ts` (`process.env.NEXT_PUBLIC_WHATSAPP_NUMBER`) | `src/lib/cta.ts:14` | ✅ OK |
| `CALENDLY_URL` → href via `lib/cta.ts` (`process.env.NEXT_PUBLIC_CALENDLY_URL`) | `src/lib/cta.ts:18` | ✅ OK |
| `BUDGET_ENGINE_URL` → href via `lib/cta.ts` (`process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL`) | `src/lib/cta.ts:22` | ✅ OK |
| Fallback defensivo quando variável ausente | `lib/cta.ts:14,18,22` | ✅ OK (string vazia / domínio base) |
| Allowlist de domínios (ENV_004) | `src/lib/env.ts:94–100` | ✅ `wa.me`, `api.whatsapp.com`, `calendly.com`, `cal.com`, `budgetengine.app` |
| EVT-002 (`cta_clicked`) disparado no clique | `CTAButton.tsx:40–46` | ✅ OK (guarded por `typeof gtag === 'function'`) |

**Resultado ST002:** Código correto. Testes práticos de click aguardam `.env.local` com valores reais.

---

## ST003 — GA4 Condicional (cookie consent)

| Ponto | Arquivo | Linha | Resultado |
|---|---|---|---|
| `useCookieConsent()` chamado em `GoogleAnalytics` | `src/components/analytics/GoogleAnalytics.tsx:7` | 7 | ✅ OK |
| Script GA4 renderizado **somente se** `consent === 'accepted'` | `GoogleAnalytics.tsx:11` | 11 | ✅ OK |
| Script GA4 renderizado **somente se** `measurementId` definido | `GoogleAnalytics.tsx:11` | 11 | ✅ OK |
| `consent` lido do `localStorage` via `useEffect` (sem hydration mismatch) | `src/hooks/useCookieConsent.ts:17–23` | 17–23 | ✅ OK |
| Estado inicial `consent = null` → scripts NÃO carregados por padrão | `useCookieConsent.ts:10` | 10 | ✅ OK |
| `<GoogleAnalytics />` inserido no `layout.tsx` | `src/app/layout.tsx:122` | 122 | ✅ OK |
| `anonymize_ip: true` + `SameSite=None;Secure` configurados | `GoogleAnalytics.tsx:30–31` | 30–31 | ✅ OK (boas práticas LGPD) |

**Resultado ST003:** GA4 é estritamente condicional ao cookie consent. Implementação correta — sem pre-load de scripts de rastreamento.

---

## ST004 — Newsletter (Cloudflare Worker)

> Status: ⏳ aguardando deploy do Worker (`cloudflare-worker/newsletter-proxy/` existe localmente, não deployado)

### Verificação estática do NewsletterOptIn

| Ponto | Arquivo | Linha | Resultado |
|---|---|---|---|
| Lê `process.env.NEXT_PUBLIC_NEWSLETTER_API_URL` diretamente | `src/components/ui/NewsletterOptIn.tsx:67` | 67 | ✅ OK |
| Aborta graciosamente se `apiUrl` for `undefined` | `NewsletterOptIn.tsx:69–73` | 69–73 | ✅ OK |
| POST com `Content-Type: application/json` | `NewsletterOptIn.tsx:81–90` | 81–90 | ✅ OK |
| AbortController com timeout de 10 segundos | `NewsletterOptIn.tsx:76–78` | 76–78 | ✅ OK |
| Honeypot anti-bot (campo `website`) | `NewsletterOptIn.tsx:59–63` | 59–63 | ✅ OK |
| Checkbox de consentimento LGPD obrigatório | `NewsletterOptIn.tsx:44–49` | 44–49 | ✅ OK |
| Schema Zod para `NEXT_PUBLIC_NEWSLETTER_API_URL` no `lib/env.ts` | `src/lib/env.ts:52–55` | 52–55 | ✅ OK (`.url().optional()`) |
| `RESEND_API_KEY` excluído do schema Next.js (server-side Worker only) | `src/lib/env.ts:57–59` | 57–59 | ✅ OK |

**Resultado ST004:** Integração newsletter corretamente implementada no lado cliente. Testes E2E aguardam deploy do Worker.

---

## ST005 — Allowlist de Domínios em lib/env.ts

| Ponto | Arquivo | Resultado |
|---|---|---|
| `ALLOWED_CTA_DOMAINS` exportada como `const` readonly tuple | `src/lib/env.ts:94–100` | ✅ OK |
| `isAllowedCTAHref()` valida `hostname` exato ou subdomínio | `src/lib/env.ts:107–119` | ✅ OK |
| Paths relativos (`/…`) passam sem validação de domínio | `src/lib/env.ts:108` | ✅ OK |
| Erro `ENV_004` logado em console.error para domínios bloqueados | `src/lib/env.ts:113` | ✅ OK |
| `NEXT_PUBLIC_SITE_URL` não está na allowlist de CTAs externos (separação correta) | — | ✅ OK (SITE_URL é para URL canônica, não CTA externo) |

**Resultado ST005:** Allowlist corretamente implementada. Defesa contra open redirect (THREAT-MODEL T-009) ativa.

---

## Tabela de Integrações — Status Geral

| Integração | Componente | ENV Var | Status |
|---|---|---|---|
| WhatsApp | `CTAButton` + `lib/cta.ts` | `NEXT_PUBLIC_WHATSAPP_NUMBER` | ⏳ Aguardando ENV vars reais |
| Calendly | `CTAButton` + `lib/cta.ts` | `NEXT_PUBLIC_CALENDLY_URL` | ⏳ Aguardando ENV vars reais |
| Budget Engine | `CTAButton` + `lib/cta.ts` | `NEXT_PUBLIC_BUDGET_ENGINE_URL` | ⏳ Aguardando ENV vars reais |
| Google Analytics 4 | `GoogleAnalytics` + `useCookieConsent` | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | ⏳ Aguardando ENV vars reais |
| Newsletter (Resend via CF Worker) | `NewsletterOptIn` | `NEXT_PUBLIC_NEWSLETTER_API_URL` | ⏳ Aguardando deploy do Worker |
| Cloudflare Cache Purge (CI/CD) | GitHub Actions | `CLOUDFLARE_API_TOKEN` (secret) | ⏳ Aguardando configuração CI/CD |

---

## Bloqueadores

| # | Bloqueador | Prioridade | Ação Necessária |
|---|---|---|---|
| B-01 | `.env.local` ausente — CTAs e GA4 não testáveis manualmente | Alta | Copiar `.env.example` para `.env.local` e preencher valores reais |
| B-02 | Cloudflare Worker não deployado — newsletter não funcional em produção | Alta | Executar `wrangler deploy` em `cloudflare-worker/newsletter-proxy/` após configurar `RESEND_API_KEY` |
| B-03 | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` não configurado — analytics silenciosos | Média | Definir Measurement ID real no `.env.local` e no ambiente de produção |

---

## Observações Técnicas

- **Separação de segredos correta:** `RESEND_API_KEY` está explicitamente fora do schema Next.js (`lib/env.ts:57–59`), sendo configurado apenas via `wrangler secret put` no Worker. Nenhum segredo server-side é exposto ao cliente.
- **Naming canônico:** O projeto usa `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (não `NEXT_PUBLIC_GA4_ID`). Toda documentação futura deve referenciar o nome correto.
- **Singleton de ENV:** `getEnv()` em `lib/env.ts:126–131` usa padrão singleton para evitar re-validação. Correto para uso server-side.
- **Build sem ENV vars:** O schema Zod marca `NEWSLETTER_API_URL` e `GA4_MEASUREMENT_ID` como `.optional()`, portanto o build Next.js não falha sem eles. As três variáveis de CTA são obrigatórias — build falhará se ausentes em produção.

---

## Veredito

```
⏳ APROVADO COM RESSALVAS — AGUARDANDO CREDENCIAIS
```

**Justificativa:** Toda a lógica de integração está corretamente implementada no código:
- ENV vars documentadas no `.env.example` e validadas com Zod em `lib/env.ts`
- CTAButton usa `isAllowedCTAHref()` antes de qualquer redirect
- GA4 é estritamente condicional ao cookie consent (`useCookieConsent`)
- NewsletterOptIn faz POST para `NEXT_PUBLIC_NEWSLETTER_API_URL` com abort controller, honeypot e consent LGPD
- Allowlist de domínios ativa (defesa T-009)

**O que falta para APROVADO PLENO:**
1. Preencher `.env.local` com valores reais das 3 variáveis obrigatórias de CTA
2. Fazer deploy do Cloudflare Worker em `cloudflare-worker/newsletter-proxy/`
3. Configurar `NEXT_PUBLIC_GA4_MEASUREMENT_ID` no ambiente de produção

**ENV vars validadas:** 6/6
**Integrações com código correto:** 6/6
**Integrações funcionais em runtime:** 0/6 (aguardando credenciais/deploy)
