# Performance Report — i18n-triple-market

**Projeto:** system-forge-landing-page
**Feature:** i18n-triple-market (BR/IT/EN)
**Atualizado em:** CI pipeline — ver GitHub Actions artifact `lighthouse-results-*`

---

## Baselines (pré-feature)

| Métrica | BR (mono-idioma, pré-i18n) |
|---------|---------------------------|
| Performance | [Preencher via TASK-0/ST002 — rodar `npm run lighthouse:br` localmente] |
| LCP | [Preencher via TASK-0/ST002] |
| CLS | [Preencher via TASK-0/ST002] |
| SEO | [Preencher via TASK-0/ST002] |

---

## Targets (SLAs)

| Métrica | Target | Justificativa |
|---------|--------|---------------|
| LCP | < 2.5s | Core Web Vitals "Good" — ranking Google |
| CLS | < 0.1 | Core Web Vitals "Good" — experiência de scroll |
| INP | < 200ms | Core Web Vitals "Good" — responsividade |
| Lighthouse Perf | ≥ 90 | Ranking orgânico em 3 domínios novos |
| Lighthouse SEO | ≥ 95 | Máximo ranqueamento — domínios sem autoridade inicial |
| Lighthouse A11y | ≥ 90 | US-019: Acessibilidade multilíngue |

---

## Resultados por Domínio

[Preenchido automaticamente por `scripts/perf-report.ts` via CI]

_Execute manualmente: `npx tsx scripts/perf-report.ts --artifacts-dir=./lighthouse-results`_

---

## Checklist de Otimizações por Locale

### Brasil (forjadesistemas.com.br)

- [x] Hero `<Image>` com `priority={true}` (`HeroSection.tsx` — `src="/hero-illustration.png"`)
- [x] Header logo com `priority={true}` (`Header.tsx` — `src="/images/logo.png"`)
- [x] OG image localizada `og-br.png` em `public/og/` → `seo.ogImage: '/og/og-br.png'`
- [x] Font loading via `next/font` (`Inter` com `subsets: ['latin', 'latin-ext']` em `layout.tsx`)
- [x] `.htaccess` com brotli+gzip+cache-control (`public/.htaccess` — já implementado em module-8)
- [ ] GA4 gateado por cookie banner (verificar module-11-cookie-compliance)
- [ ] Lighthouse SEO ≥ 95 (hreflang, canonical, meta description em PT-BR)
- [ ] OG image final com branding localizado (usar `/create-assets`)

### Itália (systemforge.it)

- [x] Hero `<Image>` com `priority={true}` (mesmo componente, condicionado por locale)
- [x] Header logo com `priority={true}`
- [x] OG image localizada `og-it.png` em `public/og/` → `seo.ogImage: '/og/og-it.png'`
- [x] Font loading via `next/font` com `latin-ext` subset (cobre caracteres IT: à, è, ì, ò, ù)
- [x] `lang="it"` no `<html>` (US-019 — `htmlLang: 'it'` em `config/sites/it.ts`)
- [x] `.htaccess` com brotli+gzip+cache-control (já implementado em module-8)
- [ ] GA4 gateado pelo cookie banner GDPR IT (verificar module-11)
- [ ] Lighthouse SEO ≥ 95 (hreflang, canonical, meta description em IT-IT)
- [ ] OG image final com branding localizado

### EUA/Internacional (systemforgesoftware.com)

- [x] Hero `<Image>` com `priority={true}`
- [x] Header logo com `priority={true}`
- [x] OG image localizada `og-en.png` em `public/og/` → `seo.ogImage: '/og/og-en.png'`
- [x] Font loading via `next/font`
- [x] `lang="en"` no `<html>` (US-019 — `htmlLang: 'en'` em `config/sites/en.ts`)
- [x] `.htaccess` com brotli+gzip+cache-control (já implementado em module-8)
- [ ] GA4 gateado pelo cookie banner (CAN-SPAM)
- [ ] Lighthouse SEO ≥ 95 (hreflang, canonical, meta description em EN)
- [ ] OG image final com branding localizado

---

## .htaccess — Cache e Compressão (Hostinger)

Adicionar em `public/.htaccess` para todos os locales:

```apache
# Compressão gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Cache de longa duração para assets estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

<IfModule mod_headers.c>
    <FilesMatch "\.(png|webp|jpg|js|css)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>
```

**Nota Hostinger:** O servidor usa LiteSpeed. As diretivas `mod_deflate` e `mod_expires`
têm compatibilidade parcial. Verificar no painel Hostinger se há opção de cache nativa
(LiteSpeed Cache) como alternativa mais confiável.

---

## Histórico de Execuções

| Data | BR Perf | IT Perf | EN Perf | LCP BR | CLS BR | Status |
|------|---------|---------|---------|--------|--------|--------|
| [CI Run] | — | — | — | — | — | [Automático via GitHub Actions] |

---

## Como Atualizar Este Relatório

```bash
# 1. Baixar artifacts do último CI run (via gh CLI)
gh run download <run-id> --name lighthouse-results-br --dir lighthouse-results/lighthouse-results-br
gh run download <run-id> --name lighthouse-results-it --dir lighthouse-results/lighthouse-results-it
gh run download <run-id> --name lighthouse-results-en --dir lighthouse-results/lighthouse-results-en

# 2. Rodar script de consolidação
npx tsx scripts/perf-report.ts --artifacts-dir=./lighthouse-results
```
