# Deploy Report — 2026-04-08 — Locale: pt-BR

## Resultado
- Artigos publicados hoje: 5 (wave 3 + nichos setoriais + compliance)
- Artigos existentes atualizados (links): 3
- Total artigos no blog: 212

## Artigos Publicados

| # | Slug | Score | Wave | Destino |
|---|------|-------|------|---------|
| 1 | quanto-custa-contratar-software-house-brasil-2026 | 9.2 | 3 | content/pt-BR/blog/quanto-custa-contratar-software-house-brasil-2026.mdx |
| 2 | software-house-vs-freelancer-qual-escolher | 8.8 | 3 | content/pt-BR/blog/software-house-vs-freelancer-qual-escolher.mdx |
| 3 | sistema-para-hotel-pousada | 8.8 | 1 | content/pt-BR/blog/sistema-para-hotel-pousada.mdx |
| 4 | lgpd-sistema-empresa-adequar-2026 | 8.8 | 2 | content/pt-BR/blog/lgpd-sistema-empresa-adequar-2026.mdx |
| 5 | sistema-para-barbearia | 8.5 | 1 | content/pt-BR/blog/sistema-para-barbearia.mdx |

## Anti-canibalizacao
- Verificado: nenhum dos 5 slugs existia previamente no destino.
- software-house-vs-freelancer: complementa "como-contratar-software-house-o-que-avaliar" sem canibalizar (ângulos distintos: decisão vs avaliação)
- sistema-para-barbearia: complementa "sistema-para-salao-de-beleza" (nichos distintos)
- lgpd-sistema-empresa-adequar-2026: complementa "seguranca-software-10-vulnerabilidades-comuns" (compliance vs segurança técnica)

## Links Injetados em Artigos Existentes

| # | Artigo existente | Link adicionado para | Anchor |
|---|-----------------|---------------------|--------|
| 1 | como-contratar-software-house-o-que-avaliar | software-house-vs-freelancer-qual-escolher | "software house e freelancer" |
| 2 | seguranca-software-10-vulnerabilidades-comuns | lgpd-sistema-empresa-adequar-2026 | "adequar seu sistema à LGPD" |
| 3 | sistema-para-salao-de-beleza | sistema-para-barbearia | "sistema para barbearia com IA" |

## Próximo Passo
- Build: `cd output/workspace/system-forge-landing-page && npm run build:br`
- Deploy: `/commit:multilanguage`
