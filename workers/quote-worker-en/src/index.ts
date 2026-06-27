// ---------------------------------------------------------------------------
// index.ts — Cloudflare Worker de leads de orcamento (quote-worker) por locale
//
// POST /lead recebe o payload do quote-wizard, valida campo a campo, deriva
// projectType a partir de serviceId (id cru NUNCA chega ao D1), normaliza,
// persiste de forma idempotente em D1 (INSERT OR IGNORE) armazenando o email
// SOMENTE como HMAC-SHA256, e responde com contrato JSON determinista.
//
// src/ e IDENTICO entre quote-worker-{br,it,en,es}; locale/market vem de env.
//
// Escopo 005: skeleton + payload + persistencia idempotente + email so HMAC.
// FORA de 005 (seams documentados):
//   - Item 006: anti-abuso fail-closed (Turnstile obrigatorio, honeypot,
//     rate-limit por IP). Em 005 Turnstile e best-effort e website e so aceito.
//   - Item 007: double opt-in (202 + GET /confirm?token) + sync s2s. Em 005 o
//     lead fica status='pending' e nenhum email e enviado.
// ---------------------------------------------------------------------------

import type { WorkerEnv, LeadRequest, ProjectType } from "./types";
import { isOriginAllowed, corsResponse } from "./cors";
import { verifyTurnstile } from "./turnstile";
import { sendConfirmationEmail } from "./email";
import {
  signConfirmToken,
  verifyConfirmToken,
  type ConfirmTokenPayload,
} from "./confirm-token";
import { syncToDashboard } from "./sync";
import { killSwitchBlocks, reconcileWindow, reconciliationKey } from "./reconciliation";

// TTL do token de confirmacao em horas. Fallback 48 quando ausente/invalido.
const DEFAULT_CONFIRM_TTL_HOURS = 48;
function parseTtlHours(raw: string | undefined): number {
  const n = Number.parseInt((raw ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CONFIRM_TTL_HOURS;
}

// ---------------------------------------------------------------------------
// Constantes de validacao
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Anti-drift task-008 (G-P2-10): regex canonico do dashboard
// (internalQuoteIngestSchema.whatsapp) e do quoteWizardSchema do form. Aceita
// `+`/digito inicial seguido de digitos/espaco/().- ; comprimento exato 8..20
// validado explicitamente (o regex sozinho admite 7). Nem mais frouxo nem mais
// estrito que o dashboard -> zero 400 espurio em borda (NG6).
const WHATSAPP_REGEX = /^[+\d][\d\s().-]{6,19}$/;
const BRAND_REGEX = /^[a-z0-9-]{1,64}$/;

// Enum de budget — inclui legacy `under5k` por compat de dados (blueprint).
const BUDGET_RANGES = new Set<string>([
  "under1k",
  "1k-5k",
  "5k-15k",
  "15k-50k",
  "50k-plus",
  "not-sure",
  "under5k", // legacy
]);

// Anti-drift task-008 (G-P2-10): enum FECHADO de timeline, identico ao
// dashboard (internalQuoteIngestSchema.timeline) e ao TIMELINES do
// quoteWizardSchema do form. Fecha o mismatch worker-frouxo (string <=40)
// vs dashboard-estrito (enum) que gerava 400 em borda. O form ja so emite
// estes 5 valores, entao nenhum payload legitimo em transito e rejeitado (NG6).
const TIMELINES = new Set<string>([
  "asap",
  "1-3months",
  "3-6months",
  "6-plus",
  "flexible",
]);

// Mapa por id (NUNCA por indice). serviceId fora do mapa -> 400 INVALID_SERVICE.
const SERVICE_ID_TO_TYPE: Record<string, ProjectType> = {
  "landing-page": "web",
  "web-app": "web",
  "mobile-app": "mobile",
  "e-commerce": "web",
  "api-backend": "ai",
  "contrato-pj": "other",
  "sistema-gestao": "web",
  "chatbots-ia": "ai",
  "other": "other",
};

// ---------------------------------------------------------------------------
// Helpers de hashing — email cru NUNCA em D1 nem em log
// ---------------------------------------------------------------------------

/** HMAC-SHA256(email, pepper) em hex. */
async function hmacEmail(email: string, pepper: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.toLowerCase()));
  return toHex(new Uint8Array(sig));
}

/** SHA-256(input) em hex — usado para a chave de dedup lead_hash. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Normalizacao
// ---------------------------------------------------------------------------

/** fold: trim + colapsa espacos/quebras multiplas em 1 espaco. */
function foldText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Route: POST /lead
// ---------------------------------------------------------------------------

async function handleLead(
  request: Request,
  env: WorkerEnv,
  origin: string,
): Promise<Response> {
  const ao = env.ALLOWED_ORIGINS;

  // 0. Kill-switch global (Item 008) — ANTES de qualquer processamento
  //    (parse/validacao/Turnstile). Fail-open de disponibilidade: var ausente
  //    OU == "true" mantem o submit habilitado (comportamento atual preservado);
  //    qualquer outro valor explicito (ex.: "false") desliga o endpoint.
  //    A leitura efetiva e sempre registrada em log estruturado.
  const killSwitch = env.SUBMIT_ENABLED;
  console.log("kill switch", { code: "KILL_SWITCH", kill_switch: killSwitch ?? "(unset)", market: env.MARKET });
  if (killSwitchBlocks(killSwitch)) {
    return corsResponse(
      { error: "Submissoes temporariamente desabilitadas.", code: "SUBMIT_DISABLED" },
      503, origin, ao,
    );
  }

  // 1. Parse JSON
  let body: LeadRequest;
  try {
    body = (await request.json()) as LeadRequest;
  } catch {
    return corsResponse({ error: "Corpo JSON invalido.", code: "INVALID_JSON" }, 400, origin, ao);
  }

  // 2. Config — falhar-cedo se o pepper estiver ausente (nao silenciar)
  if (!env.AUDIT_PEPPER) {
    console.error("CONFIG_ERROR: AUDIT_PEPPER ausente", { code: "CONFIG_ERROR", market: env.MARKET });
    return corsResponse({ error: "Erro de configuracao do servico.", code: "CONFIG_ERROR" }, 500, origin, ao);
  }

  // IP da edge — Cloudflare injeta CF-Connecting-IP em runtime. Usado pelo
  // rate-limit (chave) e pelo Turnstile (remoteip).
  const ip = request.headers.get("CF-Connecting-IP") ?? undefined;

  // 2b. Rate-limit por IP (binding nativo [[ratelimit]] — store serverless-safe).
  //     Gate mais barato primeiro: poupa o siteverify do Turnstile sob abuso.
  //     FAIL-OPEN deliberado (distinto do Turnstile): binding ausente/erro OU IP
  //     ausente NAO bloqueia — rate-limit protege disponibilidade e sua
  //     indisponibilidade nao pode derrubar o fluxo legitimo. O caminho de aceite
  //     "6o POST em 60s -> 429" usa o binding provisionado + CF-Connecting-IP
  //     presente (sempre injetado pela edge em producao). Workers sao stateless
  //     entre isolates (licao do Item 004): contador em memoria NAO conta
  //     cross-isolate, por isso o binding nativo.
  if (env.RATE_LIMITER && ip) {
    try {
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) {
        return corsResponse(
          { error: "Muitas requisicoes. Tente novamente em instantes.", code: "RATE_LIMITED" },
          429, origin, ao,
        );
      }
    } catch {
      console.log("rate-limit indisponivel (fail-open)", { code: "RATE_LIMIT_UNAVAILABLE", market: env.MARKET });
    }
  } else {
    console.log("rate-limit indisponivel (fail-open)", { code: "RATE_LIMIT_UNAVAILABLE", market: env.MARKET });
  }

  // 2c. Honeypot server-side (campo `website`, oculto no form). Bot preenche.
  //     Anti-sinalizacao: descarta o lead SEM persistir e responde decoy 202 com
  //     a MESMA forma do novo happy-path (Item 007: sucesso real virou 202), para
  //     nao revelar a deteccao ao atacante.
  //     (202 decoy != persistencia: nenhuma linha entra em quote_leads.)
  if ((body.website ?? "").trim().length > 0) {
    console.log("honeypot acionado", { code: "HONEYPOT_HIT", market: env.MARKET });
    return corsResponse({ success: true, status: "pending" }, 202, origin, ao);
  }

  // 2d. Turnstile FAIL-CLOSED (Item 006 — substitui o best-effort do 005).
  //     token ausente/vazio -> 400; secret ausente -> 500 (sem secret nao da para
  //     verificar identidade; espelha o tratamento de AUDIT_PEPPER); verificacao
  //     falha (token invalido / hostname divergente / timeout) -> 403.
  const turnstileToken = (body.turnstileToken ?? "").trim();
  if (turnstileToken.length === 0) {
    return corsResponse(
      { error: "Verificacao anti-bot obrigatoria.", code: "TURNSTILE_REQUIRED" },
      400, origin, ao,
    );
  }
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error("CONFIG_ERROR: TURNSTILE_SECRET_KEY ausente", { code: "CONFIG_ERROR", market: env.MARKET });
    return corsResponse({ error: "Erro de configuracao do servico.", code: "CONFIG_ERROR" }, 500, origin, ao);
  }
  {
    const ok = await verifyTurnstile(
      turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      env.TURNSTILE_EXPECTED_HOSTNAME,
      ip,
    );
    if (!ok) {
      return corsResponse(
        { error: "Verificacao anti-bot falhou.", code: "TURNSTILE_FAILED" },
        403, origin, ao,
      );
    }
  }

  // 3. Validacao campo a campo, na ordem da tabela. Primeiro erro retorna.

  // serviceId -> deriva projectType (id cru nao vaza)
  const serviceId = (body.serviceId ?? "").trim().toLowerCase();
  const projectType = SERVICE_ID_TO_TYPE[serviceId];
  if (!projectType) {
    return corsResponse({ error: "Servico desconhecido.", code: "INVALID_SERVICE" }, 400, origin, ao);
  }

  // description (20..2000 apos fold)
  const description = foldText(body.description ?? "");
  if (description.length < 20 || description.length > 2000) {
    return corsResponse(
      { error: "Descricao deve ter entre 20 e 2000 caracteres.", code: "INVALID_DESCRIPTION" },
      400, origin, ao,
    );
  }

  // budgetRange (enum)
  const budgetRange = (body.budgetRange ?? "").trim();
  if (!BUDGET_RANGES.has(budgetRange)) {
    return corsResponse(
      { error: "Faixa de orcamento invalida.", code: "INVALID_DETAILS" },
      400, origin, ao,
    );
  }

  // timeline (enum fechado, identico ao dashboard — anti-drift task-008 G-P2-10)
  const timeline = (body.timeline ?? "").trim();
  if (!TIMELINES.has(timeline)) {
    return corsResponse(
      { error: "Prazo invalido.", code: "INVALID_DETAILS" },
      400, origin, ao,
    );
  }

  // name (>= 2)
  const name = (body.name ?? "").trim();
  if (name.length < 2) {
    return corsResponse({ error: "Nome invalido.", code: "INVALID_CONTACT" }, 400, origin, ao);
  }

  // email (regex)
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return corsResponse({ error: "Email invalido.", code: "INVALID_EMAIL" }, 400, origin, ao);
  }

  // whatsapp (8..20 + regex canonico do dashboard — anti-drift task-008 G-P2-10)
  const whatsapp = (body.whatsapp ?? "").trim();
  if (whatsapp.length < 8 || whatsapp.length > 20 || !WHATSAPP_REGEX.test(whatsapp)) {
    return corsResponse({ error: "WhatsApp invalido.", code: "INVALID_CONTACT" }, 400, origin, ao);
  }

  // consent (=== true)
  if (body.consent !== true) {
    return corsResponse({ error: "Consentimento obrigatorio.", code: "CONSENT_REQUIRED" }, 400, origin, ao);
  }

  // locale (== SITE_LOCALE)
  const locale = (body.locale ?? "").trim();
  if (locale !== env.SITE_LOCALE) {
    return corsResponse({ error: "Locale invalido para este endpoint.", code: "INVALID_LOCALE" }, 400, origin, ao);
  }

  // referralSource (opcional)
  const referralSource = body.referralSource ? body.referralSource.trim() : null;

  // brand (opcional, saneado; invalido -> null)
  let brand: string | null = null;
  if (body.brand) {
    const candidate = body.brand.trim().toLowerCase();
    brand = BRAND_REGEX.test(candidate) ? candidate : null;
  }

  // 4. Turnstile ja foi verificado fail-closed no passo 2d (Item 006), antes da
  //    validacao campo a campo. So chega aqui quem passou no anti-abuso.

  // 5. Hashes — email cru NUNCA persiste nem entra em log
  const emailHmac = await hmacEmail(email, env.AUDIT_PEPPER);
  const leadHash = await sha256Hex(`${emailHmac}:${projectType}:${budgetRange}:${timeline}`);

  const now = new Date().toISOString();

  // 6. INSERT OR IGNORE — idempotencia por conteudo (UNIQUE(lead_hash, market))
  try {
    const result = await env.D1_LEADS.prepare(
      `INSERT OR IGNORE INTO quote_leads
         (lead_hash, email_hmac, name, whatsapp, project_type, description,
          budget_range, timeline, referral_source, locale, brand, status,
          market, consent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        leadHash, emailHmac, name, whatsapp, projectType, description,
        budgetRange, timeline, referralSource, locale, brand, "pending",
        env.MARKET, now, now,
      )
      .run();

    if (result.meta.changes === 0) {
      // Mesmo lead_hash ja existe -> reenvio absorvido como already-received.
      return corsResponse({ success: true, status: "already-received" }, 200, origin, ao);
    }
  } catch (err) {
    console.error("D1 INSERT error (sem PII):", { code: "D1_ERROR", lead_hash: leadHash, market: env.MARKET, err: String(err) });
    return corsResponse({ error: "Servico temporariamente indisponivel. Tente novamente." }, 503, origin, ao);
  }

  // 7. Lead novo persistido (status='pending'). Double opt-in (Item 007):
  //    gerar token de confirmacao stateless carregando a PII crua (disponivel
  //    so aqui), enviar o email de confirmacao (non-blocking) e responder 202.
  //    O lead so chega ao dashboard APOS o usuario clicar no link (/confirm).
  if (!env.CONFIRM_TOKEN_SECRET) {
    console.error("CONFIG_ERROR: CONFIRM_TOKEN_SECRET ausente", { code: "CONFIG_ERROR", market: env.MARKET });
    return corsResponse({ error: "Erro de configuracao do servico.", code: "CONFIG_ERROR" }, 500, origin, ao);
  }

  const nowEpochS = Math.floor(Date.now() / 1000);
  const ttlHours = parseTtlHours(env.CONFIRM_TOKEN_TTL_HOURS);
  const tokenPayload: ConfirmTokenPayload = {
    v: 1,
    market: env.MARKET,
    origin: env.INGEST_ORIGIN,
    language: env.SITE_LOCALE,
    lead_hash: leadHash,
    name,
    email,
    whatsapp,
    projectType,
    description,
    budgetRange,
    timeline,
    features: [], // wizard (Item 014) popula; vazio por ora
    referralSource,
    iat: nowEpochS,
    exp: nowEpochS + ttlHours * 3600,
  };

  const confirmToken = await signConfirmToken(tokenPayload, env.CONFIRM_TOKEN_SECRET);
  const confirmUrl = `https://${env.WORKER_DOMAIN}/confirm?token=${confirmToken}`;

  // Non-blocking: falha de email NAO derruba a resposta. O lead pending fica
  // registrado; reenvio do form regenera o link. Erro logado sem PII.
  try {
    await sendConfirmationEmail(env, email, confirmUrl);
  } catch (e) {
    console.error({ code: "EMAIL_SEND_FAILED", market: env.MARKET, err: String(e) });
  }

  console.log("lead novo persistido (pending, aguardando confirmacao)", { lead_hash: leadHash, email_hmac: emailHmac, market: env.MARKET, status: "pending" });
  return corsResponse({ success: true, status: "pending" }, 202, origin, ao);
}

// ---------------------------------------------------------------------------
// Route: GET /confirm?token — double opt-in + sync server-to-server (Item 007)
// ---------------------------------------------------------------------------

type ConfirmState = "ok" | "expired" | "invalid" | "retry";

interface ConfirmStateCopy {
  title: string;
  message: string;
}

const CONFIRM_PAGE_COPY: Record<string, Record<ConfirmState, ConfirmStateCopy>> = {
  "pt-BR": {
    ok: { title: "Pedido confirmado", message: "Recebemos seu pedido de orcamento. Em breve nossa equipe entra em contato." },
    expired: { title: "Link expirado", message: "Este link de confirmacao expirou ou nao e mais valido. Envie o formulario novamente." },
    invalid: { title: "Link invalido", message: "Este link de confirmacao e invalido. Envie o formulario novamente." },
    retry: { title: "Tente novamente", message: "Nao foi possivel concluir agora. Reabra este link em instantes para tentar de novo." },
  },
  "it-IT": {
    ok: { title: "Richiesta confermata", message: "Abbiamo ricevuto la tua richiesta di preventivo. Il nostro team ti contattera a breve." },
    expired: { title: "Link scaduto", message: "Questo link di conferma e scaduto o non e piu valido. Invia di nuovo il modulo." },
    invalid: { title: "Link non valido", message: "Questo link di conferma non e valido. Invia di nuovo il modulo." },
    retry: { title: "Riprova", message: "Non e stato possibile completare ora. Riapri questo link tra poco per riprovare." },
  },
  en: {
    ok: { title: "Request confirmed", message: "We received your quote request. Our team will be in touch shortly." },
    expired: { title: "Link expired", message: "This confirmation link has expired or is no longer valid. Please submit the form again." },
    invalid: { title: "Invalid link", message: "This confirmation link is invalid. Please submit the form again." },
    retry: { title: "Please try again", message: "We could not finish right now. Reopen this link in a moment to try again." },
  },
  "es-ES": {
    ok: { title: "Solicitud confirmada", message: "Hemos recibido tu solicitud de presupuesto. Nuestro equipo se pondra en contacto pronto." },
    expired: { title: "Enlace caducado", message: "Este enlace de confirmacion ha caducado o ya no es valido. Envia el formulario de nuevo." },
    invalid: { title: "Enlace no valido", message: "Este enlace de confirmacion no es valido. Envia el formulario de nuevo." },
    retry: { title: "Intentalo de nuevo", message: "No pudimos completar ahora. Vuelve a abrir este enlace en un momento para reintentar." },
  },
};

function confirmHtml(env: WorkerEnv, state: ConfirmState, status: number): Response {
  const byLocale = CONFIRM_PAGE_COPY[env.SITE_LOCALE] ?? CONFIRM_PAGE_COPY.en;
  const copy = byLocale[state];
  const lang = (CONFIRM_PAGE_COPY[env.SITE_LOCALE] ? env.SITE_LOCALE : "en");
  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${copy.title}</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0b0e14;color:#e6e9ef;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;">
  <main style="max-width:440px;text-align:center;background:#141925;border-radius:12px;padding:40px 32px;">
    <h1 style="font-size:22px;margin:0 0 12px;color:#ffffff;">${copy.title}</h1>
    <p style="font-size:15px;line-height:1.6;color:#c7ced9;margin:0;">${copy.message}</p>
  </main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handleConfirm(request: Request, env: WorkerEnv): Promise<Response> {
  // Config fail-closed: sem o secret nao da para verificar o token.
  if (!env.CONFIRM_TOKEN_SECRET) {
    console.error("CONFIG_ERROR: CONFIRM_TOKEN_SECRET ausente", { code: "CONFIG_ERROR", market: env.MARKET });
    return confirmHtml(env, "retry", 500);
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return confirmHtml(env, "invalid", 400);
  }

  const payload = await verifyConfirmToken(token, env.CONFIRM_TOKEN_SECRET, Math.floor(Date.now() / 1000));
  if (!payload) {
    return confirmHtml(env, "expired", 410);
  }

  // Token de outro market nesta edge -> invalido.
  if (payload.market !== env.MARKET) {
    return confirmHtml(env, "invalid", 400);
  }

  // Localizar a linha persistida no submit.
  let currentStatus: string | null;
  try {
    const row = await env.D1_LEADS.prepare(
      `SELECT status FROM quote_leads WHERE lead_hash = ? AND market = ?`,
    )
      .bind(payload.lead_hash, env.MARKET)
      .first<{ status: string }>();
    currentStatus = row ? row.status : null;
  } catch (err) {
    console.error({ code: "D1_ERROR", market: env.MARKET, lead_hash: payload.lead_hash, err: String(err) });
    return confirmHtml(env, "retry", 502);
  }

  if (currentStatus === null) {
    // Pending sumiu/expirou.
    return confirmHtml(env, "expired", 410);
  }
  if (currentStatus === "synced") {
    // Idempotente: ja confirmado e sincronizado, NAO reenvia.
    return confirmHtml(env, "ok", 200);
  }

  // status in ("pending","confirmed") -> seguir para sync.
  const nowIso = new Date().toISOString();
  try {
    await env.D1_LEADS.prepare(
      `UPDATE quote_leads SET status = 'confirmed', confirmed_at = ?
         WHERE lead_hash = ? AND market = ? AND status = 'pending'`,
    )
      .bind(nowIso, payload.lead_hash, env.MARKET)
      .run();
  } catch (err) {
    console.error({ code: "D1_ERROR", market: env.MARKET, lead_hash: payload.lead_hash, err: String(err) });
    return confirmHtml(env, "retry", 502);
  }

  const res = await syncToDashboard(env, payload);
  const idempotencyKey = reconciliationKey(env.MARKET, payload.lead_hash);

  let response: Response;
  if (res.ok) {
    try {
      await env.D1_LEADS.prepare(
        `UPDATE quote_leads SET status = 'synced', synced_at = ?
           WHERE lead_hash = ? AND market = ?`,
      )
        .bind(new Date().toISOString(), payload.lead_hash, env.MARKET)
        .run();
    } catch (err) {
      // Sync deu certo no dashboard; falha so na transicao local de status.
      // Idempotente: reabrir o link reconcilia. Logar sem PII.
      console.error({ code: "D1_ERROR", market: env.MARKET, lead_hash: payload.lead_hash, err: String(err) });
    }
    console.log({ code: "LEAD_SYNCED", market: env.MARKET, lead_hash: payload.lead_hash, duplicate: res.duplicate });
    response = confirmHtml(env, "ok", 200);
  } else {
    // Sync falhou: manter 'confirmed' (nao 'synced'). Usuario pode reabrir o link.
    // Alerta per-request (Item 008): lead persistido na edge que NAO chegou ao
    // dashboard. Sempre acionavel (recuperavel pela Idempotency-Key),
    // independentemente do agregado.
    console.error({ metric: "lead_reconciliation_event", code: "RECONCILIATION_DIVERGENCE", level: "error", scope: "per_request", market: env.MARKET, idempotency_key: idempotencyKey, lead_hash: payload.lead_hash, upstream: res.status });
    console.error({ code: "SYNC_FAILED", market: env.MARKET, lead_hash: payload.lead_hash, upstream: res.status });
    response = confirmHtml(env, "retry", 502);
  }

  // Reconciliacao agregada da janela (Item 008) — observabilidade, non-blocking
  // (nunca lanca; leitura indisponivel -> reconciliation_error + janela unknown).
  await reconcileWindow(env);

  return response;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    const ao = env.ALLOWED_ORIGINS;

    // CORS preflight
    if (method === "OPTIONS") {
      const headers = {
        "Access-Control-Allow-Origin": isOriginAllowed(origin, ao) ? origin : "",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      };
      return new Response(null, { status: 204, headers });
    }

    // Health check (sem CORS), igual worker-br
    if (url.pathname === "/health" && method === "GET") {
      return Response.json({ status: "ok", locale: env.SITE_LOCALE }, { status: 200 });
    }

    // Double opt-in (Item 007): GET /confirm?token e navegacao do browser do
    // proprio usuario via link do email. Sem CORS check (nao e XHR cross-origin)
    // e resposta HTML, nao JSON.
    if (url.pathname === "/confirm" && method === "GET") {
      return handleConfirm(request, env);
    }

    // CORS check para endpoint mutativo
    if (method === "POST" && !isOriginAllowed(origin, ao)) {
      return corsResponse({ error: "Origin nao autorizada.", code: "ORIGIN_FORBIDDEN" }, 403, origin, ao);
    }

    if (url.pathname === "/lead" && method === "POST") {
      return handleLead(request, env, origin);
    }

    // Qualquer outro metodo em rota conhecida -> 405; demais -> 404.
    if (url.pathname === "/lead") {
      return corsResponse({ error: "Metodo nao permitido.", code: "METHOD_NOT_ALLOWED" }, 405, origin, ao);
    }

    return corsResponse({ error: "Nao encontrado.", code: "NOT_FOUND" }, 404, origin, ao);
  },
};
