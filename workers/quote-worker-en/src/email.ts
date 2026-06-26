// ---------------------------------------------------------------------------
// email.ts — Envio do email de confirmacao (double opt-in, Item 007)
//
// SUBSTITUI o stub no-op do 005. Recebe o email cru + o link de confirmacao ja
// pronto e dispara via Resend (mesmo shape de workers/worker-br). O email cru
// NUNCA e logado. Copy/subject localizados por env.SITE_LOCALE (4 variantes).
//
// src/ e IDENTICO entre os 4 Workers; o locale vem de env.
// ---------------------------------------------------------------------------

import type { WorkerEnv } from "./types";

interface ConfirmCopy {
  lang: string;
  subject: string;
  heading: string;
  body: string;
  cta: string;
  footer: string;
}

// Copy por locale. Default seguro = en quando o locale nao casar.
const CONFIRM_COPY: Record<string, ConfirmCopy> = {
  "pt-BR": {
    lang: "pt-BR",
    subject: "Confirme seu pedido de orcamento — Forja de Sistemas",
    heading: "Confirme seu pedido de orcamento",
    body: "Recebemos seu pedido de orcamento. Para concluir, confirme que foi voce clicando no botao abaixo. Sem a confirmacao, nada e enviado a nossa equipe.",
    cta: "Confirmar pedido",
    footer: "Se voce nao solicitou um orcamento, ignore este email.",
  },
  "it-IT": {
    lang: "it-IT",
    subject: "Conferma la tua richiesta di preventivo — SystemForge",
    heading: "Conferma la tua richiesta di preventivo",
    body: "Abbiamo ricevuto la tua richiesta di preventivo. Per completarla, conferma di essere stato tu cliccando sul pulsante qui sotto. Senza conferma, nulla viene inviato al nostro team.",
    cta: "Conferma la richiesta",
    footer: "Se non hai richiesto un preventivo, ignora questa email.",
  },
  en: {
    lang: "en",
    subject: "Confirm your quote request — SystemForge",
    heading: "Confirm your quote request",
    body: "We received your quote request. To complete it, please confirm it was you by clicking the button below. Nothing is sent to our team until you confirm.",
    cta: "Confirm request",
    footer: "If you did not request a quote, please ignore this email.",
  },
  "es-ES": {
    lang: "es-ES",
    subject: "Confirma tu solicitud de presupuesto — SystemForge",
    heading: "Confirma tu solicitud de presupuesto",
    body: "Hemos recibido tu solicitud de presupuesto. Para completarla, confirma que fuiste tu haciendo clic en el boton de abajo. No se envia nada a nuestro equipo hasta que confirmes.",
    cta: "Confirmar solicitud",
    footer: "Si no solicitaste un presupuesto, ignora este correo.",
  },
};

function resolveCopy(locale: string): ConfirmCopy {
  return CONFIRM_COPY[locale] ?? CONFIRM_COPY.en;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getConfirmationHTML(copy: ConfirmCopy, confirmUrl: string): string {
  const href = escapeHtml(confirmUrl);
  return `<!DOCTYPE html>
<html lang="${copy.lang}" dir="ltr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0e14;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#141925;border-radius:12px;padding:32px;">
        <tr><td style="color:#ffffff;font-size:20px;font-weight:700;padding-bottom:16px;">${escapeHtml(copy.heading)}</td></tr>
        <tr><td style="color:#c7ced9;font-size:15px;line-height:1.6;padding-bottom:24px;">${escapeHtml(copy.body)}</td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${href}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">${escapeHtml(copy.cta)}</a>
        </td></tr>
        <tr><td style="color:#7a8499;font-size:12px;line-height:1.5;border-top:1px solid #232a38;padding-top:16px;">${escapeHtml(copy.footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Envia o email de confirmacao (double opt-in) via Resend. Recebe o email cru
 * e o link pronto. NUNCA loga o email cru. Lanca Error em !response.ok (o
 * caller decide se bloqueia — em handleLead o envio e non-blocking).
 */
export async function sendConfirmationEmail(
  env: WorkerEnv,
  rawEmail: string,
  confirmUrl: string,
): Promise<void> {
  const copy = resolveCopy(env.SITE_LOCALE);
  const html = getConfirmationHTML(copy, confirmUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [rawEmail],
      subject: copy.subject,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
}
