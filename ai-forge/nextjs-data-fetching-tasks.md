# Data Fetching Tasks — system-forge-landing-page

> Gerado por `/nextjs:data-fetching` em 2026-03-29
> Workspace: `output/workspace/system-forge-landing-page`
> Contexto: Next.js `output: 'export'` — static site, sem runtime server

---

## Resumo da Análise

O projeto usa **static export** com Velite como content layer. Não há chamadas `fetch()` de dados em runtime — todo o conteúdo é compilado no build. As estratégias de cache/revalidação do Next.js (ISR, `revalidate`, `no-store`) são irrelevantes em runtime neste contexto.

**Achados principais:**
- `React.cache()` corretamente aplicado em `content-loader.ts`
- `generateStaticParams()` implementado em todas as rotas dinâmicas
- `dynamic = 'force-static'` corretamente aplicado em `robots.ts` e `sitemap.ts`
- Único `fetch()` em runtime é o POST de newsletter (client-side) — sem cache necessário ✅
- **1 issue real**: `export const revalidate = 3600` não-funcional nas Route Handlers de feed
- **1 issue potencial**: chamadas de `getSiteConfig()`/`loadMessages()` em nível de módulo

---

## Tasks

### T001 - Remover `revalidate` não-funcional das Route Handlers de feed

**Tipo:** SEQUENTIAL
**Dependências:** none
**Status:** COMPLETED ✅
**Prioridade:** BAIXA
**Arquivos:**
- modificar: `src/app/blog/feed.xml/route.ts`
- modificar: `src/app/blog/feed.json/route.ts`

**Descrição:**
Com `output: 'export'`, Route Handlers são pré-renderizados como arquivos estáticos no build. O `export const revalidate = 3600` em Route Handlers só funciona em modo servidor (não static export) — neste contexto é não-funcional e gera confusão sobre a estratégia de cache.

Evidências:
- `src/app/blog/feed.xml/route.ts:12: export const revalidate = 3600 // Revalidate every hour`
- `src/app/blog/feed.json/route.ts:12: export const revalidate = 3600 // Revalidate every hour`

**Ação:** Remover a linha `export const revalidate = 3600` e substituir por comentário explicativo sobre o contexto estático.

**Critérios de Aceite:**
- [ ] `export const revalidate` removido dos dois route handlers
- [ ] Comentário sobre contexto static export adicionado
- [ ] Build passa sem warnings

**Estimativa:** 15min

---

### T002 - Documentar chamadas de módulo em `layout.tsx` e pages

**Tipo:** SEQUENTIAL
**Dependências:** T001
**Status:** COMPLETED ✅
**Prioridade:** MUITO BAIXA (informacional)
**Arquivos:**
- modificar: `src/app/layout.tsx` (comentário)

**Descrição:**
`getSiteConfig()` e `loadMessages()` são chamados em nível de módulo (fora de componentes) em vários arquivos. Para static export, isso funciona corretamente — é executado uma vez por processo de build. Porém, se o projeto migrar para server rendering, estas chamadas precisariam ser movidas para dentro de componentes ou envoltas em `React.cache()`.

Evidências (rg `grep -rn "getSiteConfig\|loadMessages" src/app/ --include="*.ts" --include="*.tsx" | grep -v "import"`):
- `src/app/layout.tsx:22-23` — chamadas em módulo
- `src/app/blog/page.tsx:11-12` — chamadas em módulo
- `src/app/blog/page/[n]/page.tsx:19-20` — chamadas em módulo
- (+ 5 outros arquivos)

**Ação:** Adicionar comentário em `layout.tsx` explicando que as chamadas de módulo são intencionais para o contexto static export e o que seria necessário em caso de migração para SSR.

**Critérios de Aceite:**
- [ ] Comentário adicionado em `layout.tsx` próximo às chamadas de módulo
- [ ] Sem mudanças de comportamento

**Estimativa:** 10min

---

## Não-Issues (confirmados como corretos)

| Item | Localização | Status |
|------|-------------|--------|
| `React.cache()` no content-loader | `src/lib/content/content-loader.ts:99` | ✅ Correto |
| `generateStaticParams()` em blog/[slug] | `src/app/blog/[slug]/page.tsx:25` | ✅ Correto |
| `generateStaticParams()` em blog/page/[n] | `src/app/blog/page/[n]/page.tsx:28` | ✅ Correto |
| `generateStaticParams()` em blog/tag/[tag] | `src/app/blog/tag/[tag]/page.tsx:26` | ✅ Correto |
| `generateStaticParams()` em blog/categoria/[cat] | `src/app/blog/categoria/[cat]/page.tsx:28` | ✅ Correto |
| `generateStaticParams()` em servicos/[slug] | `src/app/servicos/[slug]/page.tsx:17` | ✅ Correto |
| `dynamic = 'force-static'` em robots.ts | `src/app/robots.ts:14` | ✅ Correto |
| `dynamic = 'force-static'` em sitemap.ts | `src/app/sitemap.ts:30` | ✅ Correto |
| `fetch()` POST newsletter sem cache | `src/lib/services/newsletter.ts:78` | ✅ Correto (mutation client-side) |
| `Cache-Control` header manual nos feeds | `feed.xml/route.ts:57`, `feed.json/route.ts:57` | ✅ Correto para CDN |
| Dados de artigos via Velite (não fetch) | `@/.velite` em todas as páginas | ✅ Correto para static |
| `noIndex: true` nas páginas de tag | `src/app/blog/tag/[tag]/page.tsx` | ✅ Correto (evita canibalização) |
