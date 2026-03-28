# Worker BR — Newsletter LGPD

Cloudflare Worker para newsletter do mercado brasileiro (forjadesistemas.com.br).
Compliance: **LGPD** (single opt-in com consentimento explícito).

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/subscribe` | Inscrever email (consent obrigatório) |
| POST | `/unsubscribe` | Cancelar inscrição |
| GET | `/health` | Health check |

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar KV Namespace
```bash
npx wrangler kv namespace create NEWSLETTER_KV
npx wrangler kv namespace create NEWSLETTER_KV --preview
```
Atualizar `wrangler.toml` com os IDs gerados.

### 3. Criar D1 Database
```bash
npx wrangler d1 create newsletter-audit
npx wrangler d1 execute newsletter-audit --file=migrations/0001_init.sql
```
Atualizar `wrangler.toml` com o `database_id`.

### 4. Configurar Secrets
```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_AUDIENCE_ID_BR   # audience_id da lista "newsletter-br" no Resend
npx wrangler secret put TURNSTILE_SECRET_KEY
```

### 5. Configurar AUDIT_PEPPER
Gerar string aleatória segura (mínimo 32 chars):
```bash
npx wrangler secret put AUDIT_PEPPER
```

### 6. Deploy
```bash
npm run deploy
```

## Variáveis de Ambiente (wrangler.toml)

| Var | Exemplo | Descrição |
|-----|---------|-----------|
| `ALLOWED_ORIGINS` | `https://forjadesistemas.com.br` | Origins CORS permitidas (vírgula-separadas) |
| `FROM_EMAIL` | `newsletter@forjadesistemas.com.br` | Remetente dos emails |
| `WORKER_DOMAIN` | `newsletter-br.xxx.workers.dev` | Domínio do Worker |
| `TURNSTILE_EXPECTED_HOSTNAME` | `forjadesistemas.com.br` | Hostname esperado no token Turnstile |

## Configurar no Next.js (env vars por build)

No `.env.local` do projeto Next.js (build BR):
```env
NEXT_PUBLIC_NEWSLETTER_WORKER_URL_BR=https://newsletter-br.ACCOUNT_ID.workers.dev
```

## Verificação Local

```bash
npx wrangler dev &
sleep 3

# Health check
curl -s http://localhost:8787/health | jq .
# Esperado: {"status":"ok","locale":"pt-BR"}

# Inscrição válida
curl -s -X POST http://localhost:8787/subscribe \
  -H "Content-Type: application/json" \
  -H "Origin: https://forjadesistemas.com.br" \
  -d '{"email":"test@test.com","consent":true}' | jq .
# Esperado: {"success":true,"framework":"lgpd","message":"Inscrição realizada com sucesso!"}

# Sem consent
curl -s -X POST http://localhost:8787/subscribe \
  -H "Content-Type: application/json" \
  -H "Origin: https://forjadesistemas.com.br" \
  -d '{"email":"test@test.com","consent":false}' | jq .
# Esperado: HTTP 400, {"error":"Consentimento LGPD obrigatório"}

kill %1
```

## SPF/DKIM

Configurar no DNS do domínio `forjadesistemas.com.br` conforme dashboard Resend > Domains.
Ver `docs/email-dns-setup.md` para detalhes completos.
