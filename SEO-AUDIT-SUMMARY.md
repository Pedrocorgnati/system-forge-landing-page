# SEO & Metadata - Executive Summary

**Projeto:** System Forge Landing Page (i18n Triple-Market)
**Auditoria:** `/nextjs:seo`
**Data:** 2026-03-29

---

## 📊 Scorecard Geral

```
┌─────────────────────────────────┬───────┬──────────┐
│ Categoria                       │ Score │ Status   │
├─────────────────────────────────┼───────┼──────────┤
│ Metadata API                    │ 95%   │ ✅ OK    │
│ Open Graph / Twitter            │ 70%   │ ⚠️ GAPS  │
│ Canonical / hreflang            │ 100%  │ ✅ OK    │
│ Robots / Sitemap                │ 100%  │ ✅ OK    │
│ Structured Data (JSON-LD)       │ 70%   │ ⚠️ GAPS  │
│ URL Strategy                    │ 85%   │ ⚠️ MINOR │
│ Verification Setup              │ 50%   │ ❌ NEEDS │
│                                 │       │          │
│ 🎯 OVERALL SEO SCORE            │ 81%   │ ⚠️ BONNE │
└─────────────────────────────────┴───────┴──────────┘
```

---

## ✅ Strengths (O que está ótimo)

### 1️⃣ Metadata API Structure (95%)
- ✅ `metadataBase` dinâmico via config.url
- ✅ Title template com fallback patterns
- ✅ Viewport e theme colors configurados
- ✅ Icons + Manifest + PWA ready
- ✅ Helper function `generatePageMetadata()` bem estruturado

### 2️⃣ Canonical & hreflang (100%)
- ✅ Hreflang completo: pt-BR, it-IT, en-US
- ✅ Reciprocal alternates em todas as páginas
- ✅ `x-default` mapeado (en-US)
- ✅ Dinâmico per route

### 3️⃣ Robots & Sitemap (100%)
- ✅ `robots.ts` com force-static + disallow sensato
- ✅ `sitemap.ts` com hreflang cruzado
- ✅ Prioridades escaladas (1.0 home → 0.4 privacy)
- ✅ Suporte multi-locale com deduplicação

---

## ⚠️ Gaps (O que precisa melhorar)

### 1️⃣ OG/Twitter Cards Incompletos (70%) — **SEVERITY: HIGH**

**Problema:** 7 páginas estáticas definem metadata manualmente sem OG/Twitter:
- `src/app/blog/page.tsx` ❌
- `src/app/servicos/page.tsx` ❌
- `src/app/portfolio/page.tsx` ❌
- `src/app/conselheiro/page.tsx` ❌
- `src/app/privacidade/page.tsx` ❌
- `src/app/privacy/page.tsx` ❌
- `src/app/servicos/[slug]/page.tsx` ❌ (sem OG/Twitter)

**Impacto:** Sem OG images, shares em Facebook/LinkedIn não mostram preview visual. Sem Twitter cards, compartilhamentos em Twitter/X são genéricos.

**Fix:** Refatorar para usar `generatePageMetadata()` helper (task T001).

---

### 2️⃣ Structured Data Gaps (70%) — **SEVERITY: MEDIUM**

**Problemas:**
- ❌ BreadcrumbList: Apenas em blog articles, faltam em `/servicos/[slug]`, `/blog/tag/[tag]`, etc
- ❌ FAQ Schema: FaqSection renderiza HTML, mas sem JSON-LD (Rich Snippets perdidos)
- ❌ Service Schema: Serviços poderiam ter `Service` schema para melhor descrição
- ❌ WebSite SearchAction: Sem schema de busca on-site
- ⚠️ Article schema: BlogPosting OK, mas sem datePublished/dateModified consistency

**Impacto:** Menos rich snippets em SERPs, menor Click-Through Rate (CTR).

**Fix:** Tasks T002, T003, T006.

---

### 3️⃣ Feeds & Alternates (50%) — **SEVERITY: MEDIUM**

**Problema:**
- ❌ RSS/Atom feed: Não existe `/blog/feed.xml`
- ❌ JSON Feed: Não existe `/blog/feed.json`
- ❌ alternates.types: Não declarado em layout

**Impacto:** Agregadores RSS/feedreaders não conseguem subscrever ao blog.

**Fix:** Task T004.

---

### 4️⃣ Verification Incompleto (50%) — **SEVERITY: MEDIUM**

**Problema:**
- ⚠️ Google: Meta tag existe mas env `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` vazio
- ❌ Bing Webmaster: Sem configuração
- ❌ DNS records: Não mapeados

**Impacto:** Search Console não consegue verificar propriedade; acesso limitado a reports.

**Fix:** Task T005 (código) + ação manual (DNS).

---

## 📋 Action Items (9 Tasks)

| # | Task | Tempo | Severidade | Deps |
|---|------|-------|-----------|------|
| **T001** | Refatorar 7 páginas para generatePageMetadata | 2h | 🔴 HIGH | — |
| **T002** | Adicionar BreadcrumbList em rotas dinâmicas | 2h | 🔴 HIGH | — |
| **T003** | Criar FAQ Schema para FaqSection | 1.5h | 🟡 MED | — |
| **T004** | Implementar RSS/Atom feeds | 2h | 🟡 MED | — |
| **T005** | Configurar Google/Bing verification | 1h | 🟡 MED | — |
| **T006** | Service Schema para /servicos/[slug] | 1.5h | 🟢 LOW | — |
| **T007** | Validar robots.ts i18n | 1h | 🟢 LOW | — |
| **T008** | Testar OG/Twitter rendering | 1.5h | 🔴 HIGH | T001 |
| **T009** | Criar SEO checklist pré-deploy | 1h | 🟢 LOW | T001–T008 |

**Tempo Total:** ~14.5 horas
**Sequência recomendada:** T001 → T008 (validação) → T002, T003, T004, T005, T006, T007 (parallelizáveis) → T009

---

## 🚀 Próximas Etapas

### Phase 3: Execução (You are here)
Executar tasks do arquivo `ai-forge/seo-task.md`. Cada task inclui:
- Checklist detalhado
- Arquivos a modificar
- Critérios de aceite
- Evidências necessárias

### Phase 4: Validação
1. **Build 3x:**
   ```bash
   NEXT_PUBLIC_LOCALE=pt-BR npm run build
   NEXT_PUBLIC_LOCALE=it-IT npm run build
   NEXT_PUBLIC_LOCALE=en-US npm run build
   ```
2. **Testar em staging:**
   - Verificar robots.txt e sitemap.xml para cada build
   - Rodar `npm run lint` e `npm run type-check`
   - Testar OG/Twitter com debuggers (links em task T008)

### Phase 5: Deploy & Monitor
1. Deploy para produção (main branch)
2. Submeter sitemap em [Google Search Console](https://search.google.com/search-console)
3. Monitorar:
   - Core Web Vitals (LCP, CLS, FID)
   - Impressões e CTR no GSC
   - Rich Results coverage

---

## 📊 Expected Impact

### SEO Score Improvement
- **Before:** 81% (current)
- **After:** 95%+ (após T001–T005)

### Estimated Metrics Improvement
| Métrica | Estimado |
|---------|----------|
| Impressions (SERPs) | +15-20% |
| Click-Through Rate | +8-12% (melhor social preview) |
| Indexação (coverage) | +10-15% (feeds + sitemap hreflang) |
| Rich Results | +5-8 snippets (FAQ, Breadcrumb) |

---

## 📁 Arquivos Gerados

- ✅ `ai-forge/seo-audit.md` — Auditoria técnica detalhada
- ✅ `ai-forge/seo-task.md` — Task list executável
- ✅ `SEO-AUDIT-SUMMARY.md` (este arquivo)

---

## 🛠️ Tools Recomendados

| Ferramenta | Uso | Link |
|-----------|-----|------|
| Facebook Sharing Debugger | Testar OG images | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | Testar Twitter cards | https://cards-dev.twitter.com/validator |
| Schema.org Rich Results Test | Validar JSON-LD | https://search.google.com/test/rich-results |
| Google Search Console | Monitorar indexação | https://search.google.com/search-console |
| Lighthouse | Core Web Vitals | `npm install -g lighthouse` |
| Feed Validator | Validar RSS/Atom | https://validator.w3.org/feed/ |

---

## ❓ Dúvidas Frequentes

**P: Por que apenas 7 páginas têm gaps de OG/Twitter?**
R: Porque usam `export const metadata = { ... }` manual, não o helper `generatePageMetadata()` que já inclui OG/Twitter por padrão.

**P: Quão crítico é o FAQ Schema?**
R: Médio. Melhora CTR em SERPs mostrando snippet direto, mas não é bloqueador.

**P: Preciso esperar todas as 9 tasks?**
R: Não. T001, T002, T008 são críticas. T003–T007 podem ser feitas depois. T009 é uma formalidade.

**P: O multi-locale (BR/IT/EN) afeta SEO?**
R: Sim, positivamente. Hreflang correto evita conteúdo duplicado e melhora relevância por região.

---

## 📞 Suporte

Para dúvidas sobre execução das tasks, consulte:
- Documentação em `ai-forge/seo-task.md` (step-by-step)
- Next.js docs: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Schema.org: https://schema.org/

---

**Prepared with:** `/nextjs:seo` command
**Generated:** 2026-03-29
**Workspace:** `output/workspace/system-forge-landing-page`
