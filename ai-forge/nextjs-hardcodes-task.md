# Hardcodes Task List

**Projeto:** system-forge-landing-page
**Data:** 2026-03-29
**Hardcodes encontrados:** 13
**Arquivos de constantes a criar:** 3
**Arquivos a modificar:** 9

---

## T001 — Criar `src/lib/constants/analytics.ts`

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- criar: `src/lib/constants/analytics.ts`

**Descrição:**
Centralizar nomes de eventos GA4 usados inline em error.tsx, CTAButton.tsx e SearchBar.tsx.

**Critérios de Aceite:**
- [ ] Arquivo criado com `GA4_EVENTS` tipado
- [ ] Build passando

**Status:** TODO

---

## T002 — Criar `src/lib/constants/timing.ts`

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- criar: `src/lib/constants/timing.ts`

**Descrição:**
Centralizar magic numbers de timers/debounce: 5000 (carrossel), 60 (animação), 1500 (copy), 50 (focus), 500 (debounce busca).

**Critérios de Aceite:**
- [ ] Arquivo criado com `TIMING` tipado
- [ ] Build passando

**Status:** TODO

---

## T003 — Criar `src/lib/constants/storage-keys.ts`

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- criar: `src/lib/constants/storage-keys.ts`

**Descrição:**
Centralizar storage keys que hoje são constantes locais isoladas em cada arquivo.

**Critérios de Aceite:**
- [ ] Arquivo criado com `STORAGE_KEYS` exportado
- [ ] Build passando

**Status:** TODO

---

## T004 — Corrigir rotas hardcoded (5 arquivos)

**Tipo:** SEQUENTIAL
**Dependências:** none (ROUTES já existe em `src/lib/constants/routes.ts`)
**Arquivos:**
- modificar: `src/components/layout/Header.tsx` (L57)
- modificar: `src/app/servicos/[slug]/error.tsx` (L50)
- modificar: `src/components/blog/SearchBar.tsx` (L122)
- modificar: `src/app/blog/[slug]/error.tsx` (L50)
- modificar: `src/components/sections/StrategicAdvisorTeaser.tsx` (L68)

**Descrição:**
Substituir strings literais de rota por `ROUTES.*` de `@/lib/constants/routes`.
Crítico: `/servicos` hardcoded em error.tsx quebra nos builds IT (`/servizi`) e EN (`/services`).

**Critérios de Aceite:**
- [ ] `href="/"` → `href={ROUTES.HOME}`
- [ ] `href="/servicos"` → `href={ROUTES.SERVICES}`
- [ ] `href="/blog"` → `href={ROUTES.BLOG}` (2 ocorrências)
- [ ] Build passando
- [ ] Sem strings literais de rota restantes

**Status:** TODO

---

## T005 — Corrigir analytics events inline (3 arquivos)

**Tipo:** SEQUENTIAL
**Dependências:** T001
**Arquivos:**
- modificar: `src/app/error.tsx` (L19)
- modificar: `src/components/ui/CTAButton.tsx` (L30)
- modificar: `src/components/blog/SearchBar.tsx` (L15)

**Descrição:**
Substituir strings de event name inline por `GA4_EVENTS.*`.
Também migrar calls de `gtag` direto para `trackEvent()` onde aplicável.

**Critérios de Aceite:**
- [ ] `'exception'` → `GA4_EVENTS.EXCEPTION`
- [ ] `'cta_clicked'` → `GA4_EVENTS.CTA_CLICKED`
- [ ] `'search'` → `GA4_EVENTS.SEARCH`
- [ ] Build passando

**Status:** TODO

---

## T006 — Corrigir magic numbers (4 arquivos)

**Tipo:** SEQUENTIAL
**Dependências:** T002
**Arquivos:**
- modificar: `src/components/sections/TestimonialsSection.tsx` (L97, L23)
- modificar: `src/components/dev/DataTestOverlay.tsx` (L51, L62)
- modificar: `src/components/layout/MobileNav.tsx` (L31)
- modificar: `src/hooks/useArticleSearch.ts` (L26)

**Critérios de Aceite:**
- [ ] `5000` → `TIMING.CAROUSEL_AUTOPLAY`
- [ ] `60` → `TIMING.STAR_ANIMATION_STEP`
- [ ] `1500` → `TIMING.COPY_FEEDBACK` (2×)
- [ ] `50` → `TIMING.FOCUS_DELAY`
- [ ] `500` → `TIMING.SEARCH_DEBOUNCE`
- [ ] Build passando

**Status:** TODO

---

## T007 — Migrar storage keys para STORAGE_KEYS (3 arquivos)

**Tipo:** SEQUENTIAL
**Dependências:** T003
**Arquivos:**
- modificar: `src/hooks/useCookieConsent.ts`
- modificar: `src/components/layout/ThemeProvider.tsx`
- modificar: `src/hooks/useLanguageDetection.ts`

**Descrição:**
Substituir constantes locais (`STORAGE_KEY`, `THEME_STORAGE_KEY`, `getStorageKey()`) por `STORAGE_KEYS.*`.

**Critérios de Aceite:**
- [ ] `'sf-cookie-consent'` → `STORAGE_KEYS.COOKIE_CONSENT`
- [ ] `'theme'` → `STORAGE_KEYS.THEME`
- [ ] Prefixo `sf-lang-dismissed-*` → `STORAGE_KEYS.langDismissed(domain)`
- [ ] Build passando

**Status:** TODO

---

## T008 — Atualizar barrel export

**Tipo:** SEQUENTIAL
**Dependências:** T001, T002, T003
**Arquivos:**
- modificar: `src/lib/constants/index.ts`

**Critérios de Aceite:**
- [ ] `analytics`, `timing`, `storage-keys` re-exportados
- [ ] Build passando

**Status:** TODO
