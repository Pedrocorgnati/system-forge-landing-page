# SEO & Metadata - Task List

**Status:** PENDENTE (9 tasks)
**Última atualização:** 2026-03-29

---

## ✅ T001 – Atualizar páginas estáticas para usar generatePageMetadata

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Tempo estimado:** 2h

### Arquivos
- [ ] `src/app/blog/page.tsx`
- [ ] `src/app/servicos/page.tsx`
- [ ] `src/app/portfolio/page.tsx`
- [ ] `src/app/conselheiro/page.tsx`
- [ ] `src/app/privacidade/page.tsx`
- [ ] `src/app/privacy/page.tsx`

### Checklist de Execução
- [ ] Importar `generatePageMetadata` do `@/lib/seo`
- [ ] Remover metadata manual (title, description, alternates apenas)
- [ ] Chamar: `const metadata = generatePageMetadata({ title: '...', description: '...', path: '/...', ogImage: '...' })`
- [ ] Incluir ogImage quando aplicável (usar defaultOgImage se não houver)
- [ ] Testar OG preview: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Testar Twitter preview: [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] `npm run build` sem type errors

### Evidências
- [ ] Screenshots de Facebook/Twitter preview com OG image
- [ ] Build log (`npm run build`)

---

## ✅ T002 – Adicionar BreadcrumbList JSON-LD para rotas dinâmicas

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Tempo estimado:** 2h

### Arquivos
- [ ] `src/components/seo/JsonLdBreadcrumb.tsx` (criar)
- [ ] `src/app/servicos/[slug]/page.tsx`
- [ ] `src/app/blog/tag/[tag]/page.tsx`
- [ ] `src/app/blog/categoria/[cat]/page.tsx`
- [ ] `src/app/blog/page/[n]/page.tsx` (pagination)

### Checklist de Execução
- [ ] Criar component `JsonLdBreadcrumb` (Template: BreadcrumbList schema)
  - Aceita: `items: Array<{ label: string, url: string }>`
  - Renderiza: `<script type="application/ld+json">` com BreadcrumbList
- [ ] Adicionar a cada rota dinâmica (exemplo para `/servicos/[slug]`):
  ```tsx
  <JsonLdBreadcrumb items={[
    { label: 'Home', url: config.routes.home },
    { label: 'Serviços', url: config.routes.services },
    { label: service.name, url: config.routes.service(slug) }
  ]} />
  ```
- [ ] Validar em [Schema.org Rich Results Test](https://search.google.com/test/rich-results)
- [ ] `npm run build` sem erros

### Evidências
- [ ] Screenshot de Rich Results Test (válido)
- [ ] JSON-LD no <head> da página renderizada

---

## ✅ T003 – Criar FAQ Schema para FaqSection

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Tempo estimado:** 1.5h

### Arquivos
- [ ] `src/components/seo/JsonLdFaq.tsx` (criar)
- [ ] `src/components/sections/FaqSection.tsx`

### Checklist de Execução
- [ ] Criar `JsonLdFaq` component
  - Aceita: `items: Array<{ question: string, answer: string }>`
  - Renderiza: FAQPage schema com mainEntity array
- [ ] Importar FAQs de onde FaqSection busca dados
- [ ] Renderizar em `src/app/page.tsx` ou `src/app/layout.tsx`
- [ ] Validar no Rich Results Test
- [ ] Verificar se aparecem em "Featured Snippets" no Google

### Evidências
- [ ] Screenshot de Rich Results Test (FAQPage válido)
- [ ] Search Console com FAQ snippets impressionados (opcional, requer indexação)

---

## ✅ T004 – Implementar feed RSS/Atom e declarar em alternates

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Tempo estimado:** 2h

### Arquivos
- [ ] `src/app/blog/feed.xml/route.ts` (criar)
- [ ] `src/app/blog/feed.json/route.ts` (criar — JSON Feed)
- [ ] `src/app/layout.tsx` (modificar)

### Checklist de Execução
- [ ] Criar RSS feed endpoint (`/blog/feed.xml`)
  - Retorna top 11 artigos (getArticlesForLocale)
  - Channel: title, description, link, language
  - Item: title, description, link, pubDate, author, category
- [ ] Criar JSON Feed endpoint (`/blog/feed.json`)
  - Versão 1.1, mesmos 11 artigos
- [ ] Adicionar em `layout.tsx` alternates:
  ```tsx
  alternates: {
    types: {
      'application/rss+xml': 'https://domain.com/blog/feed.xml',
      'application/feed+json': 'https://domain.com/blog/feed.json'
    }
  }
  ```
- [ ] Testar: `curl https://domain.com/blog/feed.xml`
- [ ] Validar RSS com [Feed Validator](https://validator.w3.org/feed/)

### Evidências
- [ ] Feed XML/JSON acessível e válido
- [ ] Meta link tags no HTML

---

## ✅ T005 – Configurar Google/Bing verification e DNS records

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Tempo estimado:** 1h (código), + manual

### Arquivos
- [ ] `.env.local` / CI/CD config
- [ ] DNS records (MANUAL)

### Checklist de Execução
- [ ] Obter token de Google Search Console (GSC)
- [ ] Adicionar a `.env.local`:
  ```
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=abc123...
  ```
- [ ] CI/CD: injetar env em build
- [ ] Testar: `npm run build` gera `<meta name="google-site-verification" ... >` no HTML
- [ ] Verificar propriedade em [Google Search Console](https://search.google.com/search-console)
- [ ] (MANUAL) Adicionar DNS TXT record para Bing Webmaster
- [ ] (MANUAL) Adicionar DNS TXT record para Meta (se aplicável)

### Evidências
- [ ] GSC mostra "Propriedade verificada"
- [ ] HTML com meta tag renderizado

---

## ✅ T006 – Adicionar Service Schema para serviços

**Status:** `pending`
**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Tempo estimado:** 1.5h

### Arquivos
- [ ] `src/components/seo/JsonLdService.tsx` (criar)
- [ ] `src/app/servicos/[slug]/page.tsx`

### Checklist de Execução
- [ ] Criar `JsonLdService` component (Service schema)
  - Aceita: `name, description, provider: { name, url }, areaServed, url`
  - Renderiza: Service JSON-LD
- [ ] Em `src/app/servicos/[slug]/page.tsx`:
  ```tsx
  <JsonLdService
    name={service.name}
    description={service.longDescription}
    provider={{ name: 'SystemForge', url: config.url }}
    areaServed="BR,IT,US"
    url={`${config.url}/servicos/${slug}`}
  />
  ```
- [ ] Validar em Rich Results Test
- [ ] `npm run build`

### Evidências
- [ ] Rich Results Test valida Service schema
- [ ] Snapshot de cada page /servicos/{slug} com schema

---

## ✅ T007 – Atualizar robots.ts para i18n multi-domain

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** T005
**Tempo estimado:** 1h

### Arquivos
- [ ] `src/app/robots.ts`

### Checklist de Execução
- [ ] Revisar paths em disallow:
  - PT: `/newsletter/confirmado` ✓
  - IT: `/newsletter/confermato` ✓
  - EN: `/newsletter/confirmed` ✓
- [ ] Validar que cada build (build:br, build:it, build:en) gera sitemap URLs diferentes
- [ ] Verificar que `config.url` resolve corretamente em cada build
- [ ] Teste manual:
  ```bash
  NEXT_PUBLIC_LOCALE=pt-BR npm run build
  # Verificar: public/robots.txt aponta para https://domain-br/sitemap.xml
  ```

### Evidências
- [ ] robots.txt de cada build (BR/IT/EN) com URLs corretas

---

## ✅ T008 – Testar OG images e Twitter Card rendering

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** T001
**Tempo estimado:** 1.5h

### Checklist de Execução
- [ ] **Home Page (`/`)**
  - Facebook Sharing Debugger: OG image renderiza 1200x630
  - Twitter Card Validator: card=summary_large_image, image renderiza
- [ ] **Blog Article (`/blog/[slug]`)**
  - Facebook: coverImage renderiza (article type)
  - Twitter: coverImage renderiza
- [ ] **Service (`/servicos/[slug]`)**
  - Facebook: defaultOgImage renderiza
  - Twitter: defaultOgImage renderiza
- [ ] **Portfolio (`/portfolio`)**
  - Facebook: defaultOgImage renderiza
  - Twitter: defaultOgImage renderiza
- [ ] Nenhum erro de "URL não acessível" ou "Sharer não conseguiu acessar"

### Evidências
- [ ] Screenshots de Facebook Sharing Debugger (3 páginas)
- [ ] Screenshots de Twitter Card Validator (3 páginas)
- [ ] Sem erros de acesso

---

## ✅ T009 – Criar SEO checklist pré-deploy

**Status:** `pending`
**Tipo:** SEQUENTIAL
**Dependências:** T001–T008
**Tempo estimado:** 1h

### Arquivos
- [ ] `SEO-CHECKLIST.md` (criar)

### Conteúdo esperado
```markdown
# SEO Pre-Deployment Checklist

## Metadata
- [ ] metadataBase configurado
- [ ] Title template presente
- [ ] Descrições 50-160 chars
- [ ] OG images 1200x630

## Social Preview
- [ ] Facebook Sharing Debugger: todas as páginas renderizam OG
- [ ] Twitter Card Validator: todas as páginas renderizam cards

## Canonical & hreflang
- [ ] Home: canonical: /
- [ ] Rotas dinâmicas: canonical configurado
- [ ] hreflang: pt-BR, it-IT, en-US mapeados

## Indexação
- [ ] robots.ts: disallow paths corretos
- [ ] sitemap.ts: todas as rotas listadas
- [ ] staging/preview: noindex ✓

## Structured Data
- [ ] BreadcrumbList em rotas dinâmicas
- [ ] FAQ Schema na home
- [ ] Organization Schema na home
- [ ] BlogPosting em /blog/[slug]

## Feeds
- [ ] /blog/feed.xml acessível
- [ ] /blog/feed.json acessível
- [ ] alternates.types declarados

## Verification
- [ ] Google Site Verification meta tag presente
- [ ] DNS TXT records adicionados (manual)

## Search Console
- [ ] Property criada e verificada
- [ ] Sitemap submetido
- [ ] Mobile usability: 0 erros
```

### Evidências
- [ ] Arquivo `SEO-CHECKLIST.md` criado em `output/workspace/system-forge-landing-page/`

---

## Sumário de Execução

| Task | Status | Tempo | Bloqueia | Prioridade |
|------|--------|-------|----------|-----------|
| T001 | pending | 2h | T008, T009 | 🔴 HIGH |
| T002 | pending | 2h | T009 | 🔴 HIGH |
| T003 | pending | 1.5h | T009 | 🟡 MEDIUM |
| T004 | pending | 2h | T009 | 🟡 MEDIUM |
| T005 | pending | 1h | T007, T009 | 🟡 MEDIUM |
| T006 | pending | 1.5h | — | 🟢 LOW |
| T007 | pending | 1h | — | 🟢 LOW |
| T008 | pending | 1.5h | — | 🔴 HIGH |
| T009 | pending | 1h | T001–T008 | 🟢 LOW |

**Tempo Total:** ~14.5h

---

## Notas Importantes

1. **Build 3x:** Lembrar de testar cada build (build:br, build:it, build:en) separadamente
2. **Staging:** Executar checklist em staging antes de prod
3. **DNS:** Alguns items requerem ação manual em registrar do domínio
4. **Search Console:** Propriedade deve ser verificada ANTES de submeter sitemap

---
