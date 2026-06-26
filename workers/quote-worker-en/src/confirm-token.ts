// ---------------------------------------------------------------------------
// confirm-token.ts — Token de confirmacao STATELESS e assinado (Item 007)
//
// Double opt-in: o lead so chega ao dashboard APOS o usuario confirmar. Como o
// email cru NUNCA pode persistir em D1 (compliance) e o sync exige a PII crua
// (name/email/whatsapp/description) APOS um clique assincrono, a PII viaja
// dentro do PROPRIO token de confirmacao, assinado com HMAC-SHA256 e enviado
// por email ao DONO dos dados (sem vazamento a terceiros).
//
// Formato: base64url(JSON(payload)) + "." + base64url(HMAC-SHA256("confirm-v1|"+body, secret))
// Chave dedicada CONFIRM_TOKEN_SECRET (separada do AUDIT_PEPPER — proposito e
// rotacao distintos). src/ e IDENTICO entre os 4 Workers.
// ---------------------------------------------------------------------------

import type { ProjectType } from "./types";

/** Prefixo de dominio da assinatura — impede reuso cross-proposito da chave. */
const SIGN_DOMAIN = "confirm-v1|";

export interface ConfirmTokenPayload {
  v: 1;
  market: string;
  origin: string;
  language: string;
  lead_hash: string;
  name: string;
  email: string;
  whatsapp: string;
  projectType: ProjectType;
  description: string;
  budgetRange: string;
  timeline: string;
  features: string[];
  referralSource: string | null;
  iat: number; // epoch segundos
  exp: number; // epoch segundos
}

// ---------------------------------------------------------------------------
// base64url helpers (sem padding, URL-safe) — locais, sem dependencias.
// ---------------------------------------------------------------------------

function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

export function base64urlEncode(input: Uint8Array | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  const b64 = btoa(bytesToBinary(bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Decodifica base64url para bytes. Lanca em input malformado (caller trata). */
export function base64urlDecodeToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64urlDecode(input: string): string {
  return new TextDecoder().decode(base64urlDecodeToBytes(input));
}

// ---------------------------------------------------------------------------
// HMAC
// ---------------------------------------------------------------------------

async function hmacSha256(message: string, secret: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return new Uint8Array(sig);
}

/** Comparacao byte-a-byte de comprimento fixo (tempo constante). */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Assina o payload e retorna `body.sig` (base64url). */
export async function signConfirmToken(
  payload: ConfirmTokenPayload,
  secret: string,
): Promise<string> {
  const body = base64urlEncode(JSON.stringify(payload));
  const sigBytes = await hmacSha256(SIGN_DOMAIN + body, secret);
  const sig = base64urlEncode(sigBytes);
  return `${body}.${sig}`;
}

/**
 * Verifica e decodifica o token. Retorna null (NUNCA lanca) para qualquer
 * input invalido: formato, assinatura divergente, v != 1, ou expirado.
 */
export async function verifyConfirmToken(
  token: string,
  secret: string,
  nowEpochS: number,
): Promise<ConfirmTokenPayload | null> {
  if (typeof token !== "string" || token.length === 0) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expectedSig: Uint8Array;
  let providedSig: Uint8Array;
  try {
    expectedSig = await hmacSha256(SIGN_DOMAIN + body, secret);
    providedSig = base64urlDecodeToBytes(sig);
  } catch {
    return null;
  }
  if (!timingSafeEqual(expectedSig, providedSig)) return null;

  let payload: ConfirmTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(body)) as ConfirmTokenPayload;
  } catch {
    return null;
  }

  if (!payload || payload.v !== 1) return null;
  if (typeof payload.exp !== "number" || payload.exp <= nowEpochS) return null;

  return payload;
}
