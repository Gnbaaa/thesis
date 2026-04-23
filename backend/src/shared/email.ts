import nodemailer from 'nodemailer';
import { logger } from './logger';

export type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured');
    }
    logger.warn({ to: params.to, subject: params.subject }, 'email.not_configured_dev');
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = String(process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || port === 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.MAIL_FROM?.trim() || process.env.SMTP_USER!;
  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

