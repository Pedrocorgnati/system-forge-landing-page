# Deployment — SystemForge Landing Page

## Requisitos

- Node.js 20+
- Conta Hostinger com SFTP habilitado
- Conta Cloudflare (free tier) — domínio forjadesistemas.com.br deve apontar para Cloudflare
- GA4 Property criada no Google Analytics 4

## GitHub Secrets obrigatórios

Configure em: Repositório → Settings → Secrets and variables → Actions → New repository secret

### SFTP (Hostinger)

| Secret | Descrição | Onde encontrar |
|--------|-----------|----------------|
| `SFTP_HOST` | Hostname do servidor Hostinger | hPanel → Hosting → Detalhes → Servidor |
| `SFTP_PORT` | Porta SFTP (geralmente 22 ou 2222) | hPanel → Hosting → SFTP |
| `SFTP_USER` | Usuário SFTP | hPanel → Hosting → SFTP |
| `SFTP_PASSWORD` | Senha SFTP | hPanel → Hosting → SFTP |

### Cloudflare

| Secret | Descrição | Onde encontrar |
|--------|-----------|----------------|
| `CLOUDFLARE_ZONE_ID` | Zone ID do domínio forjadesistemas.com.br | Cloudflare Dashboard → Overview → Zone ID |
| `CLOUDFLARE_API_TOKEN` | API token com permissão Zone Cache Purge | Cloudflare → My Profile → API Tokens |

### Next.js (variáveis públicas)

| Secret | Descrição | Valor |
|--------|-----------|-------|
| `NEXT_PUBLIC_SITE_URL` | URL do site em produção | `https://forjadesistemas.com.br` |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | ID do GA4 | `G-XXXXXXXXXX` (do GA4 Dashboard) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número WhatsApp para CTAs | `+5541XXXXXXXXX` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Email de contato público | `contato@forjadesistemas.com.br` |
| `NEXT_PUBLIC_CALENDLY_URL` | URL do Calendly para agendamento | `https://calendly.com/pedro-corgnati/...` |
| `NEXT_PUBLIC_BUDGET_ENGINE_URL` | URL do Budget Engine (se configurado) | `https://...forjadesistemas.com.br` |

## Cloudflare Worker Secrets

Os seguintes secrets NUNCA devem ser commitados no repositório.
Configure via: `npx wrangler secret put {NOME}` (dentro de `cloudflare-worker/newsletter-proxy/`).

| Secret | Descrição | Onde obter |
|--------|-----------|-----------|
| `RESEND_API_KEY` | API key da conta Resend | resend.com → API Keys |
| `RESEND_AUDIENCE_ID` | ID da audience Resend para contacts | resend.com → Audiences |

> Após o deploy do Worker, configure `NEXT_PUBLIC_NEWSLETTER_API_URL` como GitHub Secret
> (e no `.env.local` para desenvolvimento). Ver `cloudflare-worker/newsletter-proxy/README.md`.

## Deploy manual

Para disparar deploy manualmente (sem push):
1. GitHub → Actions → Deploy — forjadesistemas.com.br
2. "Run workflow" → selecionar branch main → Run workflow

## Troubleshooting

### SFTP falha com "Connection refused"
- Verificar `SFTP_PORT` — Hostinger usa 22 por padrão, mas alguns planos usam 2222
- Testar localmente: `sftp -P 22 usuario@host`

### Cloudflare purge falha
- O step usa `|| true` — não bloqueia o deploy
- Verificar se `CLOUDFLARE_API_TOKEN` tem permissão "Zone Cache Purge"
- Verificar se `CLOUDFLARE_ZONE_ID` corresponde ao domínio correto

### Build falha em validate:frontmatter
- Verificar `content/blog/` — algum post MDX tem frontmatter inválido
- Rodar localmente: `npm run validate:frontmatter` para ver o erro exato

### Build falha por variável ENV ausente
- O build requer `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CALENDLY_URL` e `NEXT_PUBLIC_BUDGET_ENGINE_URL`
- O validate.yml usa placeholders para CI — o deploy.yml usa os secrets reais
