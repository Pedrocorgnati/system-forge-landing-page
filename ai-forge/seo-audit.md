# SEO & Metadata - Auditoria Completa

**Projeto:** System Forge Landing Page
**Locale:** pt-BR, it-IT, en-US (i18n triple-market)
**Workspace:** `output/workspace/system-forge-landing-page`
**Data:** 2026-03-29

---

## Phase 1: Auditoria Guiada

### ✅ 1.1 Metadata API - ESTRUTURA EXCELENTE

**Status:** ✅ APROVADO com observações

**Root Layout (`src/app/layout.tsx`):**
- ✅ `metadataBase` configurado via `config.url` (dinâmico por build)
- ✅ Title template: `{ default, template }` via `config.seo.titleTemplate`
- ✅ Description: `config.seo.description` (50-160 chars esperado)
- ✅ Authors e Creator definidos
- ✅ Viewport configurado (device-width, initialScale 1)
- ✅ Theme colors com `prefers-color-scheme` (light/dark)
- ✅ Manifest e icons (favicon.ico, apple-icon.png)
- ✅ Icons com `icon` e `apple`

**Helper SEO (`src/lib/seo.ts`):**
- ✅ Função `generatePageMetadata()` bem estruturada
- ✅ Parametrizável: title, description, path, ogImage, noIndex
- ✅ Segue padrão: nunca hardcode metadata
- ✅ Inclui validação de SITE_URL com fallback

### ⚠️ 1.2 Open Graph & Twitter - PARTIAL

**Status:** ⚠️ ESTRUTURA OK, MAS COM GAPS NA IMPLEMENTAÇÃO

**Root Layout OG/Twitter:**
- ✅ `openGraph`: type=website, locale, siteName, URL absolutas, images 1200x630
- ✅ Twitter Card: summary_large_image, title, description, images
- ✅ Todas as imagens OG têm alt text
- ✅ `siteName` e `locale` configurados

**Detectado - Páginas que NÃO usam generatePageMetadata:**
- ❌ `src/app/blog/page.tsx` — metadata manual, sem OG/Twitter
- ❌ `src/app/servicos/page.tsx` — metadata manual, sem OG/Twitter
- ❌ `src/app/portfolio/page.tsx` — metadata manual, sem OG/Twitter
- ❌ `src/app/privacidade/page.tsx` — metadata manual, sem OG/Twitter
- ❌ `src/app/privacy/page.tsx` — metadata manual, sem OG/Twitter
- ❌ `src/app/conselheiro/page.tsx` — metadata manual, sem OG/Twitter
- ❌ `src/app/servicos/[slug]/page.tsx` — apenas title/description/canonical

**Pages que USAM generatePageMetadata corretamente:**
- ✅ `src/app/blog/[slug]/page.tsx` — generatePageMetadata + custom OG (article type com publishedTime, authors, tags)
- ✅ `src/app/page.tsx` — metadata básica via config

### ✅ 1.3 Canonical e hreflang - EXCELENTE

**Status:** ✅ FULL APPROVAL

**Root Layout:**
- ✅ `alternates.languages`: hreflang completo com SUPPORTED_LOCALES
- ✅ Dinâmico via `LOCALE_URLS[locale]`
- ✅ Suporta 3 locales: pt-BR, it-IT, en-US

**Páginas com canonical:**
- ✅ `page.tsx` (home) — alternates: { canonical: '/' }
- ✅ `servicos/page.tsx` — canonical: config.routes.services
- ✅ `portfolio/page.tsx` — canonical: config.routes.portfolio
- ✅ `blog/[slug]/page.tsx` — canonical na metadata de artigo
- ✅ `servicos/[slug]/page.tsx` — canonical: config.routes.service(slug)

**sitemap.ts:**
- ✅ Dinâmico com hreflang cruzado por article (buildLanguagesForArticle)
- ✅ Prioridades bem definidas (1.0 home, 0.9 blog, 0.8 services, etc)
- ✅ changeFrequency contextual (daily blog, weekly home, monthly services)
- ✅ lastModified com data atual (now)
- ✅ Articigos universais com hreflang, exclusivos sem hreflang

### ✅ 1.4 Robots e Sitemap - EXCELENTE

**Status:** ✅ FULL APPROVAL

**robots.ts:**
- ✅ `force-static` para consistência entre builds
- ✅ Disallow rotas sensíveis: /api/, /_next/, /admin/, /static/
- ✅ Disallow newsletter confirmação (PT/IT/EN): /newsletter/{confirmado/confermato/confirmed}
- ✅ `sitemap: ${siteUrl}/sitemap.xml`
- ✅ `host: siteUrl` configurado

**sitemap.ts:**
- ✅ Rotas institucionais com prioridades escaladas
- ✅ Suporta categorias de serviço via SERVICE_SLUGS
- ✅ Artigos do blog com Velite (getArticlesForLocale)
- ✅ Hreflang recíproco para artigos universais
- ✅ Deduplicação de URLs de serviço (seenServiceUrls)
- ✅ Erro fail-fast se locale não mapeado em LOCALE_URLS

### ⚠️ 1.5 Structured Data - INCOMPLETO

**Status:** ⚠️ PARCIAL — Organization e BlogPosting OK, gaps em BreadcrumbList, FAQ

**Componentes JSON-LD implementados:**
- ✅ `JsonLdOrganization` (67 usos encontrados)
- ✅ `JsonLdLocalBusiness` (em componentes)
- ✅ `JsonLdBlogPosting` (articles)

**Detectado - Gaps:**
- ⚠️ BreadcrumbList: Presente em `/blog/[slug]/` (1 encontrado), mas NÃO em `/servicos/[slug]/` ou `/portfolio/[slug]/`
- ⚠️ FAQSchema: Não encontrado (FaqSection renderiza FAQ mas sem JSON-LD)
- ⚠️ Product Schema: Não aplicável (não é e-commerce)
- ⚠️ Service Schema: Não mapeado (servicos poderiam ter Service Schema)
- ⚠️ WebSite schema com SearchAction: Não encontrado

### ⚠️ 1.6 URL Strategy & Verification - PARCIAL

**Status:** ⚠️ GOOD PATTERNS, GAPS NA VERIFICAÇÃO

**URL Strategy:**
- ✅ Slugs descritivos (servico-*, artigos com slug)
- ✅ URLs < 75 caracteres (esperado, baseado em slugs)
- ✅ Sem trailing slash (config por build)
- ✅ Sem IDs numéricos em rotas públicas

**Verificação (verification em layout):**
- ⚠️ Google Site Verification: `process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- ❌ Bing Webmaster: Não configurado (env não encontrado)
- ❌ Facebook domain verification: Não configurado
- ⚠️ Sem evidência de DNS records ou meta verification configurados

**Alternates para feeds:**
- ❌ RSS/Atom feeds: Não declarados em metadata
- ❌ JSON feeds: Não mapeados em alternates

---

## Phase 2: Task List

Salvo em: `ai-forge/seo-task.md`

### T001 – Atualizar páginas estáticas para usar generatePageMetadata
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/app/blog/page.tsx`
- modificar: `src/app/servicos/page.tsx`
- modificar: `src/app/portfolio/page.tsx`
- modificar: `src/app/conselheiro/page.tsx`
- modificar: `src/app/privacidade/page.tsx`
- modificar: `src/app/privacy/page.tsx`

**Descrição:** 7 páginas estáticas estão settando metadata manualmente sem usar o helper `generatePageMetadata()`. Isso resulta em falta de OG images, Twitter cards, e robots directives consistentes. Devem ser refatoradas para usar a função helper.

**Critérios de Aceite:**
- [ ] Cada página chama `generatePageMetadata({ title, description, path, ogImage? })`
- [ ] OG images aparecem em Social Preview (verificar com Facebook Sharing Debugger)
- [ ] Twitter cards aparecem em Twitter/X (verificar com Twitter Card Validator)
- [ ] `npm run build` sem erros de type-check

**Estimativa:** 2h

---

### T002 – Adicionar BreadcrumbList JSON-LD para rotas dinâmicas
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- criar: `src/components/seo/JsonLdBreadcrumb.tsx`
- modificar: `src/app/servicos/[slug]/page.tsx`
- modificar: `src/app/blog/tag/[tag]/page.tsx`
- modificar: `src/app/blog/categoria/[cat]/page.tsx`
- modificar: `src/app/blog/page/[n]/page.tsx` (pagination)

**Descrição:** BreadcrumbList schema ajuda Google entender a hierarquia de navegação. Atualmente, apenas blog articles têm BreadcrumbList; todas as rotas dinâmicas devem incluir.

**Critérios de Aceite:**
- [ ] `JsonLdBreadcrumb` component criado (aceita items array)
- [ ] Renderizado em layout de cada rota dinâmica
- [ ] Validado no [Schema.org Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Inclui home como primeiro breadcrumb, página atual como último

**Estimativa:** 2h

---

### T003 – Criar FAQ Schema para FaqSection
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- criar: `src/components/seo/JsonLdFaq.tsx`
- modificar: `src/components/sections/FaqSection.tsx`

**Descrição:** FaqSection renderiza FAQs em HTML mas sem JSON-LD. Adicionar FAQ Schema pode melhorar appearance em SERPs (rich snippets).

**Critérios de Aceite:**
- [ ] `JsonLdFaq` component aceita array de { question, answer }
- [ ] Renderizado dentro de <head> (via Layout ou dynamic route)
- [ ] Validado no Rich Results Test
- [ ] FAQs aparecem em Featured Snippets

**Estimativa:** 1.5h

---

### T004 – Implementar feed RSS/Atom e declarar em alternates
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- criar: `src/app/blog/feed.xml/route.ts`
- criar: `src/app/blog/feed.json/route.ts` (JSON Feed)
- modificar: `src/app/layout.tsx` (adicionar alternates.types)

**Descrição:** Feeds RSS/Atom/JSON facilitam indexação de conteúdo novo (especialmente útil para blog). Devem ser declarados em alternates metadata.

**Critérios de Aceite:**
- [ ] `GET /blog/feed.xml` retorna RSS 2.0 válido (11 artigos recentes)
- [ ] `GET /blog/feed.json` retorna JSON Feed 1.1 válido
- [ ] Layout.tsx declara em alternates: `{ types: { 'application/rss+xml': '/blog/feed.xml', ... } }`
- [ ] RSS validado com [Feed Validator](https://validator.w3.org/feed/)

**Estimativa:** 2h

---

### T005 – Configurar Google/Bing verification e DNS records
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- env config (NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, etc)
- DNS records (manual — fora do escopo de código)

**Descrição:** Verification meta tags estão no código mas vazios (env não configurado). Sem verificação, Search Console não terá acesso completo a relatórios de saúde do site.

**Critérios de Aceite:**
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = token do GSC
- [ ] Meta tag renderizada em HTML (<head>)
- [ ] Google/Bing reconhecem propriedade no console
- [ ] DNS TXT records adicionados (manual)

**Estimativa:** 1h (pendente de ação manual do cliente)

---

### T006 – Adicionar Service Schema para serviços
**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- criar: `src/components/seo/JsonLdService.tsx`
- modificar: `src/app/servicos/[slug]/page.tsx`

**Descrição:** Serviços (SaaS, Mobile, Chatbots, etc) podem usar Service Schema para melhorar descrição em SERPs. Opcional, mas elevaria autoridade.

**Critérios de Aceite:**
- [ ] `JsonLdService` component aceita (name, description, provider, areaServed)
- [ ] Renderizado em cada página /servicos/{slug}
- [ ] Validado no Rich Results Test

**Estimativa:** 1.5h

---

### T007 – Atualizar robots.ts para i18n multi-domain
**Tipo:** SEQUENTIAL
**Dependências:** T005
**Arquivos:**
- modificar: `src/app/robots.ts`

**Descrição:** Robots.ts atual usa `config.url` (dinâmico por build). Verificar se `disallow` para newsletter confirmação está correto em IT/EN; se houver variações por idioma, ajustar.

**Critérios de Aceite:**
- [ ] robots.ts buildado 3x (build:br, build:it, build:en) gera sitemap URLs diferentes
- [ ] Cada build aponta para seu próprio sitemap (não para outros domínios)
- [ ] Disallow paths incluem variações de idioma se aplicável

**Estimativa:** 1h

---

### T008 – Testar OG images e Twitter Card rendering
**Tipo:** SEQUENTIAL
**Dependências:** T001
**Arquivos:**
- test: via [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- test: via [Twitter Card Validator](https://cards-dev.twitter.com/validator)

**Descrição:** Validar que OG images renderizam corretamente em redes sociais após mudanças.

**Critérios de Aceite:**
- [ ] Home page: OG image renderiza 1200x630 em Facebook
- [ ] Blog article: OG image (coverImage) renderiza em Twitter
- [ ] Serviço: OG image (defaultOgImage) renderiza em Facebook
- [ ] Sem erros de "Sharer: URL não acessível"

**Estimativa:** 1.5h

---

### T009 – Criar SEO checklist pré-deploy
**Tipo:** SEQUENTIAL
**Dependências:** T001, T002, T004, T008
**Arquivos:**
- criar: `SEO-CHECKLIST.md`

**Descrição:** Documento para validação final pre-deploy em staging: verificar indexação, Rich Results, Core Web Vitals, Search Console health.

**Critérios de Aceite:**
- [ ] Checklist cobrindo: Indexação, Metadata, OG/Twitter, Canonical, Sitemap, robots.txt, Rich Results, Verification
- [ ] Instruções para rodar em staging antes de prod
- [ ] Links para ferramentas: GSC, Lighthouse, PageSpeed, Rich Results Test

**Estimativa:** 1h

---

## Resumo de Issues por Severidade

| Severidade | Contagem | Exemplos |
|-----------|----------|----------|
| **HIGH** | 2 | Páginas sem OG/Twitter (T001), BreadcrumbList missing (T002) |
| **MEDIUM** | 3 | FAQ Schema (T003), Feeds (T004), Service Schema (T006) |
| **LOW** | 3 | Verification setup (T005), robots i18n (T007), Testing (T008) |

---

## Próximos Passos

1. **Phase 3: Execução**
   - Executar T001-T009 em sequência (ou parallelizar T006)
   - Validar cada task com tooling (Rich Results Test, Lighthouse, etc)
   - Build 3x (BR/IT/EN) e validar sitemap/robots de cada

2. **Phase 4: Validação**
   - Rodar `npm run build` + type-check
   - Testar em staging com Search Console preview
   - Validar Rich Results antes de deploy

3. **Phase 5: Deploy & Monitor**
   - Deploy para produção
   - Monitorar Search Console (indexação, impressões, CTR)
   - Acompanhar Core Web Vitals

---

## Recursos

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org Rich Results Test](https://search.google.com/test/rich-results)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Docs](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Google Search Central](https://developers.google.com/search)
