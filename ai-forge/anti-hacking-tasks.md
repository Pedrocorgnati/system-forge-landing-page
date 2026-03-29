# Anti-Hacking Tasks
Data: 2026-03-29

> Gerado por /nextjs:anti-hacking-review
> Relatório completo: ai-forge/anti-hacking-report.md

---

## P1-CRÍTICO (Fix antes do deploy em produção)

### T000a — Proteger Unsubscribe com Token Autenticado
**CVE/Ref:** V009 (Codex — Ataque de sabotagem de lista)
**Arquivos:**
- `workers/worker-br/src/index.ts:213-276`
- `workers/worker-en/src/index.ts` (equivalente)
- `workers/worker-it/src/index.ts` (equivalente)

**Estratégia recomendada (link único por email):**

O Resend já gera links de unsubscribe autenticados em emails. A solução mais simples:
1. No welcome email, incluir link `https://newsletter-{locale}.workers.dev/unsubscribe?token={HMAC_TOKEN}`
2. O worker gera e armazena o HMAC token no KV no momento da inscrição
3. O endpoint `/unsubscribe` exige o token e valida com HMAC

**Código proposto (worker-br):**

```typescript
// No handleSubscribe — gerar e armazenar token de unsubscribe
const unsubToken = await generateUnsubscribeToken(email, env.AUDIT_PEPPER);
const storedConsent: StoredConsent = {
  ...
  unsubscribeToken: unsubToken, // adicionar ao schema
};
// Passar token para sendWelcomeEmailBR para incluir no email

// No handleUnsubscribe — exigir token
async function handleUnsubscribe(request: Request, ...) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? body.token;

  if (!token) {
    return corsResponse({ error: "Token obrigatório" }, 400, ...);
  }

  // Validar token HMAC
  const expectedToken = await generateUnsubscribeToken(email, env.AUDIT_PEPPER);
  if (token !== expectedToken) {
    return corsResponse({ error: "Token inválido ou expirado" }, 403, ...);
  }
  // Prosseguir com unsubscribe...
}

// Helper
async function generateUnsubscribeToken(email: string, pepper: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`unsub:${email.toLowerCase()}`));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}
```

**Impacto do fix:** Elimina sabotagem arbitrária de lista.
**Dependência:** Link de unsubscribe deve ser incluído nos emails de boas-vindas dos 3 workers.
**Teste:** POST /unsubscribe sem token → 400. Com token errado → 403. Com token correto → 200.
**Estimativa:** 3-4h (3 workers + emails)

---

### T000b — Normalizar Respostas para Evitar Enumeração de Email
**CVE/Ref:** V010 (Codex — Email enumeration)
**Arquivos:**
- `workers/worker-br/src/index.ts` (unsubscribe:213-276)

**Fix mínimo (unsubscribe — elimina 404 revelador):**
```typescript
// Antes (vulnerável):
if (!existingRaw) {
  return corsResponse({ error: "Inscrição não encontrada" }, 404, ...)
}

// Depois (seguro — resposta indistinguível):
if (!existingRaw) {
  // Retornar 200 silenciosamente — não revelar que email não existe
  return corsResponse({ success: true, message: "Inscrição cancelada com sucesso." }, 200, ...)
}
```

**Nota sobre subscribe 409:** Manter 409 para `already-subscribed` é aceitável do ponto de vista de UX (evita formulário duplo). O risco é baixo pois requer que o atacante já conheça o email.

**Impacto do fix:** Elimina confirmação binária de existência de email via unsubscribe.
**Estimativa:** 30min (3 workers)

---

## P2-ALTO (Fix em 1 semana)

### T001 — Integrar Widget Turnstile + Tornar Obrigatório nos Workers
> ⚠️ Codex confirmou: tornar obrigatório antes de integrar o widget causa regressão 100%.
> **Ordem obrigatória: (a) integrar widget → (b) tornar obrigatório nos workers**

#### T001a — Integrar Widget Cloudflare Turnstile no Frontend
**Arquivo:** `src/components/ui/NewsletterOptIn.tsx`

```bash
npm install @marsidev/react-turnstile
# ou usar o widget nativo sem biblioteca
```

```typescript
// Adicionar ao formulário
import { Turnstile } from '@marsidev/react-turnstile'

const [turnstileToken, setTurnstileToken] = useState('')

// No formulário, antes do botão:
<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
  onSuccess={setTurnstileToken}
/>

// No payload enviado ao worker:
const result = await subscribeNewsletter({
  email: formData.email,
  consent: requiresCheckbox ? formData.consent : true,
  website: formData.website,
  turnstileToken, // NOVO
})
```

#### T001b — Tornar Token Obrigatório nos Workers (após T001a)

### T001b — Tornar Turnstile Obrigatório nos 3 Workers *(executar após T001a)*
**CVE/Ref:** V001 (Attack Chain 1)
**Arquivos:**
- `workers/worker-br/src/index.ts:91`
- `workers/worker-en/src/index.ts:79`
- `workers/worker-it/src/index.ts:79`

**Código atual (vulnerável):**
```typescript
if (body.turnstileToken) {
  const valid = await verifyTurnstile(...)
  if (!valid) return corsResponse(..., 400, ...)
}
// Sem token = sem verificação
```

**Código proposto (seguro):**
```typescript
// Tornar obrigatório — rejeitar se token ausente
if (!body.turnstileToken) {
  return corsResponse(
    { error: "Verificação de segurança obrigatória", code: "TURNSTILE_REQUIRED" },
    400,
    origin,
    env.ALLOWED_ORIGINS,
  );
}
const valid = await verifyTurnstile(
  body.turnstileToken,
  env.TURNSTILE_SECRET_KEY,
  env.TURNSTILE_EXPECTED_HOSTNAME,
  request.headers.get("CF-Connecting-IP") ?? undefined,
);
if (!valid) {
  return corsResponse(
    { error: "Verificação de segurança falhou", code: "TURNSTILE_FAILED" },
    400,
    origin,
    env.ALLOWED_ORIGINS,
  );
}
```

**Impacto do fix:** Remove bypass completo do anti-bot.
**Dependência:** O formulário `NewsletterOptIn.tsx` deve enviar o token sempre. Verificar se Turnstile widget está integrado no frontend — se não estiver, integrar antes de tornar obrigatório.
**Teste:** Enviar POST sem `turnstileToken` → deve retornar 400. Enviar com token inválido → deve retornar 400. Enviar com token válido → deve retornar 201/202.
**Estimativa:** 1-2h por worker (3 workers = 3-6h)

---

### T002 — Implementar Rate Limiting por IP nos Workers
**Ref:** V002
> ⚠️ Codex alerta: limitação só por IP pode causar falso bloqueio em NAT/proxy. Implementar com fallback seguro para `CF-Connecting-IP` ausente.
**Arquivos:**
- `workers/worker-br/src/index.ts`
- `workers/worker-en/src/index.ts`
- `workers/worker-it/src/index.ts`

**Código proposto (com fallback seguro para IP ausente):**
```typescript
// Adicionar ao início do handleSubscribe, antes de qualquer processamento
const rawIp = request.headers.get("CF-Connecting-IP");
// Se IP ausente (não-Cloudflare), não aplicar rate limit por IP
// (evita auto-DoS: todos cairiam na chave "unknown")
if (rawIp) {
  const ipHash = await hashIp(rawIp);
  const rateLimitKey = `ratelimit:subscribe:${ipHash}`;
  const attempts = await env.NEWSLETTER_KV.get(rateLimitKey);
  const MAX_ATTEMPTS = 5; // conservador para evitar bloquear NAT/proxy legítimo

  if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
    return corsResponse(
      { error: "Muitas tentativas. Tente novamente em 1 hora.", code: "RATE_LIMITED" },
      429,
      origin,
      env.ALLOWED_ORIGINS,
    );
  }

  const newCount = attempts ? parseInt(attempts) + 1 : 1;
  await env.NEWSLETTER_KV.put(rateLimitKey, String(newCount), { expirationTtl: 3600 });
}
```

**Alternativa superior (Cloudflare Workers Rate Limiting API — GA desde Set/2025):**
```typescript
// wrangler.toml — adicionar binding nativo
[[unsafe.bindings]]
name = "RATE_LIMITER"
type = "ratelimit"
namespace_id = "1"
simple = { limit = 5, period = 3600 }

// index.ts — usar binding nativo (mais confiável que KV)
const { success } = await env.RATE_LIMITER.limit({ key: rawIp ?? "no-ip" });
if (!success) {
  return corsResponse({ error: "Rate limit excedido", code: "RATE_LIMITED" }, 429, ...);
}
```

**Impacto do fix:** Limita flood a 5 tentativas/IP/hora via API nativa Cloudflare (sem KV eventual consistency).
**Teste:** 6 requests do mesmo IP → 6ª retorna 429. Requests sem CF-Connecting-IP → bloqueados juntos na chave "no-ip" (aceitável como fallback).
**Estimativa:** 1h por worker (com binding nativo)

---

## P3-MÉDIO (Próximo sprint)

### T003 — Verificar Honeypot Server-Side nos Workers
**Ref:** V004
**Arquivos:**
- `workers/worker-br/src/index.ts` (após validação de consent, antes de Turnstile)
- `workers/worker-en/src/index.ts`
- `workers/worker-it/src/index.ts`

**Código proposto:**
```typescript
// Verificar honeypot server-side
const honeyPot = (body.website ?? "").trim();
if (honeyPot !== "") {
  // Silently succeed — não revelar ao bot que foi detectado
  return corsResponse(
    { success: true, message: "Inscrição realizada com sucesso!" },
    201,
    origin,
    env.ALLOWED_ORIGINS,
  );
}
```

**Impacto do fix:** Bloqueia bots que preenchem o honeypot via requests diretos.
**Estimativa:** 30min por worker

---

### T004 — Adicionar CSP sem `unsafe-eval` (longo prazo)
**Ref:** V003
**Arquivo:** `scripts/generate-htaccess.ts`

**Estratégia:**
1. Investigar se o Next.js 16 static export ainda requer `unsafe-eval`
2. Se sim, avaliar migração de `MDXContent` para alternativa sem `new Function()`
3. Se possível, usar nonces CSP em vez de `unsafe-inline`

**Nota:** Esta é uma mudança significativa na arquitetura de conteúdo. Avaliar custo vs benefício.
**Estimativa:** 4-8h (investigação + implementação)

---

### T005 — Mover GA4 Init para Script Externo
**Ref:** V005
**Arquivo:** `src/components/analytics/GoogleAnalytics.tsx`

**Proposta:**
```typescript
// Em vez de dangerouslySetInnerHTML, usar um arquivo externo gerado no build
// que seja servido como /scripts/gtag-init.js com o measurement ID baked in
// ou usar nonce CSP
```

**Estimativa:** 2-3h

---

## P4-BAIXO (Backlog)

### T006 — Completar Headers de Segurança no nginx.conf
**Ref:** V006
**Arquivo:** `nginx.conf`

**Fix:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; frame-ancestors 'none';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
```

**Estimativa:** 15min

---

### T007 — Mudar X-Frame-Options para DENY
**Ref:** V007
**Arquivos:** `nginx.conf:8`, `scripts/generate-htaccess.ts:153`

**Fix:**
```
X-Frame-Options: DENY
```

**Nota:** Verificar se alguma página precisa ser embeddável no mesmo domínio (improvável para landing page).
**Estimativa:** 5min

---

### T008 — Remover `revalidate` das Feed Routes
**Ref:** V008
**Arquivos:** `src/app/blog/feed.xml/route.ts:12`, `src/app/blog/feed.json/route.ts:12`

**Fix:** Remover ou comentar `export const revalidate = 3600` pois é ignorado em `output: 'export'` e pode causar confusão.
**Estimativa:** 5min
