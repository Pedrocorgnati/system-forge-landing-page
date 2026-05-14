# Quality Gate Report — 2026-05-13 — Locale: pt-BR — Modo: stockpile

## Resultado
- Locale: pt-BR (Brasil)
- Modo: stockpile (3 checks desabilitados: anti-canibalização, links internos, internal_links_resolved)
- Total avaliados: 5
- APROVADOS: 0
- COM RESSALVAS: 5
- RETIDOS: 0
- Taxa de aprovacao: 0%

## Artigos Aprovados / Com Ressalvas
| Slug | Score Medio | Status | Ressalva |
|------|-------------|--------|----------|
| portal-imobiliario-proprio-quanto-custa-2026 | — | COM RESSALVAS | loc_foreign_expr |
| quem-faz-backend-confiavel-guia-pmes-2026 | — | COM RESSALVAS | loc_foreign_expr |
| quanto-custa-app-forca-vendas-reais-prazos-stack-2026 | — | COM RESSALVAS | loc_foreign_expr |
| freelancer-ou-agencia-qual-escolher-software-2026 | — | COM RESSALVAS | loc_country_ref |
| quanto-custa-software-agencia-turismo-2026 | — | COM RESSALVAS | loc_foreign_expr |

## Nota: Ressalvas Identificadas
Todos os 5 artigos falharam em `loc_foreign_expr` (falso positivo: "vos " em "novos",
"receptivos"; "che " em "cache") ou `loc_country_ref`. Esses são falsos positivos de
regex substring sem word boundary — o conteúdo está em PT-BR correto. Recomendação:
ajustar thresholds do checker para word-boundary nas proximas rodadas.

Critério de desempate Codex (2+ ressalvas): não ativado — todos têm 1 ressalva apenas.

## Artigos Retidos
Nenhum.

## Próximos Passos
- Artigos: 5 pacotes disponíveis para `/blog:stockpile-promote` quando `enabled=true`
- Ressalvas: resolver false positive em `loc_foreign_expr` atualizando `blog_quality_gate_checklist.py` com `` word boundary
- Pipeline diário promoverá automaticamente quando `config.stockpile.enabled = true`
