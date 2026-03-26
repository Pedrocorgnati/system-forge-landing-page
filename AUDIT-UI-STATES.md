# AUDIT-UI-STATES.md

**Projeto:** system-forge-landing-page
**Data:** 2026-03-25
**Tarefa:** TASK-6 / module-9-integration — Audit de UI States

---

## Resultado por Componente

| Componente | Arquivo | Loading | Empty | Error | Success | Status |
|---|---|---|---|---|---|---|
| PortfolioGallery | `src/components/sections/PortfolioGallery.tsx` | N/A | ✅ `"Nenhum projeto em {cat}"` | N/A | ✅ cards visíveis | ✅ APROVADO |
| BlogListPage | `src/components/blog/BlogListPage.tsx` | N/A | ✅ `"Nenhum artigo encontrado"` | N/A | ✅ lista artigos | ✅ APROVADO |
| SearchBar | `src/components/blog/SearchBar.tsx` | ✅ spinner animado (isSearching) | ✅ `"Nenhum artigo encontrado para {query}"` | N/A | ✅ resultados em dropdown | ✅ APROVADO |
| NewsletterOptIn | `src/components/ui/NewsletterOptIn.tsx` | ✅ `"Enviando..."` + disabled | N/A | ✅ `toast.error(...)` via Sonner | ✅ `"Verifique seu email"` | ✅ APROVADO |
| CookieBanner | `src/components/ui/CookieBanner.tsx` | N/A | N/A | N/A | ✅ `return null` após decisão | ✅ APROVADO |
| /newsletter/confirmado | `src/app/newsletter/confirmado/page.tsx` | N/A | N/A | ✅ `?error=token_invalid` (+ outros códigos) | ✅ `?success=true` | ✅ APROVADO |

---

## Componentes com Estados Ausentes (Bloqueadores)

Nenhum bloqueador restante — todos os estados aplicáveis foram verificados e estão implementados após as correções abaixo.

---

## Correções Aplicadas

### 1. PortfolioGallery — Empty State sem interpolação de categoria

**Arquivo:** `src/components/sections/PortfolioGallery.tsx`

**Problema:** O estado vazio exibia a mensagem genérica `"Nenhum projeto nessa categoria ainda"` sem identificar qual categoria estava vazia. A spec exige `"Nenhum projeto em {cat}"`.

**Correção:** Substituída a mensagem estática por interpolação dinâmica usando `categoryLabels[activeFilter]`:

```tsx
// Antes
<p className="font-medium text-foreground">Nenhum projeto nessa categoria ainda</p>

// Depois
<p className="font-medium text-foreground">
  {activeFilter === 'all'
    ? 'Nenhum projeto cadastrado ainda'
    : `Nenhum projeto em ${categoryLabels[activeFilter] ?? activeFilter}`}
</p>
```

---

### 2. SearchBar — Loading state sem spinner visual

**Arquivo:** `src/components/blog/SearchBar.tsx`

**Problema:** O estado `isSearching` exibia apenas texto `"Buscando..."`. A spec exige `spinner/isSearching` — indicador visual animado.

**Correção:** Substituído o `<span>` de texto por SVG animado (`animate-spin`) com `role="status"` para acessibilidade e `<span className="sr-only">` para leitores de tela:

```tsx
// Antes
<span className="text-muted-foreground text-sm">Buscando...</span>

// Depois
<div className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Buscando..." role="status">
  <svg className="w-4 h-4 text-muted-foreground animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
  <span className="sr-only">Buscando...</span>
</div>
```

---

## Detalhamento por Componente

### PortfolioGallery
- **Empty:** Corrigido — mensagem agora interpola o nome da categoria via `categoryLabels[activeFilter]`. Inclui botão "Ver todos os projetos" para reset do filtro.
- **Success:** Cards do portfólio são renderizados no grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

### BlogListPage
- **Empty:** Estado implementado com ícone 📭, título "Nenhum artigo encontrado" e descrição contextual (distingue: sem categoria, sem tag, sem artigos em geral).
- **Success:** Grid de `ArticleCard` com paginação.

### SearchBar
- **Loading (isLoading):** Texto "Carregando..." exibido enquanto o índice de busca carrega — mantido como está (indica carregamento inicial, não busca ativa).
- **Loading (isSearching):** Corrigido — spinner SVG animado com acessibilidade completa.
- **Empty:** `"Nenhum artigo encontrado para {query}"` exibido no dropdown quando `hasResults === false`.
- **Success:** Lista de até 5 resultados com título e descrição, via `role="listbox"`.
- **Nota:** `showDropdown` só ativa quando `inputValue.trim().length >= 2 && !isSearching && !isLoading` — dropdown não aparece durante busca ativa, apenas quando a resposta chega. Comportamento correto.

### NewsletterOptIn
- **Loading:** `status === 'submitting'` — botão mostra "Enviando...", `disabled={true}`, campos `disabled`. Usa prop `loading` do `<Button>` component.
- **Error:** `catch` block chama `toast.error('Erro ao se inscrever. Tente novamente.')` via Sonner. Também trata `NEXT_PUBLIC_NEWSLETTER_API_URL` ausente.
- **Success:** `status === 'success'` renderiza bloco alternativo com ícone check verde e texto "Verifique seu email para confirmar sua inscrição!".

### CookieBanner
- **Oculto após decisão:** `if (!isLoaded || consent !== null) { return null }` — o banner não renderiza quando `consent === 'accepted'` ou `consent === 'rejected'`. Comportamento correto.
- **Antes de carregar:** `!isLoaded` também retorna null, evitando flash indesejado (SSR hydration safe).

### /newsletter/confirmado
- **Error (`?error=token_invalid`):** Renderiza bloco de erro com ícone X vermelho, título e descrição específicos por código. Códigos mapeados: `token_missing`, `token_invalid`, `activation_failed` + fallback genérico.
- **Success (`?success=true`):** Renderiza bloco de sucesso com ícone check verde, "Inscrição confirmada!" e CTA para voltar ao início.
- **Nota:** A condição `isSuccess` é computada mas não utilizada para controle de fluxo — a página usa `errorCode` como gate principal e o `return` padrão serve como success. O comportamento está correto para `?success=true` (sem error) e `?error=*`.

---

## Veredito

**✅ APROVADO**

Todos os 6 componentes auditados têm os estados aplicáveis implementados. Foram aplicadas 2 correções:
1. PortfolioGallery: interpolação do nome da categoria no empty state
2. SearchBar: substituição de texto por spinner SVG animado no estado `isSearching`

Nenhum bloqueador remanescente.
