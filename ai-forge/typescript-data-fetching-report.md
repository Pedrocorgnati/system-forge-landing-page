# typescript-data-fetching-report.md
# Data Fetching — Relatório de Auditoria

Gerado por: `/typescript:data-fetching`
Workspace: `output/workspace/system-forge-landing-page`
Data: 2026-03-25

---

## Status Geral

| Domínio | Status | Notas |
|---------|--------|-------|
| HTTP Client centralizado | ⚠️ Pendente | `newsletter.ts` bem implementado, mas `NewsletterOptIn.tsx` o ignora (T-001) |
| Validação de schema (Zod) | ⚠️ Pendente | `search-index.json` sem validação runtime (T-004); formulários e env OK |
| Cache / localStorage | ✅ OK | Apenas tema e cookie consent no localStorage; sem TTL customizado necessário |
| Cancelamento / debounce | ⚠️ Pendente | `useArticleSearch` sem AbortController no fetch inicial (T-002) |
| AsyncState / feedback visual | ⚠️ Pendente | `isLoading` pode ficar `true` em erro na busca (T-003) |
| Worker Cloudflare | ⚠️ Pendente | Sem timeouts nas chamadas Resend; erros NOTIF-002/003 silenciosos (T-005–T-007) |

---

## Contexto Arquitetural

Este é um site estático (Next.js `output: 'export'`). Toda a lógica de fetch em runtime ocorre em dois lugares:

1. **Newsletter** — `fetch` do browser → Cloudflare Worker → Resend API
2. **Busca de artigos** — `fetch` do browser → `/search-index.json` estático → Fuse.js em memória

Não há SWR, React Query, axios, ou cache distribuído — o modelo é simples e adequado ao contexto. Os problemas encontrados são pontuais.

---

## Achados por Domínio

### 1. Cliente HTTP — Duplicação (HIGH)

**Evidência:**
```
rg -n "fetch(" src --include="*.ts" --include="*.tsx"
→ src/components/ui/NewsletterOptIn.tsx:81
→ src/lib/services/newsletter.ts:69
```

`NewsletterOptIn.tsx#L67-107` reimplementa o mesmo fluxo de `subscribeNewsletter()`:
- Lê `NEXT_PUBLIC_NEWSLETTER_API_URL` diretamente
- Cria `AbortController` com timeout de 10 s
- Faz `fetch` com `application/json`
- Trata `AbortError` e erros HTTP

`src/lib/services/newsletter.ts` já encapsula exatamente esse comportamento com a mesma lógica. A função `subscribeNewsletter()` inclusive retorna um `NewsletterSubscribeResult` tipado que evita o uso de `throw` no componente.

**Impacto:** qualquer ajuste no serviço (timeout, retry, mapeamento de erros) precisa ser replicado manualmente no componente.

---

### 2. Cancelamento no fetch do índice de busca (MEDIUM)

**Evidência:**
```
rg -n "AbortController" src/hooks/useArticleSearch.ts
→ (nenhum resultado)
```

`useArticleSearch.ts#L41-47`:
```typescript
const [FuseModule, searchIndex] = await Promise.all([
  import('fuse.js'),
  fetch('/search-index.json').then(r => {   // ← sem signal
    if (!r.ok) throw new Error(...)
    return r.json() as Promise<SearchIndexItem[]>
  }),
])
```

Se o `debouncedQuery` mudar durante o carregamento do JSON (ex: usuário digita rápido enquanto o índice carrega), a promise anterior continua, `setIsLoading(false)` é chamado fora de ordem, e `fuseRef.current` pode ser sobrescrito por uma instância stale.

---

### 3. `isLoading` não resetado em erro (MEDIUM)

**Evidência:**
```
setIsLoading(true)  → linha 40
setIsLoading(false) → linha 60 (dentro do if, não no finally)
```

Caminho de erro:
1. `setIsLoading(true)` — linha 40
2. `fetch('/search-index.json')` → throw (ex: 404 estático)
3. Cai no `catch` — linha 65
4. `setIsSearching(false)` — linha 69 (finally)
5. `isLoading` ainda é `true` → spinner eterno

---

### 4. Schema do search-index sem validação runtime (LOW)

**Evidência:**
```typescript
return r.json() as Promise<SearchIndexItem[]>  // type assertion, não validação
```

`SearchIndexItem` tem 6 campos. Se o script `generate-search-index.ts` mudar o shape, erros ocorrem em tempo de execução no Fuse.js sem rastreabilidade.

---

### 5. Cloudflare Worker: ausência de timeouts e verificações (MEDIUM)

**Evidência:**
```
rg -n "AbortController\|AbortSignal\|timeout" cloudflare-worker/
→ (nenhum resultado)
```

5 chamadas `fetch()` para `api.resend.com` sem timeout:
- `index.ts#L133` — NOTIF-001 (confirmação): resultado verificado ✅
- `index.ts#L184` — ativar contato: resultado verificado ✅
- `index.ts#L215` — NOTIF-002 (boas-vindas): **resultado NÃO verificado** ❌
- `index.ts#L249` — DELETE contato: **resultado NÃO verificado** ❌
- `index.ts#L258` — NOTIF-003 (cancelamento): resultado não verificado ❌

Para NOTIF-002 e DELETE, falhas silenciosas comprometem a experiência sem nenhum sinal de erro para o operador (além do `console.error` ausente).

---

### 6. Cache e localStorage (OK)

`localStorage` é usado apenas em:
- `src/app/layout.tsx` — inline script para tema (inline de 1 linha, padrão correto para evitar FOUC)
- `src/hooks/useCookieConsent.ts` — consent LGPD (chave `cookie-consent`, sem TTL — aceitável pois o consentimento é permanente)

Nenhum cache de dados de API em localStorage. Nenhum problema encontrado neste domínio.

---

## Resumo de Prioridades

| Prioridade | Tarefa | Arquivo |
|------------|--------|---------|
| 🔴 HIGH | T-001: Usar `subscribeNewsletter()` no componente | `NewsletterOptIn.tsx` |
| 🟠 MEDIUM | T-002: AbortController no fetch do search-index | `useArticleSearch.ts` |
| 🟠 MEDIUM | T-003: `isLoading` reset em finally | `useArticleSearch.ts` |
| 🟠 MEDIUM | T-005: Timeouts no Worker | `cloudflare-worker/index.ts` |
| 🟠 MEDIUM | T-006: Verificar resultado NOTIF-002 | `cloudflare-worker/index.ts` |
| 🟠 MEDIUM | T-007: Verificar resultado DELETE contato | `cloudflare-worker/index.ts` |
| 🟡 LOW | T-004: Schema Zod para search-index.json | `useArticleSearch.ts` |
| 🟡 LOW | T-008: Idempotência na reconfirmação | `cloudflare-worker/index.ts` |

---

## Referências a Outros Comandos

- **`/typescript:forms`** — T-001 envolve o formulário `NewsletterOptIn`; após refatorar o fetch, verificar se validação de email/consent no componente pode usar react-hook-form + Zod em vez de estado manual.
- **`/typescript:error-handling`** — T-006 e T-007: erros silenciosos no Worker deveriam alimentar logs estruturados ou alertas Cloudflare Workers Analytics.
- **`/typescript:security`** — Worker já tem honeypot + rate limiting + validação LGPD; sem gaps de segurança no caminho de fetch.

---

## Comandos Usados na Investigação

```bash
rg -n "fetch(" src scripts cloudflare-worker --include="*.ts" --include="*.tsx"
rg -n "AbortController" src --include="*.ts" --include="*.tsx"
rg -n "localStorage|sessionStorage|cache\.set" src --include="*.ts" --include="*.tsx"
rg -n "setIsLoading" src/hooks/useArticleSearch.ts
find src -name "*.ts" -o -name "*.tsx" | sort
```
