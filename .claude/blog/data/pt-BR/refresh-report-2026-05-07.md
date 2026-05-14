# Refresh Report — 2026-05-07 — All Locales

- **Locales atualizados:** pt-BR, it-IT, en, es-ES
- **Modo de priorizacao:** fallback (sem analytics-feed.json)
- **Familias de artigos atualizadas:** 3
- **Artigos atualizados:** 12 (3 por locale)
- **Secoes adicionadas:** ~20
- **Links internos injetados:** ~6
- **FAQs adicionados:** 12 (3 por locale)
- **Dados atualizados:** ~16 (precos, requisitos Google Play)

---

## Familia 1: Contratar Software House

| Locale | Artigo | Idade | Principais Mudanças |
|--------|--------|-------|---------------------|
| pt-BR | como-contratar-software-house-o-que-avaliar | ~10 meses | FAQ com 5 perguntas, links internos |
| it-IT | come-assumere-software-house-cosa-valutare | ~10 meses | FAQ com 5 perguntas |
| en | how-to-hire-a-software-house-what-to-evaluate | ~10 meses | FAQ com 5 perguntas |
| es-ES | como-contratar-una-empresa-de-software-que-evaluar | ~10 meses | FAQ com 5 perguntas |

## Familia 2: Pricing SaaS B2B

| Locale | Artigo | Idade | Principais Mudanças |
|--------|--------|-------|---------------------|
| pt-BR | pricing-saas-b2b-guia-pratico | ~10 meses | Preços atualizados 2026, secao AI Credits, FAQ |
| it-IT | pricing-saas-b2b-guida-pratica | ~10 meses | Preços EUR atualizados 2026, secao AI Credits, FAQ |
| en | saas-b2b-pricing-practical-guide | ~10 meses | Preços USD atualizados 2026, secao AI Credits, FAQ |
| es-ES | pricing-saas-b2b-guia-practica | ~10 meses | Secao AI Credits, FAQ (artigo mais curto, sem tabela de precos detalhada) |

## Familia 3: Publicar App na App Store/Google Play

| Locale | Artigo | Idade | Principais Mudanças |
|--------|--------|-------|---------------------|
| pt-BR | publicar-app-app-store-google-play-guia | ~10 meses | Google Play 20→12 testers, secao 2025/2026, FAQ |
| it-IT | pubblicare-app-store-google-play-guida | ~10 meses | Google Play 20→12 testers, secao 2025/2026, FAQ |
| en | publish-app-on-app-store-and-google-play | ~10 meses | Google Play 20→12 testers, secao 2025/2026, FAQ |
| es-ES | publicar-app-app-store-google-play-guia | ~10 meses | Google Play 20→12 testers, secao 2025/2026, FAQ |

---

## Stockpile — Impacto do Refresh

- **Pacotes afetados (cluster match):** 0
- **Eventos emitidos (refresh_content):** 0
- **Detalhes:** Stockpile vazio — FASE 3 pulada em todos os locales

---

## Commits

```
779cbe8 content(refresh): update 3 oldest pt-BR articles with 2026 data
23e4dcb content(refresh): propagate updates to it-IT, en, es-ES articles
```

Pushed to `origin main`

---

## Notas

- Os artigos em es-ES sao versoes mais curtas que os outros locales. As atualizacoes foram adaptadas proporcionalmente.
- O commit 23e4dcb incluiu tambem 39 arquivos de scripts/testes do stockpile que estavam pendentes no workspace.
- Recomenda-se configurar `/blog:analytics-review` para futuros runs com priorizacao baseada em dados reais.
