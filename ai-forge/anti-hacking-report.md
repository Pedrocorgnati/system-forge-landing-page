# Anti-Hacking Review Report
Data: 2026-03-29
Projeto: SystemForge Landing Page
Fingerprint: Next.js 16.2.1 | React 19.2.4 | Node ≥20 | Static Export

---

## Resumo Executivo

Este é um **site estático de alta maturidade de segurança**. A escolha de `output: 'export'` elimina automaticamente a maioria dos CVEs críticos do ecossistema Next.js (middleware bypass, RSC RCE, SSRF, cache poisoning). A única superfície de ataque dinâmica são os **Cloudflare Workers** de newsletter.

- Vulnerabilidades encontradas: 10
  - P0-BLOCKER: 0
  - P1-CRÍTICO: 2 *(Workers: Unsubscribe sem autenticação + Email Enumeration)*
  - P2-ALTO: 2
  - P3-MÉDIO: 3
  - P4-BAIXO: 3
- CVEs verificados: 8 (0 aplicáveis em runtime — static export mitiga todos)
- Attack chains identificadas: 2
- **Risco geral: BAIXO** (para o site Next.js) / **ALTO** (para os Workers — Unsubscribe não autenticado)

> **Revisado por Codex MCP** — Verdict original: BLOCKED. Dois P1 adicionais descobertos (unsubscribe sem token + enumeração de email). V005 (GoogleAnalytics.tsx) rebaixado para P4 pois o componente não está em uso (layout usa Analytics.tsx).

---

## CVEs Verificados

| CVE | CVSS | Descrição | Projeto Afetado? | Motivo |
|-----|------|-----------|-----------------|--------|
| CVE-2025-29927 | 9.1 | Middleware Authorization Bypass | **NÃO** | Sem middleware.ts |
| CVE-2025-55182 (React2Shell) | 10.0 | RSC Flight RCE | **NÃO** | React 19.2.4 está PATCHED (fix em 19.2.1+). Static export — sem servidor RSC em runtime. Exploits ativos por grupos state-nexus (Earth Lamia, Jackpot Panda) desde Dez/2025. |
| CVE-2025-55184 | — | DoS RSC via Promises | **NÃO** | Static export — sem servidor em runtime |
| CVE-2025-49826 | — | Cache Poisoning ISR | **NÃO** | Static export — sem ISR |
| CVE-2025-57822 | — | SSRF via Middleware Location | **NÃO** | Sem middleware |
| CVE-2024-34351 | 7.5 | SSRF via Server Actions | **NÃO** | Sem Server Actions |
| CVE-2024-46982 | — | Cache Poisoning Pages Router | **NÃO** | Sem Pages Router |
| CVE-2025-55183 | — | Server Actions Source Disclosure | **NÃO** | Sem Server Actions |

**Conclusão:**
- React 19.2.4 está PATCHED para CVE-2025-55182 (fix foi em 19.2.1+)
- Next.js 16.2.1 contém CVE-2025-66478 (variante Next.js do React2Shell), mas é **imune** porque `output: 'export'` não executa nenhum servidor Node.js em produção — não há RSC server para atacar
- O `output: 'export'` é o principal fator de mitigação para todos os CVEs RSC/server-side
- Velite 0.3.1: sem CVEs conhecidos (verificado via Snyk/Socket)

---

## Vulnerabilidades Detalhadas

### V001 — Turnstile Condicional nos Workers (Anti-Bot Bypass)
**Prioridade: P2-ALTO**
**Arquivos:** `workers/worker-br/src/index.ts:91`, `workers/worker-en/src/index.ts:79`, `workers/worker-it/src/index.ts:79`

**Código vulnerável:**
```typescript
// VULNERÁVEL — Turnstile só verifica se token presente; ausência = bypass
if (body.turnstileToken) {
  const valid = await verifyTurnstile(...)
  if (!valid) return corsResponse(..., 400, ...)
}
// Se body.turnstileToken não for enviado, cai aqui sem verificação
```

**Como explorar:**
```bash
# Atacante omite turnstileToken — worker aceita sem verificação anti-bot
curl -X POST https://newsletter-br.xxx.workers.dev/subscribe \
  -H "Content-Type: application/json" \
  -H "Origin: https://forjadesistemas.com.br" \
  -d '{"email":"victim@example.com","consent":true}'
```

**Impacto:** Bypass completo do Turnstile. Sem rate limiting, qualquer script pode fazer flood de inscrições.

**Fix:** Tornar o token obrigatório — rejeitar requests sem `turnstileToken`.

---

### V002 — Rate Limiting Ausente nos Workers
**Prioridade: P2-ALTO**
**Arquivos:** `workers/worker-br/src/index.ts`, `workers/worker-en/src/index.ts`, `workers/worker-it/src/index.ts`

**Descrição:** Os 3 workers não implementam rate limiting por IP. Combinado com V001 (Turnstile opcional), um script pode fazer flood de `POST /subscribe`.

**Impacto:**
- Abuso da cota gratuita da Resend API (100 emails/dia free tier)
- Inflate de custos em D1 (leituras/escritas)
- Possível esgotamento do KV namespace
- Lista de newsletter poluída com emails falsos

**Fix:** Implementar rate limiting via `CF-Connecting-IP` (ex: máx 3 tentativas/IP/hora usando KV com TTL).

---

### V003 — CSP com `unsafe-eval` e `unsafe-inline`
**Prioridade: P3-MÉDIO**
**Arquivo:** `scripts/generate-htaccess.ts:35-71`

**Código:**
```
"script-src 'self' 'unsafe-inline' 'unsafe-eval' ..."
```

**Motivo da presença:** `unsafe-eval` é exigido pelo `new Function(code)` em `MDXContent.tsx` e pelo runtime do Next.js static export. `unsafe-inline` é necessário para scripts inline.

**Impacto:** Se um XSS fosse injetado (ex: via conteúdo MDX não sanitizado), `unsafe-eval` eliminaria a última linha de defesa da CSP. Na prática, o `rehype-sanitize` e o controle editorial interno mitigam o vetor.

**Fix (ideal):** Migrar `MDXContent` para usar `next-mdx-remote` com nonces CSP ou substituir `new Function()` por `eval()` restrito. A solução pragmática é documentar o risco e manter `rehype-sanitize` rigoroso.

---

### V004 — Honeypot Não Verificado no Servidor
**Prioridade: P3-MÉDIO**
**Arquivo:** `workers/worker-br/src/index.ts` (e worker-en, worker-it)

**Descrição:** O formulário envia o campo `website` (honeypot) ao worker, mas o worker ignora o campo completamente. Apenas o cliente faz o check client-side. Um bot que ignora o honeypot client-side (ou um atacante que monta requests diretos via cURL) não é bloqueado server-side.

**Fix:** O worker deve verificar `if (body.website && body.website.trim() !== '') return 400` antes de processar.

---

### V005 — `dangerouslySetInnerHTML` com Measurement ID Interpolado
**Prioridade: P3-MÉDIO**
**Arquivo:** `src/components/analytics/GoogleAnalytics.tsx:26-37`

**Código:**
```typescript
dangerouslySetInnerHTML={{
  __html: `
    gtag('config', '${measurementId}', { ... });
  `
}}
```

**Análise:** `measurementId` vem de `process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID`, que é baked-in no bundle em build time. Não há injeção dinâmica de runtime. O risco é estritamente supply-chain (comprometimento do ambiente de CI/build).

**Mitigação atual:** Valor baked in build time. CSP presente (mas `unsafe-inline` ativo).

**Fix:** Usar nonces ou mover o script GA4 para um arquivo externo referenciado por `<Script src=...>`.

---

### V006 — Nginx (Docker) sem Headers de Segurança Completos
**Prioridade: P4-BAIXO**
**Arquivo:** `nginx.conf`

**Headers ausentes no nginx.conf:**
- `Content-Security-Policy` — ausente
- `Strict-Transport-Security` — ausente
- `Permissions-Policy` — ausente

**Mitigação:** nginx.conf é para uso Docker/staging. Produção usa Hostinger com `.htaccess` gerado por `generate-htaccess.ts` que tem todos os headers. Risco real somente se Docker for usado em produção.

---

### V007 — X-Frame-Options: SAMEORIGIN vs DENY
**Prioridade: P4-BAIXO**
**Arquivos:** `nginx.conf:8`, `scripts/generate-htaccess.ts:153`

**Descrição:** SAMEORIGIN permite que o próprio domínio faça embedding via iframe. Para uma landing page pura, DENY seria o valor mais restritivo.

**Impacto:** Baixo — clickjacking dentro do mesmo domínio é improvável.

---

### V008 — Feed Routes com `revalidate` em Static Export
**Prioridade: P4-BAIXO**
**Arquivos:** `src/app/blog/feed.xml/route.ts:12`, `src/app/blog/feed.json/route.ts:12`

**Descrição:** `export const revalidate = 3600` é ignorado silenciosamente em `output: 'export'`. O conteúdo dos feeds é gerado estaticamente no build e não é revalidado.

**Impacto:** Funcional apenas (feeds desatualizados entre deploys), não um problema de segurança.

---

### V009 — Unsubscribe sem Prova de Posse *(Codex — novo)*
**Prioridade: P1-CRÍTICO**
**Arquivos:** `workers/worker-br/src/index.ts:213-276`, `workers/worker-en/src/index.ts`, `workers/worker-it/src/index.ts`

**Código vulnerável:**
```typescript
async function handleUnsubscribe(request: Request, env: WorkerEnv, origin: string) {
  const email = (body.email ?? "").trim().toLowerCase();
  // APENAS valida formato do email — sem token, sem link autenticado
  if (!EMAIL_REGEX.test(email)) { ... }
  // Qualquer um que saiba o email pode desinscrever
  const existingRaw = await env.NEWSLETTER_KV.get(kvActiveKey(email));
  ...
```

**Como explorar:**
```bash
# Atacante desinscreve um usuário legítimo sem qualquer autenticação
curl -X POST https://newsletter-br.xxx.workers.dev/unsubscribe \
  -H "Content-Type: application/json" \
  -H "Origin: https://forjadesistemas.com.br" \
  -d '{"email":"victim@example.com"}'
# → 200 OK — inscrito removido
```

**Impacto:** Negação de serviço da lista de newsletter. Sabotagem direcionada de assinantes. Ação irreversível (sem re-confirmação). Afeta os 3 workers.

**Fix:** Gerar token assinado (HMAC) no welcome email, exigir `token` no endpoint `POST /unsubscribe`. Alternativamente: link de unsubscribe único gerado por Resend (já usado por ESPs).

---

### V010 — Enumeração de Estado de Email *(Codex — novo)*
**Prioridade: P1-CRÍTICO**
**Arquivos:** `workers/worker-br/src/index.ts:107-134`

**Respostas distinguíveis:**
```
POST /subscribe {"email":"a@x.com","consent":true}
→ 201 {"success":true}              # Email novo, inscrito
→ 409 {"status":"already-subscribed"} # Email existente e ativo
→ 201 {"success":true} (silencioso)   # Email suprimido (bounced/complaint)
→ 400 {"code":"INVALID_EMAIL"}        # Email inválido
```

```
POST /unsubscribe {"email":"a@x.com"}
→ 200 {"success":true}               # Email estava ativo
→ 404 {"error":"Inscrição não encontrada"} # Email não existe
```

**Como explorar:** Script que itera emails e mapeia status: ativo, nunca inscrito, suprimido. Confirma existência de emails na base de clientes/prospects.

**Impacto:** Vazamento de PII (existência de email na base). LGPD art. 6º — dados pessoais sem consentimento explícito para disclosure.

**Fix unsubscribe:** Retornar sempre 200 independentemente de o email existir ou não.
**Fix subscribe:** Remover diferença entre `already-subscribed` (409) e novo inscrito (201), ou aceitar que 409 é necessário para UX.

---

## Attack Chains

### Attack Chain 1: Newsletter Spam Flood
```
1. Atacante inspeciona source do site ou scripts de automação
2. Descobre NEXT_PUBLIC_NEWSLETTER_WORKER_URL_* (baked no bundle)
3. Envia POST /subscribe sem turnstileToken (V001)
4. Sem rate limiting (V002), faz flood ilimitado
5. Worker: email validado via regex, consent=true, sem honeypot check (V004)
6. Cada request bem-sucedido:
   - Grava em D1 (se email único)
   - Grava em KV (sempre)
   - Chama Resend API (depleta cota)
   - Envia welcome email (custo real)
```

**Impacto combinado:** Abuso de API de email, custos Cloudflare D1/KV, lista contaminada
**Complexidade:** Baixa (1 curl + loop)

---

### Attack Chain 2: Sabotagem Direcionada de Lista
```
1. Atacante coleta lista de emails de prospects da empresa (LinkedIn, etc.)
2. Forja Origin header para passar checagem CORS
3. Envia POST /unsubscribe para cada email (V009 — sem autenticação)
4. Inscritos legítimos são removidos da lista sem consentimento
5. Empresa perde leads, sem logs rastreáveis ao atacante
```

**Impacto combinado:** Dano reputacional + perda de leads + possível violação LGPD
**Complexidade:** Baixa (1 script, sem tokens necessários)

---

## Dependências Vulneráveis

```
npm audit: 0 vulnerabilities
```

Nenhuma dependência vulnerável conhecida.

---

## Headers de Segurança

### .htaccess (Produção — Hostinger)

| Header | Status |
|--------|--------|
| Content-Security-Policy | Presente (unsafe-eval/unsafe-inline necessários) |
| Strict-Transport-Security | Presente (max-age=31536000, includeSubDomains) |
| X-Frame-Options | Presente (SAMEORIGIN) |
| X-Content-Type-Options | Presente (nosniff) |
| Referrer-Policy | Presente (strict-origin-when-cross-origin) |
| Permissions-Policy | Presente (camera, mic, geo, payment) |

### nginx.conf (Docker/Dev)

| Header | Status |
|--------|--------|
| Content-Security-Policy | **AUSENTE** |
| Strict-Transport-Security | **AUSENTE** |
| X-Frame-Options | Presente (SAMEORIGIN) |
| X-Content-Type-Options | Presente (nosniff) |
| Referrer-Policy | Presente |
| Permissions-Policy | **AUSENTE** |

---

## Proteção de Arquivos

- `.htaccess` bloqueia `.env`, `.md`, `.ts`, `.tsx`, `.lock`, `.log` via `Require all denied`
- `.env*` gitignored (exceto `.env.docker.example` que contém apenas placeholders)
- `Options -Indexes` — directory listing desativado

---

## Fontes Pesquisadas

- [Microsoft Security Blog — React2Shell](https://www.microsoft.com/en-us/security/blog/2025/12/15/defending-against-the-cve-2025-55182-react2shell-vulnerability-in-react-server-components/)
- [NVD CVE-2025-55182](https://nvd.nist.gov/vuln/detail/CVE-2025-55182)
- [Next.js Security Update Dez/2025](https://nextjs.org/blog/security-update-2025-12-11)
- [Next.js Security Advisory CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478)
- [Socket — velite security analysis](https://socket.dev/npm/package/velite)
- [Cloudflare Rate Limiting Workers GA](https://developers.cloudflare.com/changelog/post/2025-09-19-ratelimit-workers-ga/)
- [Cloudflare Rate Limiting Best Practices](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/)
- [AWS Blog — China-nexus groups exploiting React2Shell](https://aws.amazon.com/blogs/security/china-nexus-cyber-threat-groups-rapidly-exploit-react2shell-vulnerability-cve-2025-55182/)
