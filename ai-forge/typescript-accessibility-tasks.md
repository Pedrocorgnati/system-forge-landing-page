# Accessibility Tasks — SystemForge Landing Page

Gerado em: 2026-03-25
Stack: Next.js (TypeScript) — WCAG 2.1 AA

---

## Tarefas por Severidade

| # | Arquivo | Linha | Severidade (WCAG) | Problema | Correção proposta | Dependência |
|---|---------|-------|-------------------|----------|-------------------|-------------|
| 1 | `src/components/blog/SearchBar.tsx` | L44–L79 | **CRÍTICO (AA — 4.1.2)** | Input de busca não segue padrão ARIA Combobox: falta `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` e `aria-activedescendant` | Adicionar `aria-haspopup="listbox"`, `aria-expanded={showDropdown}`, `aria-controls="search-listbox"` no `<input>` e `id="search-listbox"` no div de resultados | — |
| 2 | `src/components/blog/SearchBar.tsx` | L44–L115 | **CRÍTICO (A — 2.1.1)** | Sem navegação por teclado (seta ↑↓) entre resultados do dropdown; padrão combobox exige controle por teclado | Implementar `onKeyDown` com `ArrowDown`/`ArrowUp` no input, controle de `aria-activedescendant`, e `Enter` para navegar ao resultado | — |
| 3 | `src/components/ui/NewsletterOptIn.tsx` | L144–L157 | **CRÍTICO (A — 3.3.2)** | Input de email sem `<label>` visível; `aria-label` não é substituto para `<label>` conforme WCAG 3.3.2 | Adicionar `<label htmlFor="newsletter-email">Seu email</label>` antes do input (pode ser `sr-only` se o design não permitir visível, mas label visível é preferível) | — |
| 4 | `src/components/blog/Pagination.tsx` | L37, L74 | **MODERADO (AA — 2.4.11)** | Links usam `focus:ring-2` em vez de `focus-visible:ring-2`; anel de foco aparece ao clicar com mouse, inconsistente com o restante do codebase | Substituir `focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1` por `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]` | — |
| 5 | `src/components/ui/Breadcrumb.tsx` | L58 | **MODERADO (AA — 2.4.11)** | Link de breadcrumb usa `focus:ring-1 focus:ring-primary` em vez de `focus-visible:*` | Substituir por `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]` | — |
| 6 | `src/components/sections/TestimonialsSection.tsx` | L167–L187 | **MODERADO (A — 4.1.2)** | `role="tablist"` com `<button role="tab">` sem `aria-controls` associando à área de conteúdo; não há `role="tabpanel"` correspondente | Associar cada dot via `aria-controls="testimonial-panel"` num elemento com `role="tabpanel" id="testimonial-panel"`, ou trocar para padrão carousel com `aria-roledescription="slide"` | — |
| 7 | `src/components/layout/Footer.tsx` | L66–L93 | **MODERADO (A — 3.2.2)** | Links externos (LinkedIn, GitHub) abrem em `target="_blank"` sem aviso acessível de nova aba | Adicionar `(abre em nova aba)` via `<span class="sr-only">` dentro do link, ou atualizar `aria-label` para incluir a informação. Ex: `aria-label="Pedro Corgnati no LinkedIn (abre em nova aba)"` | — |
| 8 | `src/app/layout.tsx` | L110–L115 | **BAIXO (informativo)** | Skip link usa `focus:not-sr-only` em vez de `focus-visible:not-sr-only`; o link pode ficar visível ao ser clicado via mouse | Substituir `focus:not-sr-only focus:fixed...` por `focus-visible:not-sr-only focus-visible:fixed...` | — |
| 9 | `src/components/sections/ContactSection.tsx` | L67 | **BAIXO (A — 1.1.1)** | `<span role="img" aria-label={channel.label}>` repete o label já visível no `<h3>` seguinte; screen readers anunciam a label duas vezes | Usar `aria-hidden="true"` no span do emoji, já que o texto descritivo imediatamente abaixo cobre a informação | — |
| 10 | `src/components/sections/HeroSection.tsx` | L57 | **BAIXO (informativo)** | Emoji `✓` usado diretamente em texto sem `aria-hidden="true"`; leitores de tela anunciam "marca de seleção pesada" ou "checkmark" | Envolver cada `✓` em `<span aria-hidden="true">✓</span>` | — |
| 11 | `src/components/layout/MobileNav.tsx` | L118 | **BAIXO (informativo)** | `<nav>` interno do drawer sem `aria-label`; o dialog pai tem label mas o elemento `<nav>` em si não | Adicionar `aria-label="Menu de navegação móvel"` ao `<nav>` | — |

---

## Legenda de Severidade

- **CRÍTICO** — Bloqueia ou impede uso por usuários de leitores de tela / teclado. Corrigir prioritariamente.
- **MODERADO** — Degrada experiência de acessibilidade mas não bloqueia completamente. Corrigir no próximo ciclo.
- **BAIXO** — Melhoria de semântica ou conformidade total. Pode ser incluído como melhoria contínua.
