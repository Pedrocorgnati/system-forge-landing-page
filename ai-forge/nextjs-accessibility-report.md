# PRD: Acessibilidade e Semântica — System Forge Landing Page

> Gerado por `/nextjs:accessibility` em 2026-03-29

---

## Problemas Encontrados

### Semântica (WCAG 1.3.1, 4.1.2)

- **`id="portfolio"` duplicado** — `PortfolioGallery` (src/components/sections/PortfolioGallery.tsx:56) e `PortfolioBento` (src/components/sections/PortfolioBento.tsx:388) usam o mesmo ID. Embora em páginas diferentes, viola WCAG 4.1.1 se ambos aparecerem no mesmo DOM.
- **Tabs sem `aria-controls` / `role="tabpanel"`** — `PortfolioGallery` e `TestimonialsSection` implementam `role="tablist"` + `role="tab"` + `aria-selected` mas **não** possuem `aria-controls` nos tabs nem `role="tabpanel"` no painel de conteúdo. WCAG 4.1.2.
- **`aria-hidden="false"` redundante** — `ContactSection` linha 181 usa `aria-hidden="false"`, que é o valor padrão e causa ruído desnecessário.

### Navegação por Teclado (WCAG 2.1.1, 2.1.2, 2.4.3)

- **MobileNav sem focus trap** — O drawer abre e foca o primeiro link, mas Tab/Shift+Tab não cicla dentro do drawer. Foco escapa para elementos fora. WCAG 2.1.2.
- **SearchBar combobox incompleto** — O `<input type="search">` não tem `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded` nem `aria-controls`. O `role="listbox"` do dropdown não é associado ao input. WCAG 4.1.2.
- **`ArticleCard` link usa `focus:ring-1`** — Usa `focus:outline-none focus:ring-1` (dispara em click também) em vez de `focus-visible:`. WCAG 2.4.7.

### Touch Targets (WCAG 2.5.5)

| Componente | Arquivo | Tamanho atual | Mínimo |
|-----------|---------|--------------|--------|
| `Button` size=sm | ui/Button.tsx:39 | `min-h-[32px]` | 44px |
| `CTAButton` size=sm | ui/CTAButton.tsx:49 | `min-h-[32px]` | 44px |
| PortfolioGallery filter pills | sections/PortfolioGallery.tsx:103 | `min-h-[36px]` | 44px |
| scrollable-chips | mobile/scrollable-chips.tsx:35 | `min-h-[40px]` | 44px |

### Conteúdo em Movimento (WCAG 2.2.2)

- **TestimonialsSection autoplay sem pausa** — Carrossel avança automaticamente a cada 5 segundos sem botão de pausa explícito. WCAG 2.2.2 exige controle para pausar, parar ou esconder conteúdo em movimento.

### ARIA (WCAG 4.1.2)

- **SearchBar**: `role="listbox"` no dropdown sem associação com o input (falta `aria-owns` ou `aria-controls`).
- **TestimonialsSection tabs**: `role="tab"` sem `aria-controls` apontando para o painel ativo.
- **PortfolioGallery tabs**: `role="tab"` sem `aria-controls` apontando para a grid de resultados.

---

## Conformidade WCAG 2.1

### Level A (Mínimo)
| Critério | Status | Notas |
|----------|--------|-------|
| 1.3.1 Info and Relationships | ⚠️ | Tab patterns incompletos |
| 2.1.1 Keyboard | ✅ | Todos os interativos são focáveis |
| 2.1.2 No Keyboard Trap | ❌ | MobileNav sem focus trap |
| 2.4.1 Bypass Blocks | ✅ | Skip link implementado |
| 4.1.1 Parsing | ⚠️ | ID duplicado em componentes distintos |
| 4.1.2 Name, Role, Value | ❌ | SearchBar combobox incompleto; tabs sem aria-controls |

### Level AA (Recomendado)
| Critério | Status | Notas |
|----------|--------|-------|
| 1.4.3 Contrast (Minimum) | ✅ | CSS vars com contraste adequado |
| 1.4.4 Resize Text | ✅ | Usa rem/em |
| 2.2.2 Pause, Stop, Hide | ❌ | Carousel autoplay sem pausa |
| 2.4.7 Focus Visible | ⚠️ | ArticleCard usa focus: em vez de focus-visible: |
| 2.5.5 Target Size | ❌ | Button sm, CTAButton sm, filtros < 44px |
| 3.1.1 Language of Page | ✅ | lang dinâmico via config |
| 4.1.3 Status Messages | ✅ | aria-live implementado em Newsletter, SearchBar |

---

## Pontos Positivos (não alterar)

- Skip link implementado corretamente em layout.tsx
- `lang` dinâmico por locale
- prefers-reduced-motion coberto globalmente em globals.css + por componente (TestimonialsSection, BlogPreviewCards)
- MobileNav retorna foco ao trigger ao fechar (triggerRef.current?.focus())
- CookieConsentModal com focus trap, Escape e restauração de foco completos
- Todos os botões de controle (header, mobile) têm min 44×44px
- aria-live em painéis dinâmicos (ServicesGrid detail panel, Newsletter states)
- Labels nos inputs do NewsletterOptIn com aria-describedby, aria-invalid
- Imagens com alt descritivo
- SVGs decorativos com aria-hidden="true"

---

## Impacto
- Componentes afetados: 6
- Páginas afetadas: 3 (home, blog, portfolio)
- Risco: **MÉDIO** (problemas de keyboard navigation e ARIA patterns incompletos)
