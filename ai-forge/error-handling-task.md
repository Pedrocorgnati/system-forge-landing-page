# Error Handling Tasks

Auditoria: 2026-03-29
Workspace: `output/workspace/system-forge-landing-page`

---

## Checklist de Auditoria

### Error boundaries
- [x] `error.tsx` existe na raiz com reset + logging + error.digest
- [ ] `global-error.tsx` ausente — falhas do layout.tsx não são capturadas
- [ ] `error.tsx` granular ausente em rotas dinâmicas (blog/[slug], servicos/[slug])
- [x] Mensagens não vazam stack via UI (error.digest exibido)
- [ ] console.error expõe objeto Error completo (inclui stack) — T001

### Not found
- [x] `not-found.tsx` completo com home + contact links
- [x] `notFound()` aplicado em todas as rotas dinâmicas

### Loading / Empty
- [x] `loading.tsx` na raiz com spinner acessível
- [ ] `loading.tsx` ausente em rotas dinâmicas com conteúdo pesado (blog/[slug], servicos/[slug])
- [x] `NewsletterOptIn` com todos os estados (idle/submitting/success/pending/error)
- [x] `useArticleSearch` com hasError + isLoading states

### Try/Catch
- [x] `NewsletterOptIn` com try/catch + AbortController 10s + retry
- [x] `useArticleSearch` com try/catch + setHasError

### Edge cases & Logging
- [x] Timeout 10s no newsletter (AbortError tratado separadamente)
- [ ] Sem logger centralizado — 3x `console.error` direto em produção
- [ ] Sentry não configurado

---

## Tasks

### T001 – Criar logger centralizado (substituir console.error)
**Tipo:** SEQUENTIAL
**Dependências:** none
**Status:** COMPLETED
**Estimativa:** 30min

**Arquivos:**
- criar: `src/lib/logger.ts`
- modificar: `src/app/error.tsx`
- modificar: `src/hooks/useArticleSearch.ts`
- modificar: `src/components/ui/CTAButton.tsx`

**Descrição:**
Três ocorrências de `console.error` direto em produção. Em `error.tsx` o objeto `Error` completo (incluindo stack) é passado ao console — expõe informação sensível. Deve-se criar um logger que em produção omite a stack e registra apenas `error.digest` + mensagem. Em desenvolvimento, mantém comportamento verboso.

**Critérios de Aceite:**
- `src/lib/logger.ts` exporta `logger.error(msg, ctx?)` e `logger.warn(msg, ctx?)`
- Em produção (`process.env.NODE_ENV === 'production'`): não imprime stack, apenas message + digest
- Em dev: mantém `console.error` completo
- `error.tsx`, `useArticleSearch.ts`, `CTAButton.tsx` usam `logger.error` em vez de `console.error`

---

### T002 – Criar global-error.tsx
**Tipo:** SEQUENTIAL
**Dependências:** T001
**Status:** COMPLETED
**Estimativa:** 30min

**Arquivos:**
- criar: `src/app/global-error.tsx`

**Descrição:**
Ausência de `global-error.tsx` significa que erros lançados dentro do `layout.tsx` raiz (ThemeProvider, Header, Footer, Analytics, etc.) não são capturados por nenhum boundary. O `global-error.tsx` deve ser completamente autônomo — sem imports de `@config` ou outros módulos externos que possam falhar, usando apenas HTML básico + logging.

**Critérios de Aceite:**
- Arquivo `src/app/global-error.tsx` com `'use client'` e `html`+`body` na raiz
- Sem dependências externas (zero imports de `@config`, componentes, etc.)
- Exibe `error.digest` se disponível
- Botão de reset com `reset()`
- Logging via `logger.error` (ou fallback para `console.error` se logger não disponível)
- Mensagem amigável em PT-BR hardcoded (não pode usar loadMessages — pode falhar)

---

### T003 – Adicionar loading.tsx em rotas dinâmicas do blog e serviços
**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Status:** COMPLETED
**Estimativa:** 20min

**Arquivos:**
- criar: `src/app/blog/[slug]/loading.tsx`
- criar: `src/app/servicos/[slug]/loading.tsx`

**Descrição:**
As rotas `blog/[slug]` e `servicos/[slug]` usam `generateStaticParams` (SSG), mas o `loading.tsx` granular é necessário para: (1) fallback durante regeneração ISR, (2) navegação client-side (prefetch miss), (3) preview/draft modes. Atualmente o `loading.tsx` da raiz mostra spinner genérico. Skeletons específicos melhoram percepção de performance.

**Critérios de Aceite:**
- `blog/[slug]/loading.tsx`: skeleton com título (bloco de ~40px), parágrafos (3-4 blocos) e imagem de cover
- `servicos/[slug]/loading.tsx`: skeleton com breadcrumb + título + ícone + parágrafos
- Ambos com `role="status"` e `aria-label` em PT-BR
- Reutilizam classes Tailwind do design system existente (bg-muted, animate-pulse, rounded-lg)

---

### T004 – Adicionar error.tsx em rotas dinâmicas críticas
**Tipo:** PARALLEL-GROUP-1
**Dependências:** T001
**Status:** COMPLETED
**Estimativa:** 30min

**Arquivos:**
- criar: `src/app/blog/[slug]/error.tsx`
- criar: `src/app/servicos/[slug]/error.tsx`

**Descrição:**
Rotas com conteúdo dinâmico (artigo de blog, página de serviço) não têm `error.tsx` granular. Erros nessas rotas sobem até o `error.tsx` raiz, que exibe mensagem genérica sem contexto. Um `error.tsx` por rota permite mensagem contextual ("Erro ao carregar artigo") e link de volta para a listagem.

**Critérios de Aceite:**
- `blog/[slug]/error.tsx`: mensagem "Erro ao carregar artigo", link para `/blog`, botão reset
- `servicos/[slug]/error.tsx`: mensagem "Erro ao carregar serviço", link para `/servicos`, botão reset
- Ambos com logging via `logger.error` + `error.digest`
- Ambos com `data-testid` adequados
- Não expõem stack na UI

---
