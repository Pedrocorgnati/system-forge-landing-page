# Quality Gate Report — 2026-06-15 — Modo: stockpile

## Resumo por Locale
| Locale | Total | Aprovados | Com Ressalvas | Retidos | Taxa |
|--------|-------|-----------|---------------|---------|------|
| pt-BR | 119 | 17 | 21 | 81 | 14.3% |
| it-IT | 88 | 3 | 8 | 77 | 3.4% |
| en | 86 | 53 | 17 | 16 | 61.6% |
| es-ES | 88 | 4 | 9 | 75 | 4.5% |

## Pacote Corrente: `ea936043-c9ad-487b-9024-6875dc40f695`
Target slug: `p4-automacao-processos-automacao-empresarial-3`

| Locale | Status | Word Count | Ações |
|--------|--------|------------|-------|
| pt-BR | APROVADO | 1334 | Frontmatter corrigido manualmente; `metadata.json` gerado. |
| it-IT | APROVADO | 1403 | Frontmatter corrigido manualmente; `metadata.json` gerado. |
| en | pendente | 1337 | Aguardando quality gate. |
| es-ES | pendente | 1403 | Aguardando quality gate. |

## Notas
- Modo stockpile: checks de anti-canibalização, links internos e `internal_links_resolved` estão desabilitados.
- Veredito fail-open: RETIDOS/RESSALVAS são registrados, mas não travam a fila.
- O frontmatter mínimo gerado por `review_seo_score.py` precisa de complemento manual (slug, description, tags, author, relatedService, date, canonical, hreflang_pair) e menção do autor no corpo para passar no gate.
