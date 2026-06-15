import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Tekil nodemailer transporter helper'ı.
 *
 * Env adları apps/api (NestJS MailService) ile BİREBİR aynı:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true"/"false"), SMTP_USER, SMTP_PASS, MAIL_FROM
 * Ek olarak iletişim/bülten bildirimlerinin gideceği adres: CONTACT_TO
 *
 * SMTP yapılandırılmamışsa (SMTP_HOST yok veya "localhost") `isMailConfigured()`
 * false döner — bu durumda route'lar gerçek mail yerine console.log yapar (dev).
 */

const DEFAULT_FROM = "Markala <markala@324ajans.com>";
const DEFAULT_CONTACT_TO = "merhaba@markala.com.tr";

export interface MailOptions {
  to?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export function getContactTo(): string {
  const to = process.env.CONTACT_TO?.trim();
  return to && to.length > 0 ? to : DEFAULT_CONTACT_TO;
}

export function getMailFrom(): string {
  const from = process.env.MAIL_FROM?.trim();
  return from && from.length > 0 ? from : DEFAULT_FROM;
}

/**
 * SMTP gerçekten yapılandırılmış mı?
 * SMTP_HOST tanımlı VE "localhost" değilse true.
 */
export function isMailConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim().toLowerCase();
  return Boolean(host) && host !== "localhost";
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const secure = (process.env.SMTP_SECURE ?? "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure,
    auth: user ? { user, pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  return cachedTransporter;
}

/**
 * Mail gönderir. `to` verilmezse CONTACT_TO'ya gider, `from` her zaman MAIL_FROM.
 * Hata fırlatır — çağıran taraf yakalamalı (transaksiyonel/bloke davranışa kendisi karar versin).
 */
export async function sendMail(opts: MailOptions): Promise<{ messageId: string }> {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: getMailFrom(),
    to: opts.to ?? getContactTo(),
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    replyTo: opts.replyTo,
  });
  return { messageId: info.messageId };
}
