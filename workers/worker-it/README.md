# Worker IT — Newsletter GDPR

Cloudflare Worker para newsletter do mercado italiano (systemforge.it).
Compliance: **GDPR** (double opt-in obrigatório).

## Fluxo GDPR

```
POST /subscribe → gera token → envia email confirmação
GET /confirm?token=xxx → ativa subscriber → envia welcome email → HTML confirmação
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/subscribe` | Inscrever (retorna 202 pending) |
| GET | `/confirm` | Confirmar token (retorna HTML) |
| POST | `/unsubscribe` | Cancelar inscrição (GDPR Art. 7 §3) |
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

### 3. Criar D1 Database
```bash
npx wrangler d1 create newsletter-audit
npx wrangler d1 execute newsletter-audit --file=migrations/0001_init.sql
```

### 4. Configurar Secrets
```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_AUDIENCE_ID_IT
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put AUDIT_PEPPER
```

### 5. Deploy
```bash
npm run deploy
```

## SPF/DKIM

Configurar no DNS do domínio `systemforge.it` — ver `docs/email-dns-setup.md`.

## Variável no Next.js

```env
NEXT_PUBLIC_NEWSLETTER_WORKER_URL_IT=https://newsletter-it.ACCOUNT_ID.workers.dev
```
