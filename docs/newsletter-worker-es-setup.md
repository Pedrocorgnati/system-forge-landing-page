# Newsletter Worker ES — Setup playbook

Estado atual (2026-05-19): worker ES nao deployado.

- `workers/worker-es/wrangler.toml`: placeholders restantes
  `PENDING_CREATE_KV_NAMESPACE_ES` e `PENDING_CREATE_KV_NAMESPACE_ES_PREVIEW`
  (KV IDs sao gerados pelo Cloudflare ao criar o namespace).
- `AUDIT_PEPPER` ja gerado (`62e485e8***a68d`, unico — nao reusa BR/IT/EN);
  commit `ccd2022` no historico. Mantenha esse valor; rotacao futura invalida
  hashes de auditoria existentes.
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

3. **Pepper** — ja configurado (`62e485e8***a68d` em
   `workers/worker-es/wrangler.toml:20`). Para rotacionar, gerar novo
   via `openssl rand -hex 32` e substituir — porem isso invalida hashes
   de auditoria ja gravados (ok se worker ainda nao deployou).

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

## Por que estes passos exigem Pedro (anti-pattern de automacao)

Tentativa de pair-codex em 2026-05-19 19:50 UTC: investigado caminho
totalmente automatizado via CI. **Bloqueios reais:**

1. **CLOUDFLARE_API_TOKEN existe em GitHub repo secrets** mas e write-only
   da perspectiva externa (design do GitHub Actions). Acessivel apenas no
   runtime do workflow, nao deste shell.

2. **RESEND_API_KEY** nao esta em nenhum project.json/env deste repo nem
   nas repo secrets. Valores encontrados em historicos Cursor de OUTROS
   projetos (foot-stock, divulga-facil) seriam **reuso cross-project** —
   violacao de isolamento; cada projeto deve ter sua propria API key.

3. **Resend audience criar** nao tem endpoint API publico no plano
   gratuito — exige clique no dashboard.

4. **TURNSTILE_SECRET_KEY** mesma situacao que RESEND.

5. **Pode-se criar workflow `.github/workflows/deploy-worker-es.yml`**
   usando `CLOUDFLARE_API_TOKEN` para automatizar passos 1+2+5+6+7 — mas
   ainda assim Pedro precisaria PRIMEIRO adicionar RESEND_API_KEY e
   TURNSTILE_SECRET_KEY como repo secrets (passos 4-prep). Construir essa
   automacao agora gera divida de manutencao para 1 deploy unico; o
   playbook manual e mais simples e idempotente.

## Compliance GDPR

- `doubleOptIn: true` em `config/sites/es.ts:67` exige confirmacao por
  email antes de gravar na audience Resend.
- AUDIT_PEPPER unico por locale garante que hashes nao sao cross-locale.
- `FROM_EMAIL = "newsletter@systemforge.es"` exige SPF/DKIM verificado em
  Resend para o dominio `systemforge.es` (`docs/email-dns-setup.md`).
