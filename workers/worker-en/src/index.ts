// ---------------------------------------------------------------------------
// index.ts — Cloudflare Worker para newsletter EN (CAN-SPAM)
//
// GDPR-EXCEPTION: locale=en uses single opt-in (CAN-SPAM, not GDPR)
// Reason: English market targets US/CA/AU audience under CAN-SPAM Act, not EU GDPR
// CAN-SPAM requires physical address and unsubscribe in every email, not double opt-in
// COMP-008-EXCEPTION: CAN-SPAM — single opt-in, physical address + opt-out OBRIGATÓRIOS
// CreatedAt: 2026-03-28 | ReviewAt: 2026-06-28 | Owner: pedro
// ---------------------------------------------------------------------------

import type { WorkerEnv, SubscribeRequest, StoredConsent, UnsubscribeRequest } from "./types";
import { isOriginAllowed, corsResponse } from "./cors";
import { sendWelcomeEmailEN } from "./email";
import { verifyTurnstile } from "./turnstile";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function kvActiveKey(email: string): string {
  return `active:newsletter-en:${email.toLowerCase()}`;
}

function kvUnsubscribedKey(email: string): string {
  return `unsubscribed:newsletter-en:${email.toLowerCase()}`;
}

function kvSuppressedKey(email: string): string {
  return `suppressed:newsletter-en:${email.toLowerCase()}`;
}

/** Gera token opaco para RFC 8058 unsubscribe (evita PII em query string) */
function generateUnsubscribeToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** HMAC-SHA256 do email com pepper */
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

/** SHA-256 do IP */
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
  // ⚠️ RELEASE BLOCKER GATE (G007): garantir endereço físico configurado
  const addr = env.COMPANY_ADDRESS ?? "";
  if (!addr || addr.includes("[PREENCHER") || addr.includes("[endereço")) {
    throw new Error("RELEASE BLOCKER: COMPANY_ADDRESS não configurado. Ver PENDING-ACTIONS.md.");
  }

  // 1. Parse JSON
  let body: SubscribeRequest;
  try {
    body = (await request.json()) as SubscribeRequest;
  } catch {
    return corsResponse({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const source = body.source ?? "unknown";

  // 2. Validate email
  if (!EMAIL_REGEX.test(email)) {
    return corsResponse({ error: "Invalid email address", code: "INVALID_EMAIL" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  // 3. Validate Turnstile (se presente)
  if (body.turnstileToken) {
    const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    const valid = await verifyTurnstile(
      body.turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      env.TURNSTILE_EXPECTED_HOSTNAME,
      ip,
    );
    if (!valid) {
      return corsResponse({ error: "Security verification failed", code: "TURNSTILE_FAILED" }, 400, origin, env.ALLOWED_ORIGINS);
    }
  }

  // 4. Check suppressed — CAN-SPAM 10-day suppression (retornar 201 silenciosamente)
  const suppressed = await env.NEWSLETTER_KV.get(kvSuppressedKey(email));
  if (suppressed) {
    return corsResponse(
      { success: true, framework: "can-spam", message: "You're subscribed! Check your email for a welcome message." },
      201,
      origin,
      env.ALLOWED_ORIGINS,
    );
  }

  // 5. Check unsubscribed — CAN-SPAM 10-day suppression list
  const isUnsubscribed = await env.NEWSLETTER_KV.get(kvUnsubscribedKey(email));
  if (isUnsubscribed) {
    return corsResponse(
      { status: "already-subscribed", message: "You have previously unsubscribed. Please contact us to re-subscribe." },
      409,
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
      .bind(emailHash, "en", "active", new Date().toISOString())
      .run();

    if (result.meta.changes === 0) {
      return corsResponse(
        { status: "already-subscribed", message: "You're already subscribed!" },
        409,
        origin,
        env.ALLOWED_ORIGINS,
      );
    }
  } catch (err) {
    console.error("D1 INSERT error:", err);
    return corsResponse({ error: "Service temporarily unavailable. Please try again." }, 503, origin, env.ALLOWED_ORIGINS);
  }

  const now = new Date().toISOString();

  // 7. Gerar token de unsubscribe opaco (RFC 8058 — não expor email em query string)
  const unsubToken = generateUnsubscribeToken();
  await env.NEWSLETTER_KV.put(`unsub-token:newsletter-en:${unsubToken}`, email, {
    expirationTtl: 60 * 60 * 24 * 365, // 1 ano
  });

  // 8. Salvar consent em KV
  const storedConsent: StoredConsent = {
    email,
    locale: "en",
    source,
    framework: "can-spam",
    status: "active",
    consentedAt: now,
    confirmedAt: now,
  };
  await env.NEWSLETTER_KV.put(kvActiveKey(email), JSON.stringify(storedConsent));

  // 9. POST /contacts na Resend
  try {
    const resendRes = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        audience_id: env.RESEND_AUDIENCE_ID_EN,
        unsubscribed: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resendRes.ok && resendRes.status !== 409) {
      const errBody = await resendRes.text();
      throw new Error(`Resend contacts error (${resendRes.status}): ${errBody}`);
    }
  } catch (err) {
    console.error("Resend contacts error:", err);
    return corsResponse({ error: "Service temporarily unavailable. Please try again." }, 503, origin, env.ALLOWED_ORIGINS);
  }

  // 10. Registrar em D1_AUDIT
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
        "en",
        "can-spam",
      )
      .run();
  } catch (err) {
    console.error("D1 audit insert error:", err);
  }

  // 11. Enviar welcome email com endereço físico + RFC 8058 (non-blocking)
  try {
    await sendWelcomeEmailEN(env, email, unsubToken);
  } catch (err) {
    console.error("Welcome email error (non-blocking):", err);
  }

  return corsResponse(
    { success: true, framework: "can-spam", message: "You're subscribed! Check your email for a welcome message." },
    201,
    origin,
    env.ALLOWED_ORIGINS,
  );
}

// ---------------------------------------------------------------------------
// Route: POST /unsubscribe — CAN-SPAM Sec. 5(a)(3): honrar em 10 dias
// Aceita application/json OU application/x-www-form-urlencoded (RFC 8058 one-click)
// ---------------------------------------------------------------------------

async function handleUnsubscribe(
  request: Request,
  env: WorkerEnv,
  origin: string,
): Promise<Response> {
  let email: string | null = null;

  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    // RFC 8058 one-click: body = "List-Unsubscribe=One-Click"
    // Token vem de query string (não PII)
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (token) {
      email = await env.NEWSLETTER_KV.get(`unsub-token:newsletter-en:${token}`);
    }
  } else {
    // JSON
    let body: UnsubscribeRequest;
    try {
      body = (await request.json()) as UnsubscribeRequest;
    } catch {
      return corsResponse({ error: "Invalid request body" }, 400, origin, env.ALLOWED_ORIGINS);
    }
    email = (body.email ?? "").trim().toLowerCase() || null;
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return corsResponse({ error: "Invalid email address" }, 400, origin, env.ALLOWED_ORIGINS);
  }

  const existingRaw = await env.NEWSLETTER_KV.get(kvActiveKey(email));
  if (!existingRaw) {
    return corsResponse({ error: "Subscription not found" }, 404, origin, env.ALLOWED_ORIGINS);
  }

  const now = new Date().toISOString();
  const existing = JSON.parse(existingRaw) as StoredConsent;
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
      body: JSON.stringify({ audience_id: env.RESEND_AUDIENCE_ID_EN, unsubscribed: true }),
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
      .bind(emailHash, now, "unsubscribe", "en", "can-spam")
      .run();
  } catch (err) {
    console.error("D1 audit unsubscribe error:", err);
  }

  return corsResponse(
    { success: true, message: "You have been unsubscribed successfully." },
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
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // CORS check para POST mutativos
    if (method === "POST" && !isOriginAllowed(origin, env.ALLOWED_ORIGINS)) {
      return corsResponse({ error: "Origin not authorized" }, 403, origin, env.ALLOWED_ORIGINS);
    }

    // Health check
    if (url.pathname === "/health" && method === "GET") {
      return Response.json({ status: "ok", locale: "en" }, { status: 200 });
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
