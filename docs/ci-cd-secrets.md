# CI/CD Secrets — Triple Market Deploy

> ⚠️ **SEGURANÇA: Nunca commite valores reais neste arquivo.**
> Use o painel do Hostinger para obter as credenciais SFTP de cada domínio.

## Como Configurar

1. Acesse o repositório no GitHub
2. Vá em **Settings → Secrets and variables → Actions → New repository secret**
3. Adicione cada secret abaixo com o valor obtido no painel Hostinger

---

## Secrets por Domínio

Convenção de nomenclatura: `SFTP_{MERCADO}_{CAMPO}`

### Brasil — forjadesistemas.com.br

| Secret | Descrição | Onde encontrar no Hostinger |
|--------|-----------|------------------------------|
| `SFTP_BR_HOST` | Host FTP/FTPS do servidor BR | Hosting → FTP Accounts → Server Address |
| `SFTP_BR_USER` | Usuário FTP BR | Hosting → FTP Accounts → Username |
| `SFTP_BR_PASS` | Senha FTP BR | Hosting → FTP Accounts → Password |
| `SFTP_BR_PORT` | Porta FTP BR (geralmente 21 para FTP/FTPS) | Hosting → FTP Accounts → Port |
| `SFTP_BR_PUBLIC_HTML` | Caminho do public_html BR | Hosting → File Manager → public_html path |

Exemplo de valor: `SFTP_BR_HOST` = `ftp.forjadesistemas.com.br`

---

### Itália — systemforge.it

| Secret | Descrição | Onde encontrar no Hostinger |
|--------|-----------|------------------------------|
| `SFTP_IT_HOST` | Host FTP/FTPS do servidor IT | Hosting → FTP Accounts → Server Address |
| `SFTP_IT_USER` | Usuário FTP IT | Hosting → FTP Accounts → Username |
| `SFTP_IT_PASS` | Senha FTP IT | Hosting → FTP Accounts → Password |
| `SFTP_IT_PORT` | Porta FTP IT (geralmente 21 para FTP/FTPS) | Hosting → FTP Accounts → Port |
| `SFTP_IT_PUBLIC_HTML` | Caminho do public_html IT | Hosting → File Manager → public_html path |

Exemplo de valor: `SFTP_IT_HOST` = `ftp.systemforge.it`

---

### Inglês — systemforgesoftware.com

| Secret | Descrição | Onde encontrar no Hostinger |
|--------|-----------|------------------------------|
| `SFTP_EN_HOST` | Host FTP/FTPS do servidor EN | Hosting → FTP Accounts → Server Address |
| `SFTP_EN_USER` | Usuário FTP EN | Hosting → FTP Accounts → Username |
| `SFTP_EN_PASS` | Senha FTP EN | Hosting → FTP Accounts → Password |
| `SFTP_EN_PORT` | Porta FTP EN (geralmente 21 para FTP/FTPS) | Hosting → FTP Accounts → Port |
| `SFTP_EN_PUBLIC_HTML` | Caminho do public_html EN | Hosting → File Manager → public_html path |

Exemplo de valor: `SFTP_EN_HOST` = `ftp.systemforgesoftware.com`

---

## Secrets de Aplicação (build.yml)

Valores de configuração armazenados como secrets para evitar hardcoding. Usados no step de build.

| Secret | Descrição | Onde obter |
|--------|-----------|------------|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | ID de medição do Google Analytics 4 (ex: G-XXXXXXXXXX) | Google Analytics → Admin → Data Streams |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número WhatsApp para CTA de contato (formato internacional) | Número comercial da empresa |
| `NEXT_PUBLIC_CALENDLY_URL` | URL do Calendly para agendamento de reuniões | Calendly → Event Types → Link |
| `NEXT_PUBLIC_BUDGET_ENGINE_URL` | URL da API do Budget Engine | Painel do Budget Engine |

---

## Secrets Compartilhados (opcionais)

| Secret | Descrição | Usado em |
|--------|-----------|----------|
| `CLOUDFLARE_API_TOKEN` | Token de API do Cloudflare para purge de cache | deploy.yml (pós-deploy) |
| `CLOUDFLARE_ZONE_ID` | Zone ID do domínio BR no Cloudflare | deploy.yml — deploy-br |
| `CLOUDFLARE_ZONE_ID_IT` | Zone ID do domínio IT no Cloudflare | deploy.yml — deploy-it |
| `CLOUDFLARE_ZONE_ID_EN` | Zone ID do domínio EN no Cloudflare | deploy.yml — deploy-en |

---

## Checklist de Configuração

Antes do primeiro deploy, confirme que todos os secrets estão configurados:

**Brasil (BR) — 5 secrets:**
- [ ] `SFTP_BR_HOST`
- [ ] `SFTP_BR_USER`
- [ ] `SFTP_BR_PASS`
- [ ] `SFTP_BR_PORT`
- [ ] `SFTP_BR_PUBLIC_HTML`

**Itália (IT) — 5 secrets:**
- [ ] `SFTP_IT_HOST`
- [ ] `SFTP_IT_USER`
- [ ] `SFTP_IT_PASS`
- [ ] `SFTP_IT_PORT`
- [ ] `SFTP_IT_PUBLIC_HTML`

**Inglês (EN) — 5 secrets:**
- [ ] `SFTP_EN_HOST`
- [ ] `SFTP_EN_USER`
- [ ] `SFTP_EN_PASS`
- [ ] `SFTP_EN_PORT`
- [ ] `SFTP_EN_PUBLIC_HTML`

**Total: 15 secrets SFTP** (+ 4 opcionais do Cloudflare)

---

## Para Adicionar um 4º Mercado

Seguir o padrão: criar 5 secrets `SFTP_{MERCADO}_HOST/USER/PASS/PORT/PUBLIC_HTML`
e adicionar um novo job no `.github/workflows/deploy.yml`.
