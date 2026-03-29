# Server Actions — Task List
**Projeto:** system-forge-landing-page
**Data:** 2026-03-29
**Status:** IN_PROGRESS

---

## Contexto

Projeto usa **static export** (Next.js → Hostinger Shared). Server Actions não existem nem são
aplicáveis a esta arquitetura. O único formulário com submissão de dados é `NewsletterOptIn.tsx`,
que chama um Cloudflare Worker externo via `fetch` client-side.

**Problema identificado:** duplicação de lógica de fetch entre o componente e o serviço
`src/lib/services/newsletter.ts`.

---

## Tasks

### T001 — Refatorar NewsletterOptIn para usar o serviço subscribeNewsletter

**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/ui/NewsletterOptIn.tsx`

**Descrição:**
O componente duplica toda a lógica de fetch (URL construction, AbortController, timeout,
error handling) que já existe em `src/lib/services/newsletter.ts → subscribeNewsletter()`.

Substituir o bloco `fetch` inline (linhas 107-158) por uma chamada a `subscribeNewsletter`,
mantendo o mapeamento de estados: `201 → success`, `202 ou isGDPR → pending-confirmation`.

**Critérios de Aceite:**
- [ ] Import de `subscribeNewsletter` de `@/lib/services/newsletter`
- [ ] Bloco fetch inline removido do componente
- [ ] Mapeamento de status mantido (201 → success, 202/GDPR → pending-confirmation)
- [ ] Honeypot check mantido (client-side, antes de chamar o serviço)
- [ ] Estados de loading/error/success funcionando igual ao anterior
- [ ] Sem regressões nos testes `src/components/ui/__tests__/NewsletterOptIn.test.tsx`

**Estimativa:** 0.5h
**Status:** COMPLETED ✅

---

## Fora de Escopo

Os itens abaixo foram verificados e são N/A para este projeto:

| Item | Motivo |
|------|--------|
| "use server" | Static export — Server Actions não suportadas |
| useActionState | Sem Server Actions |
| revalidatePath/Tag | Sem mutações server-side |
| Rate limiting em actions | Responsabilidade do Cloudflare Worker |
| Auth/Authz em actions | Sem autenticação no projeto |
| Transações / Idempotência | Sem banco de dados |
| Upload de arquivos | Sem formulários de upload |
| Progressive enhancement | Form depende de JS (aceitável para SPA) |
