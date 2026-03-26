# AUDIT-ACCESSIBILITY.md

**Projeto:** SystemForge Landing Page
**Data:** 2026-03-25
**Tipo:** Revisão manual de código (WCAG 2.1 AA)
**Nota:** Axe-core requer servidor rodando — verificação manual de código realizada.

---

## Resultado Final

## ✅ APROVADO (com correções aplicadas)

3 violações encontradas, todas corrigidas antes da emissão deste relatório.

---

## Checklist Manual

### 1. Estrutura Global (`app/layout.tsx`)

| Item | Status | Detalhe |
|------|--------|---------|
| `<html lang="pt-BR">` definido | ✅ PASS | Linha 99 |
| `<main id="main-content">` como landmark | ✅ PASS | Linha 123 |
| `<header>` como landmark semântico | ✅ PASS | Header.tsx |
| `<footer>` como landmark semântico | ✅ PASS | Footer.tsx |
| `<nav aria-label>` nos elementos de navegação | ✅ PASS | "Navegação principal", "Links do rodapé" |
| Skip-to-content como primeiro elemento focável | ✅ PASS | `href="#main-content"` — layout.tsx linha 111 |
| `#main-content` corresponde ao `id` do `<main>` | ✅ PASS | `id="main-content"` — layout.tsx linha 123 |

### 2. Navegação por Teclado

| Item | Status | Detalhe |
|------|--------|---------|
| Ausência de `tabIndex > 0` | ✅ PASS | Nenhum encontrado. `tabIndex={0}` usado apenas em `role="button"` div (TestimonialsSection) — aceitável |
| `tabIndex={-1}` no honeypot do formulário | ✅ PASS | NewsletterOptIn.tsx linha 214, NewsletterSection.tsx linha 79 |
| Focus visible em todos os elementos interativos | ✅ PASS | `focus-visible:outline-2` ou `focus:ring-2` em todos os botões, links e inputs |
| `outline-none` sempre acompanhado de `ring` substituto | ✅ PASS | Todos os 9 casos de `outline-none` têm `focus:ring-*` ou `focus-visible:outline-*` equivalente |

### 3. Header e MobileNav

| Item | Status | Detalhe |
|------|--------|---------|
| `aria-label` no botão hamburger | ✅ PASS | "Abrir menu de navegação" — Header.tsx linha 105 |
| `aria-expanded` no botão hamburger | ✅ PASS | Header.tsx linha 103 |
| `aria-controls` no botão hamburger | ✅ PASS | `aria-controls="mobile-nav"` — Header.tsx linha 104 |
| `role="dialog"` no MobileNav | ✅ PASS | MobileNav.tsx linha 59 |
| `aria-modal="true"` no MobileNav | ✅ PASS | MobileNav.tsx linha 60 |
| `aria-label` no MobileNav | ✅ PASS | "Menu de navegação" — MobileNav.tsx linha 61 |
| ESC fecha o MobileNav e retorna foco ao trigger | ✅ PASS | MobileNav.tsx — handleKeyDown |
| Focus trap no MobileNav | ✅ FIXED | **Violação crítica corrigida** — ver seção de correções |
| Botão fechar com `aria-label` | ✅ PASS | "Fechar menu" — MobileNav.tsx linha 80 |
| Tamanho mínimo de toque 44×44px nos links mobile | ✅ PASS | `min-h-[44px]` aplicado |

### 4. CTAButton e Links Externos

| Item | Status | Detalhe |
|------|--------|---------|
| `aria-label` descritivo nos CTAButtons | ✅ PASS | `aria-label={config.label + (WhatsApp ? ' (WhatsApp)' : '')}` — CTAButton.tsx linha 59 |
| Links externos com `aria-label` indicando nova aba | ✅ PASS | PortfolioCard.tsx: `"Ver ${project.name} (abre em nova aba)"` |
| Footer — links sociais com texto descritivo visível | ✅ PASS | "Pedro Corgnati no LinkedIn", "Pedrocorgnati no GitHub" |
| Ícones SVG decorativos com `aria-hidden="true"` | ✅ PASS | Footer, CTAButton, TestimonialsSection |

### 5. Carousel de Testimonials (`TestimonialsSection.tsx`)

| Item | Status | Detalhe |
|------|--------|---------|
| `aria-label` na seção do carousel | ✅ PASS | `aria-label="Depoimentos de clientes"` — linha 117 |
| `aria-live="polite"` na região do slide ativo | ✅ PASS | `aria-live="polite" aria-atomic="true"` — linha 136-137 |
| Botão "anterior" com `aria-label` | ✅ PASS | "Depoimento anterior" — linha 195 |
| Botão "próximo" com `aria-label` | ✅ PASS | "Próximo depoimento" — linha 207 |
| Dots de navegação com `aria-label` individual | ✅ PASS | `aria-label="Depoimento de ${t.name}"` |
| `role="tablist"` + `aria-selected` nos dots | ✅ PASS | Linha 167-172 |
| Respeita `prefers-reduced-motion` | ✅ PASS | Auto-advance desativado quando reduzido — linha 74 |
| `role="article"` nos cards de depoimento | ✅ PASS | Linha 145 |

### 6. Formulário NewsletterOptIn (`NewsletterOptIn.tsx`)

| Item | Status | Detalhe |
|------|--------|---------|
| `aria-label` no input email | ✅ PASS | "Seu email" — linha 149 |
| `aria-invalid` quando há erro | ✅ PASS | Linha 150 |
| `aria-describedby` para erro de email | ✅ PASS | `newsletter-email-error` — linha 151 |
| `<label>` para checkbox de consentimento | ✅ PASS | `htmlFor="newsletter-consent"` — linha 167 |
| `aria-describedby` para erro de consentimento | ✅ PASS | `newsletter-consent-error` — linha 181 |
| `aria-busy` durante submitting | ✅ PASS | Button component tem `aria-busy={loading}` — Button.tsx linha 21 |
| `role="status"` + `aria-live` na mensagem de sucesso | ✅ PASS | `role="status"` linha 125, `aria-live="polite"` linha 108 |
| Honeypot com `aria-hidden="true"` e `tabIndex={-1}` | ✅ PASS | Linha 214-215 |
| `role="alert"` nas mensagens de erro | ✅ PASS | `role="alert"` linha 156 e 200 |

### 7. Formulário NewsletterSection (`NewsletterSection.tsx`)

| Item | Status | Detalhe |
|------|--------|---------|
| `<label htmlFor>` para email e consent | ✅ PASS | `htmlFor="email"` e `htmlFor="consent"` |
| `aria-invalid` + `aria-describedby` nos campos | ✅ PASS | Linhas 96-97, 112-113 |
| `role="alert"` nas mensagens de erro | ✅ PASS | Linhas 100, 120 |
| `aria-busy` no botão de submit | ✅ FIXED | **Violação moderada corrigida** |
| `role="status"` na mensagem de sucesso | ✅ FIXED | **Violação moderada corrigida** |
| Honeypot com `aria-hidden="true"` e `tabIndex={-1}` | ✅ PASS | Linha 79-81 |

### 8. CookieBanner (`CookieBanner.tsx`)

| Item | Status | Detalhe |
|------|--------|---------|
| Semântica de landmark correta | ✅ FIXED | **Violação séria corrigida** — ver seção de correções |
| `aria-label` descritivo | ✅ PASS | "Aviso de cookies" |
| `aria-live="polite"` | ✅ PASS | Presente |
| Botões com `aria-label` | ✅ PASS | "Recusar cookies não essenciais", "Aceitar todos os cookies" |

### 9. Imagens

| Item | Status | Detalhe |
|------|--------|---------|
| Nenhuma `<Image>` sem `alt` | ✅ PASS | OptimizedImage.tsx requer `alt: string` na interface |
| Nenhum `alt=""` sem `role="presentation"` | ✅ PASS | Nenhum `alt=""` encontrado no codebase |
| HeroSection — alt descritivo | ✅ PASS | "Ilustração de desenvolvimento de software" |
| ArticlePage — alt usa título do artigo | ✅ PASS | `alt={article.title}` |
| PortfolioCard — alt usa nome do projeto | ✅ PASS | `alt={project.name}` |
| ArticleCard — alt usa título do artigo | ✅ PASS | `alt={article.title}` |
| Link da imagem com `aria-hidden="true"` (duplicado) | ✅ PASS | ArticleCard.tsx — link da imagem decorativa com `aria-hidden="true"` e `tabIndex={-1}` |

### 10. Semântica Geral

| Item | Status | Detalhe |
|------|--------|---------|
| `<h1>` único por página | ✅ PASS | HeroSection, páginas de artigo, páginas de serviço |
| Hierarquia de headings (h1→h2→h3) | ✅ PASS | Sem saltos de nível detectados |
| `<time dateTime>` em datas | ✅ PASS | ArticleCard.tsx, ArticlePage.tsx |
| `<dl>` para estatísticas | ✅ PASS | HeroSection stats bar usa `<dl>/<dt>/<dd>` |
| `<blockquote>` nos depoimentos | ✅ PASS | TestimonialsSection.tsx linha 149 |
| `role="img" aria-label` nos grupos de estrelas | ✅ PASS | StarRating: `role="img" aria-label="5 estrelas"` |
| Emojis decorativos com `role="img" aria-label` | ✅ PASS | ContactSection.tsx: `role="img" aria-label={channel.label}` |
| Separadores `·` com `aria-hidden="true"` | ✅ PASS | ArticleCard.tsx, ArticlePage.tsx |

---

## Violações Encontradas e Correções Aplicadas

### CRÍTICA — B04.1: Ausência de Focus Trap no MobileNav

**Critério WCAG:** 2.1.2 No Keyboard Trap (Nível A) / ARIA Authoring Practices — Dialog Pattern
**Arquivo:** `src/components/layout/MobileNav.tsx`
**Problema:** O MobileNav tinha `role="dialog" aria-modal="true"` mas não implementava focus trap. O Tab podia escapar do drawer para elementos do documento principal, violando o padrão ARIA para diálogos modais.

**Correção aplicada:**
- Adicionado `drawerRef` ao elemento drawer
- Implementado handler `Tab` / `Shift+Tab` que cicla o foco dentro dos elementos focáveis do drawer
- Usa `querySelectorAll` com seletores padrão de elementos focáveis, filtrado por `offsetParent !== null` (apenas visíveis)

### SÉRIA — B04.2: CookieBanner com `role="dialog"` incorreto

**Critério WCAG:** 4.1.2 Name, Role, Value (Nível AA)
**Arquivo:** `src/components/ui/CookieBanner.tsx`
**Problema:** O banner usava `role="dialog" aria-modal="false"`, combinação semanticamente inconsistente. Um banner de cookies é uma notificação persistente não-modal, não um diálogo. O `role="dialog"` implica comportamento de foco que não estava implementado.

**Correção aplicada:**
- Alterado `role="dialog"` para `role="region"`
- Removido `aria-modal="false"` (irrelevante para `role="region"`)
- Mantido `aria-label="Aviso de cookies"` e `aria-live="polite"`

### MODERADA — B04.3: Botão de submit em NewsletterSection sem `aria-busy`

**Critério WCAG:** 4.1.3 Status Messages (Nível AA)
**Arquivo:** `src/components/sections/NewsletterSection.tsx`
**Problema:** O botão de submissão usava um `<button>` nativo sem `aria-busy` durante o estado de submissão, ao contrário do componente `Button` reutilizável que já implementa corretamente.

**Correção aplicada:**
- Adicionado `aria-busy={isSubmitting}` e `aria-disabled={isSubmitting}` ao botão

### MODERADA — B04.4: Mensagem de sucesso em NewsletterSection sem `role="status"`

**Critério WCAG:** 4.1.3 Status Messages (Nível AA)
**Arquivo:** `src/components/sections/NewsletterSection.tsx`
**Problema:** A mensagem de confirmação de inscrição (`status === 'success'`) não tinha `role="status"` ou `aria-live`, impedindo que leitores de tela anunciassem automaticamente o feedback ao usuário.

**Correção aplicada:**
- Adicionado `role="status" aria-live="polite"` ao parágrafo de confirmação

---

## Pontos de Destaque Positivo

- **Skip-to-content** implementado corretamente com `#main-content` correspondendo ao `<main>`.
- **Todos os outline-none** acompanhados de `focus:ring-*` substitutos — sem perda de indicador de foco.
- **MobileNav ESC** e retorno de foco ao trigger estavam corretos antes da auditoria.
- **Prefers-reduced-motion** respeitado no carousel (auto-advance desativado).
- **Honeypots** em ambos os formulários com `aria-hidden="true"` e `tabIndex={-1}`.
- **Ícones SVG** decorativos consistentemente marcados com `aria-hidden="true"`.
- **OptimizedImage** força `alt` como campo obrigatório na interface TypeScript.
- **Button component** tem `aria-busy` e `aria-disabled` nativos.
- **TestimonialsSection** implementa padrão tablist completo para os dots de navegação.

---

## Limitações da Auditoria

- **Axe-core não executado:** requer servidor Next.js rodando (`npm run dev`). Recomenda-se execução de `axe-core` ou `@axe-core/react` em ambiente de desenvolvimento para validação automatizada complementar.
- **Contraste de cores não verificado programaticamente:** os tokens CSS (`--primary`, `--foreground`, `--muted-foreground`) dependem da paleta ativa. Verificação de contraste deve ser feita com servidor ativo usando extensão axe DevTools ou similar.
- **Testes E2E de navegação por teclado:** não executados (requer Playwright com servidor ativo).
- **Conteúdo MDX:** o campo `article.content` renderizado via `dangerouslySetInnerHTML` não foi auditado — conteúdo gerado deve garantir headings semânticos e alt texts em imagens inline.

---

*Auditoria realizada em 2026-03-25 — SystemForge TASK-8 / module-9-integration*
