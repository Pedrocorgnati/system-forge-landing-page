// ---------------------------------------------------------------------------
// index.ts — Cloudflare Worker para newsletter IT (GDPR double opt-in)
//
// COMP-008: locale=it-IT uses GDPR double opt-in — OBRIGATÓRIO
// Subscriber NUNCA deve ter status "active" sem confirmação por email
// CreatedAt: 2026-03-28 | ReviewAt: 2026-06-28 | Owner: pedro
// ---------------------------------------------------------------------------

import type { WorkerEnv, SubscribeRequest, StoredSubscription, UnsubscribeRequest } from "./types";
import { isOriginAllowed, corsResponse } from "./cors";
import { generateToken, pendingKey, activeKey, unsubscribedKey } from "./token";
import { sendConfirmationEmail, sendWelcomeEmailIT, getConfirmationPage } from "./email";
import { verifyTurnstile } from "./turnstile";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIST_ID = "newsletter-it";

/** HMAC-SHA256 do email com pepper — nunca armazenar email bruto no D1 */
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
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 do IP — nunca armazenar IP bruto (GDPR) */
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Route: POST /subscribe (GDPR double opt-in)
// ---------------------------------------------------------------------------

async function handleSubscribe(
  request: Request,
  env: WorkerEnv,
  origin: string,
): Promise<Response> {
  // 1. Parse JSON
  let body: SubscribeRequest;
  try {
    body = (await request.json()) as SubscribeRequest;
  } catch {
    return corsResponse({ error: "JSON non valido", code: "INVALID_JSON" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const consent = body.consent;
  const source = body.source ?? "unknown";

  // 2. Validate email
  if (!EMAIL_REGEX.test(email)) {
    return corsResponse({ error: "Indirizzo email non valido", code: "INVALID_EMAIL" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  // 3. Validate consent (GDPR obrigatório)
  if (consent !== true) {
    return corsResponse({ error: "Consenso GDPR obbligatorio", code: "CONSENT_REQUIRED" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  // 4. Validate Turnstile
  if (body.turnstileToken) {
    const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    const valid = await verifyTurnstile(
      body.turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      env.TURNSTILE_EXPECTED_HOSTNAME,
      ip,
    );
    if (!valid) {
      return corsResponse({ error: "Verifica di sicurezza fallita", code: "TURNSTILE_FAILED" }, 400, origin, env.ALLOWED_ORIGINS);
    }
  }

  // 5. Check unsubscribed — GDPR não permite re-inscrição automática
  const unsubKey = unsubscribedKey(LIST_ID, email);
  const isUnsubscribed = await env.NEWSLETTER_KV.get(unsubKey);
  if (isUnsubscribed) {
    return corsResponse(
      { status: "already-subscribed", message: "Iscrizione non possibile. Utilizza il modulo di contatto." },
      409,
      origin,
      env.ALLOWED_ORIGINS,
    );
  }

  // 6. Check already active
  const activeK = activeKey(LIST_ID, email);
  const isActive = await env.NEWSLETTER_KV.get(activeK);
  if (isActive) {
    return corsResponse(
      { status: "already-subscribed", message: "Sei già iscritto alla newsletter." },
      409,
      origin,
      env.ALLOWED_ORIGINS,
    );
  }

  // 7. Check pending — se já pending, reenviar com novo token
  // Buscar qualquer pending existente para este email via scan por prefixo não é eficiente;
  // usamos um índice email→token em KV para este caso
  const emailPendingKey = `pending-email:newsletter-it:${email}`;
  const oldToken = await env.NEWSLETTER_KV.get(emailPendingKey);
  if (oldToken) {
    // Invalidar token antigo deletando-o
    await env.NEWSLETTER_KV.delete(pendingKey(oldToken));
  }

  const now = new Date().toISOString();

  // 8. Gerar novo token e salvar pending
  const token = generateToken();
  const pendingData: StoredSubscription = {
    email,
    locale: "it-IT",
    listId: LIST_ID,
    framework: "gdpr",
    status: "pending",
    createdAt: now,
    source,
  };

  // KV write ordering (GDPR critical): primeiro salvar pending, depois enviar email
  await env.NEWSLETTER_KV.put(pendingKey(token), JSON.stringify(pendingData), {
    expirationTtl: 86400, // 24h
  });
  // Índice email→token para reenvio (TTL igual ao token)
  await env.NEWSLETTER_KV.put(emailPendingKey, token, { expirationTtl: 86400 });

  // 9. Enviar email de confirmação (bloqueante — GDPR crítico)
  try {
    await sendConfirmationEmail(env, email, token);
  } catch (err) {
    // Cleanup — não deixar pending sem email enviado
    await env.NEWSLETTER_KV.delete(pendingKey(token));
    await env.NEWSLETTER_KV.delete(emailPendingKey);
    console.error("Confirmation email error:", err);
    return corsResponse(
      { error: "Impossibile inviare l'email di conferma. Riprova." },
      500,
      origin,
      env.ALLOWED_ORIGINS,
    );
  }

  // 10. Registrar em D1_AUDIT (subscribe pending)
  const emailHash = await hmacEmail(email, env.AUDIT_PEPPER);
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const ipHash = ip ? await hashIp(ip) : null;

  try {
    await env.D1_AUDIT.prepare(
      "INSERT INTO audit_events(email_hash, timestamp_utc, ip_hash, user_agent, source_url, action, market, framework) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        emailHash,
        now,
        ipHash,
        request.headers.get("User-Agent") ?? "",
        request.headers.get("Referer") ?? "",
        "subscribe",
        "it",
        "gdpr",
      )
      .run();
  } catch (err) {
    console.error("D1 audit subscribe error:", err);
  }

  const message = oldToken
    ? "Email di conferma reinviato. Controlla la tua casella."
    : "Controlla la tua email per confermare l'iscrizione.";

  return corsResponse(
    { status: "pending", framework: "gdpr", message },
    202,
    origin,
    env.ALLOWED_ORIGINS,
  );
}

// ---------------------------------------------------------------------------
// Route: GET /confirm?token=xxx (GDPR double opt-in confirmation)
// ---------------------------------------------------------------------------

async function handleConfirm(
  request: Request,
  env: WorkerEnv,
): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      JSON.stringify({ error: "Token mancante" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Buscar pending no KV
  const pendingRaw = await env.NEWSLETTER_KV.get(pendingKey(token));
  if (!pendingRaw) {
    return new Response(
      JSON.stringify({ error: "Token di conferma non valido o scaduto. Si prega di iscriversi nuovamente." }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  let pendingData: StoredSubscription;
  try {
    pendingData = JSON.parse(pendingRaw) as StoredSubscription;
  } catch {
    return new Response(
      JSON.stringify({ error: "Dati corrotti" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();
  const email = pendingData.email;

  // KV write ordering (GDPR critical): salvar active ANTES de deletar pending
  const activeData: StoredSubscription = {
    ...pendingData,
    status: "active",
    confirmedAt: now,
  };
  await env.NEWSLETTER_KV.put(activeKey(LIST_ID, email), JSON.stringify(activeData));
  await env.NEWSLETTER_KV.delete(pendingKey(token));
  await env.NEWSLETTER_KV.delete(`pending-email:newsletter-it:${email}`);

  // D1 INSERT OR IGNORE — guard de idempotência
  const emailHash = await hmacEmail(email, env.AUDIT_PEPPER);
  try {
    await env.D1_AUDIT.prepare(
      "INSERT OR IGNORE INTO subscriptions(email_hash, market, status, created_at) VALUES (?, ?, ?, ?)",
    )
      .bind(emailHash, "it", "active", now)
      .run();
  } catch (err) {
    console.error("D1 subscriptions insert error:", err);
  }

  // POST /contacts na Resend
  try {
    await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        audience_id: env.RESEND_AUDIENCE_ID_IT,
        unsubscribed: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("Resend contacts error:", err);
  }

  // Enviar welcome email (non-blocking)
  try {
    await sendWelcomeEmailIT(env, email);
  } catch (err) {
    console.error("Welcome email error (non-blocking):", err);
  }

  // Registrar em D1_AUDIT: confirm
  try {
    await env.D1_AUDIT.prepare(
      "INSERT INTO audit_events(email_hash, timestamp_utc, action, market, framework) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(emailHash, now, "confirm", "it", "gdpr")
      .run();
  } catch (err) {
    console.error("D1 audit confirm error:", err);
  }

  // Retornar HTML de confirmação inline (não redireciona para Next.js — design intencional)
  const html = getConfirmationPage("it-IT");
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ---------------------------------------------------------------------------
// Route: POST /unsubscribe (G003 — GDPR Art. 7 §3)
// ---------------------------------------------------------------------------

async function handleUnsubscribe(
  request: Request,
  env: WorkerEnv,
  origin: string,
): Promise<Response> {
  let body: UnsubscribeRequest;
  try {
    body = (await request.json()) as UnsubscribeRequest;
  } catch {
    return corsResponse({ error: "JSON non valido" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return corsResponse({ error: "Indirizzo email non valido" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  const existingRaw = await env.NEWSLETTER_KV.get(activeKey(LIST_ID, email));
  if (!existingRaw) {
    return corsResponse({ error: "Iscrizione non trovata" }, 404, origin, env.ALLOWED_ORIGINS);
  }

  const now = new Date().toISOString();
  const existing = JSON.parse(existingRaw) as StoredSubscription;
  const updated: StoredSubscription = { ...existing, status: "unsubscribed", unsubscribedAt: now };

  await env.NEWSLETTER_KV.put(activeKey(LIST_ID, email), JSON.stringify(updated));
  await env.NEWSLETTER_KV.put(unsubscribedKey(LIST_ID, email), "1");

  // PATCH /contacts na Resend
  try {
    await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audience_id: env.RESEND_AUDIENCE_ID_IT, unsubscribed: true }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("Resend PATCH error:", err);
  }

  const emailHash = await hmacEmail(email, env.AUDIT_PEPPER);
  try {
    await env.D1_AUDIT.prepare(
      "INSERT INTO audit_events(email_hash, timestamp_utc, action, market, framework) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(emailHash, now, "unsubscribe", "it", "gdpr")
      .run();
  } catch (err) {
    console.error("D1 audit unsubscribe error:", err);
  }

  return corsResponse(
    { success: true, message: "Iscrizione cancellata con successo." },
    200,
    origin,
    env.ALLOWED_ORIGINS,
  );
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const method = request.method.toUpperCase();
    const url = new URL(request.url);

    // CORS preflight
    if (method === "OPTIONS") {
      const isAllowed = isOriginAllowed(origin, env.ALLOWED_ORIGINS);
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": isAllowed ? origin : "",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // CORS check para POST mutativos
    if (method === "POST" && !isOriginAllowed(origin, env.ALLOWED_ORIGINS)) {
      return corsResponse({ error: "Origin non autorizzata" }, 403, origin, env.ALLOWED_ORIGINS);
    }

    // Health check
    if (url.pathname === "/health" && method === "GET") {
      return Response.json({ status: "ok", locale: "it-IT" }, { status: 200 });
    }

    if (url.pathname === "/subscribe" && method === "POST") {
      return handleSubscribe(request, env, origin);
    }

    if (url.pathname === "/confirm" && method === "GET") {
      return handleConfirm(request, env);
    }

    if (url.pathname === "/unsubscribe" && method === "POST") {
      return handleUnsubscribe(request, env, origin);
    }

    return corsResponse({ error: "Not found" }, 404, origin, env.ALLOWED_ORIGINS);
  },
};
