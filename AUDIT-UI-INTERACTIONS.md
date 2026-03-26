# AUDIT-UI-INTERACTIONS.md

**Projeto:** SystemForge Landing Page
**Data:** 2026-03-25
**Task:** TASK-5 / module-9-integration / ST001–ST004
**Auditor:** Claude Sonnet 4.6 (automated)

---

## Veredito Final

## ✅ APROVADO

**0 elementos sem handler.** Todos os elementos interativos possuem handlers funcionais.
**2 formulários auditados.** Ambos possuem `onSubmit` devidamente implementado.
**0 correções necessárias.** Nenhuma alteração de código foi aplicada.

---

## Sumário Executivo

| Categoria | Total elementos | Aprovados | Com problema |
|-----------|-----------------|-----------|--------------|
| Buttons (onClick) | 17 | 17 | 0 |
| Links (href) | 38+ | 38+ | 0 |
| Forms (onSubmit) | 2 | 2 | 0 |
| Inputs (onChange) | 5 | 5 | 0 |
| Checkboxes (onChange) | 2 | 2 | 0 |
| Divs role="button" (onClick + onKeyDown) | 4+ | 4+ | 0 |

---

## Auditoria por Componente

### 1. Header (`src/components/layout/Header.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Logo link (`/`) | `href="/"` via `next/link` | ✅ |
| Nav desktop links (NAV_LINKS) | `href={link.href}` via `next/link` | ✅ |
| Dark mode toggle button | `onClick={toggleTheme}` → `setTheme()` | ✅ |
| Hamburger button (mobile) | `onClick={() => setIsMobileNavOpen(true)}` | ✅ |

**Resultado:** 4/4 elementos com handlers. ✅ APROVADO

---

### 2. MobileNav (`src/components/layout/MobileNav.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Overlay backdrop (div) | `onClick={() => { onClose(); triggerRef.current?.focus() }}` | ✅ |
| Botão fechar (X) | `onClick={() => { onClose(); triggerRef.current?.focus() }}` | ✅ |
| Nav links (NAV_LINKS) | `href={link.href}` + `onClick={() => onClose()}` | ✅ |
| Fechar com ESC | `useEffect` → `document.addEventListener('keydown', ...)` | ✅ |

**Resultado:** 4/4 elementos com handlers. ✅ APROVADO

**Observação extra:** Foco retorna ao `triggerRef` (hamburger button) ao fechar — acessibilidade correta.

---

### 3. CTAButton (`src/components/ui/CTAButton.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| CTAButton (WhatsApp) | `onClick={handleClick}` → `isAllowedCTAHref()` + `window.open()` | ✅ |
| CTAButton (Calendly) | `onClick={handleClick}` → `isAllowedCTAHref()` + `window.open()` | ✅ |
| CTAButton (Budget Engine) | `onClick={handleClick}` → `isAllowedCTAHref()` + `window.open()` | ✅ |

**Observação CTA sem ENV:**
- `NEXT_PUBLIC_WHATSAPP_NUMBER` ausente → href vira `https://wa.me` (sem número)
- `NEXT_PUBLIC_CALENDLY_URL` ausente → href vira `https://calendly.com` (fallback genérico)
- `NEXT_PUBLIC_BUDGET_ENGINE_URL` ausente → href vira `https://budgetengine.app` (fallback genérico)
- ⏳ **Aguardando configuração do `.env.local`** para CTAs funcionais em produção.
- Não há `href="undefined"` — os fallbacks são URLs válidas na allowlist.

**Resultado:** 3/3 variantes com handlers. ✅ APROVADO (com observação de ENV)

---

### 4. PortfolioGallery (`src/components/sections/PortfolioGallery.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Botões de filtro de categoria (7 tabs) | `onClick={() => setActiveFilter(cat)}` | ✅ |
| Botão "Ver todos" (empty state) | `onClick={() => setActiveFilter('all')}` | ✅ |
| Link "Ver portfólio completo" | `href={ROUTES.PORTFOLIO}` via `next/link` | ✅ |

**Resultado:** 9/9 elementos com handlers. ✅ APROVADO

---

### 5. PortfolioFilteredList (`src/components/pages/PortfolioFilteredList.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Botões de filtro (11 tabs) | `onClick={() => setFilter(cat)}` | ✅ |
| Botão "Ver todos" (empty state) | `onClick={() => setFilter('all')}` | ✅ |
| Links de projetos (`project.url`) | `href={project.url}` via `next/link` + `target="_blank"` | ✅ |

**Resultado:** 13/13 elementos com handlers. ✅ APROVADO

---

### 6. ServicesGrid + ServiceCard (`src/components/sections/ServicesGrid.tsx`, `src/components/shared/ServiceCard.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| ServiceCard (cada serviço) | `href={ROUTES.SERVICE(service.slug)}` via `next/link` | ✅ |

**Resultado:** Todos os cards são links para `/servicos/{slug}`. ✅ APROVADO

---

### 7. TestimonialsSection (`src/components/sections/TestimonialsSection.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Botão "Anterior" | `onClick={handlePrev}` → `goTo(active - 1)` + `resetTimer()` | ✅ |
| Botão "Próximo" | `onClick={handleNext}` → `goTo(active + 1)` + `resetTimer()` | ✅ |
| Dots de navegação (N dots) | `onClick={() => { goTo(i); resetTimer() }}` | ✅ |
| Cards (grid lg) role="button" | `onClick={() => { goTo(i); resetTimer() }}` + `onKeyDown` (Enter/Space) | ✅ |
| Swipe touch | `onTouchStart={handleTouchStart}` + `onTouchEnd={handleTouchEnd}` | ✅ |

**Resultado:** 5 tipos de handlers implementados. ✅ APROVADO

**Observação de qualidade:** Cards do grid respeitam `prefers-reduced-motion` e têm `onKeyDown` para acessibilidade por teclado.

---

### 8. SearchBar (`src/components/blog/SearchBar.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Input de busca | `onChange={handleChange}` → `setInputValue()` | ✅ |
| Tecla ESC | `onKeyDown={handleKeyDown}` → `setInputValue('')` | ✅ |
| Resultados dropdown | `href={/blog/${result.slug}}` via `next/link` | ✅ |

**Observação:** SearchBar não usa `<form>` com submit — usa busca reativa com `useArticleSearch` debounced. Comportamento correto para busca live. Não há botão "Buscar" explícito, mas a busca dispara automaticamente ao digitar. **Sem bloqueador.**

**Resultado:** 3/3 elementos com handlers. ✅ APROVADO

---

### 9. CategoryFilter (`src/components/blog/CategoryFilter.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Link "Todos" | `href={ROUTES.BLOG}` via `next/link` | ✅ |
| Links por categoria | `href={ROUTES.BLOG_CATEGORY(encodeURIComponent(cat))}` via `next/link` | ✅ |

**Observação:** CategoryFilter é Server Component — usa links estáticos ao invés de onClick. Correto: filtro por URL, sem JS necessário.

**Resultado:** N+1 links com href. ✅ APROVADO

---

### 10. Pagination (`src/components/blog/Pagination.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Link "Anterior" | `href={prevHref}` via `next/link` (ou `<span aria-disabled>` quando na primeira) | ✅ |
| Link "Próxima" | `href={nextHref}` via `next/link` (ou `<span aria-disabled>` quando na última) | ✅ |
| Links de números de página | `href={pageHref}` via `next/link` (ou `<span aria-current>` para página atual) | ✅ |

**Observação:** Páginas desabilitadas são renderizadas como `<span>` (não links), com `aria-disabled="true"` — acessibilidade correta.

**Resultado:** Todos os links com href ou states desabilitados corretos. ✅ APROVADO

---

### 11. NewsletterOptIn (`src/components/ui/NewsletterOptIn.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| `<form>` | `onSubmit={handleSubmit}` | ✅ |
| Input email | `onChange={e => setFormData(...)}` | ✅ |
| Checkbox consentimento | `onChange={e => setFormData(...)}` | ✅ |
| Botão submit | `type="submit"` (acionado pelo form) | ✅ |
| Link "Política de Privacidade" | `href="/privacidade"` | ✅ |

**Resultado:** 5/5 elementos com handlers. ✅ APROVADO

---

### 12. NewsletterSection (`src/components/sections/NewsletterSection.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| `<form>` | `onSubmit={handleSubmit(onSubmit)}` (react-hook-form + zod) | ✅ |
| Input email | `{...register('email')}` (controlled by RHF) | ✅ |
| Checkbox consentimento | `{...register('consent')}` (controlled by RHF) | ✅ |
| Botão submit | `type="submit"` (acionado pelo form) | ✅ |

**Resultado:** 4/4 elementos com handlers. ✅ APROVADO

---

### 13. CookieBanner (`src/components/ui/CookieBanner.tsx`)

| Elemento | Handler | Status |
|----------|---------|--------|
| Botão "Recusar" | `onClick={() => setConsent('rejected')}` | ✅ |
| Botão "Aceitar todos" | `onClick={() => setConsent('accepted')}` | ✅ |
| Link "Saiba mais" | `href={ROUTES.PRIVACY}` via `next/link` | ✅ |

**Resultado:** 3/3 elementos com handlers. ✅ APROVADO

---

### 14. Outros componentes verificados

| Componente | Elementos interativos | Status |
|------------|----------------------|--------|
| `ContactSection.tsx` | CTAButton x3 (via CTAGroup) + email mailto link | ✅ |
| `CTASection.tsx` | CTAGroup com 3 CTAButtons | ✅ |
| `HeroSection.tsx` | CTAGroup com 3 CTAButtons | ✅ |
| `StrategicAdvisorTeaser.tsx` | CTAButton WhatsApp + Link "Voltar" | ✅ |
| `SidebarCTA.tsx` | CTAButton WhatsApp + link para serviço | ✅ |
| `CTAContextual.tsx` | CTAGroup 3 CTAs + link para serviço | ✅ |
| `ArticlePage.tsx` | Links de tags, artigos relacionados, newsletter inline | ✅ |
| `error.tsx` | Botão "Tentar novamente" com `onClick={reset}` | ✅ |
| `not-found.tsx` | Link home + link WhatsApp com fallback `5541999999999` | ✅ |
| `DataTestOverlay.tsx` (dev-only) | Toggle button + copy buttons | ✅ |

---

## Auditoria de Formulários (ST002)

```bash
# Resultado do grep "<form" no workspace:
# src/components/sections/NewsletterSection.tsx:69: <form onSubmit={handleSubmit(onSubmit)} ...
# src/components/ui/NewsletterOptIn.tsx:138:       <form onSubmit={handleSubmit} noValidate ...
```

| Arquivo | onSubmit presente? | Implementação | Status |
|---------|-------------------|---------------|--------|
| `NewsletterSection.tsx` | ✅ Sim | `react-hook-form` + `zodResolver` + `onSubmit` assíncrono | ✅ |
| `NewsletterOptIn.tsx` | ✅ Sim | `handleSubmit` manual com validação + fetch + abort timeout | ✅ |

**Conclusão:** 0 forms sem `onSubmit`. Nenhum bloqueador crítico.

---

## Auditoria de CTAs (ST003)

| CTA | href sem ENV | href com ENV | `href="undefined"`? | Status |
|-----|-------------|-------------|---------------------|--------|
| WhatsApp | `https://wa.me` (sem número) | `https://wa.me/5548999999999` | ❌ Não | ⏳ Aguardando ENV |
| Calendly | `https://calendly.com` (fallback) | `https://calendly.com/pedro-corgnati` | ❌ Não | ⏳ Aguardando ENV |
| Budget Engine | `https://budgetengine.app` (fallback) | URL real | ❌ Não | ⏳ Aguardando ENV |

**Segurança:** Todos os hrefs passam por `isAllowedCTAHref()` antes de `window.open()`. Domínios validados contra allowlist (`wa.me`, `calendly.com`, `budgetengine.app`). Nenhum open redirect possível (ENV_004 protegido).

**Ação necessária (pré-deploy):** Criar `.env.local` baseado em `.env.example` com os valores reais.

---

## Bloqueadores Encontrados

**Nenhum.** 0 elementos sem handler. 0 forms sem onSubmit. 0 CTAs com `href="undefined"`.

---

## Correções Aplicadas

**Nenhuma.** O código estava correto — auditoria passou sem necessidade de edições.

---

## Observações de Qualidade

1. **Acessibilidade por teclado:** MobileNav (ESC fecha + foco retorna), TestimonialsSection (cards com `onKeyDown` Enter/Space), todos os botões com `focus-visible:outline`.
2. **aria-* corretos:** `aria-expanded`, `aria-controls`, `aria-label`, `aria-selected`, `aria-current`, `aria-live`, `aria-disabled` — todos aplicados corretamente.
3. **Touch support:** TestimonialsSection com `onTouchStart`/`onTouchEnd` para swipe nativo.
4. **Server vs Client Components:** CategoryFilter e Pagination são Server Components com links estáticos — decisão arquitetural correta (sem JS desnecessário).
5. **Honeypot anti-bot:** Ambos os formulários de newsletter implementam campo honeypot `website` com detecção server-side e client-side.
6. **Abort controller:** NewsletterOptIn usa `AbortController` com timeout de 10 segundos — proteção contra requisições penduradas.
