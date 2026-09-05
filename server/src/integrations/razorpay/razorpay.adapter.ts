import crypto from 'node:crypto';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';

export interface RazorpayPaymentLinkResponse {
  id: string;
  shortUrl: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'expired';
}

function formatCustomerContact(phone?: string): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  return undefined;
}

export class RazorpayAdapter {
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor() {
    this.keyId = env.RAZORPAY_KEY_ID;
    this.keySecret = env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  }

  /**
   * Verify Razorpay Webhook signature (HMAC SHA256)
   */
  verifyWebhookSignature(payload: string, signature: string, secret?: string): boolean {
    const webhookSecret = secret || this.webhookSecret;
    if (!signature || !webhookSecret) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Failed to verify Razorpay webhook signature');
      return false;
    }
  }

  private async fetchLivePaymentLink(params: {
    referenceId: string;
    amount: number;
    currency?: string;
    customer: { name: string; email: string; phone?: string };
    description?: string;
  }): Promise<RazorpayPaymentLinkResponse | null> {
    try {
      const credentials = `${this.keyId}:${this.keySecret}`;
      const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;
      const contact = formatCustomerContact(params.customer.phone);

      const response = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        signal: AbortSignal.timeout(3000),
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.max(100, Math.round(params.amount * 100)), // amount in paise, min ₹1.00
          currency: params.currency || 'INR',
          accept_partial: false,
          reference_id: `recov_${params.referenceId.slice(0, 16)}_${Date.now().toString(36)}`,
          description: params.description || `Reclaim Recovery for #${params.referenceId.slice(0, 12)}`,
          customer: {
            name: params.customer.name,
            email: params.customer.email,
            contact,
          },
          notify: {
            sms: false,
            email: false,
          },
          reminder_enable: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(
          { status: response.status, err: errText },
          '[Razorpay Adapter] Razorpay API returned error, falling back to Reclaim customer recovery portal'
        );
        return null;
      }

      const data = (await response.json()) as {
        id: string;
        short_url: string;
        amount: number;
        currency: string;
        status: string;
      };

      logger.info(
        {
          linkId: data.id,
          shortUrl: data.short_url,
          referenceId: params.referenceId,
          amount: params.amount,
        },
        '[Razorpay Adapter] Successfully created LIVE Razorpay hosted payment link'
      );

      return {
        id: data.id,
        shortUrl: data.short_url,
        amount: params.amount,
        currency: params.currency || 'INR',
        status: 'created',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(
        { err: message },
        '[Razorpay Adapter] Failed to call Razorpay Payment Link API, using fallback portal'
      );
      return null;
    }
  }

  /**
   * Generate an official Razorpay payment link (or fallback customer recovery portal)
   */
  async createPaymentLink(params: {
    referenceId: string;
    amount: number;
    currency?: string;
    customer: { name: string; email: string; phone?: string };
    description?: string;
  }): Promise<RazorpayPaymentLinkResponse> {
    const isTestEnv = Boolean(process.env.VITEST) || env.NODE_ENV === 'test';
    if (this.keyId && this.keySecret && !isTestEnv) {
      const liveLink = await this.fetchLivePaymentLink(params);
      if (liveLink) {
        return liveLink;
      }
    }

    const fallbackId = `plink_${crypto.randomBytes(8).toString('hex')}`;
    const fallbackUrl = `${env.CLIENT_URL || 'http://localhost:5173'}?checkoutCaseId=${params.referenceId}`;

    logger.info(
      {
        linkId: fallbackId,
        referenceId: params.referenceId,
        amount: params.amount,
        fallbackUrl,
      },
      '[Razorpay Adapter] Generated customer recovery portal link'
    );

    return {
      id: fallbackId,
      shortUrl: fallbackUrl,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: 'created',
    };
  }

  /**
   * Generate a mandate re-authorization link for recurring e-mandate recovery
   */
  async createMandateReauthLink(params: {
    mandateId: string;
    customer: { name: string; email: string };
  }): Promise<{ mandateId: string; reauthUrl: string }> {
    const reauthUrl = `https://api.razorpay.com/v1/subscriptions/${params.mandateId}/reauth`;

    logger.info(
      { mandateId: params.mandateId, customerEmail: params.customer.email },
      '[Razorpay Adapter] Generated mandate reauthorization link'
    );

    return {
      mandateId: params.mandateId,
      reauthUrl,
    };
  }
}

export const razorpayAdapter = new RazorpayAdapter();
