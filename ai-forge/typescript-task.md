# TypeScript Audit — system-forge-landing-page

> Gerado por `/nextjs:typescript` em 2026-03-29
> `tsc --noEmit`: PASSOU (0 erros antes das correções)

---

## Resumo

| Categoria | Status |
|-----------|--------|
| `strict: true` | ✅ |
| `noImplicitAny` (via strict) | ✅ |
| `strictNullChecks` (via strict) | ✅ |
| `useUnknownInCatchVariables` (via strict) | ✅ |
| `noUncheckedIndexedAccess` | ❌ ausente |
| `moduleResolution: "bundler"` | ✅ |
| `paths @/*` | ✅ |
| Plugin `next` | ✅ |
| Pages com `params: Promise<{...}>` | ✅ |
| `generateMetadata` com return `Promise<Metadata>` | ⚠️ falta em 1 page |
| `window as any` | ⚠️ 2 ocorrências (documentadas) |
| `any` em testes | ⚠️ 1 ocorrência (documentada) |
| `@ts-expect-error` justificados | ✅ todos justificados |
| Tipos organizados em `src/types/` | ✅ |

---

### T001 – Habilitar `noUncheckedIndexedAccess` no tsconfig

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `tsconfig.json`

**Descrição:** `noUncheckedIndexedAccess` não está habilitado. Com strict mode, acessos a arrays e índices de Record/objeto retornam `T | undefined`, forçando guards explícitos. Previne bugs de runtime em acessos como `arr[0].prop`.

**Critérios de Aceite:**
- [ ] `"noUncheckedIndexedAccess": true` presente em `tsconfig.json`
- [ ] `tsc --noEmit` continua passando após adição
- [ ] Eventuais erros de tipo introduzidos são corrigidos

**Estimativa:** 0.5h
**Status:** COMPLETED

---

### T002 – Tipar `window.dataLayer` em `gtag.d.ts` e remover `window as any` em Analytics.tsx

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/types/gtag.d.ts`
- modificar: `src/components/analytics/Analytics.tsx`

**Descrição:** `Analytics.tsx` usa `window as any` duas vezes para acessar `window.dataLayer` e `window.gtag`. O arquivo `gtag.d.ts` já estende `Window` com `gtag?`, mas não declara `dataLayer`. A correção é adicionar `dataLayer` ao `Window` e usar `window` diretamente.

**Critérios de Aceite:**
- [ ] `dataLayer?: unknown[]` adicionado à interface `Window` em `gtag.d.ts`
- [ ] `window as any` removido de Analytics.tsx
- [ ] `eslint-disable` removidos junto com os `as any`
- [ ] `tsc --noEmit` passa

**Estimativa:** 0.5h
**Status:** COMPLETED

---

### T003 – Adicionar `Promise<Metadata>` ao `generateMetadata` em blog/[slug]/page.tsx

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/app/blog/[slug]/page.tsx`

**Descrição:** `generateMetadata` neste arquivo não tem anotação de retorno explícita (`Promise<Metadata>`), ao contrário das demais pages que já declaram corretamente. A anotação explícita garante que o compilador valide o shape do objeto retornado.

**Critérios de Aceite:**
- [ ] `generateMetadata` retorna `Promise<Metadata>` explicitamente
- [ ] `tsc --noEmit` passa

**Estimativa:** 0.1h
**Status:** COMPLETED

---

### T004 – Substituir `(data as any).coverImage` por `Partial<>` em post-schema.test.ts

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/lib/blog/__tests__/post-schema.test.ts`

**Descrição:** O teste usa `delete (data as any).coverImage` para remover uma chave opcional. O cast é desnecessário — `{ ...validBase }` pode ser tipado com o type do schema ou um `Partial<>` que já aceita `delete` sem cast.

**Critérios de Aceite:**
- [ ] `as any` removido
- [ ] `eslint-disable` removido
- [ ] Teste continua passando

**Estimativa:** 0.2h
**Status:** COMPLETED
