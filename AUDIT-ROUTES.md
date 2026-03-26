# AUDIT-ROUTES.md — Auditoria de Rotas e Navegação

**Projeto:** SystemForge Landing Page
**Data:** 2026-03-25
**Executado por:** TASK-1 / module-9-integration

---

## Resumo Executivo

| Indicador | Valor |
|-----------|-------|
| Rotas verificadas | 21 |
| Rotas OK | 19 |
| Rotas com aviso (⚠️) | 2 |
| Rotas órfãs (sem entrada de link) | 2 |
| Correções aplicadas nesta auditoria | 0 |
| Veredito | ⚠️ APROVADO COM RESSALVAS |

---

## ST001 — Tabela de Resultado por Rota

### Rotas Principais

| Rota | Existe no `src/app/` | Existe em `out/` | Entrada de link no UI | Status | Componente(s) com link |
|------|---------------------|----------------|-----------------------|--------|------------------------|
| `/` | ✅ `app/page.tsx` | ✅ `out/index.html` | ✅ | ✅ OK | Header logo, Footer logo, MobileNav (via `NAV_LINKS`) |
| `/servicos` | ✅ `app/servicos/page.tsx` | ✅ `out/servicos/index.html` | ✅ | ✅ OK | Header, Footer, MobileNav (via `NAV_LINKS`) |
| `/portfolio` | ✅ `app/portfolio/page.tsx` | ✅ `out/portfolio/index.html` | ✅ | ✅ OK | Header, Footer, MobileNav, PortfolioGallery, RelatedProjects |
| `/blog` | ✅ `app/blog/page.tsx` | ✅ `out/blog/index.html` | ✅ | ✅ OK | Header, Footer, MobileNav, BlogPreview, CategoryFilter, RelatedArticles, ArticlePage |
| `/privacidade` | ✅ `app/privacidade/page.tsx` | ✅ `out/privacidade/` | ✅ | ✅ OK | Footer (`ROUTES.PRIVACY`), CookieBanner (`ROUTES.PRIVACY`), NewsletterOptIn (`/privacidade` hardcoded) |
| `/conselheiro` | ✅ `app/conselheiro/page.tsx` | ✅ `out/conselheiro/` | ❌ | ⚠️ ORPHAN | Nenhum componente do site linka para `/conselheiro` |
| `/newsletter/confirmado` | ✅ `app/newsletter/confirmado/page.tsx` | ✅ `out/newsletter/` | N/A | ✅ OK | Destino de redirect do Cloudflare Worker (não requer link interno) |
| `/not-found` | ✅ `app/not-found.tsx` | ✅ `out/404.html` | N/A | ✅ OK | Automático Next.js |

### Rotas de Serviços (`/servicos/[slug]`)

Todas as páginas de serviço são geradas dinamicamente via `app/servicos/[slug]/page.tsx` e acessadas via `ServiceCard` (→ `ROUTES.SERVICE(service.slug)`).

| Rota | Slug em `servicesData` | Existe em `out/` | Link via ServiceCard | Status |
|------|------------------------|-----------------|----------------------|--------|
| `/servicos/saas` | ✅ `saas` | ✅ | ✅ | ✅ OK |
| `/servicos/aplicativo-mobile` | ✅ `aplicativo-mobile` | ✅ | ✅ | ✅ OK |
| `/servicos/marketplace` | ✅ `marketplace` | ✅ | ✅ | ✅ OK |
| `/servicos/automacao-com-ia` | ✅ `automacao-com-ia` | ✅ | ✅ | ✅ OK |
| `/servicos/bots-automacoes` | ✅ `bots-automacoes` | ✅ | ✅ | ✅ OK |
| `/servicos/landing-page` | ✅ `landing-page` | ✅ | ✅ | ✅ OK |
| `/servicos/e-commerce` | ✅ `e-commerce` | ✅ | ✅ | ✅ OK |
| `/servicos/dashboard-b2b` | ✅ `dashboard-b2b` | ✅ | ✅ | ✅ OK |
| `/servicos/api-integracoes` | ✅ `api-integracoes` | ✅ | ✅ | ✅ OK |
| `/servicos/desktop` | ✅ `desktop` | ✅ | ✅ | ✅ OK |
| `/servicos/gestao-setorial` | ✅ `gestao-setorial` | ✅ | ✅ | ✅ OK |

### Rotas de Blog

| Rota | Existe no `src/app/` | Existe em `out/` | Entrada de link no UI | Status |
|------|---------------------|-----------------|----------------------|--------|
| `/blog/[slug]` | ✅ `app/blog/[slug]/page.tsx` | ✅ (ex: `out/blog/react-native-vs-flutter/`) | ✅ ArticleCard (title e cover), ArticlePage links | ✅ OK |
| `/blog/page/[n]` | ✅ `app/blog/page/[n]/page.tsx` | ✅ `out/blog/page/1/` | ✅ Pagination component | ✅ OK |
| `/blog/categoria/[cat]` | ✅ `app/blog/categoria/[cat]/page.tsx` | ✅ `out/blog/categoria/` | ✅ CategoryFilter (`ROUTES.BLOG_CATEGORY(encodeURIComponent(cat))`) | ✅ OK |
| `/blog/tag/[tag]` | ✅ `app/blog/tag/[tag]/page.tsx` | ✅ `out/blog/tag/` | ✅ ArticlePage (`ROUTES.BLOG_TAG(tag)`) — **sem `encodeURIComponent`** | ⚠️ VER NOTA |

---

## ST002 — Rotas Órfãs e Bloqueadores

### Rotas Órfãs Identificadas

#### 1. `/conselheiro` — ÓRFÃ

**Problema:** A página `/conselheiro` existe no filesystem e no `out/`, mas nenhum componente, seção ou link no site aponta para ela.

- `StrategicAdvisorTeaser` é um componente existente em `src/components/sections/StrategicAdvisorTeaser.tsx`, mas **não está incluído** na home (`src/app/page.tsx`).
- O componente `WhySystemForge` não linka para `/conselheiro`.
- Nenhum item de `NAV_LINKS` aponta para `/conselheiro`.
- A constante `ROUTES.ADVISOR = '/conselheiro'` existe mas não é usada em nenhum link de navegação.

**Classificação:** Bloqueador de navegação — a rota é inacessível via UI. O usuário só chega via URL direta.

**Ação recomendada:** Adicionar link para `/conselheiro` em pelo menos um dos seguintes locais:
- `NAV_LINKS` em `src/lib/constants/site.ts`
- Seção `StrategicAdvisorTeaser` incluída na home (`src/app/page.tsx`)
- Link em `Footer` ou `Header`

**Correção NÃO aplicada nesta auditoria** (requer decisão de produto sobre onde exibir a entrada).

#### 2. `/servicos` — Sem "Ver todos" na ServicesGrid

**Problema:** A task spec mencionava um botão "Ver todos" no `ServicesGrid` linkando para `/servicos`. O componente **não possui esse botão** — exibe apenas os cards de serviços sem um link explícito para `/servicos`.

**Impacto:** Baixo — o Header contém link "Serviços" → `/servicos`. O usuário consegue navegar, mas a seção da homepage não tem CTA de listagem.

**Classificação:** Aviso — não é uma rota órfã (a rota tem entradas via Header/Footer), mas a ServicesGrid não tem o link esperado.

**Correção NÃO aplicada** (mudança estrutural em componente de UI).

---

## ST003 — Header Links

| Link | href | Existe em `NAV_LINKS` | Âncora/rota existe | Status |
|------|------|-----------------------|--------------------|--------|
| Início | `/` | ✅ `ROUTES.HOME` | ✅ | ✅ OK |
| Serviços | `/servicos` | ✅ `ROUTES.SERVICES` | ✅ | ✅ OK |
| Portfólio | `/portfolio` | ✅ `ROUTES.PORTFOLIO` | ✅ | ✅ OK |
| Blog | `/blog` | ✅ `ROUTES.BLOG` | ✅ | ✅ OK |
| Contato | `/#contato` | ✅ `ROUTES.CONTACT` | ✅ `id="contato"` em `ContactSection` | ✅ OK |

**MobileNav:** Usa o mesmo `NAV_LINKS` array — todos os links são idênticos ao desktop.

---

## ST004 — Footer Links

### Links de Navegação (coluna "Navegação")

| Link | href | Status |
|------|------|--------|
| Início | `/` (via `NAV_LINKS`) | ✅ OK |
| Serviços | `/servicos` (via `NAV_LINKS`) | ✅ OK |
| Portfólio | `/portfolio` (via `NAV_LINKS`) | ✅ OK |
| Blog | `/blog` (via `NAV_LINKS`) | ✅ OK |
| Contato | `/#contato` (via `NAV_LINKS`) | ✅ OK |
| Política de Privacidade | `/privacidade` (via `ROUTES.PRIVACY`) | ✅ OK |

### Links Externos (coluna "Redes Sociais")

| Link | href | `target="_blank"` | `rel="noopener noreferrer"` | Status |
|------|------|-------------------|-----------------------------|--------|
| Pedro Corgnati no LinkedIn | `https://linkedin.com/in/pedrocorgnati` (via `SITE.linkedin`) | ✅ | ✅ | ✅ OK |
| Pedrocorgnati no GitHub | `https://github.com/Pedrocorgnati` (via `SITE.github`) | ✅ | ✅ | ✅ OK |

Todos os links externos possuem `rel="noopener noreferrer"` corretamente configurado.

---

## Notas Técnicas

### Tags de blog sem `encodeURIComponent` em `ArticlePage.tsx`

**Arquivo:** `src/components/blog/ArticlePage.tsx` linha 91

```tsx
href={ROUTES.BLOG_TAG(tag)}  // sem encodeURIComponent
```

Tags com caracteres especiais (acentos, espaços) como "automação com ia", "inteligência artificial" geram URLs não-encoded. O `CategoryFilter` usa `encodeURIComponent` corretamente. As páginas em `out/blog/tag/` são geradas com encoding (`automa%C3%A7%C3%A3o%20com%20ia`), então o comportamento depende do servidor/navegador normalizar a URL.

**Impacto:** Potencial 404 em alguns navegadores para tags com caracteres especiais.

**Classificação:** Aviso (não-crítico para o escopo desta auditoria de navegação).

### `ROUTES.PORTFOLIO_PROJECT` definida mas não utilizada

A constante `ROUTES.PORTFOLIO_PROJECT: (slug: string) => /portfolio/${slug}` está definida em `routes.ts`, mas nenhuma página `app/portfolio/[slug]/` existe e nenhum componente usa essa rota. `PortfolioCard` linka para `project.url` (externo) em vez de uma rota interna. Isso é intencional dado o design atual do portfólio.

---

## Correções Aplicadas Nesta Auditoria

Nenhuma correção foi aplicada nesta auditoria. Os dois problemas identificados requerem decisão de produto:

1. **`/conselheiro` órfã** — requer definir onde no site exibir a entrada para a feature (Header, Footer, ou seção na homepage).
2. **ServicesGrid sem "Ver todos"** — requer decisão sobre adicionar o CTA ao componente.

---

## Veredito Final

**⚠️ APROVADO COM RESSALVAS**

| # | Problema | Severidade | Bloqueador de Deploy? |
|---|----------|-----------|----------------------|
| 1 | `/conselheiro` sem entrada de link — rota inacessível via UI | Alta | Não (rota funcional, apenas sem entrada) |
| 2 | `ServicesGrid` sem botão "Ver todos" linkando `/servicos` | Baixa | Não |
| 3 | Tags de blog sem `encodeURIComponent` em `ArticlePage.tsx` | Média | Não |

**Rotas de serviço:** 11/11 corretas.
**Header:** 5/5 links corretos.
**Footer:** 6 links internos + 2 externos — todos corretos com `rel="noopener noreferrer"`.
**Blog:** todas as sub-rotas existem e têm entradas de link.
**Privacidade:** rota é `/privacidade` (não `/privacy`) — confirmado e correto.
