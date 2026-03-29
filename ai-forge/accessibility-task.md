# Accessibility Tasks — System Forge Landing Page

> Gerado por `/nextjs:accessibility` em 2026-03-29

---

### T001 — Fix MobileNav: implementar focus trap completo

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/layout/MobileNav.tsx`

**Descrição:**
Adicionar ciclo Tab/Shift+Tab dentro do drawer. Quando o foco estiver no último elemento focável e o usuário pressionar Tab, redirecionar para o primeiro. Quando no primeiro e Shift+Tab, redirecionar para o último.

**WCAG:** 2.1.2 (No Keyboard Trap)

**Critérios de Aceite:**
- [ ] Tab cicla dentro do drawer sem escapar
- [ ] Shift+Tab cicla corretamente para o último elemento
- [ ] Escape fecha e retorna foco ao trigger
- [ ] Testado navegação por teclado apenas

**Estimativa:** 1h

---

### T002 — Fix SearchBar: combobox ARIA pattern

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/blog/SearchBar.tsx`

**Descrição:**
Adicionar `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded={showDropdown}`, `aria-controls="search-listbox"` no input. Adicionar `id="search-listbox"` no div `role="listbox"`. Adicionar `aria-autocomplete="list"` no input.

**WCAG:** 4.1.2 (Name, Role, Value)

**Critérios de Aceite:**
- [ ] Input tem role="combobox"
- [ ] aria-expanded reflete estado correto
- [ ] aria-controls aponta para o listbox
- [ ] Screen reader anuncia resultados corretamente

**Estimativa:** 30min

---

### T003 — Fix TestimonialsSection: adicionar pause button para autoplay

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/sections/TestimonialsSection.tsx`

**Descrição:**
Adicionar estado `isPaused` e botão de pause/play. Quando pausado, o timer não avança. Botão deve ter aria-label descritivo ("Pausar depoimentos" / "Retomar depoimentos"). Integrar com prefers-reduced-motion: se ativo, iniciar como pausado.

**WCAG:** 2.2.2 (Pause, Stop, Hide)

**Critérios de Aceite:**
- [ ] Botão de pausa visível e acessível por teclado
- [ ] Carousel para de avançar quando pausado
- [ ] aria-label correto no botão
- [ ] prefers-reduced-motion inicia como pausado

**Estimativa:** 1h

---

### T004 — Fix TestimonialsSection tabs: aria-controls e tabpanel

**Tipo:** SEQUENTIAL
**Dependências:** T003
**Arquivos:**
- modificar: `src/components/sections/TestimonialsSection.tsx`

**Descrição:**
Adicionar `id` ao card ativo (ex: `testimonial-panel`). Adicionar `aria-controls="testimonial-panel"` em cada dot/tab. Adicionar `role="tabpanel"` e `aria-labelledby` no container do testimonial ativo.

**WCAG:** 4.1.2 (Name, Role, Value)

**Critérios de Aceite:**
- [ ] Cada tab tem aria-controls apontando para o panel
- [ ] Panel tem role="tabpanel"
- [ ] Panel tem aria-labelledby apontando para o tab ativo
- [ ] Testado com screen reader

**Estimativa:** 30min

---

### T005 — Fix PortfolioGallery: tabpanel e aria-controls nos filtros

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/sections/PortfolioGallery.tsx`

**Descrição:**
Adicionar `id="portfolio-filter-panel"` na grid de projetos. Adicionar `aria-controls="portfolio-filter-panel"` em cada tab de filtro. Adicionar `role="tabpanel"` e `aria-label` na grid.

**WCAG:** 4.1.2 (Name, Role, Value)

**Critérios de Aceite:**
- [ ] Cada tab tem aria-controls apontando para a grid
- [ ] Grid tem role="tabpanel" e aria-label
- [ ] Testado com screen reader

**Estimativa:** 30min

---

### T006 — Fix touch targets: Button sm, CTAButton sm, filtros PortfolioGallery, scrollable-chips

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/components/ui/Button.tsx`
- modificar: `src/components/ui/CTAButton.tsx`
- modificar: `src/components/sections/PortfolioGallery.tsx`
- modificar: `src/components/mobile/scrollable-chips.tsx`

**Descrição:**
Alterar tamanho mínimo do size=sm de `min-h-[32px]` para `min-h-[36px]` (touch target menor tolerado pelo WCAG 2.5.8, versão relaxada) ou `min-h-[44px]` (WCAG 2.5.5 estrito). Para filtros de PortfolioGallery: `min-h-[36px]` → `min-h-[44px]`. Para scrollable-chips: `min-h-[40px]` → `min-h-[44px]`.

**WCAG:** 2.5.5 (Target Size)

**Critérios de Aceite:**
- [ ] Button sm ≥ 44px de altura
- [ ] CTAButton sm ≥ 44px de altura
- [ ] Filtros PortfolioGallery ≥ 44px
- [ ] scrollable-chips ≥ 44px

**Estimativa:** 30min

---

### T007 — Fix ContactSection: remover aria-hidden="false" redundante

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/components/sections/ContactSection.tsx`

**Descrição:**
Remover atributo `aria-hidden="false"` da div do email fallback (linha 181). O valor padrão é false e este atributo é ruído.

**WCAG:** 4.1.2 (semântica limpa)

**Critérios de Aceite:**
- [ ] Atributo removido
- [ ] Sem regressões

**Estimativa:** 5min

---

### T008 — Fix ArticleCard: focus → focus-visible

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/components/blog/ArticleCard.tsx`

**Descrição:**
Substituir `focus:outline-none focus:ring-1 focus:ring-primary` por `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary` no link do título do artigo.

**WCAG:** 2.4.7 (Focus Visible)

**Critérios de Aceite:**
- [ ] Ring só aparece em navegação por teclado, não em clique
- [ ] Focus visível em keyboard navigation

**Estimativa:** 5min
