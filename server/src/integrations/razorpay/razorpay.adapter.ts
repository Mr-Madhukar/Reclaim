import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';

export interface RazorpayPaymentLinkResponse {
  id: string;
  shortUrl: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'expired';
}

export class RazorpayAdapter {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

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
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to verify Razorpay webhook signature');
      return false;
    }
  }

  /**
   * Generate a simulated test-mode payment link
   */
  async createPaymentLink(params: {
    referenceId: string;
    amount: number;
    currency?: string;
    customer: { name: string; email: string; phone?: string };
    description?: string;
  }): Promise<RazorpayPaymentLinkResponse> {
    const linkId = `plink_${crypto.randomBytes(8).toString('hex')}`;
    const shortUrl = `https://rzp.io/i/test_${params.referenceId.slice(0, 8)}`;

    logger.info(
      {
        linkId,
        referenceId: params.referenceId,
        amount: params.amount,
        customerEmail: params.customer.email,
      },
      '[Razorpay Adapter] Generated payment recovery link'
    );

    return {
      id: linkId,
      shortUrl,
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
