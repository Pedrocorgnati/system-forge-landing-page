// ---------------------------------------------------------------------------
// cors.ts — CORS helpers para Worker EN
// Padrão reutilizado pelos 3 Workers (cópias independentes por design).
// ---------------------------------------------------------------------------

export function getCorsHeaders(
  origin: string,
  allowedOrigins: string,
): Record<string, string> {
  const allowed = allowedOrigins.split(",").map((o) => o.trim());
  const isAllowed = allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function isOriginAllowed(
  origin: string,
  allowedOrigins: string,
): boolean {
  return allowedOrigins.split(",").map((o) => o.trim()).includes(origin);
}

export function corsResponse(
  body: unknown,
  status: number,
  origin: string,
  allowedOrigins: string,
): Response {
  const headers = getCorsHeaders(origin, allowedOrigins);
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
