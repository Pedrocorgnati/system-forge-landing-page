# CONTEXTO PARA NOVA SESSÃO CLAUDE — LEIA ANTES DE TUDO
> Este bloco foi escrito em 2026-03-28 para retomada da sessão. Após concluir todos os itens pendentes, este bloco pode ser removido.

## O que é este projeto

Landing page multi-mercado do **SystemForge / Forja de Sistemas** — um site Next.js estático (export) com 3 builds independentes por locale, cada um deployado em um domínio diferente via GitHub Actions + SFTP para Hostinger. Cloudflare fica na frente como CDN/proxy.

- Repositório GitHub: `Pedrocorgnati/system-forge-landing-page`
- Workspace local: `output/workspace/system-forge-landing-page/`
- Credenciais SSH Hostinger: `output/workspace/my-fckng-landing-page/.env.deploy`
- GitHub CLI já autenticado localmente (`gh auth status` → Pedrocorgnati)
- Cloudflare Account ID: `d6692eecddf8380bf6d48d5a14f84436` (Corgnati.pedro@gmail.com)
- Cloudflare API Token (full permissions): `cfat_6uzIHMXxM0RjF8inktYZrzg0cK2seTzqLRz3LY9C03865854`
  - Permissões: Workers Scripts Edit, D1 Edit, Workers KV Edit, Zone Edit, DNS Edit, Cache Purge, Turnstile Edit

## 3 Domínios / Locales

| Locale | Domínio | Cloudflare Zone ID | Status DNS |
|--------|---------|-------------------|------------|
| pt-BR | forjadesistemas.com.br | `bc088c2de926356945bfa6933255b609` | NS apontados → aguardando propagação |
| it-IT | systemforge.it | `00d4d6b1dcf38e638dba03b4ac02b443` | NS apontados → aguardando propagação |
| en | systemforgesoftware.com | PENDENTE — zone não criada ainda | Zone só pode ser criada após as outras 2 ficarem `active` no Cloudflare |

**Nameservers já configurados no Dynadot:**
- `forjadesistemas.com.br` → `bingo.ns.cloudflare.com` + `ed.ns.cloudflare.com`
- `systemforge.it` → `adam.ns.cloudflare.com` + `arely.ns.cloudflare.com`
- `systemforgesoftware.com` → ainda não configurado (aguarda as outras 2 ficarem active)

## Infraestrutura Cloudflare já provisionada

### Cloudflare Workers (3 workers live)
Todos os 3 workers estão deployados e respondendo em `corgnati-pedro.workers.dev`:

| Worker | URL | Locale | Compliance |
|--------|-----|--------|-----------|
| newsletter-br | `https://newsletter-br.corgnati-pedro.workers.dev` | pt-BR | LGPD (single opt-in) |
| newsletter-it | `https://newsletter-it.corgnati-pedro.workers.dev` | it-IT | GDPR (double opt-in) |
| newsletter-en | `https://newsletter-en.corgnati-pedro.workers.dev` | en | CAN-SPAM (single opt-in) |

Endpoints disponíveis em cada worker: `GET /health`, `POST /subscribe`, `POST /unsubscribe`

### D1 Database
- Nome: `newsletter-audit`
- ID: `85f58928-0f2a-4e72-881e-2ae337f1875c`
- Schema aplicado: tabelas `audit_events` e `subscriptions` (com UNIQUE constraint)
- Localização: WNAM (West North America)

### KV Namespaces
| Worker | KV Prod ID | KV Preview ID |
|--------|-----------|---------------|
| newsletter-br | `3502ec738f164c29ade29146a0767371` | `957b83f697a64827a907d9aef9732bbc` |
| newsletter-it | `5125d8d64e444767bded6c787fb6e19f` | `d1d28700120a446bb62216f45db90ada` |
| newsletter-en | `3bd03afe63ce4dd389ff79c60522cff7` | `089b4988e34345d79135c7a9bf39389b` |

### Resend (email)
- API Key usada: `re_NsbtQce5_BamK442vX1raAVHDLb9tM47y`
- Audiences criadas:
  - `newsletter-br` → ID: `fb90004a-e787-46f8-92b0-f04f02d85e00`
  - `newsletter-it` → ID: `2790deb3-ca99-4c9f-8aa4-40aa520c5f44`
  - `newsletter-en` → ID: `be330cb7-fc3c-4d5f-b738-7d5eea72972f`
- Secrets configurados em cada worker: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID_BR/IT/EN`
- Domínios de envio adicionados ao Resend:
  - `forjadesistemas.com.br` → ID: `53c89f0c-ea77-4ba1-91c6-02f1216043da` | status: **pending** (aguarda propagação DNS)
  - `systemforge.it` → ID: `4ad78c7d-9ab3-44fe-a427-6cd443de5e15` | status: **pending** (aguarda propagação DNS)
  - `systemforgesoftware.com` → ID: `cd897e56-9b38-4101-9feb-d1ce54142869` | status: **pending** (DNS só pode ser criado após zone Cloudflare)
- Registros DNS Resend (DKIM + SPF/MX) já criados no Cloudflare para BR e IT
- Para verificar status: `curl -s https://api.resend.com/domains -H "Authorization: Bearer re_NsbtQce5_BamK442vX1raAVHDLb9tM47y"`

### Turnstile (anti-bot)
- Status: placeholder configurado nos 3 workers (`TURNSTILE_SECRET_KEY = "TURNSTILE_NOT_CONFIGURED_YET"`)
- O Turnstile é OPCIONAL — o worker só verifica se o frontend enviar o campo `turnstileToken`
- Para ativar: criar 3 sites em `dash.cloudflare.com → Turnstile`, depois atualizar o secret em cada worker via:
  ```bash
  cd workers/worker-{br,it,en}
  CLOUDFLARE_API_TOKEN=cfat_6uzIHMXxM0RjF8inktYZrzg0cK2seTzqLRz3LY9C03865854 \
  CLOUDFLARE_ACCOUNT_ID=d6692eecddf8380bf6d48d5a14f84436 \
  npx wrangler secret put TURNSTILE_SECRET_KEY
  ```

### AUDIT_PEPPER (segurança)
- Valor gerado: `9bf1e79683b44adce95e574df1b8367d8e5c2c8b7b38e30539c376ef0a01bbca`
- Já configurado como variável (não secret) nos 3 wrangler.toml
- Usado para HMAC-SHA256 dos emails no D1 (nunca armazenar email bruto — LGPD/GDPR)

## GitHub Secrets — estado atual

### Já configurados (completos)
| Secret | Valor |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | `cfat_6uzIHMXxM0RjF8inktYZrzg0cK2seTzqLRz3LY9C03865854` |
| `CLOUDFLARE_ZONE_ID` | `bc088c2de926356945bfa6933255b609` (BR) |
| `CLOUDFLARE_ZONE_ID_IT` | `00d4d6b1dcf38e638dba03b4ac02b443` (IT) |
| `SFTP_BR_HOST` | `82.25.67.8` |
| `SFTP_BR_USER` | `u441087813` |
| `SFTP_BR_PASS` | `3e49D94thq58!` |
| `SFTP_BR_PORT` | `21` |
| `SFTP_BR_PUBLIC_HTML` | `/domains/forjadesistemas.com.br/public_html/` |
| `SFTP_IT_HOST` | `82.25.67.8` |
| `SFTP_IT_USER` | `u441087813` |
| `SFTP_IT_PASS` | `3e49D94thq58!` |
| `SFTP_IT_PORT` | `21` |
| `SFTP_IT_PUBLIC_HTML` | `/domains/systemforge.it/public_html/` |
| `SFTP_EN_HOST` | `82.25.67.8` |
| `SFTP_EN_USER` | `u441087813` |
| `SFTP_EN_PASS` | `3e49D94thq58!` |
| `SFTP_EN_PORT` | `21` |
| `SFTP_EN_PUBLIC_HTML` | `/domains/systemforgesoftware.com/public_html/` |
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_BR` | `https://newsletter-br.corgnati-pedro.workers.dev` |
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_IT` | `https://newsletter-it.corgnati-pedro.workers.dev` |
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_EN` | `https://newsletter-en.corgnati-pedro.workers.dev` |
| `NEWSLETTER_WORKER_URL_BR` | `https://newsletter-br.corgnati-pedro.workers.dev` |
| `NEWSLETTER_WORKER_URL_IT` | `https://newsletter-it.corgnati-pedro.workers.dev` |
| `NEWSLETTER_WORKER_URL_EN` | `https://newsletter-en.corgnati-pedro.workers.dev` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | já existia |
| `NEXT_PUBLIC_CALENDLY_URL` | já existia |
| `NEXT_PUBLIC_BUDGET_ENGINE_URL` | já existia |
| `NEXT_PUBLIC_CONTACT_EMAIL` | já existia |
| `NEXT_PUBLIC_SITE_URL` | já existia |

### Pendentes
| Secret | Motivo |
|--------|--------|
| `CLOUDFLARE_ZONE_ID_EN` | Zone de `systemforgesoftware.com` ainda não criada |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Precisa criar propriedade no Google Analytics 4 |
| `LHCI_GITHUB_APP_TOKEN` | Opcional — Lighthouse CI upload de resultados |

## Sequência exata para retomar (nova sessão Claude)

### PASSO 1 — Verificar propagação DNS (fazer primeiro)
```bash
# Verificar se as zones ficaram active no Cloudflare
curl -s "https://api.cloudflare.com/client/v4/zones?per_page=50" \
  -H "Authorization: Bearer cfat_6uzIHMXxM0RjF8inktYZrzg0cK2seTzqLRz3LY9C03865854" | \
  python3 -c "import sys,json; [print(z['status'],z['name']) for z in json.load(sys.stdin)['result']]"
```
Esperado: `active forjadesistemas.com.br` e `active systemforge.it`

### PASSO 2 — Criar zone de systemforgesoftware.com (após PASSO 1)
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer cfat_6uzIHMXxM0RjF8inktYZrzg0cK2seTzqLRz3LY9C03865854" \
  -H "Content-Type: application/json" \
  --data '{"name":"systemforgesoftware.com","account":{"id":"d6692eecddf8380bf6d48d5a14f84436"},"jump_start":false}'
```
Pegar o Zone ID retornado, adicionar ao GitHub:
```bash
gh secret set CLOUDFLARE_ZONE_ID_EN --body "ZONE_ID_AQUI" --repo Pedrocorgnati/system-forge-landing-page
```
Depois configurar os nameservers retornados no Dynadot para `systemforgesoftware.com`.

### PASSO 3 — Criar registros DNS no Cloudflare ✅ FEITO para BR e IT
Registros A (`@` e `www` → `82.25.67.8`, proxied) e registros Resend (DKIM + SPF) já criados para BR e IT.

Para EN (após criar a zone no PASSO 2), rodar:
```bash
CF=cfat_6uzIHMXxM0RjF8inktYZrzg0cK2seTzqLRz3LY9C03865854
ZONE_EN=<ID_DA_ZONE_EN>

# A records
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
  --data '{"type":"A","name":"@","content":"82.25.67.8","ttl":1,"proxied":true}'
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
  --data '{"type":"A","name":"www","content":"82.25.67.8","ttl":1,"proxied":true}'

# Resend DKIM (pegar valor atual via: curl https://api.resend.com/domains/cd897e56-9b38-4101-9feb-d1ce54142869 -H "Authorization: Bearer re_NsbtQce5_BamK442vX1raAVHDLb9tM47y")
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
  --data '{"type":"TXT","name":"resend._domainkey.systemforgesoftware.com","content":"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9Na2yl6OWhUj+rUatoTtTzWfYrFJmj4Y4WKQ80Jz/EpZMOoUjDhKygmorCbFsB9GGlLX7kdP2qyKApvRCGgyfyJVCJqZBhmYM6T1+6z1IZeKPBOwFIJH918tEGtubnKG64lFW4jdQvbnZ2HTVAxKlmbJtJQO7vtU8FagGaFCRmwIDAQAB","ttl":1,"proxied":false}'
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
  --data '{"type":"MX","name":"send.systemforgesoftware.com","content":"feedback-smtp.sa-east-1.amazonses.com","ttl":1,"priority":10}'
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF" -H "Content-Type: application/json" \
  --data '{"type":"TXT","name":"send.systemforgesoftware.com","content":"v=spf1 include:amazonses.com ~all","ttl":1,"proxied":false}'

# Verificar domínio no Resend
curl -s -X POST "https://api.resend.com/domains/cd897e56-9b38-4101-9feb-d1ce54142869/verify" \
  -H "Authorization: Bearer re_NsbtQce5_BamK442vX1raAVHDLb9tM47y"
```

### PASSO 4 — Disparar o primeiro deploy
```bash
cd output/workspace/system-forge-landing-page
gh workflow run deploy.yml --repo Pedrocorgnati/system-forge-landing-page
```
Ou fazer um push para `main`.

### PASSO 5 — Configurar Turnstile (opcional, pós-launch)
1. `dash.cloudflare.com → Turnstile → Add Site` → criar 1 site por domínio
2. Copiar o secret key de cada site
3. Atualizar nos workers:
```bash
cd workers/worker-br && echo "SECRET_KEY_BR" | CLOUDFLARE_API_TOKEN=cfat_6uzIHMXxM0RjF8inktYZrzg0cK2seTzqLRz3LY9C03865854 CLOUDFLARE_ACCOUNT_ID=d6692eecddf8380bf6d48d5a14f84436 npx wrangler secret put TURNSTILE_SECRET_KEY
```
4. Adicionar o sitekey público no `.env.local` como `NEXT_PUBLIC_TURNSTILE_SITE_KEY_BR/IT/EN`

### PASSO 6 — Configurar GA4 (opcional)
1. Criar propriedade em analytics.google.com para cada domínio (ou uma propriedade multi-stream)
2. `gh secret set NEXT_PUBLIC_GA4_MEASUREMENT_ID --body "G-XXXXXXXXXX" --repo Pedrocorgnati/system-forge-landing-page`

## Observações importantes
- O deploy usa `FTP-Deploy-Action` com `protocol: ftps` na porta 21 (não SSH)
- `dangerous-clean-slate: true` no deploy — cada deploy apaga e recria o `public_html` inteiro
- O step de cache purge no GitHub Actions já tem `if [ -n "$ZONE_ID" ]` — pula silenciosamente se o Zone ID não existir
- O worker-en tem `COMPANY_ADDRESS` setado com endereço de coworking NY (WeWork, 222 Broadway) — **atualizar com endereço real antes do lançamento** (obrigação legal CAN-SPAM)
- O build do site NÃO inclui a newsletter worker URL no HTML (variável ausente = newsletter desativada silenciosamente via `isNewsletterConfigured()`)
- Arquivos dos workers: `workers/worker-br/`, `workers/worker-it/`, `workers/worker-en/`
- wrangler.toml de cada worker já tem todos os IDs reais (KV, D1) preenchidos

---

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
