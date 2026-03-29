# Performance Tasks — System Forge Landing Page

Gerado em: 2026-03-29
Stack: Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / Static Export

---

## Resumo Executivo

Projeto bem otimizado com arquitetura sólida: static export, zero dependências pesadas, useCallback/useMemo aplicados corretamente, cleanup de efeitos presente em todos os hooks. Pontos de melhoria concentrados em monitoramento de Web Vitals, lazy loading de imagens abaixo do fold e pequenos ajustes de renderização.

---

## Tasks

### T001 – StarRating: mover criação de array para fora do componente

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Status:** PENDING

**Arquivos:**
- modificar: `src/components/sections/TestimonialsSection.tsx`

**Descrição:**
`Array.from({ length: 5 })` é chamado dentro do corpo JSX do componente `StarRating`, criando um novo array a cada render. Como o array é estático (sempre 5 estrelas), deve ser extraído como constante fora do componente para evitar alocação desnecessária.

```tsx
// ANTES (dentro do componente)
{Array.from({ length: 5 }).map((_, i) => ...)}

// DEPOIS (fora do componente)
const STAR_INDICES = [0, 1, 2, 3, 4]
// ...
{STAR_INDICES.map((i) => ...)}
```

**Critérios de Aceite:**
- [ ] Constante `STAR_INDICES` (ou similar) declarada fora de `StarRating`
- [ ] JSX usa a constante no `.map()`
- [ ] Key mantém valor estável (não `Math.random()`, não `crypto.randomUUID()`)
- [ ] `npm run build` sem erros

**Estimativa:** 0.25h

---

### T002 – OptimizedImage: expor e defaultar `loading="lazy"` para imagens abaixo do fold

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Status:** PENDING

**Arquivos:**
- modificar: `src/components/ui/OptimizedImage.tsx`
- verificar: `src/components/blog/ArticleCard.tsx`
- verificar: `src/components/blog/ArticlePage.tsx`
- verificar: `src/components/pages/PortfolioFilteredList.tsx`
- verificar: `src/components/shared/PortfolioCard.tsx`
- verificar: `src/components/sections/RelatedProjects.tsx`

**Descrição:**
O wrapper `OptimizedImage` não expõe a prop `loading` nem define `loading="lazy"` como padrão. Imagens abaixo do fold (blog cards, portfolio cards, testimonials) não se beneficiam de lazy loading automático no static export, impactando LCP e uso de banda inicial.

O comportamento correto é:
- `priority={true}` → LCP image (hero) — sem `loading` attr
- `priority={false}` (default) + `loading="lazy"` → todas as demais

```tsx
interface OptimizedImageProps {
  // ...
  loading?: 'lazy' | 'eager'
}

export function OptimizedImage({ ..., loading = 'lazy', priority = false }: ...) {
  return (
    <Image
      // ...
      loading={priority ? undefined : loading}
    />
  )
}
```

**Critérios de Aceite:**
- [ ] `OptimizedImage` aceita e aplica prop `loading` (default `'lazy'`)
- [ ] Imagens com `priority={true}` (hero, logo) não recebem `loading` attr
- [ ] Nenhuma imagem abaixo do fold com `priority={true}` sem justificativa
- [ ] `npm run build` sem erros de tipo

**Estimativa:** 0.5h

---

### T003 – Adicionar monitoramento de Web Vitals (LCP, CLS, INP)

**Tipo:** SEQUENTIAL
**Dependências:** none
**Status:** PENDING

**Arquivos:**
- criar: `src/lib/performance/web-vitals.ts`
- modificar: `src/app/layout.tsx` (ou criar `src/app/_analytics.tsx`)
- verificar: `package.json` (instalar `web-vitals` se ausente)

**Descrição:**
O projeto não possui instrumentação de Web Vitals. Sem essa medição em produção, não há baseline para validar se otimizações (lazy loading, bundle splits, etc.) produziram impacto real em LCP, CLS e INP.

Implementar um reporter mínimo que captura as métricas e as envia para o endpoint de analytics já existente (ou `console.log` em dev como fallback):

```ts
// src/lib/performance/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'

export function reportWebVitals() {
  const send = (metric: { name: string; value: number; rating: string }) => {
    // envia para analytics ou console em dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metric.name, metric.value, metric.rating)
    }
    // navigator.sendBeacon('/api/vitals', JSON.stringify(metric)) — se houver endpoint
  }

  onCLS(send)
  onINP(send)
  onLCP(send)
  onFCP(send)
  onTTFB(send)
}
```

```tsx
// src/app/layout.tsx — dentro de um Client Component leve
'use client'
import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/performance/web-vitals'

export function WebVitalsReporter() {
  useEffect(() => { reportWebVitals() }, [])
  return null
}
```

**Critérios de Aceite:**
- [ ] `web-vitals` instalado (`npm install web-vitals`)
- [ ] `reportWebVitals()` chamado no layout raiz via Client Component leve
- [ ] Em dev: métricas aparecem no console com nome, valor e rating (good/needs-improvement/poor)
- [ ] Zero impacto no bundle de SSR (import apenas em Client Component)
- [ ] `npm run build` sem erros

**Estimativa:** 1h

---

### T004 – Adicionar `optimizePackageImports` no next.config.ts para lucide-react

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Status:** PENDING

**Arquivos:**
- modificar: `next.config.ts`

**Descrição:**
Next.js 13.5+ suporta `experimental.optimizePackageImports` que instrui o bundler a tree-shake bibliotecas com exports barrel (como `lucide-react`). Sem isso, importar qualquer ícone pode incluir todos os ícones no bundle.

```ts
const nextConfig: NextConfig = {
  // ...
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}
```

**Critérios de Aceite:**
- [ ] `experimental.optimizePackageImports: ['lucide-react']` adicionado ao `nextConfig`
- [ ] `npm run build` sem erros
- [ ] `npm run analyze` (opcional): confirmar redução do chunk contendo lucide

**Nota:** Verificar compatibilidade com Next.js 16 — se a API foi promovida a estável, usar sem `experimental`.

**Estimativa:** 0.25h

---

### T005 – Extrair CSS custom properties de animation delay para data attributes

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Status:** PENDING

**Arquivos:**
- verificar: `src/components/blog/ArticleCard.tsx:30` — `style={{ '--reveal-delay': ... }}`
- verificar: `src/components/sections/TestimonialsSection.tsx:24` — `style={animate ? { animationDelay: ... } : undefined}`

**Descrição:**
Inline styles com CSS custom properties (ex: `--reveal-delay`) funcionam, mas podem causar recalculation de estilo em rerenders porque React compara objetos por referência. Quando o valor é derivado de `index` (estático), a prop pode ser movida para um `data-index` attribute e o CSS lê via `calc()`:

```css
/* globals.css */
[data-reveal-index] {
  animation-delay: calc(attr(data-reveal-index number) * 120ms);
}
```

Ou, alternativa mais compatível: gerar as classes Tailwind com delay estático via `safelist` se os valores forem conhecidos.

**Critérios de Aceite:**
- [ ] Inline `style` com `--reveal-delay` ou `animationDelay` calculados por index removidos
- [ ] Substituição via `data-*` attr + CSS `var()` ou classes Tailwind com safelist
- [ ] Animações visuais mantidas identicamente
- [ ] `npm run build` sem erros

**Estimativa:** 1h

---

## Checklist Final

- [ ] T001: StarRating array extraído para constante externa
- [ ] T002: OptimizedImage com `loading="lazy"` por padrão
- [ ] T003: Web Vitals monitorados em produção (LCP/CLS/INP)
- [ ] T004: `optimizePackageImports` para lucide-react no next.config.ts
- [ ] T005: Animation delays via data attributes em vez de inline styles
- [ ] `npm run lint` sem warnings após todas as alterações
- [ ] `npm run build` bem-sucedido
- [ ] Métricas documentadas (LCP: before → after) após T003

---

## Achados Positivos (não requerem ação)

| Categoria | Status |
|-----------|--------|
| Static export (`output: 'export'`) | Excelente — elimina overhead de runtime |
| Zero dependências pesadas (sem lodash, moment, axios) | Excelente |
| useCallback em todos os handlers críticos | Bem aplicado |
| useMemo em computações caras (filtros, MDX) | Bem aplicado |
| useEffect com cleanup em todos os listeners | Sem memory leaks |
| Contexto único e focado (ThemeProvider) | Sem context bloat |
| Dynamic import para DevOverlayLoader | Dev tools excluídos do build de prod |
| Bundle analyzer configurado (`npm run analyze`) | Pronto para uso |
| IntersectionObserver com cleanup | ProcessSection, TestimonialsSection |
| React 19 + Next.js 16 | Stack atual |
