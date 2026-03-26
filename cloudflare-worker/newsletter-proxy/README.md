# Newsletter Proxy — Cloudflare Worker

Proxy seguro entre o frontend Next.js e a Resend API.
Protege a `RESEND_API_KEY` de ser exposta ao cliente (THREAT-MODEL T-003).

## Funcionalidades

- CORS: valida `Origin` contra `ALLOWED_ORIGIN` e `localhost`
- Rate limiting: máx 3 req/IP/hora via KV
- Honeypot: retorna 200 silencioso se campo `website` preenchido (anti-bot)
- Double opt-in: token UUID v4, TTL 48h no KV
- LGPD: mecanismo de cancelamento via `/unsubscribe`

## Pré-requisitos

- Node.js 18+
- Conta Cloudflare (gratuita)
- Conta Resend + API key
- Wrangler CLI: `npm install -g wrangler`

## Setup Inicial

```bash
# 1. Autenticar no Cloudflare
npx wrangler login

# 2. Criar KV Namespace para rate limiting e tokens
npx wrangler kv namespace create "RATE_LIMIT_KV"
# Copie o ID retornado e substitua "SUBSTITUIR_PELO_ID_DO_KV_NAMESPACE" em wrangler.toml

# 3. Criar KV Namespace para preview (desenvolvimento local)
npx wrangler kv namespace create "RATE_LIMIT_KV" --preview
# Copie o preview_id e substitua "SUBSTITUIR_PELO_PREVIEW_ID" em wrangler.toml
```

## Configurar Secrets

```bash
# API key da Resend (NUNCA commitar no repositório)
npx wrangler secret put RESEND_API_KEY
# Prompt: cole o valor da API key (começa com re_)

# ID da audience Resend
npx wrangler secret put RESEND_AUDIENCE_ID
# Prompt: cole o ID da audience
```

## Deploy

```bash
# Deploy para produção
npx wrangler deploy

# URL do Worker após deploy:
# https://systemforge-newsletter-proxy.{seu-subdominio}.workers.dev
# Ou com domínio customizado configurado no painel Cloudflare:
# https://newsletter-proxy.forjadesistemas.com.br
```

## Configurar URL no Next.js

Após o deploy, configure a URL do Worker no `.env.local` do projeto Next.js:

```bash
# output/workspace/system-forge-landing-page/.env.local
NEXT_PUBLIC_NEWSLETTER_API_URL=https://systemforge-newsletter-proxy.{seu-subdominio}.workers.dev
```

## Desenvolvimento Local

```bash
# Executar Worker localmente (porta 8787)
npx wrangler dev

# Ajuste NEXT_PUBLIC_NEWSLETTER_API_URL no .env.local para testar localmente:
NEXT_PUBLIC_NEWSLETTER_API_URL=http://localhost:8787
```

## Fluxo Double Opt-in

```
1. POST /
   Usuário se inscreve → valida → gera token → armazena KV → envia NOTIF-001

2. GET /confirm?token={uuid}
   Usuário clica no link do email → confirma token → cria contact Resend → envia NOTIF-002
   Redireciona: /newsletter/confirmado?success=true

3. GET /unsubscribe?token={uuid}
   Usuário cancela → remove contact Resend → envia NOTIF-003
```

## Endpoints

| Método | Path | Descrição |
|--------|------|-----------|
| POST | / | Inscrição (valida, gera token, envia NOTIF-001) |
| GET | /confirm?token={uuid} | Confirmação double opt-in |
| GET | /unsubscribe?token={uuid} | Cancelamento de inscrição |

## KV Keys Utilizadas

| Key | Value | TTL | Descrição |
|-----|-------|-----|-----------|
| `rate:{ip}` | contagem (0-3) | 3600s (1h) | Rate limiting por IP |
| `token:{uuid}` | email | 172800s (48h) | Token de confirmação |
| `unsub:{uuid}` | email | 31536000s (1 ano) | Token de unsubscribe |

## Segurança

| Ameaça | Mitigação |
|--------|-----------|
| API key exposta ao cliente | Nunca enviada ao browser — apenas no Worker server-side |
| Spam/abuso da Resend API | Rate limiting 3 req/IP/hora via KV |
| Bots preenchendo formulário | Honeypot (verificação dupla: cliente + Worker) |
| CSRF de origens não autorizadas | Verificação do header `Origin` |
| Tokens de confirmação previsíveis | `crypto.randomUUID()` — UUID v4 criptograficamente seguro |
| Tokens expirados aceitos | TTL 48h no KV — expiração automática |
