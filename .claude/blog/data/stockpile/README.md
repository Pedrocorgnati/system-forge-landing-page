# Stockpile V2 — Storage

> Spec completa: `scheduled-updates/auto-blog/STOCKPILE-FEATURE.md`  
> ADRs: ADR-001..ADR-004 em `scheduled-updates/auto-blog/`  
> Runbook: `scheduled-updates/auto-blog/STOCKPILE-RUNBOOK.md` (disponível após F1.7)

---

## Estrutura

```
.claude/blog/data/stockpile/
  index.json                      # índice DERIVADO — nunca editar diretamente
  invalidation-log.jsonl          # append-only — não editar linhas existentes
  packages/
    {equivalence_id}/             # UUID v4 do grupo de equivalência
      package.json                # contrato canônico do pacote
      pt-BR/
        reviewed.md               # output de /blog:review-seo
        brief-fingerprint.json    # hash do brief + keywords
        metadata.json             # tags, relatedService, excerpt, scores
      it-IT/   (opcional)
      en/      (opcional)
      es-ES/   (opcional)
```

## Contratos

- `packages/` contém somente UUIDs de grupos — nunca slugs ou locales diretamente
- `index.json` é regenerável via `npm run stockpile:rebuild-index`
- `invalidation-log.jsonl` é **append-only** — nunca remover ou editar linhas existentes
- Pacotes promovidos são **deletados imediatamente** após o commit confirmar (`archive_promoted_after_days: 0`)
- Nenhum arquivo em `stockpile/` é MDX final — são drafts revisados e metadados

## Estado atual

Stockpile desabilitado (`enabled: false` em `config.json`). Ativação: Fase 5 do pipeline V2.

## Ciclo de vida de um pacote

```
generated → quality_gated → (freshness_checked) → promoted → [deleted]
```

Estado explícito em `package.json > lifecycle.*`.

## Invariantes de mutação

1. `index.json` nunca é fonte de verdade — rebuild via script em caso de divergência
2. Nenhum script move/deleta pacotes sem registrar em `invalidation-log.jsonl`
3. Mutação em `package.json` requer bump de `lifecycle.*` correspondente
4. `block_contents_api_for_stockpile: true` — routine nunca usa Contents API para este diretório
