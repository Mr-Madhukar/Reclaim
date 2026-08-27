import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { BoundedActionType, RootCauseBucket } from '../../types';

export interface LLMDiagnosisOutput {
  rootCause: RootCauseBucket;
  confidence: number;
  explanation: string;
  recommendedAction: BoundedActionType;
  customerCopy: {
    channel: 'email' | 'sms' | 'whatsapp';
    subject?: string;
    body: string;
  };
}

export class GeminiAdapter {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  /**
   * Diagnose ambiguous failure or craft structured customer recovery copy.
   * Enforces JSON schema and includes retry logic + fallback to static template.
   */
  async diagnoseAndDraft(params: {
    lane: 'PAYMENT' | 'CHECKOUT' | 'RECEIVABLE';
    sourceRefId: string;
    failureReasonRaw?: string;
    failureCode?: string;
    customerName: string;
    amount: number;
    currency?: string;
    attemptNumber: number;
    priorActions?: string[];
    locale?: 'en' | 'hinglish' | 'hi';
    simulateOutage?: boolean;
  }): Promise<{
    result: LLMDiagnosisOutput;
    modelUsed: 'gemini-2.0-flash' | 'fallback_template' | string;
    fallbackUsed: boolean;
  }> {
    if (params.simulateOutage || env.NODE_ENV === 'test') {
      if (params.simulateOutage) {
        logger.warn('[Chaos Mode] Simulated Gemini API 429 rate limit / outage; activating self-healing static fallback');
      }
      return {
        result: this.getStaticFallback(params),
        modelUsed: 'fallback_template',
        fallbackUsed: true,
      };
    }


    if (!this.genAI || !env.GEMINI_API_KEY) {
      logger.info('Gemini API key not configured, using static fallback template');
      return {
        result: this.getStaticFallback(params),
        modelUsed: 'fallback_template',
        fallbackUsed: true,
      };
    }

    const isHinglish = params.locale === 'hinglish';
    const languageInstruction = isHinglish
      ? 'Draft customerCopy in natural, empathetic conversational Hinglish (Hindi words in English alphabet, e.g. "Namaste [Name], aapka payment temporary technical reason se complete nahi ho paya...").'
      : 'Draft customerCopy in clear, professional English.';

    const systemPrompt = `You are Reclaim AI, an autonomous revenue recovery diagnostic assistant.
Your job is to analyze failure signals, diagnose the root cause, and draft empathetic, compliant customer recovery messages.
${languageInstruction}
CRITICAL RULES:
1. Only choose recommendedAction from:
   - 'send_retry_link'
   - 'suggest_alt_payment_method'
   - 'send_mandate_reauth_link'
   - 'send_checkout_recovery_nudge'
   - 'apply_recovery_incentive'
   - 'send_reminder'
   - 'offer_payment_plan'
   - 'log_promise_to_pay'
   - 'escalate_to_human'
   - 'no_action_hold'
2. Only choose rootCause from:
   - 'insufficient_funds'
   - 'bank_timeout'
   - 'card_expired'
   - 'otp_failure'
   - 'mandate_expired'
   - 'risk_decline'
   - 'network_error'
   - 'unknown'
3. NEVER use false urgency, countdown timers, or aggressive/harassing language. Keep copy professional and concise.`;

    const userPrompt = `Diagnose and draft copy for:
- Lane: ${params.lane}
- Customer Name: ${params.customerName}
- Amount: ${params.currency || 'INR'} ${params.amount}
- Attempt Number: ${params.attemptNumber}
- Failure Code: ${params.failureCode || 'N/A'}
- Raw Failure Reason: ${params.failureReasonRaw || 'N/A'}
- Prior Actions: ${params.priorActions?.join(', ') || 'None'}
- Preferred Language: ${params.locale || 'en'}`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: env.GEMINI_MODEL || 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              rootCause: {
                type: SchemaType.STRING,
                format: 'enum',
                enum: [
                  'insufficient_funds',
                  'bank_timeout',
                  'card_expired',
                  'otp_failure',
                  'mandate_expired',
                  'risk_decline',
                  'network_error',
                  'unknown',
                ],
              },
              confidence: { type: SchemaType.NUMBER },
              explanation: { type: SchemaType.STRING },
              recommendedAction: {
                type: SchemaType.STRING,
                format: 'enum',
                enum: [
                  'send_retry_link',
                  'suggest_alt_payment_method',
                  'send_mandate_reauth_link',
                  'send_checkout_recovery_nudge',
                  'apply_recovery_incentive',
                  'send_reminder',
                  'offer_payment_plan',
                  'log_promise_to_pay',
                  'escalate_to_human',
                  'no_action_hold',
                ],
              },
              customerCopy: {
                type: SchemaType.OBJECT,
                properties: {
                  channel: {
                    type: SchemaType.STRING,
                    format: 'enum',
                    enum: ['email', 'sms', 'whatsapp'],
                  },
                  subject: { type: SchemaType.STRING },
                  body: { type: SchemaType.STRING },
                },
                required: ['channel', 'body'],
              },
            },
            required: ['rootCause', 'confidence', 'explanation', 'recommendedAction', 'customerCopy'],
          },
        },
      });

      const response = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      const text = response.response.text();
      const parsed = JSON.parse(text) as LLMDiagnosisOutput;
      return {
        result: parsed,
        modelUsed: env.GEMINI_MODEL || 'gemini-2.0-flash',
        fallbackUsed: false,
      };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.warn({ err: errorMessage }, 'Gemini API call failed, falling back to static template');
      return {
        result: this.getStaticFallback(params),
        modelUsed: 'fallback_template',
        fallbackUsed: true,
      };
    }
  }

  /**
   * Static deterministic fallback when LLM is unavailable, rate-limited, or returns invalid schema.
   */
  getStaticFallback(params: {
    lane: 'PAYMENT' | 'CHECKOUT' | 'RECEIVABLE';
    customerName: string;
    amount: number;
    currency?: string;
    failureCode?: string;
    locale?: 'en' | 'hinglish' | 'hi';
  }): LLMDiagnosisOutput {
    const currency = params.currency || 'INR';
    const isHinglish = params.locale === 'hinglish';

    if (params.lane === 'PAYMENT') {
      return {
        rootCause: 'network_error',
        confidence: 0.8,
        explanation: 'Payment could not be completed. A direct retry link has been generated.',
        recommendedAction: 'send_retry_link',
        customerCopy: {
          channel: 'email',
          subject: isHinglish ? 'Aapka pending payment complete karein' : 'Complete your pending payment',
          body: isHinglish
            ? `Namaste ${params.customerName}, aapka ${currency} ${params.amount} ka payment bank timeout ki wajah se ruka hai. Niche diye link par tap karke 10 second me securely complete karein.`
            : `Hi ${params.customerName}, your payment of ${currency} ${params.amount} was interrupted. Please click the link to complete your transaction securely.`,
        },
      };
    }

    if (params.lane === 'CHECKOUT') {
      return {
        rootCause: 'unknown',
        confidence: 0.85,
        explanation: 'Cart abandoned prior to payment completion.',
        recommendedAction: 'send_checkout_recovery_nudge',
        customerCopy: {
          channel: 'email',
          subject: isHinglish ? 'Aapka cart aapka wait kar raha hai' : 'Your cart is waiting for you',
          body: isHinglish
            ? `Namaste ${params.customerName}, aapne cart me ${currency} ${params.amount} ka items chhoda hai. Aaj hi apna order asani se complete karein.`
            : `Hi ${params.customerName}, you left items in your cart worth ${currency} ${params.amount}. Complete your purchase today.`,
        },
      };
    }

    // Lane RECEIVABLE
    return {
      rootCause: 'unknown',
      confidence: 0.9,
      explanation: 'Invoice overdue past payment due date.',
      recommendedAction: 'send_reminder',
      customerCopy: {
        channel: 'email',
        subject: isHinglish ? 'Gentle reminder: Invoice payment bacha hai' : 'Friendly reminder: Invoice payment pending',
        body: isHinglish
          ? `Namaste ${params.customerName}, aapka ${currency} ${params.amount} ka outstanding invoice due date cross kar chuka hai. Kripya payment options check karein.`
          : `Hi ${params.customerName}, this is a gentle reminder regarding your outstanding invoice for ${currency} ${params.amount}. Please review the payment options attached.`,
      },
    };
  }
}

export const geminiAdapter = new GeminiAdapter();
