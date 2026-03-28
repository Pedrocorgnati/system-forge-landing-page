# Worker EN — Newsletter CAN-SPAM

Cloudflare Worker para newsletter do mercado internacional (systemforgesoftware.com).
Compliance: **CAN-SPAM** (single opt-in, endereço físico obrigatório em todos os emails).

## ⚠️ RELEASE BLOCKER

Antes do deploy de produção, configurar `COMPANY_ADDRESS` com endereço físico real:
```bash
# Em wrangler.toml [vars]:
COMPANY_ADDRESS = "SystemForge Software LLC, 123 Main St, City, State 12345, USA"
```
**Deploy sem endereço físico real é violação legal do CAN-SPAM Sec. 5(a)(5).**

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/subscribe` | Inscrever email (consent opcional) |
| POST | `/unsubscribe` | Cancelar (JSON ou RFC 8058 one-click) |
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
npx wrangler secret put RESEND_AUDIENCE_ID_EN
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put AUDIT_PEPPER
```

### 5. Atualizar wrangler.toml com endereço físico real (RELEASE BLOCKER)
```toml
COMPANY_ADDRESS = "SystemForge Software LLC, [endereço físico real]"
```

### 6. Deploy
```bash
npm run deploy
```

## Variável no Next.js

```env
NEXT_PUBLIC_NEWSLETTER_WORKER_URL_EN=https://newsletter-en.ACCOUNT_ID.workers.dev
```

## SPF/DKIM

Configurar no DNS do domínio `systemforgesoftware.com` — ver `docs/email-dns-setup.md`.
