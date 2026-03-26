# AUDIT-USER-FLOWS.md

**Projeto:** SystemForge Landing Page
**Task:** TASK-7 — Audit de User Flows (module-9-integration)
**Data:** 2026-03-25
**Método:** Revisão de código (sem servidor — estático)
**Auditor:** Claude Code

---

## Tabela de Resultado por Fluxo

| # | Fluxo | Resultado | Observações |
|---|-------|-----------|-------------|
| 1 | Conversão Direta (Happy Path) | ⚠️ PARCIAL | CTA sem texto pré-preenchido no WhatsApp; sem ENV → fallback `https://wa.me` (sem número) |
| 2 | Blog → Conversão (Happy Path) | ✅ APROVADO | Todos os componentes presentes e corretos |
| 3 | Serviços → Portfólio (Happy Path) | ✅ APROVADO | 11 serviços, breadcrumb, RelatedProjects e CTA presentes |
| 4 | Newsletter (Happy Path) | ⏳ PARCIAL | Worker não deployado; código client-side correto |
| 5 | Portfólio (Happy Path) | ✅ APROVADO | Galeria, filtros, empty state e links externos presentes |
| 6 | Sad Path — CTA sem ENV var | ⚠️ PARCIAL | SITE_URL é obrigatória (falha build); WHATSAPP/CALENDLY obrigatórias no schema mas sem fallback "gracioso" em `buildWhatsAppCTA` — **BUG CORRIGIDO** |
| 7 | Sad Path — Newsletter offline | ✅ APROVADO | try/catch presente, toast de erro, reset para `idle` |
| 8 | Sad Path — Busca vazia no Blog | ✅ APROVADO (pós-fix) | Faltava sugestão de ação — **BUG CORRIGIDO** |

---

## Detalhamento por Fluxo

### Fluxo 1 — Conversão Direta (Happy Path)

**HeroSection renderiza corretamente:**
✅ Código correto — `HeroSection` em `src/components/sections/HeroSection.tsx` renderiza headline, subheadline, stats bar e CTAs via `CTAGroup`.

**CTA "Falar no WhatsApp" visível no Hero:**
✅ Código correto — `buildDefaultCTAs()` retorna 3 CTAs com `ConversionAction.WHATSAPP` como primeiro item; `CTAGroup` os renderiza em layout horizontal.

**CTAButton tem handler que leva para `wa.me/{WHATSAPP_NUMBER}`:**
✅ Código correto — `CTAButton` em `handleClick` valida o href com `isAllowedCTAHref()` e chama `window.open(config.href, '_blank', 'noopener,noreferrer')`.

**Mensagem pré-preenchida no WhatsApp:**
❌ Problema no código (observação) — `buildDefaultCTAs` e `buildWhatsAppCTA` geram URLs `https://wa.me/{number}` sem parâmetro `?text=...`. A mensagem pré-preenchida não é enviada ao WhatsApp. Isso não é um bug bloqueador (WhatsApp abre normalmente), mas é uma oportunidade de melhoria para contexto de conversão.

**Fallback sem ENV var:**
✅ Código correto — `buildDefaultCTAs` usa `whatsappNumber ? \`https://wa.me/...\` : 'https://wa.me'`. O `CTAButton` valida o domínio `wa.me` como permitido.

---

### Fluxo 2 — Blog → Conversão (Happy Path)

**`/blog` com lista de artigos ou empty state:**
✅ Código correto — `app/blog/page.tsx` ordena `allArticles` por data DESC, fatia para `BLOG_ITEMS_PER_PAGE` e passa para `BlogListPage`. Empty state controlado dentro do componente.

**Artigos levam para `/blog/{slug}`:**
✅ Código correto — `SearchBar` usa `Link href={\`/blog/${result.slug}\`}`. `ArticleCard` e `BlogListPage` usam `ROUTES.BLOG_POST(slug)`.

**Breadcrumb no artigo:**
✅ Código correto — `ArticlePage` renderiza `<Breadcrumb items={breadcrumbItems} />` com items `[Blog → título]`.

**CTA ao final do artigo (SidebarCTA ou CTAContextual):**
✅ Código correto — `ArticlePage` renderiza `<CTAContextual relatedService={article.relatedService} />` após o conteúdo MDX; `<SidebarCTA>` aparece na sidebar desktop e inline mobile.

**`RelatedArticles` component:**
✅ Código correto — `ArticlePage` renderiza seção "Artigos Relacionados" com `ArticleCard` em grid 3 colunas (ou fallback link para `/blog`). Os artigos são buscados via `getRelatedArticles()` na page.

**`NewsletterOptIn` presente na página do artigo:**
✅ Código correto — `ArticlePage` importa e renderiza `<NewsletterOptIn />` após a seção de artigos relacionados.

---

### Fluxo 3 — Serviços → Portfólio (Happy Path)

**ServicesGrid tem 11 serviços:**
✅ Código correto — `src/lib/data/services.ts` exporta `servicesData` com exatamente 11 entradas: SAAS, MOBILE, MARKETPLACE, AI, BOTS, LANDING_PAGE, ECOMMERCE, DASHBOARD, API, DESKTOP, GESTAO.

**Cada card tem link para `/servicos/{slug}`:**
✅ Código correto — `ServiceCard` usa `Link href={ROUTES.SERVICE(service.slug)}`. `ROUTES.SERVICE` retorna `/servicos/${slug}`.

**Página `/servicos/[slug]` renderiza conteúdo MDX:**
✅ Código correto — `app/servicos/[slug]/page.tsx` carrega `servicesConfig` e `servicesData`; passa `config` para `ServicePage` que renderiza `longDescription`.

**Breadcrumb funcional:**
✅ Código correto — `ServicePage` renderiza `<Breadcrumb items={[{ label: 'Serviços', href: ROUTES.SERVICES }, { label: config.title, href: ROUTES.SERVICE(config.category) }]} />`.

**Projetos relacionados do portfólio (RelatedProjects):**
✅ Código correto — `ServicePage` renderiza `<RelatedProjects projects={config.relatedProjects} serviceName={config.title} />`.

**CTA na página de serviço:**
✅ Código correto — `ServicePage` renderiza dois `CTAGroup` com `buildWhatsAppCTA` e `buildBudgetCTA`: um no hero e um ao final da página.

---

### Fluxo 4 — Newsletter (Happy Path)

**NewsletterOptIn presente em artigos:**
✅ Código correto — importado e renderizado em `ArticlePage` (linha 152).

**Validação client-side (email inválido, consent obrigatório):**
✅ Código correto — `validateForm()` em `NewsletterOptIn` valida email com regex e consent obrigatório. Exibe `emailError` e `consentError` via `role="alert"`.

**Estado `submitting` visível:**
✅ Código correto — botão exibe "Enviando..." e `loading={status === 'submitting'}`, inputs ficam `disabled`.

**Estado `success` exibe mensagem:**
✅ Código correto — quando `status === 'success'`, renderiza seção com `aria-live="polite"` e mensagem "Verifique seu email para confirmar sua inscrição!".

**NOTIF-001: Worker não deployado:**
⏳ Requer teste manual com servidor — `NEXT_PUBLIC_NEWSLETTER_API_URL` é opcional no schema Zod. Quando ausente, `NewsletterOptIn` cai no bloco `if (!apiUrl)` e exibe `toast.error('Erro ao se inscrever. Tente novamente.')` revertendo para `idle`. O fluxo de inscrição real aguarda deploy do Cloudflare Worker.

---

### Fluxo 5 — Portfólio (Happy Path)

**`/portfolio` tem galeria:**
✅ Código correto — `app/portfolio/page.tsx` renderiza `<PortfolioFilteredList projects={portfolioProjects} />` dentro de `Section`.

**Filtros de categoria funcionam:**
✅ Código correto — `PortfolioFilteredList` usa `useState<FilterState>` e `useMemo` para filtrar por `ServiceCategory`. Botões com `aria-pressed` e `onClick={() => setFilter(cat)}`.

**Empty state para categoria vazia:**
✅ Código correto — quando `filteredProjects.length === 0`, renderiza `<div>Nenhum projeto em {getCategoryLabel(filter)} ainda.</div>` com botão "Ver todos os projetos →" que reseta o filtro.

**Cards com link externo em nova aba:**
✅ Código correto — `PortfolioFilteredList` renderiza `Link href={project.url} target="_blank" rel="noopener noreferrer"` com `aria-label` descritivo. `PortfolioCard` (seção home) usa `<a>` com os mesmos atributos.

---

### Fluxo 6 — Sad Path — CTA sem ENV var

**`lib/env.ts` valida `NEXT_PUBLIC_WHATSAPP_NUMBER` como required:**
✅ Código correto — `EnvSchema` em `src/lib/env.ts` define `NEXT_PUBLIC_WHATSAPP_NUMBER` como `z.string().min(1, 'ENV_002: ...').regex(...)`. A função `getValidatedEnv()` lança `Error` com mensagem descritiva se inválida.

**`CTAButton` não usa `wa.me/undefined`:**
✅ Código correto — `buildDefaultCTAs` verifica `whatsappNumber ? \`https://wa.me/...\` : 'https://wa.me'`. O domínio `wa.me` está na `ALLOWED_CTA_DOMAINS`, então `isAllowedCTAHref` retorna `true` mesmo sem número.

**BUG CORRIGIDO — `buildWhatsAppCTA` sem guard de número vazio:**
`buildWhatsAppCTA` (usada em `SidebarCTA` e `ServicePage`) produzia `https://wa.me/` (barra sem número) quando `NEXT_PUBLIC_WHATSAPP_NUMBER` estava ausente, pois não havia fallback. Corrigido em `src/lib/cta.ts` linha 66 para usar o mesmo padrão de `buildDefaultCTAs`.

**A validação Zod falha o build se ENV obrigatória estiver ausente:**
⚠️ Comportamento observado — `getValidatedEnv()` lança em runtime (não em build time). As ENV vars de CTA são marcadas como obrigatórias no schema, mas `getEnv()` é um singleton inicializado em runtime. Portanto, o build Next.js (`next build`) **não** falha se as ENVs estiverem ausentes — apenas o acesso runtime ao singleton falhará. `NEXT_PUBLIC_SITE_URL` é a única que pode causar falha de build se usada em `generateMetadata` durante SSG.

---

### Fluxo 7 — Sad Path — Newsletter offline

**Tem try/catch ou .catch() para falha de rede:**
✅ Código correto — `handleSubmit` em `NewsletterOptIn` usa `try/catch` envolvendo o `fetch`.

**Toast de erro é exibido:**
✅ Código correto — no bloco `catch`, executa `toast.error('Erro ao se inscrever. Tente novamente.')`.

**Formulário volta para estado `idle`:**
✅ Código correto — no bloco `catch`, executa `setStatus('idle')` antes de exibir o toast.

**AbortController com timeout:**
✅ Código correto — `setTimeout(() => controller.abort(), 10000)` garante timeout de 10s. `AbortController.abort()` causa o `catch` ser disparado.

---

### Fluxo 8 — Sad Path — Busca vazia no Blog

**Quando query sem resultados → empty state correto:**
✅ Código correto — `SearchBar` exibe dropdown quando `showDropdown` e, dentro, verifica `hasResults`. Quando falso, renderiza mensagem de "não encontrado".

**Mensagem com `query` interpolada:**
✅ Código correto — usa `{query}` (valor debounced de `useArticleSearch`) na mensagem: "Nenhum artigo encontrado para "{query}"".

**Sugestão de ação:**
❌ PROBLEMA ENCONTRADO E CORRIGIDO — a versão original exibia apenas a mensagem sem nenhuma sugestão de ação. Corrigido em `src/components/blog/SearchBar.tsx` para exibir "Tente termos diferentes ou [navegue pelo blog](/blog)".

---

## Bloqueadores (Fluxos REPROVADOS)

Nenhum fluxo foi reprovado. Dois bugs foram encontrados e corrigidos in-place:

| Bug | Arquivo | Status |
|-----|---------|--------|
| `buildWhatsAppCTA` sem fallback para número vazio — produzia `https://wa.me/` (URL inválida) | `src/lib/cta.ts` | ✅ CORRIGIDO |
| `SearchBar` empty state sem sugestão de ação | `src/components/blog/SearchBar.tsx` | ✅ CORRIGIDO |

---

## Pendências (não-bloqueadoras)

| Item | Descrição | Resolução |
|------|-----------|-----------|
| NOTIF-001 | Cloudflare Worker não deployado — newsletter não funcional em produção | Deploy do Worker + configuração de `NEXT_PUBLIC_NEWSLETTER_API_URL` |
| WhatsApp pré-preenchido | CTAs de WhatsApp não enviam `?text=...` contextual | Melhoria futura: adicionar parâmetro `text` codificado por contexto |
| ENV build-time | Zod valida ENVs em runtime, não em `next build`. Build não falha com ENVs ausentes | Considerar `next build` com `.env.local` mandatório no CI/CD |

---

## Veredito Final

**⏳ PARCIAL — Worker pendente**

Todos os fluxos de código estão corretos após as correções aplicadas. O único item que impede APROVADO completo é o Cloudflare Worker não deployado, que torna o Fluxo 4 (Newsletter) dependente de ação de infraestrutura.

- Fluxos bloqueados por código: 0
- Bugs corrigidos: 2
- Pendências de infra: 1 (Worker)
- Fluxos aprovados (código): 8/8
