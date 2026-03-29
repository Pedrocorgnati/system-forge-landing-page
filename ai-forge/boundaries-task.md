# BOUNDARIES AUDIT — Server/Client Separation

**Data:** 2026-03-29
**Status:** COMPLETED

---

## Resumo da auditoria

- **Total de arquivos com `'use client'`:** 58 (single-quote — grep com double-quote retorna zero; usar `grep 'use client'`)
- **`server-only` / `client-only`:** nenhum importado — não existem módulos com secrets de servidor ou libs exclusivamente browser que precisem desse guard neste projeto (SSG puro, sem Prisma/fs/credenciais servidor)
- **`suppressHydrationWarning`:** 4 ocorrências, todas justificadas
- **Hydration risks (Date/Math.random no JSX):** nenhum em Client Components; uso em Server Components é seguro

---

## Problemas corrigidos

### T001 – `'use client'` desnecessário em `HeroSection.tsx`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/sections/HeroSection.tsx`

**Descrição:** Componente não possui hooks, event handlers nem browser APIs. CSS animations (`animate-marquee-hero`, `hero-enter`) são pure-CSS. Importa `CTAButton` (que tem `'use client'`), mas Server Components podem renderizar Client Components normalmente.

**Correção:** `'use client'` removido. Componente promovido a Server Component.
**Linhas alteradas:** -1 linha (`'use client'` + linha em branco)
**Status:** COMPLETED ✓

---

### T002 – `'use client'` desnecessário em `StrategicAdvisorTeaser.tsx`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/sections/StrategicAdvisorTeaser.tsx`

**Descrição:** Componente renderiza conteúdo estático, lista de benefits e `CTAButton`. Nenhum hook ou handler próprio.

**Correção:** `'use client'` removido. Componente promovido a Server Component.
**Linhas alteradas:** -1 linha
**Status:** COMPLETED ✓

---

### T003 – `'use client'` desnecessário em `ClientLogosStrip.tsx`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/sections/ClientLogosStrip.tsx`

**Descrição:** Marquee de vídeos com dados estáticos. CSS animation `animate-marquee`. Sem hooks ou event handlers.

**Correção:** `'use client'` removido. Componente promovido a Server Component.
**Linhas alteradas:** -1 linha
**Status:** COMPLETED ✓

---

### T004 – `'use client'` desnecessário em `CTAGroup.tsx`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/ui/CTAGroup.tsx`

**Descrição:** Wrapper que mapeia `CTAConfig[]` para `CTAButton` (que já tem `'use client'`). Sem hooks, handlers ou browser APIs próprios. Props (`CTAConfig[]`) são JSON-serializáveis.

**Correção:** `'use client'` removido. Componente promovido a Server Component.
**Linhas alteradas:** -1 linha
**Status:** COMPLETED ✓

---

## Itens inspecionados sem problema

| Arquivo | Veredicto |
|---------|-----------|
| `layout.tsx` → `suppressHydrationWarning` em `<html>` | OK — padrão Next.js para ThemeProvider que injeta classes no html |
| `JsonLdBreadcrumb/Service/Faq.tsx` → `suppressHydrationWarning` em `<script>` | OK — proteção defensiva contra browser extensions que modificam tags script (ad blockers, SEO tools) |
| `Footer.tsx` → `new Date().getFullYear()` | OK — Server Component; valor computado uma vez no servidor, sem re-render cliente |
| `RelatedArticles.tsx` → `Intl.DateTimeFormat('pt-BR')` | OK — Server Component; sem hydration mismatch |
| `lib/analytics.ts` → `window` sem `'use client'` | OK — guarda com `typeof window === 'undefined'` explícito; comentário documenta uso exclusivo em Client Components |
| `BlogPreviewCards.tsx` → `window.matchMedia` | OK — acesso dentro de `useEffect` (componente tem `'use client'`) |
| `TestimonialsSection.tsx` → `window.matchMedia` | OK — acesso dentro de `useEffect` (componente tem `'use client'`) |
| `useLanguageDetection.ts` → `localStorage` | OK — acesso em helper interno chamado apenas do `useEffect` |
| `useCookieConsent.ts` → `localStorage` / `Date.now()` | OK — hook com `'use client'`, acessos em `useEffect` |
| `Button.tsx` → `forwardRef` com `'use client'` | OK — forwardRef + ref forwarding requer boundary client para uso interativo |
| `EmptyStateSearch/Portfolio.tsx` → `onClick` callback | OK — renderizam `<button onClick={onClear}>` → `'use client'` necessário |

---

## Métricas finais

| Métrica | Valor |
|---------|-------|
| `'use client'` eliminados | 4 |
| Componentes promovidos a Server Component | 4 (`HeroSection`, `StrategicAdvisorTeaser`, `ClientLogosStrip`, `CTAGroup`) |
| Hydration issues corrigidos | 0 (nenhum encontrado) |
| `suppressHydrationWarning` não justificados | 0 |
| `server-only` / `client-only` adicionados | 0 (não aplicável — SSG sem secrets servidor) |
| Fetchs movidos para Server | 0 (não aplicável — sem `useEffect+fetch` antipattern) |
| Providers centralizados | sim — `ThemeProvider` já em `app/providers.tsx`-equivalent |
| Erros de build | 0 |
| Warnings de lint relacionados | 0 |

---

## Validação

```
✓ npm run lint    → 0 errors, 27 warnings (pré-existentes, não relacionados a boundaries)
✓ npm run build   → Compiled successfully in 6.2s, 959 páginas geradas
```
