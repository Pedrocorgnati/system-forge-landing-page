# Anti-Hacking Fingerprint
Data: 2026-03-29
Projeto: SystemForge Landing Page

## Stack

| Componente | Versão | Notas |
|-----------|--------|-------|
| Next.js | 16.2.1 | Static export (`output: 'export'`) |
| React | 19.2.4 | App Router |
| Node.js | ≥20.0.0 (engines) | — |
| TypeScript | ^5 | — |
| Velite | 0.3.1 | CMS/MDX content pipeline |

## Router

- **App Router** (`src/app/`) — único router
- Sem `pages/`

## Auth

- **Nenhuma** — site estático/informacional, sem área autenticada

## ORM / Database

- **Nenhum** — static export sem backend Next.js
- Cloudflare D1 (SQLite) via Workers (fora do Next.js)

## Payment

- **Nenhum** — site de conversão (WhatsApp, Calendly CTAs)

## Deploy

- **Hostinger Shared Hosting** — via `.htaccess` + static HTML
- Docker disponível para dev/staging
- Triple-market: dist-br, dist-it, dist-en

## Middleware

- **Ausente** — nenhum `middleware.ts` encontrado

## Server Actions

- **Ausente** — static export não suporta Server Actions em runtime
- Zero arquivos com `"use server"`

## API Routes (dentro do Next.js)

- `GET /blog/feed.xml` — RSS feed (velite data, estático)
- `GET /blog/feed.json` — JSON feed (velite data, estático)

## Cloudflare Workers (fora do Next.js)

- `worker-br` — Newsletter BR (LGPD, single opt-in)
- `worker-it` — Newsletter IT (GDPR, double opt-in)
- `worker-en` — Newsletter EN (CAN-SPAM, single opt-in)

## Superfície de Ataque

- Site estático HTML/JS/CSS → attack surface mínima no servidor Next.js
- Cloudflare Workers → único endpoint com lógica de negócio
- Sem autenticação, sem banco de dados direto, sem pagamentos

## Proteções Existentes

| Proteção | Status |
|---------|--------|
| rehype-sanitize no MDX | Configurado (velite.config.ts) |
| CORS whitelist nos Workers | Configurado (cors.ts) |
| HMAC email + hash IP | Configurado (LGPD) |
| D1 parameterized queries | Configurado (sem SQL injection) |
| Honeypot no formulário | Client-side only |
| Turnstile | Opcional (condicional) |
| CSP via .htaccess | Configurado (generate-htaccess.ts) |
| HSTS | Configurado (.htaccess) |
| .env gitignored | Configurado |
