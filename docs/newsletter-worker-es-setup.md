# Newsletter Worker ES — Setup playbook

Estado atual (2026-05-19): worker ES nao deployado.

- `workers/worker-es/wrangler.toml` contem placeholders:
  `PENDING_CREATE_KV_NAMESPACE_ES`, `PENDING_CREATE_KV_NAMESPACE_ES_PREVIEW`,
  `PENDING_GENERATE_NEW_PEPPER_FOR_ES_DO_NOT_REUSE_IT_PEPPER`.
- Probe `curl -sI https://newsletter-es.corgnati-pedro.workers.dev/health`
  retorna `text/plain 404` (hostname inexistente — Cloudflare default).
- Repo Secrets `NEWSLETTER_WORKER_URL_ES` e
  `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES` ausentes (`gh secret list`).
- Build/deploy ES funciona sem o worker: `config/sites/es.ts:64-72`
  permite `workerUrl == ''`; o formulario newsletter na home ES exibe
  estado vazio ate o worker subir.

## Passos (Pedro, ~30 min)

1. **KV namespace** (Cloudflare):
   ```bash
   cd workers/worker-es
   npx wrangler kv namespace create NEWSLETTER_KV
   npx wrangler kv namespace create NEWSLETTER_KV --preview
   ```
   Anote os 2 IDs retornados.

2. **D1 audit** (reutiliza o ja existente `newsletter-audit`):
   - `database_id` no `wrangler.toml` ja aponta para `85f58928-...`.
   - Confirmar com `npx wrangler d1 list` que esse ID existe na conta.
   - Se nao existir, criar com `npx wrangler d1 create newsletter-audit`
     e substituir o `database_id`.

3. **Pepper** (segredo de hash, unico por locale):
   ```bash
   openssl rand -base64 48
   ```
   Cole o valor no `AUDIT_PEPPER` do `wrangler.toml` (substituindo o
   placeholder). **Nao reutilize** o pepper IT/BR/EN.

4. **Resend audience** (lista email):
   - Painel Resend -> Audiences -> Create -> `newsletter-es`.
   - Copie o `audience_id` (formato `aud_xxx`).

5. **Secrets do worker** (escopo Cloudflare, nao GitHub):
   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put RESEND_AUDIENCE_ID_ES
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
   `RESEND_API_KEY` e `TURNSTILE_SECRET_KEY` podem ser os mesmos das
   outras locales (chave global). `RESEND_AUDIENCE_ID_ES` e o `aud_xxx`
   do passo 4.

6. **Deploy:**
   ```bash
   npx wrangler deploy
   ```
   Retorna a URL definitiva (formato `https://newsletter-es.<account>.workers.dev`).

7. **Healthcheck:**
   ```bash
   curl -sI https://newsletter-es.<account>.workers.dev/health
   # deve retornar 200 application/json
   ```

8. **Secrets do repositorio** (GitHub, para Next build):
   ```bash
   gh secret set NEWSLETTER_WORKER_URL_ES \
     --body 'https://newsletter-es.<account>.workers.dev'
   gh secret set NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES \
     --body 'https://newsletter-es.<account>.workers.dev'
   ```

9. **Rebuild ES** (manual ou esperar proximo deploy):
   ```bash
   gh workflow run build.yml
   ```

10. **Verificar:** formulario newsletter em https://systemforge.es
    aceita inscricao e o Resend envia confirmacao GDPR (double opt-in).

## Linkagens relevantes

- `config/sites/es.ts:64-72` — leitura das env vars (com fallback `''`).
- `.github/workflows/deploy.yml:492-495` — passagem das envs no build ES.
- `.github/workflows/quality-gate.yml` — verifica config consistency dos 4
  locales (nao bloqueia se ES worker URL vazio).

## Compliance GDPR

- `doubleOptIn: true` em `config/sites/es.ts:67` exige confirmacao por
  email antes de gravar na audience Resend.
- AUDIT_PEPPER unico por locale garante que hashes nao sao cross-locale.
- `FROM_EMAIL = "newsletter@systemforge.es"` exige SPF/DKIM verificado em
  Resend para o dominio `systemforge.es` (`docs/email-dns-setup.md`).
