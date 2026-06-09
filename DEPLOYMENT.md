# CONTEXTO PARA NOVA SESSÃO CLAUDE — LEIA ANTES DE TUDO
> Este bloco foi escrito em 2026-03-28 para retomada da sessão. Após concluir todos os itens pendentes, este bloco pode ser removido.

## O que é este projeto

Landing page multi-mercado do **SystemForge / Forja de Sistemas** — um site Next.js estático (export) com 4 builds independentes por locale, cada um deployado em um domínio diferente via GitHub Actions + SFTP para Hostinger. Cloudflare fica na frente como CDN/proxy.

- Repositório GitHub: `Pedrocorgnati/system-forge-landing-page`
- Workspace local: `output/workspace/system-forge-landing-page/`
- Credenciais SSH Hostinger: `output/workspace/my-fckng-landing-page/.env.deploy`
- GitHub CLI já autenticado localmente (`gh auth status` → Pedrocorgnati)
- Cloudflare Account ID: armazenado em `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` (não commitado)
- Cloudflare API Token: armazenado em `${{ secrets.CLOUDFLARE_API_TOKEN }}` (não commitado)
  - Permissões: Workers Scripts Edit, D1 Edit, Workers KV Edit, Zone Edit, DNS Edit, Cache Purge, Turnstile Edit

## 4 Domínios / Locales

> **Status verificado em 2026-06-08:** as 4 zonas estão ativas no Cloudflare e os 4 domínios respondem **HTTP 200** servindo o locale correto. Os NS dos 4 já propagaram para a Cloudflare.

| Locale | Domínio | Cloudflare Zone ID | Status DNS |
|--------|---------|-------------------|------------|
| pt-BR | forjadesistemas.com.br | `${{ secrets.CLOUDFLARE_ZONE_ID_BR }}` | ✅ ativo — NS na Cloudflare, A proxied, site no ar |
| it-IT | systemforge.it | `${{ secrets.CLOUDFLARE_ZONE_ID_IT }}` | ✅ ativo — NS na Cloudflare, A proxied, site no ar |
| en | systemforgesoftware.com | `${{ secrets.CLOUDFLARE_ZONE_ID_EN }}` | ✅ ativo — NS na Cloudflare, A proxied, site no ar |
| es-ES | systemforge.es | `bcc897b903d2aad8bd5b52e6c840e995` | ✅ ativo — NS na Cloudflare, A proxied, site no ar |

**Nameservers (todos já apontando para a Cloudflare e propagados):**
- `forjadesistemas.com.br` → `bingo.ns.cloudflare.com` + `ed.ns.cloudflare.com`
- `systemforge.it` → `adam.ns.cloudflare.com` + `arely.ns.cloudflare.com`
- `systemforgesoftware.com` → `adam.ns.cloudflare.com` + `arely.ns.cloudflare.com`
- `systemforge.es` → `adam.ns.cloudflare.com` + `arely.ns.cloudflare.com`

> ### ⚠️ Sobre o aviso "domínio desconectado / nameservers incorretos" no hPanel da Hostinger
>
> Isso é **esperado e cosmético** neste setup — não é falha. O painel da Hostinger só marca um domínio como "Conectado" quando os NS dele apontam para os nameservers **da própria Hostinger** (`ns1.dns-parking.com` / `ns2.dns-parking.com`). Como aqui os NS apontam para a **Cloudflare** (CDN/proxy na frente), a Hostinger não controla o DNS e exibe o aviso, mas o tráfego real chega normalmente: domínio → NS Cloudflare → registro A (proxied, nuvem laranja) → IP de origem na Hostinger → `public_html` correto.
>
> **Não troque os NS de volta para a Hostinger** só para apagar o aviso: isso remove a Cloudflare da frente (perde CDN/cache/proxy) e quebraria os registros DKIM/SPF do Resend e os Workers de newsletter, que dependem das zonas Cloudflare. Para silenciar o aviso sem perder nada, adicione o domínio no hPanel via opção de **DNS externo / nameservers personalizados** (Cloudflare) em vez de "Conectar domínio".

## Infraestrutura Cloudflare já provisionada

### Cloudflare Workers (3 workers live + 1 pendente)
Workers deployados e respondendo em `murta-pedro.workers.dev`:

| Worker | URL | Locale | Compliance |
|--------|-----|--------|-----------|
| newsletter-br | `https://newsletter-br.murta-pedro.workers.dev` | pt-BR | LGPD (single opt-in) |
| newsletter-it | `https://newsletter-it.murta-pedro.workers.dev` | it-IT | GDPR (double opt-in) |
| newsletter-en | `https://newsletter-en.murta-pedro.workers.dev` | en | CAN-SPAM (single opt-in) |
| newsletter-es | **PENDENTE** — criar em `workers/worker-es/` | es-ES | GDPR (double opt-in, como IT) |

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
- API Key: armazenada em `${{ secrets.RESEND_API_KEY }}` (não commitada)
- Audiences criadas:
  - `newsletter-br` → ID: armazenado em `${{ secrets.RESEND_AUDIENCE_ID_BR }}`
  - `newsletter-it` → ID: armazenado em `${{ secrets.RESEND_AUDIENCE_ID_IT }}`
  - `newsletter-en` → ID: armazenado em `${{ secrets.RESEND_AUDIENCE_ID_EN }}`
  - `newsletter-es` → **PENDENTE** — criar audience quando worker-es for deployado
- Secrets configurados em cada worker: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID_BR/IT/EN`
- Domínios de envio adicionados ao Resend:
  - `forjadesistemas.com.br` → ID: armazenado em `${{ secrets.RESEND_DOMAIN_ID_BR }}` | DNS já propagado (zona Cloudflare ativa) — revalidar status no Resend via curl abaixo
  - `systemforge.it` → ID: armazenado em `${{ secrets.RESEND_DOMAIN_ID_IT }}` | DNS já propagado (zona Cloudflare ativa) — revalidar status no Resend via curl abaixo
  - `systemforgesoftware.com` → ID: armazenado em `${{ secrets.RESEND_DOMAIN_ID_EN }}` | zona Cloudflare agora ativa — adicionar/verificar DKIM no Resend
  - `systemforge.es` → zona Cloudflare ativa (`bcc897b903d2aad8bd5b52e6c840e995`) — adicionar ao Resend e criar registros DKIM
- Registros DNS Resend (DKIM + SPF/MX) já criados no Cloudflare para BR e IT; pendentes para EN e ES
- Para verificar status: `curl -s https://api.resend.com/domains -H "Authorization: Bearer ${{ secrets.RESEND_API_KEY }}"`

### Turnstile (anti-bot)
- Status: placeholder configurado nos 3 workers (`TURNSTILE_SECRET_KEY = "TURNSTILE_NOT_CONFIGURED_YET"`)
- O Turnstile é OPCIONAL — o worker só verifica se o frontend enviar o campo `turnstileToken`
- Para ativar: criar 3 sites em `dash.cloudflare.com → Turnstile`, depois atualizar o secret em cada worker via:
  ```bash
  cd workers/worker-br
  npx wrangler secret put TURNSTILE_SECRET_KEY
  # Cole a secret key quando solicitado
  ```

### AUDIT_PEPPER (segurança)
- Valor: armazenado como variável (não secret) nos 3 wrangler.toml
- Usado para HMAC-SHA256 dos emails no D1 (nunca armazenar email bruto — LGPD/GDPR)
- Configure via: `npx wrangler secret put AUDIT_PEPPER` em cada worker

## GitHub Secrets — Checklist de Configuração

### Secrets Obrigatórios (não commitados)

Configure em: Repositório → Settings → Secrets and variables → Actions → New repository secret

**⚠️ AVISO:** Nunca commit os valores reais dos secrets. Use GitHub Secrets ou variáveis de ambiente.

| Secret | Tipo | Descrição |
|--------|------|-----------|
| `CLOUDFLARE_API_TOKEN` | Token | API Token Cloudflare com permissões Zone Edit |
| `CLOUDFLARE_ACCOUNT_ID` | ID | Account ID da conta Cloudflare |
| `CLOUDFLARE_ZONE_ID_BR` | ID | Zone ID para forjadesistemas.com.br |
| `CLOUDFLARE_ZONE_ID_IT` | ID | Zone ID para systemforge.it |
| `CLOUDFLARE_ZONE_ID_EN` | ID | Zone ID para systemforgesoftware.com (zona ativa) |
| `CLOUDFLARE_ZONE_ID_ES` | ID | Zone ID para systemforge.es (zona ativa — `bcc897b903d2aad8bd5b52e6c840e995`) |
| `SFTP_BR_HOST` | String | Host SFTP Hostinger |
| `SFTP_BR_USER` | String | Usuário SFTP Hostinger |
| `SFTP_BR_PASS` | String | Senha SFTP Hostinger (32+ chars) |
| `SFTP_BR_PORT` | String | Porta SFTP Hostinger |
| `SFTP_BR_PUBLIC_HTML` | String | Caminho `public_html` no Hostinger |
| `SFTP_IT_HOST` | String | Host SFTP Hostinger (IT) |
| `SFTP_IT_USER` | String | Usuário SFTP Hostinger (IT) |
| `SFTP_IT_PASS` | String | Senha SFTP Hostinger (IT) |
| `SFTP_IT_PORT` | String | Porta SFTP Hostinger (IT) |
| `SFTP_IT_PUBLIC_HTML` | String | Caminho `public_html` Hostinger (IT) |
| `SFTP_EN_HOST` | String | Host SFTP Hostinger (EN) |
| `SFTP_EN_USER` | String | Usuário SFTP Hostinger (EN) |
| `SFTP_EN_PASS` | String | Senha SFTP Hostinger (EN) |
| `SFTP_EN_PORT` | String | Porta SFTP Hostinger (EN) |
| `SFTP_EN_PUBLIC_HTML` | String | Caminho `public_html` Hostinger (EN) |
| `SFTP_ES_HOST` | String | Host SFTP Hostinger (ES) |
| `SFTP_ES_USER` | String | Usuário SFTP Hostinger (ES) |
| `SFTP_ES_PASS` | String | Senha SFTP Hostinger (ES) |
| `SFTP_ES_PORT` | String | Porta SFTP Hostinger (ES) |
| `SFTP_ES_PUBLIC_HTML` | String | Caminho `public_html` Hostinger (ES) |
| `RESEND_API_KEY` | Token | API Key Resend (email) |
| `RESEND_AUDIENCE_ID_BR` | ID | Audience ID Resend (PT-BR) |
| `RESEND_AUDIENCE_ID_IT` | ID | Audience ID Resend (IT-IT) |
| `RESEND_AUDIENCE_ID_EN` | ID | Audience ID Resend (EN) |
| `RESEND_AUDIENCE_ID_ES` | ID | Audience ID Resend (ES) — pendente |
| `RESEND_DOMAIN_ID_BR` | ID | Domain ID Resend (forjadesistemas.com.br) |
| `RESEND_DOMAIN_ID_IT` | ID | Domain ID Resend (systemforge.it) |
| `RESEND_DOMAIN_ID_EN` | ID | Domain ID Resend (systemforgesoftware.com) |
| `RESEND_DOMAIN_ID_ES` | ID | Domain ID Resend (systemforge.es) — pendente |
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_BR` | URL | URL do Worker Cloudflare (PT-BR) |
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_IT` | URL | URL do Worker Cloudflare (IT) |
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_EN` | URL | URL do Worker Cloudflare (EN) |
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES` | URL | URL do Worker Cloudflare (ES) — pendente |
| `NEWSLETTER_WORKER_URL_BR` | URL | URL do Worker Cloudflare (PT-BR, backend) |
| `NEWSLETTER_WORKER_URL_IT` | URL | URL do Worker Cloudflare (IT, backend) |
| `NEWSLETTER_WORKER_URL_EN` | URL | URL do Worker Cloudflare (EN, backend) |
| `NEWSLETTER_WORKER_URL_ES` | URL | URL do Worker Cloudflare (ES, backend) — pendente |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | String | Número WhatsApp (público) |
| `NEXT_PUBLIC_BUDGET_ENGINE_URL` | URL | URL Budget Engine (público) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Email | Email de contato (público) |
| `NEXT_PUBLIC_SITE_URL` | URL | URL do site (público) |

### Pendentes
> Atualizado em 2026-06-08: as zonas Cloudflare EN/ES já estão ativas e a conta Hostinger ES já está deployada (`systemforge.es` responde HTTP 200). Pendências restantes são só do Worker de newsletter ES.

| Secret | Motivo |
|--------|--------|
| `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES` | Worker newsletter-es ainda não deployado |
| `NEWSLETTER_WORKER_URL_ES` | Worker newsletter-es ainda não deployado |
| `RESEND_AUDIENCE_ID_ES` | Audience criada após worker-es estar live |
| `RESEND_DOMAIN_ID_ES` | Domínio adicionado ao Resend após zone Cloudflare |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Precisa criar propriedade no Google Analytics 4 |
| `LHCI_GITHUB_APP_TOKEN` | Opcional — Lighthouse CI upload de resultados |

## Sequência exata para retomar (nova sessão Claude)

### PASSO 1 — Verificar propagação DNS (fazer primeiro)
```bash
# Verificar se as zones ficaram active no Cloudflare
# Use ${{ secrets.CLOUDFLARE_API_TOKEN }} ou variável de ambiente CLOUDFLARE_API_TOKEN
CF_TOKEN="$CLOUDFLARE_API_TOKEN"  # ou obtenha do GitHub Secret

curl -s "https://api.cloudflare.com/client/v4/zones?per_page=50" \
  -H "Authorization: Bearer $CF_TOKEN" | \
  python3 -c "import sys,json; [print(z['status'],z['name']) for z in json.load(sys.stdin)['result']]"
```
Esperado: `active forjadesistemas.com.br` e `active systemforge.it`

### PASSO 2 — Criar zone de systemforgesoftware.com (após PASSO 1)
```bash
# Use ${{ secrets.CLOUDFLARE_API_TOKEN }} e ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
CF_TOKEN="$CLOUDFLARE_API_TOKEN"
CF_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID"

curl -s -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"name\":\"systemforgesoftware.com\",\"account\":{\"id\":\"$CF_ACCOUNT_ID\"},\"jump_start\":false}"
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
# Use GitHub Secrets para obter tokens
CF_TOKEN="$CLOUDFLARE_API_TOKEN"
ZONE_EN="$CLOUDFLARE_ZONE_ID_EN"  # Obtido do PASSO 2
RESEND_TOKEN="$RESEND_API_KEY"
RESEND_DOMAIN_ID="$RESEND_DOMAIN_ID_EN"

# A records
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  --data '{"type":"A","name":"@","content":"82.25.67.8","ttl":1,"proxied":true}'
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  --data '{"type":"A","name":"www","content":"82.25.67.8","ttl":1,"proxied":true}'

# Resend DKIM (pegar valor atual via: curl https://api.resend.com/domains/$RESEND_DOMAIN_ID -H "Authorization: Bearer $RESEND_TOKEN")
# Cole o valor DKIM retornado abaixo em <DKIM_VALUE>
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  --data '{"type":"TXT","name":"resend._domainkey.systemforgesoftware.com","content":"p=<DKIM_VALUE>","ttl":1,"proxied":false}'

# MX e SPF records
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  --data '{"type":"MX","name":"send.systemforgesoftware.com","content":"feedback-smtp.sa-east-1.amazonses.com","ttl":1,"priority":10}'
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_EN/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  --data '{"type":"TXT","name":"send.systemforgesoftware.com","content":"v=spf1 include:amazonses.com ~all","ttl":1,"proxied":false}'

# Verificar domínio no Resend
curl -s -X POST "https://api.resend.com/domains/$RESEND_DOMAIN_ID/verify" \
  -H "Authorization: Bearer $RESEND_TOKEN"
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
cd workers/worker-br && echo "SECRET_KEY_BR" | CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}" npx wrangler secret put TURNSTILE_SECRET_KEY
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
- Arquivos dos workers: `workers/worker-br/`, `workers/worker-it/`, `workers/worker-en/`, `workers/worker-es/` (pendente — copiar de worker-it, GDPR)
- `systemforge.es` adquirido no Dynadot em 2026-03-29 — 4º mercado (Espanha + LATAM)
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
| `NEXT_PUBLIC_CALENDLY_URL` | URL do Calendly para agendamento | `https://calendly.com/pedro-murta/...` |
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
