// ---------------------------------------------------------------------------
// token.ts — Geração de token seguro para GDPR double opt-in
// Usa crypto.getRandomValues() (Web Crypto API — disponível em CF Workers)
// 32 bytes = 64 chars hex — adequado para tokens de confirmação
// ---------------------------------------------------------------------------

/** Gera token hex 64 chars via crypto.getRandomValues() */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** KV key para token pending */
export function pendingKey(token: string): string {
  return `pending:${token}`;
}

/** KV key para subscriber ativo */
export function activeKey(listId: string, email: string): string {
  return `active:${listId}:${email.toLowerCase()}`;
}

/** KV key para subscriber desinscrito */
export function unsubscribedKey(listId: string, email: string): string {
  return `unsubscribed:${listId}:${email.toLowerCase()}`;
}
