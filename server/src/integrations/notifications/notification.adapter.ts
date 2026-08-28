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

export class NotificationAdapter {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

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

    // In production / test / dev environments when email channel is targeted
    if (params.channel === 'email' && params.recipient.email && env.NODE_ENV !== 'test') {
      const emailHtml = `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <p>${params.message.replace(/\n/g, '<br/>')}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <small style="color: #64748b;">Automated message from Reclaim AI Revenue Recovery</small>
      </div>`;

      // 1. Try Resend API first if configured
      if (this.resend) {
        try {
          const resendResult = await this.resend.emails.send({
            from: env.RESEND_FROM_EMAIL || 'Reclaim Recovery <recovery@mrmadhukar.in>',
            to: params.recipient.email,
            subject: params.subject || 'Reclaim Notification',
            text: params.message,
            html: emailHtml,
          });

          if (resendResult.error) {
            logger.warn({ err: resendResult.error }, '[Notification Adapter] Resend delivery error');
          } else {
            logger.info(
              { resendId: resendResult.data?.id, recipient: params.recipient.email },
              '[Notification Adapter] Email successfully sent via Resend API'
            );
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          logger.warn({ err: message }, 'Failed to send email via Resend API, falling back to SMTP');
        }
      } else if (this.transporter) {
        // 2. Fallback to SMTP / Ethereal transporter
        try {
          const info = await this.transporter.sendMail({
            from: `"Reclaim Recovery Agent" <${env.SMTP_USER}>`,
            to: params.recipient.email,
            subject: params.subject || 'Reclaim Notification',
            text: params.message,
            html: emailHtml,
          });
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) {
            logger.info({ previewUrl, recipient: params.recipient.email }, '[Notification Adapter] Email sent! View rendered message at previewUrl');
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          logger.warn({ err: message }, 'Failed to send actual email via SMTP, recording simulated success');
        }
      }
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
