# AUDIT-PERMISSIONS.md — Auditoria de Permissões e Acesso Público

**Projeto:** SystemForge Landing Page
**Data:** 2026-03-25
**Executor:** TASK-3 / module-9-integration

---

## Checklist de Verificação

### ST001 — `.github/CODEOWNERS`

- [x] Arquivo existe em `.github/CODEOWNERS`
- [x] Regra geral `*` atribui owner `@Pedrocorgnati`
- [x] `content/blog/**` tem `@inbound-forge @Pedrocorgnati`
- [x] `public/images/blog/**` tem `@inbound-forge @Pedrocorgnati`

**Observação:** O arquivo usa o GitHub handle real `@Pedrocorgnati` (em vez do alias `@pedro` referenciado na task). A proteção está corretamente configurada — nenhuma alteração necessária.

**Status:** OK — sem modificações

---

### ST002 — `.gitignore`

- [x] `.env.local` — coberto pelo glob `.env*`
- [x] `.env*.local` — coberto pelo glob `.env*`
- [x] `.env.production` — coberto pelo glob `.env*`

O `.gitignore` contém `.env*` na linha 34, que cobre todos os padrões exigidos de forma mais abrangente do que entradas individuais.

**Status:** OK — sem modificações

---

### ST003 — `DEPLOYMENT.md` — GitHub Secrets documentados

- [x] Arquivo `DEPLOYMENT.md` existe na raiz do workspace
- [x] Seção "GitHub Secrets obrigatórios" documenta secrets SFTP: `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER`, `SFTP_PASSWORD`
- [x] Seção "Cloudflare" documenta: `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`
- [x] Seção "Next.js (variáveis públicas)" documenta: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CALENDLY_URL`, `NEXT_PUBLIC_BUDGET_ENGINE_URL`
- [x] Seção "Cloudflare Worker Secrets" documenta: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` — com instrução explícita de uso via `wrangler secret put` (nunca commitado)

**Status:** OK — sem modificações

---

### ST004 — Nenhum secret hardcoded

Varredura realizada nos arquivos `.ts` e `.tsx` em `src/app/`, `src/components/`, `src/lib/`.

| Padrão pesquisado | Resultado |
|---|---|
| `sk_live_` | Nenhuma ocorrência |
| `sk_test_` | Nenhuma ocorrência |
| `Bearer ` | Nenhuma ocorrência |
| `api_key\s*=\s*['"]` | Nenhuma ocorrência |
| `api.resend.com` em src/ (exceto cloudflare-worker) | Nenhuma ocorrência |
| `resend.com/` em src/ | 1 ocorrência: `src/app/privacidade/page.tsx:138` — link público para `https://resend.com/privacy` (página de privacidade), não é credencial |

`src/lib/env.ts` menciona `RESEND_API_KEY` somente em comentário de código, confirmando que a chave pertence ao Cloudflare Worker, não ao Next.js.

**Status:** OK — zero secrets hardcoded

---

### ST005 — Rotas públicas (sem autenticação forçada)

- [x] `middleware.ts` não existe em `src/` nem na raiz do workspace
- [x] Nenhum redirect para login ou verificação de sessão em nenhum middleware

Todos os paths são públicos por omissão — comportamento correto para landing page.

**Status:** OK — sem middleware de autenticação

---

## Itens Corrigidos nesta Auditoria

Nenhum item precisou de correção. Todos os controles já estavam implementados e em conformidade.

---

## Veredito

✅ **APROVADO**

Todos os 5 subtasks verificados sem falhas:
- CODEOWNERS com controle de acesso granular para Inbound Forge
- `.gitignore` protegendo todos os arquivos `.env*`
- `DEPLOYMENT.md` documentando a totalidade dos GitHub Secrets e Worker Secrets
- Zero secrets hardcoded no código-fonte
- Nenhum middleware bloqueando rotas públicas
