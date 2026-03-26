# Relatório de Acessibilidade — SystemForge Landing Page

**Data:** 2026-03-25
**Auditor:** /typescript:accessibility
**Escopo:** `src/` completo (Next.js TypeScript, WCAG 2.1 AA)
**Config:** `.claude/projects/system-forge-landing-page.json`

---

## Resumo Executivo

O projeto apresenta **fundação de acessibilidade sólida** — a grande maioria dos padrões críticos está implementada corretamente. Foram identificados **3 problemas críticos**, **4 problemas moderados** e **4 melhorias informativas**.

### Estado Geral por Domínio

| Domínio | Status | Notas |
|---------|--------|-------|
| Landmarks ARIA (`<header>`, `<nav>`, `<main>`, `<footer>`) | ✅ OK | Todos presentes com `aria-label` adequados |
| Skip link | ✅ OK (com ressalva) | Funciona, mas usa `focus:` em vez de `focus-visible:` |
| Imagens e `alt` text | ✅ OK | `alt` obrigatório em `OptimizedImage`; decorativas com `aria-hidden` |
| Formulários com labels e feedbacks | ⚠️ PARCIAL | Newsletter email sem `<label>` visível |
| Hierarquia de headings | ✅ OK | H1 → H2 → H3 sem saltos |
| Navegação por teclado | ⚠️ PARCIAL | SearchBar sem setas no dropdown |
| Focus visible | ⚠️ PARCIAL | Pagination e Breadcrumb com `focus:` em vez de `focus-visible:` |
| Live regions e mensagens dinâmicas | ✅ OK | `aria-live` implementado em carousel, newsletter, cookie banner |
| Contraste (estimado) | ✅ OK | `--foreground: #0F172A` sobre `--background: #FFFFFF` → ratio ~19:1 |
| `prefers-reduced-motion` | ✅ OK | CSS global + carousel pausa auto-advance |
| ARIA roles interativos | ⚠️ PARCIAL | Tabs sem `aria-controls`; combobox incompleto |
| Idioma da página | ✅ OK | `lang="pt-BR"` no `<html>` |

---

## Problemas Críticos (WCAG A/AA)

### 1. SearchBar — Padrão Combobox Incompleto
**Arquivo:** `src/components/blog/SearchBar.tsx#L44–L79`
**WCAG:** 4.1.2 (A) — Name, Role, Value

O input de busca exibe um dropdown com resultados mas não comunica isso a leitores de tela. O padrão ARIA Combobox exige:
- `aria-haspopup="listbox"` no input
- `aria-expanded={showDropdown}` no input
- `aria-controls` apontando para o `id` do listbox
- `aria-activedescendant` para anunciar o item focado

**Situação atual:**
```tsx
// SearchBar.tsx#L44
<input
  type="search"
  aria-label="Buscar artigos no blog"
  // ❌ sem aria-haspopup, aria-expanded, aria-controls
/>
<div role="listbox" aria-label="Resultados da busca">
  <li role="option" aria-selected={false}>  // ❌ li wrapping Link — mismatch
```

**Correção necessária:**
```tsx
<input
  type="search"
  role="combobox"
  aria-haspopup="listbox"
  aria-expanded={showDropdown}
  aria-controls="search-results-listbox"
  aria-autocomplete="list"
  aria-activedescendant={activeId ?? undefined}
  ...
/>
<div role="listbox" id="search-results-listbox" ...>
  <div role="option" id={`result-${slug}`} aria-selected={activeSlug === slug}>
    <Link ...>{title}</Link>
  </div>
```

---

### 2. SearchBar — Sem Navegação por Teclado no Dropdown
**Arquivo:** `src/components/blog/SearchBar.tsx#L44–L115`
**WCAG:** 2.1.1 (A) — Keyboard

Usuários de teclado não conseguem navegar entre os resultados de busca. O `handleKeyDown` atual trata apenas `Escape` (limpar input). O padrão combobox ARIA exige `ArrowDown`/`ArrowUp` para mover entre opções e `Enter` para selecionar.

**Impacto:** Usuários que dependem de teclado não podem usar a busca do blog.

---

### 3. NewsletterOptIn — Input de Email Sem `<label>` Visível
**Arquivo:** `src/components/ui/NewsletterOptIn.tsx#L144–L157`
**WCAG:** 3.3.2 (A) — Labels or Instructions

```tsx
// ❌ Sem <label> vinculado
<input
  type="email"
  name="email"
  aria-label="Seu email"     // programático apenas
  placeholder="seu@email.com"  // não é label
/>
```

WCAG 3.3.2 exige labels ou instruções visíveis para entradas de formulário. `aria-label` provê nome acessível mas não é visível. O `placeholder` desaparece ao digitar e não é reconhecido por todos os assistivos como label.

**Correção:**
```tsx
<label htmlFor="newsletter-email" className="sr-only">Seu email</label>
<input
  id="newsletter-email"
  type="email"
  aria-describedby={emailError ? 'newsletter-email-error' : undefined}
  ...
/>
```
*(Se design permite, tornar o label visível é mais robusto que `sr-only`.)*

---

## Problemas Moderados

### 4. Pagination + Breadcrumb — `focus:ring` em vez de `focus-visible:ring`
**Arquivos:**
- `src/components/blog/Pagination.tsx#L37, L74`
- `src/components/ui/Breadcrumb.tsx#L58`

```tsx
// ❌ Atual — focus ring aparece ao clicar com mouse
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"

// ✅ Padrão do resto do codebase
className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
```

O restante do codebase usa corretamente `focus-visible:*`. Estes dois componentes ficaram inconsistentes.

---

### 5. TestimonialsSection — Tabs sem `aria-controls` / `role="tabpanel"`
**Arquivo:** `src/components/sections/TestimonialsSection.tsx#L167–L187`
**WCAG:** 4.1.2 (A)

```tsx
// ❌ tablist sem tabpanel correspondente
<div role="tablist" aria-label="Navegar entre depoimentos">
  <button role="tab" aria-selected={i === active} ...>
    {/* sem aria-controls="testimonial-panel" */}
  </button>
</div>

<div aria-live="polite">  {/* não tem role="tabpanel" */}
  <div role="article" ...>
```

O padrão tabs exige que cada `role="tab"` tenha `aria-controls` apontando para `role="tabpanel"`. Alternativa: converter para padrão carousel com `role="region"` e `aria-roledescription="slide"`.

---

### 6. Footer — Links Externos Sem Aviso de Nova Aba
**Arquivo:** `src/components/layout/Footer.tsx#L66–L93`
**WCAG:** 3.2.2 (A)

```tsx
// ❌ Abre nova aba sem informar o usuário
<a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
  Pedro Corgnati no LinkedIn
</a>

// ✅ Correção
<a href={SITE.linkedin} target="_blank" rel="noopener noreferrer"
   aria-label="Pedro Corgnati no LinkedIn (abre em nova aba)">
  Pedro Corgnati no LinkedIn
  <span className="sr-only"> (abre em nova aba)</span>
</a>
```

---

## Melhorias Informativas (Baixa Prioridade)

### 7. Skip Link com `focus:` em vez de `focus-visible:`
**Arquivo:** `src/app/layout.tsx#L110`

```tsx
// ❌ Atual
className="sr-only focus:not-sr-only focus:fixed ..."
// ✅ Recomendado
className="sr-only focus-visible:not-sr-only focus-visible:fixed ..."
```

### 8. ContactSection — Emoji com `aria-label` Redundante
**Arquivo:** `src/components/sections/ContactSection.tsx#L67`

```tsx
// ❌ Anuncia "WhatsApp" duas vezes (emoji + h3)
<span role="img" aria-label={channel.label}>{channel.icon}</span>
<h3>{channel.label}</h3>

// ✅ Ocultar emoji
<span aria-hidden="true">{channel.icon}</span>
<h3>{channel.label}</h3>
```

### 9. HeroSection — Emoji `✓` sem `aria-hidden`
**Arquivo:** `src/components/sections/HeroSection.tsx#L57`

```tsx
// ❌ Screen reader lê "marca de seleção pesada Sem fidelidade"
✓ Sem fidelidade &nbsp;&nbsp; ✓ Orçamento gratuito ...

// ✅
<span aria-hidden="true">✓</span> Sem fidelidade
```

### 10. MobileNav — `<nav>` sem `aria-label`
**Arquivo:** `src/components/layout/MobileNav.tsx#L118`

```tsx
// ❌ nav sem label dentro do dialog
<nav>

// ✅
<nav aria-label="Menu de navegação móvel">
```

---

## O Que Está Muito Bem ✅

Estes padrões foram implementados com qualidade acima da média:

- **Focus trap no MobileNav** — ESC, Tab cíclico, retorno de foco ao hamburger (`MobileNav.tsx`)
- **`aria-expanded` + `aria-controls` no hamburger** — comunicação correta de estado (`Header.tsx#L103–L105`)
- **`aria-live="polite"` no carousel de depoimentos** com `aria-atomic="true"` (`TestimonialsSection.tsx#L136`)
- **`prefers-reduced-motion`** — CSS global + carousel para auto-advance (`globals.css#L298–L307`)
- **`:focus-visible` global** — regra base correta em `globals.css#L419–L424`
- **`aria-busy` + `aria-disabled` no Button** durante loading (`Button.tsx#L77–L78`)
- **`aria-invalid` + `aria-describedby` nos campos** do newsletter (`NewsletterOptIn.tsx`)
- **`role="status"` + `aria-live`** no sucesso do newsletter
- **Skip link implementado** com `href="#main-content"` → `<main id="main-content">` (`layout.tsx`)
- **`lang="pt-BR"` no `<html>`** (`layout.tsx#L99`)
- **`scroll-margin-top`** para anchors sob header sticky (`globals.css#L414–L417`)
- **`aria-hidden="true"` em SVGs decorativos** — consistente em toda a codebase
- **`min-h-[44px]`** em todos os botões — alvos de toque adequados (WCAG 2.5.5)
- **Breadcrumb com `aria-current="page"`** e JSON-LD (`Breadcrumb.tsx`)
- **`<dl>/<dt>/<dd>`** para estatísticas no Hero (`HeroSection.tsx#L77–L85`)

---

## Testes Recomendados

```bash
# Testes automatizados (instalar axe-playwright se ainda não tiver)
npx playwright test --grep accessibility

# Verificação manual recomendada:
# 1. Navegar todo o site apenas com Tab/Shift+Tab + Enter/Space
# 2. Testar SearchBar: Tab até o input, digitar 2+ chars, tentar Arrow Down
# 3. Testar NewsletterOptIn com NVDA/VoiceOver — anuncia label correta?
# 4. Testar MobileNav: hamburger → drawer → ESC → foco volta ao hamburger?
# 5. Verificar skip link: primeira tecla Tab deve mostrar "Pular para o conteúdo"
```

---

## Próximos Passos

1. **Prioridade 1 (sprints próximos):** Corrigir tarefas #1, #2, #3 (SearchBar combobox + Newsletter label)
2. **Prioridade 2 (backlog próximo):** Corrigir #4, #5, #6, #7 (focus-visible, tabs, footer)
3. **Prioridade 3 (melhoria contínua):** #8, #9, #10, #11

Dependência de outros comandos: nenhuma — todos os problemas são de acessibilidade pura.
