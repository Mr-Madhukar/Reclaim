import { BoundedActionType, DiagnosisResult, RootCauseBucket } from '../types';
import { geminiAdapter } from '../integrations/gemini/gemini.adapter';
import { logger } from '../lib/logger';

interface KnownRuleMapping {
  rootCause: RootCauseBucket;
  recommendedAction: BoundedActionType;
  confidence: number;
  explanation: string;
}

const KNOWN_FAILURE_CODE_MAP: Record<string, KnownRuleMapping> = {
  // Insufficient funds
  PAYMENT_FAILED_INSUFFICIENT_FUNDS: {
    rootCause: 'insufficient_funds',
    recommendedAction: 'send_retry_link',
    confidence: 0.98,
    explanation: 'Transaction declined due to insufficient account/card balance.',
  },
  INSUFFICIENT_FUNDS: {
    rootCause: 'insufficient_funds',
    recommendedAction: 'send_retry_link',
    confidence: 0.98,
    explanation: 'Transaction declined due to insufficient account/card balance.',
  },
  NOT_ENOUGH_BALANCE: {
    rootCause: 'insufficient_funds',
    recommendedAction: 'send_retry_link',
    confidence: 0.98,
    explanation: 'Account has inadequate funds at the time of charge.',
  },

  // Bank timeout
  GATEWAY_ERROR: {
    rootCause: 'bank_timeout',
    recommendedAction: 'send_retry_link',
    confidence: 0.95,
    explanation: 'Issuing bank or payment gateway encountered a timeout.',
  },
  BANK_TIMEOUT: {
    rootCause: 'bank_timeout',
    recommendedAction: 'send_retry_link',
    confidence: 0.95,
    explanation: 'Issuing bank server failed to respond within threshold.',
  },
  ACQUIRER_TIMEOUT: {
    rootCause: 'bank_timeout',
    recommendedAction: 'send_retry_link',
    confidence: 0.95,
    explanation: 'Acquiring bank timeout during 3DS processing.',
  },

  // Card expired
  EXPIRED_CARD: {
    rootCause: 'card_expired',
    recommendedAction: 'suggest_alt_payment_method',
    confidence: 0.99,
    explanation: 'Card expiry date has passed.',
  },
  CARD_EXPIRED: {
    rootCause: 'card_expired',
    recommendedAction: 'suggest_alt_payment_method',
    confidence: 0.99,
    explanation: 'Card expiry date has passed.',
  },

  // OTP / 3DS authentication failure
  OTP_EXPIRED: {
    rootCause: 'otp_failure',
    recommendedAction: 'send_retry_link',
    confidence: 0.96,
    explanation: 'Two-factor authentication OTP expired prior to submission.',
  },
  INCORRECT_OTP: {
    rootCause: 'otp_failure',
    recommendedAction: 'send_retry_link',
    confidence: 0.96,
    explanation: 'Incorrect OTP entered during 3D-Secure verification.',
  },
  AUTHENTICATION_FAILED: {
    rootCause: 'otp_failure',
    recommendedAction: 'send_retry_link',
    confidence: 0.94,
    explanation: '3DS authentication failed or customer cancelled verification.',
  },

  // Mandate / Subscription failure
  MANDATE_EXPIRED: {
    rootCause: 'mandate_expired',
    recommendedAction: 'send_mandate_reauth_link',
    confidence: 0.97,
    explanation: 'Recurring payment e-mandate validity period has expired.',
  },
  RECURRING_AUTH_FAILED: {
    rootCause: 'mandate_expired',
    recommendedAction: 'send_mandate_reauth_link',
    confidence: 0.95,
    explanation: 'Standing instruction authorization failed on bank side.',
  },

  // Risk / Fraud decline
  RISK_DECLINE: {
    rootCause: 'risk_decline',
    recommendedAction: 'escalate_to_human',
    confidence: 0.99,
    explanation: 'Transaction blocked by automated risk and fraud heuristics.',
  },
  HIGH_RISK_FRAUD: {
    rootCause: 'risk_decline',
    recommendedAction: 'escalate_to_human',
    confidence: 0.99,
    explanation: 'High fraud probability score detected by risk gateway.',
  },

  // Network error
  NETWORK_ERROR: {
    rootCause: 'network_error',
    recommendedAction: 'send_retry_link',
    confidence: 0.92,
    explanation: 'Transient network failure during transaction handover.',
  },
  CONNECTION_FAILED: {
    rootCause: 'network_error',
    recommendedAction: 'send_retry_link',
    confidence: 0.92,
    explanation: 'Connection interrupted between merchant app and gateway.',
  },
};

export class DiagnosisService {
  /**
   * Diagnoses root cause using rules-first classifier.
   * If code is recognized, returns deterministic diagnosis immediately.
   * If ambiguous or unrecognized, falls back to structured Gemini LLM.
   */
  async diagnose(params: {
    lane: 'PAYMENT' | 'CHECKOUT' | 'RECEIVABLE';
    sourceRefId: string;
    failureCode?: string;
    failureReasonRaw?: string;
    customerName: string;
    amount: number;
    currency?: string;
    attemptNumber: number;
    priorActions?: string[];
  }): Promise<DiagnosisResult> {
    const code = (params.failureCode || '').trim().toUpperCase();

    // 1. Rules-First Classifier Path
    if (code && KNOWN_FAILURE_CODE_MAP[code]) {
      const match = KNOWN_FAILURE_CODE_MAP[code];
      logger.info(
        { failureCode: code, rootCause: match.rootCause },
        '[Diagnosis Service] Rules-first classifier matched'
      );

      // Generate channel copy for customer
      const customerCopy = this.generateDeterministicCopy({
        lane: params.lane,
        rootCause: match.rootCause,
        customerName: params.customerName,
        amount: params.amount,
        currency: params.currency || 'INR',
        action: match.recommendedAction,
      });

      return {
        rootCause: match.rootCause,
        confidence: match.confidence,
        explanation: match.explanation,
        recommendedAction: match.recommendedAction,
        modelUsed: 'rules',
        customerCopy,
      };
    }

    // Lane-specific deterministic heuristics for Checkout and Receivables
    if (params.lane === 'CHECKOUT') {
      const action: BoundedActionType =
        params.amount >= 2000 && params.attemptNumber >= 2
          ? 'apply_recovery_incentive'
          : 'send_checkout_recovery_nudge';

      return {
        rootCause: 'unknown',
        confidence: 0.9,
        explanation: 'Customer left checkout before completing transaction.',
        recommendedAction: action,
        modelUsed: 'rules',
        customerCopy: {
          channel: 'email',
          subject: 'Complete your checkout with Reclaim',
          body: `Hi ${params.customerName}, your selected items worth ${params.currency || 'INR'} ${params.amount} are still waiting for you. Click here to resume checkout.`,
        },
      };
    }

    if (params.lane === 'RECEIVABLE') {
      const action: BoundedActionType =
        params.amount >= 50000 && params.attemptNumber >= 2
          ? 'offer_payment_plan'
          : 'send_reminder';

      return {
        rootCause: 'unknown',
        confidence: 0.9,
        explanation: 'B2B Invoice outstanding past invoice due date.',
        recommendedAction: action,
        modelUsed: 'rules',
        customerCopy: {
          channel: 'email',
          subject: 'Overdue invoice payment reminder',
          body: `Dear ${params.customerName}, this is a formal reminder that invoice amounting to ${params.currency || 'INR'} ${params.amount} is currently overdue. Please review payment options.`,
        },
      };
    }

    // 2. Ambiguous / Unknown Failure: Delegate to Gemini Structured Output
    logger.info(
      { rawReason: params.failureReasonRaw, code },
      '[Diagnosis Service] Unrecognized failure code, routing to Gemini adapter'
    );

    const { result, modelUsed } = await geminiAdapter.diagnoseAndDraft(params);

    return {
      rootCause: result.rootCause,
      confidence: result.confidence,
      explanation: result.explanation,
      recommendedAction: result.recommendedAction,
      modelUsed,
      customerCopy: result.customerCopy,
    };
  }

  /**
   * Deterministic copy generator ensuring zero hallucination on critical financial messaging
   */
  private generateDeterministicCopy(params: {
    lane: string;
    rootCause: RootCauseBucket;
    customerName: string;
    amount: number;
    currency: string;
    action: BoundedActionType;
  }): { channel: 'email' | 'sms' | 'whatsapp'; subject?: string; body: string } {
    switch (params.rootCause) {
      case 'insufficient_funds':
        return {
          channel: 'email',
          subject: 'Action required: Complete your payment',
          body: `Hi ${params.customerName}, your payment of ${params.currency} ${params.amount} could not be processed due to insufficient balance. You can retry with the secure link below or use another payment method.`,
        };
      case 'bank_timeout':
        return {
          channel: 'sms',
          body: `Hi ${params.customerName}, your bank timed out during your payment of ${params.currency} ${params.amount}. Tap to retry securely: https://rzp.io/i/test_retry`,
        };
      case 'card_expired':
        return {
          channel: 'email',
          subject: 'Update your payment method',
          body: `Hi ${params.customerName}, your payment of ${params.currency} ${params.amount} was declined because your card on file has expired. Please provide an alternative payment method to proceed.`,
        };
      case 'otp_failure':
        return {
          channel: 'sms',
          body: `Hi ${params.customerName}, your OTP verification was not completed for ${params.currency} ${params.amount}. Click to retry: https://rzp.io/i/test_retry`,
        };
      case 'mandate_expired':
        return {
          channel: 'email',
          subject: 'Re-authenticate your auto-pay subscription',
          body: `Hi ${params.customerName}, your auto-debit subscription mandate for ${params.currency} ${params.amount} has expired. Please re-authorize your mandate to continue uninterrupted service.`,
        };
      case 'risk_decline':
        return {
          channel: 'email',
          subject: 'Payment verification notice',
          body: `Hi ${params.customerName}, your transaction of ${params.currency} ${params.amount} was flagged for verification. Our support team is reviewing your account.`,
        };
      default:
        return {
          channel: 'email',
          subject: 'Complete your pending payment',
          body: `Hi ${params.customerName}, your payment of ${params.currency} ${params.amount} is pending. Please click to complete your transaction.`,
        };
    }
  }
}

export const diagnosisService = new DiagnosisService();
