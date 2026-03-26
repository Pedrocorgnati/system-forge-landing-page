# AUDIT-SCHEMAS.md

**Projeto:** SystemForge Landing Page
**Task:** TASK-4 — Audit de Schemas e DTOs TypeScript (module-9-integration)
**Data:** 2026-03-25
**Executado por:** Claude (Sonnet 4.6)

---

## ST001 — Output do `npx tsc --noEmit`

```
(nenhum output — sem erros)
EXIT_CODE=0
```

**Resultado:** 0 erros TypeScript. Compilação limpa.

---

## ST002 — Uso de `any`

### Ocorrências de `: any`

Nenhuma ocorrência encontrada em `src/`.

### Ocorrências de `as any`

| Arquivo | Linha | Trecho | Justificativa |
|---------|-------|--------|---------------|
| `src/components/blog/SearchBar.tsx` | 12 | `(window as any).gtag(...)` | `gtag` não possui typings nativos no objeto `window`; acesso pontual via type assertion. Comentário justificativo adicionado na mesma linha. Acompanhado de `eslint-disable-next-line @typescript-eslint/no-explicit-any`. |

**Acao aplicada:** Comentário `// any: gtag não tem typings nativos...` adicionado inline na ocorrência.

---

## ST003 — Enums fora de `lib/types.ts`

```
src/lib/types.ts:20:  export enum ServiceCategory
src/lib/types.ts:38:  export enum TechTag
src/lib/types.ts:58:  export enum ConversionAction
src/lib/types.ts:68:  export enum DeliveryCountry
src/lib/types.ts:76:  export enum ProjectStatus
```

**Resultado:** Todos os enums estão centralizados em `src/lib/types.ts`. Nenhuma declaracao fora do arquivo canônico.

---

## ST004 — Interfaces principais duplicadas

| Interface buscada | Localização(ões) encontradas |
|-------------------|------------------------------|
| `PortfolioProject` | `src/lib/types.ts:87` (unica) |
| `Testimonial` | `src/lib/types.ts:179` (unica) |
| `CTAConfig` | `src/lib/types.ts:106` (unica) |
| `ServicePage` | Nenhuma interface `ServicePage` — apenas `ServicePageData` em `lib/types.ts:156` e `ServicePageProps` em `ServicePage.tsx:11` |

**Observacao sobre `ServicePageProps`:** Interface local em `src/components/pages/ServicePage.tsx` que descreve as props do componente React (`config: ServicePageData`, `relatedArticles: ArticleFrontmatter[]`). Nao e uma redefinicao de `ServicePageData` — e complementar e correta, seguindo o padrao de props tipadas por componente.

**Resultado:** Nenhuma interface principal redefinida fora de `lib/types.ts`.

---

## Tabela Consolidada de Problemas

| ID | Tipo | Severidade | Arquivo | Descricao | Status |
|----|------|------------|---------|-----------|--------|
| — | `as any` sem justificativa | MEDIO | `SearchBar.tsx:12` | `window.gtag` sem typings | CORRIGIDO (comentario adicionado) |

---

## Veredito

**APROVADO**

- `npx tsc --noEmit`: **0 erros** (exit code 0)
- Erros criticos (TS2322, TS2339): **0**
- Erros medios: **0** (o unico `as any` ja possuia eslint-disable; justificativa inline adicionada)
- Enums fora de `lib/types.ts`: **0**
- Interfaces duplicadas: **0**
- Correcoes aplicadas: **1** (comentario justificativo em `SearchBar.tsx:12`)
