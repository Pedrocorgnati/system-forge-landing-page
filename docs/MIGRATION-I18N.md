# Migração i18n: next-intl/next-i18next → i18n-triple-market

**Data:** 2026-03-28
**Escopo:** feature `i18n-triple-market`
**Executado por:** module-12-compliance-seo / TASK-5

---

## Abordagem Anterior (I18N-SPEC.md legado)

- Biblioteca planejada: `next-intl` (abordagem mono-idioma pt-BR)
- Locales planejados: pt-BR, en
- Conteúdo: `messages/{locale}.json`
- Estratégia de URLs: Prefixo de locale (`/pt-BR/`, `/en/`)
- Status: **Nunca implementada no workspace** — spec substituída antes da execução

## Nova Abordagem (Triple-Market)

- Conteúdo: `content/{locale}/pages/*.json`, `content/{locale}/blog/*.json`
- Configuração por mercado: `config/sites/{locale}.ts` via `getSiteConfig()`
- Build por locale: `npm run build:br | build:it | build:en`
- 3 domínios independentes: forjadesistemas.com.br / systemforge.it / systemforgesoftware.com
- Sem roteamento de locale em runtime — locale definido em build-time via `NEXT_PUBLIC_LOCALE`
- Spec de referência: `output/docs/system-forge-landing-page/features/i18n-triple-market/`

---

## Achados da Auditoria

**Data da auditoria:** 2026-03-28

### src/ — Imports legados

```
grep -r "next-i18next" src/   → Nenhum achado
grep -r "react-i18next" src/  → Nenhum achado
grep -r "useTranslation" src/ → Nenhum achado
grep -r "i18next" src/        → Nenhum achado
grep -r "serverSideTranslations" src/ → Nenhum achado
```

**Resultado: Nenhum achado — migração limpa**

### package.json — Dependências

```
grep "next-i18next"  → Não encontrado
grep "react-i18next" → Não encontrado
grep "i18next"       → Não encontrado
```

**Resultado: Nenhuma dependência legada no package.json**

### next.config.ts — Bloco i18n{}

```
grep "i18n" next.config.ts → Não encontrado
```

`output: 'export'` confirmado presente (compatível com static export).

**Resultado: Nenhum bloco i18n{} incompatível**

### Arquivos de conteúdo legados

```
public/locales/ → Não existe
i18n.json (raiz) → Não existe
```

**Resultado: Nenhum artefato legado**

---

## Ações Tomadas

| Subtask | Ação | Resultado |
|---------|------|-----------|
| ST001 | Banner SUPERSEDED adicionado a `project/I18N-SPEC.md` | Concluído |
| ST002 | Este documento criado com resultado da auditoria | Concluído |
| ST003 | SKIP — nenhuma dependência legada detectada | N/A |
| ST004 | Referências cruzadas verificadas em `output/docs/` | Ver abaixo |

### ST004 — Referências cruzadas

Arquivos com referência a `I18N-SPEC`:

| Arquivo | Tipo de referência | Ação |
|---------|-------------------|------|
| `features/i18n-triple-market/features/compliance-polimento/FDD.md` | Checklist de arquivamento (ação já planejada) | Sem alteração necessária |
| `features/i18n-triple-market/PRD.md` | Critério de aceite "Arquivar ou remover I18N-SPEC.md" | Critério atendido pelo banner SUPERSEDED |
| `project/research/RESEARCH-seo-cro-performance-briefing.md` | Lista de docs consultados (histórico de pesquisa) | Sem alteração — contexto histórico adequado |

Nenhuma nota inline foi necessária — todas as referências são retrospectivas (planejamento de arquivamento ou histórico de pesquisa), não instruções de implementação.

---

## Status Final

- ✅ `I18N-SPEC.md` legado sinalizado como SUPERSEDED
- ✅ Nenhuma dependência legada a remover
- ✅ `next.config.ts` sem bloco `i18n{}` incompatível
- ✅ `output: 'export'` presente
- ✅ Zero imports de i18n legado em `src/`
- ✅ `public/locales/` não existe (nunca foi criada)
