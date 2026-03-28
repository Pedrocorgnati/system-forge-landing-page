// ---------------------------------------------------------------------------
// email.ts — Templates e envio de email para Worker IT (GDPR)
// Usa confirmationEmail e welcomeEmail de resend-templates do scaffold
// adaptados inline para evitar dependência de arquivo externo no Worker.
// ---------------------------------------------------------------------------

import type { WorkerEnv } from "./types";

/** HTML do email de confirmação GDPR (it-IT) */
function getConfirmationEmailHTML(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="it-IT" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Conferma la tua iscrizione</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #1f2937;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
        Conferma la tua iscrizione
      </h1>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        Grazie per il tuo interesse nella nostra newsletter!
        Per completare l'iscrizione, clicca il pulsante qui sotto.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${confirmUrl}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px;"
           target="_blank">
          Conferma iscrizione
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin: 0 0 16px 0;">
        Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
        <a href="${confirmUrl}" style="color: #2563eb; text-decoration: underline; font-size: 13px; word-break: break-all;">
          ${confirmUrl}
        </a>
      </p>
      <p style="font-size: 13px; color: #9ca3af; margin: 0 0 20px 0;">
        Il link scade in 24 ore. Se non hai richiesto l'iscrizione, puoi ignorare questa email.
      </p>
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Hai ricevuto questa email perché qualcuno ha inserito il tuo indirizzo nel nostro modulo.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** HTML da página de confirmação inline (retornado pelo GET /confirm) */
export function getConfirmationPage(locale: string): string {
  const isIT = locale.startsWith("it");
  const title = isIT ? "Iscrizione Confermata" : "Subscription Confirmed";
  const body = isIT
    ? "Grazie! La tua iscrizione alla newsletter è stata confermata."
    : "Thank you! Your newsletter subscription has been confirmed.";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f9fafb; color: #1f2937; }
    .card { text-align: center; padding: 3rem 2rem; background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.07); max-width: 480px; }
    .check { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check" aria-hidden="true">&#10003;</div>
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

/** HTML do email de boas-vindas (it-IT) — enviado após confirmação */
function getWelcomeEmailHTML(domain: string): string {
  const unsubscribeUrl = `https://${domain}/unsubscribe`;

  return `<!DOCTYPE html>
<html lang="it-IT" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Benvenuto nella nostra newsletter!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #1f2937;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
        Benvenuto nella nostra newsletter!
      </h1>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        La tua iscrizione è stata confermata con successo.
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        Da ora in poi riceverai le nostre novità, consigli e contenuti esclusivi
        direttamente nella tua casella di posta.
      </p>
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">Grazie per esserti iscritto!</p>
        <p style="margin: 0; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: underline; font-size: 12px;">
            Annulla iscrizione
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envia email de confirmação GDPR (bloqueante — falha deve ser propagada).
 * Se falhar, o caller deve deletar o pending token do KV e retornar 500.
 */
export async function sendConfirmationEmail(
  env: WorkerEnv,
  email: string,
  token: string,
): Promise<void> {
  const domain = env.WORKER_DOMAIN || "newsletter-it.workers.dev";
  const confirmUrl = `https://${domain}/confirm?token=${token}`;
  const html = getConfirmationEmailHTML(confirmUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [email],
      subject: "Conferma la tua iscrizione alla newsletter",
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend confirmation email error (${response.status}): ${errorBody}`);
  }
}

/**
 * Envia email de boas-vindas GDPR (non-blocking — erros apenas logados).
 */
export async function sendWelcomeEmailIT(
  env: WorkerEnv,
  email: string,
): Promise<void> {
  const domain = env.WORKER_DOMAIN || "newsletter-it.workers.dev";
  const html = getWelcomeEmailHTML(domain);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [email],
      subject: "Benvenuto nella newsletter SystemForge!",
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend welcome email error (${response.status}): ${errorBody}`);
  }
}
