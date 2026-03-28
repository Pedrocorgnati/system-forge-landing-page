// ---------------------------------------------------------------------------
// index.ts — Cloudflare Worker para newsletter BR (LGPD)
//
// GDPR-EXCEPTION: locale=pt-BR uses single opt-in (LGPD, not GDPR)
// Reason: Brazilian market regulated by LGPD (Lei 13.709/2018), not EU GDPR
// COMP-008-EXCEPTION: BR uses single opt-in — LGPD allows direct subscription
// with explicit consent capture (consentedAt, locale, source OBRIGATÓRIOS)
// CreatedAt: 2026-03-28 | ReviewAt: 2026-06-28 | Owner: pedro
// ---------------------------------------------------------------------------

import type { WorkerEnv, SubscribeRequest, StoredConsent, UnsubscribeRequest } from "./types";
import { isOriginAllowed, corsResponse } from "./cors";
import { sendWelcomeEmailBR } from "./email";
import { verifyTurnstile } from "./turnstile";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function kvActiveKey(email: string): string {
  return `active:newsletter-br:${email.toLowerCase()}`;
}

function kvUnsubscribedKey(email: string): string {
  return `unsubscribed:newsletter-br:${email.toLowerCase()}`;
}

function kvSuppressedKey(email: string): string {
  return `suppressed:newsletter-br:${email.toLowerCase()}`;
}

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

/** SHA-256 do IP — nunca armazenar IP bruto (LGPD) */
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Route: POST /subscribe
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
    return corsResponse({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const consent = body.consent;
  const source = body.source ?? "unknown";

  // 2. Validate email
  if (!EMAIL_REGEX.test(email)) {
    return corsResponse({ error: "Email inválido", code: "INVALID_EMAIL" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  // 3. Validate consent (LGPD obrigatório)
  if (consent !== true) {
    return corsResponse({ error: "Consentimento LGPD obrigatório", code: "CONSENT_REQUIRED" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  // 4. Validate Turnstile (se token presente)
  if (body.turnstileToken) {
    const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    const valid = await verifyTurnstile(
      body.turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      env.TURNSTILE_EXPECTED_HOSTNAME,
      ip,
    );
    if (!valid) {
      return corsResponse({ error: "Verificação de segurança falhou", code: "TURNSTILE_FAILED" }, 400, origin, env.ALLOWED_ORIGINS);
    }
  }

  // 5. Check suppressed (bounce/complaint) — retornar 201 silenciosamente
  const suppressed = await env.NEWSLETTER_KV.get(kvSuppressedKey(email));
  if (suppressed) {
    // Silently succeed — não adicionar à lista
    return corsResponse(
      { success: true, framework: "lgpd", message: "Inscrição realizada com sucesso!" },
      201,
      origin,
      env.ALLOWED_ORIGINS,
    );
  }

  // 6. D1 INSERT OR IGNORE — guard forte de idempotência (G002)
  const emailHash = await hmacEmail(email, env.AUDIT_PEPPER);
  try {
    const result = await env.D1_AUDIT.prepare(
      "INSERT OR IGNORE INTO subscriptions(email_hash, market, status, created_at) VALUES (?, ?, ?, ?)",
    )
      .bind(emailHash, "br", "active", new Date().toISOString())
      .run();

    if (result.meta.changes === 0) {
      // Email já existe no D1 → já inscrito
      return corsResponse(
        { status: "already-subscribed", message: "Você já está inscrito!" },
        409,
        origin,
        env.ALLOWED_ORIGINS,
      );
    }
  } catch (err) {
    console.error("D1 INSERT error:", err);
    return corsResponse({ error: "Serviço temporariamente indisponível. Tente novamente." }, 503, origin, env.ALLOWED_ORIGINS);
  }

  const now = new Date().toISOString();

  // 7. Salvar consent em KV
  const storedConsent: StoredConsent = {
    email,
    locale: "pt-BR",
    source,
    framework: "lgpd",
    status: "active",
    consentedAt: now,
    confirmedAt: now,
  };
  await env.NEWSLETTER_KV.put(kvActiveKey(email), JSON.stringify(storedConsent));

  // 8. POST /contacts na Resend (G002 — D1 já garante unicidade)
  try {
    const resendRes = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        audience_id: env.RESEND_AUDIENCE_ID_BR,
        unsubscribed: false,
      }),
    });
    if (!resendRes.ok && resendRes.status !== 409) {
      const errBody = await resendRes.text();
      throw new Error(`Resend contacts error (${resendRes.status}): ${errBody}`);
    }
  } catch (err) {
    console.error("Resend contacts error:", err);
    return corsResponse({ error: "Serviço temporariamente indisponível. Tente novamente." }, 503, origin, env.ALLOWED_ORIGINS);
  }

  // 9. Registrar em D1_AUDIT
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  const ipHash = ip ? await hashIp(ip) : null;
  const userAgent = request.headers.get("User-Agent") ?? "";
  const sourceUrl = request.headers.get("Referer") ?? "";

  try {
    await env.D1_AUDIT.prepare(
      "INSERT INTO audit_events(email_hash, timestamp_utc, ip_hash, user_agent, source_url, action, market, framework) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(emailHash, now, ipHash, userAgent, sourceUrl, "subscribe", "br", "lgpd")
      .run();
  } catch (err) {
    console.error("D1 audit insert error:", err);
    // Non-blocking — não impede a resposta
  }

  // 10. Enviar welcome email (non-blocking)
  try {
    await sendWelcomeEmailBR(env, email);
  } catch (err) {
    console.error("Welcome email error (non-blocking):", err);
  }

  // 11. Return 201
  return corsResponse(
    { success: true, framework: "lgpd", message: "Inscrição realizada com sucesso!" },
    201,
    origin,
    env.ALLOWED_ORIGINS,
  );
}

// ---------------------------------------------------------------------------
// Route: POST /unsubscribe (G003 — state machine LGPD)
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
    return corsResponse({ error: "Invalid JSON body" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return corsResponse({ error: "Email inválido" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  // Verificar se está ativo
  const existingRaw = await env.NEWSLETTER_KV.get(kvActiveKey(email));
  if (!existingRaw) {
    return corsResponse({ error: "Inscrição não encontrada" }, 404, origin, env.ALLOWED_ORIGINS);
  }

  const existing = JSON.parse(existingRaw) as StoredConsent;
  const now = new Date().toISOString();

  // Atualizar KV para unsubscribed
  const updated: StoredConsent = { ...existing, status: "unsubscribed", unsubscribedAt: now };
  await env.NEWSLETTER_KV.put(kvActiveKey(email), JSON.stringify(updated));
  await env.NEWSLETTER_KV.put(kvUnsubscribedKey(email), "1");

  // PATCH /contacts na Resend
  try {
    await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audience_id: env.RESEND_AUDIENCE_ID_BR, unsubscribed: true }),
    });
  } catch (err) {
    console.error("Resend PATCH error:", err);
  }

  // Registrar em D1_AUDIT
  const emailHash = await hmacEmail(email, env.AUDIT_PEPPER);
  try {
    await env.D1_AUDIT.prepare(
      "INSERT INTO audit_events(email_hash, timestamp_utc, action, market, framework) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(emailHash, now, "unsubscribe", "br", "lgpd")
      .run();
  } catch (err) {
    console.error("D1 audit unsubscribe error:", err);
  }

  return corsResponse(
    { success: true, message: "Inscrição cancelada com sucesso." },
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
      const headers = {
        "Access-Control-Allow-Origin": isOriginAllowed(origin, env.ALLOWED_ORIGINS) ? origin : "",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      };
      return new Response(null, { status: 204, headers });
    }

    // CORS check para endpoints mutativos
    if ((method === "POST") && !isOriginAllowed(origin, env.ALLOWED_ORIGINS)) {
      return corsResponse({ error: "Origin não autorizada" }, 403, origin, env.ALLOWED_ORIGINS);
    }

    // Health check (não requer CORS)
    if (url.pathname === "/health" && method === "GET") {
      return Response.json({ status: "ok", locale: "pt-BR" }, { status: 200 });
    }

    if (url.pathname === "/subscribe" && method === "POST") {
      return handleSubscribe(request, env, origin);
    }

    if (url.pathname === "/unsubscribe" && method === "POST") {
      return handleUnsubscribe(request, env, origin);
    }

    return corsResponse({ error: "Not found" }, 404, origin, env.ALLOWED_ORIGINS);
  },
};
