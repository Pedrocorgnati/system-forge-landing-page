# Hardcodes Report

**Projeto:** system-forge-landing-page
**Data:** 2026-03-29
**Status:** COMPLETO ✅

---

## Hardcodes Encontrados e Corrigidos

### 1. Rotas Hardcoded — 5 ocorrências ✅

| Arquivo | Linha | Antes | Depois |
|---------|-------|-------|--------|
| `src/components/layout/Header.tsx` | 57 | `href="/"` | `href={ROUTES.HOME}` |
| `src/app/servicos/[slug]/error.tsx` | 50 | `href="/servicos"` | `href={ROUTES.SERVICES}` ⚠️ |
| `src/components/blog/SearchBar.tsx` | 122 | `href="/blog"` | `href={ROUTES.BLOG}` |
| `src/app/blog/[slug]/error.tsx` | 50 | `href="/blog"` | `href={ROUTES.BLOG}` |
| `src/components/sections/StrategicAdvisorTeaser.tsx` | 68 | `href="/"` | `href={ROUTES.HOME}` |

> ⚠️ `/servicos` era crítico: no build IT a rota é `/servizi`, no EN é `/services`. ROUTES já é locale-aware via `getSiteConfig().routes`.

### 2. Analytics Event Names — 3 ocorrências ✅

| Arquivo | Antes | Depois |
|---------|-------|--------|
| `src/app/error.tsx` | `gtag('event', 'exception', {...})` | `trackEvent(GA4_EVENTS.EXCEPTION, {...})` |
| `src/components/ui/CTAButton.tsx` | `gtag('event', 'cta_clicked', {...})` | `trackEvent(GA4_EVENTS.CTA_CLICKED, {...})` |
| `src/components/blog/SearchBar.tsx` | `gtag('event', 'search', {...})` | `trackEvent(GA4_EVENTS.SEARCH, {...})` |

Todos migrados para `trackEvent()` de `@/lib/analytics` + `GA4_EVENTS` de `@/lib/constants/analytics`.

### 3. Magic Numbers — 5 locais ✅

| Arquivo | Valor | Constante |
|---------|-------|-----------|
| `src/components/sections/TestimonialsSection.tsx:97` | `5000` | `TIMING.CAROUSEL_AUTOPLAY` |
| `src/components/sections/TestimonialsSection.tsx:23` | `60` | `TIMING.STAR_ANIMATION_STEP` |
| `src/components/dev/DataTestOverlay.tsx:51,62` | `1500` (2×) | `TIMING.COPY_FEEDBACK` |
| `src/components/layout/MobileNav.tsx:31` | `50` | `TIMING.FOCUS_DELAY` |
| `src/hooks/useArticleSearch.ts:26` | `500` | `TIMING.SEARCH_DEBOUNCE` |

### 4. Storage Keys — 3 ocorrências ✅

| Arquivo | Antes | Depois |
|---------|-------|--------|
| `src/hooks/useCookieConsent.ts` | `'sf-cookie-consent'` | `STORAGE_KEYS.COOKIE_CONSENT` |
| `src/components/layout/ThemeProvider.tsx` | `'theme'` | `STORAGE_KEYS.THEME` |
| `src/hooks/useLanguageDetection.ts` | `` `sf-lang-dismissed-${domain}` `` | `STORAGE_KEYS.langDismissed(domain)` |

---

## Arquivos Criados

| Arquivo | Exports |
|---------|---------|
| `src/lib/constants/analytics.ts` | `GA4_EVENTS`, `GA4EventName` |
| `src/lib/constants/timing.ts` | `TIMING` |
| `src/lib/constants/storage-keys.ts` | `STORAGE_KEYS` |

## Arquivos Modificados

- `src/lib/constants/index.ts` — barrel export atualizado
- `src/components/layout/Header.tsx`
- `src/app/servicos/[slug]/error.tsx`
- `src/app/blog/[slug]/error.tsx`
- `src/components/blog/SearchBar.tsx`
- `src/components/sections/StrategicAdvisorTeaser.tsx`
- `src/app/error.tsx`
- `src/components/ui/CTAButton.tsx`
- `src/hooks/useArticleSearch.ts`
- `src/components/sections/TestimonialsSection.tsx`
- `src/components/dev/DataTestOverlay.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/hooks/useCookieConsent.ts`
- `src/components/layout/ThemeProvider.tsx`
- `src/hooks/useLanguageDetection.ts`

---

## Observações

**Erro TS pré-existente não relacionado:**
`src/components/ui/NewsletterOptIn.tsx:113` — `string | undefined` não atribuível a `SetStateAction<string>`. Existia antes desta auditoria.

**Constante `BLOG_ITEMS_PER_PAGE = 12`:** já estava centralizada em `src/lib/constants/site.ts` e usada corretamente em todos os arquivos de paginação do blog. Nenhuma ação necessária.
