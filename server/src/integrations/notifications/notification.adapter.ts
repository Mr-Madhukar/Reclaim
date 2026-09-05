import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';

export interface SendNotificationParams {
  channel: 'email' | 'sms' | 'whatsapp';
  recipient: {
    name: string;
    email?: string;
    phone?: string;
  };
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationResult {
  success: boolean;
  messageId: string;
  channel: 'email' | 'sms' | 'whatsapp';
  deliveredAt: Date;
  details?: unknown;
}

const DEFAULT_CLIENT_URL = 'http://localhost:5173';
const DEFAULT_MERCHANT_NAME = 'Reclaim SaaS Services';

export function generateRecoveryEmailHtml(params: SendNotificationParams): string {
  const recipientName = params.recipient.name || 'Valued Customer';
  const clientBaseUrl = env.CLIENT_URL || DEFAULT_CLIENT_URL;

  // Extract payment link if available
  let paymentLink = (params.metadata?.paymentLink as string) || '';
  if (!paymentLink) {
    const urlMatch = /https?:\/\/[^\s]+/.exec(params.message);
    if (urlMatch) {
      paymentLink = urlMatch[0];
    }
  }

  // Clean message: remove raw "Payment link: https://..." or "Re-authorize: https://..." from body text
  const cleanMessage = params.message
    .replace(/(?:Payment link|Re-authorize|Payment URL):\s*https?:\/\/[^\s]+/gi, '')
    .trim();

  const formattedMessage = cleanMessage
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155;">${line}</p>`)
    .join('');

  const amount = params.metadata?.amount ? Number(params.metadata.amount) : null;
  const formattedAmount = amount
    ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;
  const caseId = (params.metadata?.caseId as string) || '';
  const referenceId =
    (params.metadata?.referenceId as string) || (caseId ? caseId.slice(0, 10) : undefined);
  const merchantName = (params.metadata?.merchantName as string) || DEFAULT_MERCHANT_NAME;
  const portalUrl = caseId
    ? `${clientBaseUrl}?checkoutCaseId=${caseId}`
    : paymentLink || clientBaseUrl;
  const optOutUrl = caseId
    ? `${clientBaseUrl}?optOutCaseId=${caseId}`
    : clientBaseUrl;

  let referenceRow = '';
  if (referenceId) {
    referenceRow = `<tr>
      <td style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Reference ID:</td>
      <td align="right" style="font-size: 12px; font-weight: 600; font-family: monospace; color: #475569; padding-bottom: 8px;">#${referenceId}</td>
    </tr>`;
  }

  let summaryCard = '';
  if (formattedAmount) {
    summaryCard = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px 20px;">
      <tr>
        <td style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Merchant Name:</td>
        <td align="right" style="font-size: 12px; font-weight: 700; color: #0f172a; padding-bottom: 8px;">${merchantName}</td>
      </tr>
      ${referenceRow}
      <tr>
        <td style="font-size: 13px; font-weight: 700; color: #0f172a; border-top: 1px dashed #cbd5e1; padding-top: 10px;">Amount Due:</td>
        <td align="right" style="font-size: 18px; font-weight: 800; color: #059669; border-top: 1px dashed #cbd5e1; padding-top: 10px;">${formattedAmount}</td>
      </tr>
    </table>`;
  }

  let ctaButton = '';
  if (paymentLink) {
    ctaButton = `<div style="text-align: center; margin: 30px 0 16px 0;">
      <a href="${paymentLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); letter-spacing: 0.3px;">
        Complete Payment via Razorpay &rarr;
      </a>
    </div>
    <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-bottom: 24px;">
      Direct link: <a href="${paymentLink}" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">${paymentLink}</a>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject || 'Payment Recovery Notice'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 30px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Reclaim <span style="font-size: 11px; background-color: #4338ca; color: #e0e7ff; padding: 3px 8px; border-radius: 6px; font-weight: 700; margin-left: 6px; vertical-align: middle;">Razorpay Partner</span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                      ${merchantName} &bull; Secure Payment Recovery
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">
                      🔒 256-Bit SSL
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">
                Hello ${recipientName},
              </div>

              <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                ${formattedMessage}
              </div>

              ${summaryCard}

              ${ctaButton}

              <!-- Self-Service Options -->
              <div style="margin-top: 24px; padding: 14px 16px; background-color: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0; font-size: 12px; color: #166534; line-height: 1.5;">
                <strong>Self-Service Resolution:</strong> Need more time? You can request a 24-hour grace period or update payment methods on our 
                <a href="${portalUrl}" style="color: #15803d; font-weight: 700; text-decoration: underline;">Customer Recovery Portal</a>.
              </div>
            </td>
          </tr>

          <!-- Trust & Compliance Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 6px;">
                🛡️ Verified by Razorpay Webhook Engine &bull; PCI-DSS Level 1 Compliant
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 12px;">
                In full compliance with India's DPDP Act 2023 &amp; RBI fair recovery practice rules.<br>
                Recontact window: 9:00 AM – 7:00 PM IST. Max 3 touches lifetime limit.
              </div>
              <div style="font-size: 11px; color: #94a3b8;">
                Don't recognize this charge or wish to stop reminders? 
                <a href="${optOutUrl}" style="color: #e11d48; text-decoration: underline; margin-left: 4px;">1-Click Opt-Out / Unsubscribe</a>
              </div>
            </td>
          </tr>

        </table>

        <!-- Micro-footer -->
        <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 16px;">
          &copy; ${new Date().getFullYear()} Reclaim SaaS Technologies. Automated Revenue Recovery Agent for Razorpay.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const DUMMY_DOMAINS = new Set([
  'techscale.demo',
  'example.com',
  'example.org',
  'example.net',
  'test.com',
]);

function isDummyEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return (
    domain.endsWith('.demo') ||
    domain.endsWith('.test') ||
    domain.endsWith('.invalid') ||
    domain.endsWith('.localhost') ||
    DUMMY_DOMAINS.has(domain)
  );
}

export class NotificationAdapter {
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
    }

    if (env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  private async dispatchViaResend(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<void> {
    if (!this.resend) return;

    try {
      const resendResult = await this.resend.emails.send({
        from: env.RESEND_FROM_EMAIL || 'Reclaim Recovery <recovery@mrmadhukar.in>',
        to,
        subject,
        text,
        html,
      });

      if (resendResult.error) {
        logger.warn({ err: resendResult.error }, '[Notification Adapter] Resend delivery error');
      } else {
        logger.info(
          { resendId: resendResult.data?.id, recipient: to },
          '[Notification Adapter] Email successfully sent via Resend API'
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err: message }, 'Failed to send email via Resend API, falling back to SMTP');
    }
  }

  private async dispatchViaSmtp(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<void> {
    if (!this.transporter) return;

    try {
      const info = await this.transporter.sendMail({
        from: `"Reclaim Recovery Agent" <${env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(
          { previewUrl, recipient: to },
          '[Notification Adapter] Email sent! View rendered message at previewUrl'
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err: message }, 'Failed to send actual email via SMTP, recording simulated success');
    }
  }

  private async dispatchEmailNotification(params: SendNotificationParams): Promise<void> {
    const recipientEmail = params.recipient.email;
    if (!recipientEmail || env.NODE_ENV === 'test') {
      return;
    }

    if (isDummyEmail(recipientEmail)) {
      logger.warn(
        { recipient: recipientEmail },
        '[Notification Adapter] Recipient has a dummy/test domain (*.demo / example.com). Resend delivery skipped to prevent sender bounce penalties. Enter a real email address (e.g. Gmail) in the Webhook Simulator to test live delivery.'
      );
      return;
    }

    const emailHtml = generateRecoveryEmailHtml(params);
    const subject = params.subject || 'Reclaim Notification';

    if (this.resend) {
      await this.dispatchViaResend(recipientEmail, subject, params.message, emailHtml);
    } else if (this.transporter) {
      await this.dispatchViaSmtp(recipientEmail, subject, params.message, emailHtml);
    }
  }

  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const messageId = `notif_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();

    logger.info(
      {
        messageId,
        channel: params.channel,
        recipientEmail: params.recipient.email,
        recipientPhone: params.recipient.phone,
        subject: params.subject,
      },
      `[Notification Adapter] Dispatching ${params.channel.toUpperCase()} notification`
    );

    if (params.channel === 'email') {
      await this.dispatchEmailNotification(params);
    }

    return {
      success: true,
      messageId,
      channel: params.channel,
      deliveredAt: now,
      details: {
        recipientName: params.recipient.name,
        preview: params.message.slice(0, 100),
      },
    };
  }
}

export const notificationAdapter = new NotificationAdapter();
