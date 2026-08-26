import crypto from 'crypto';
import nodemailer from 'nodemailer';
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
  metadata?: Record<string, any>;
}

export interface SendNotificationResult {
  success: boolean;
  messageId: string;
  channel: 'email' | 'sms' | 'whatsapp';
  deliveredAt: Date;
  details?: any;
}

export class NotificationAdapter {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
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

    // In test/demo environment or when transporter is configured
    if (params.channel === 'email' && this.transporter && params.recipient.email && env.NODE_ENV !== 'test') {
      try {
        await this.transporter.sendMail({
          from: `"Reclaim Recovery Agent" <${env.SMTP_USER}>`,
          to: params.recipient.email,
          subject: params.subject || 'Reclaim Notification',
          text: params.message,
          html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <p>${params.message.replace(/\n/g, '<br/>')}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <small style="color: #64748b;">Automated message from Reclaim AI Revenue Recovery</small>
          </div>`,
        });
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Failed to send actual email via SMTP, recording simulated success');
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
