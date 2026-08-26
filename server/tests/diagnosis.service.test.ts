import { describe, it, expect, vi } from 'vitest';
import { DiagnosisService } from '../src/services/diagnosis.service';
import { geminiAdapter } from '../src/integrations/gemini/gemini.adapter';

describe('DiagnosisService — Rules-First Classifier & LLM Fallback', () => {
  const diagnosisService = new DiagnosisService();

  it('Classifies INSUFFICIENT_FUNDS correctly via rules', async () => {
    const result = await diagnosisService.diagnose({
      lane: 'PAYMENT',
      sourceRefId: 'pay-1',
      failureCode: 'PAYMENT_FAILED_INSUFFICIENT_FUNDS',
      customerName: 'Aarav Sharma',
      amount: 2500,
      attemptNumber: 1,
    });

    expect(result.rootCause).toBe('insufficient_funds');
    expect(result.recommendedAction).toBe('send_retry_link');
    expect(result.modelUsed).toBe('rules');
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.customerCopy?.body).toContain('insufficient balance');
  });

  it('Classifies GATEWAY_ERROR as bank_timeout via rules', async () => {
    const result = await diagnosisService.diagnose({
      lane: 'PAYMENT',
      sourceRefId: 'pay-2',
      failureCode: 'GATEWAY_ERROR',
      customerName: 'Priya Patel',
      amount: 1500,
      attemptNumber: 1,
    });

    expect(result.rootCause).toBe('bank_timeout');
    expect(result.recommendedAction).toBe('send_retry_link');
    expect(result.modelUsed).toBe('rules');
  });

  it('Classifies CARD_EXPIRED and recommends suggest_alt_payment_method', async () => {
    const result = await diagnosisService.diagnose({
      lane: 'PAYMENT',
      sourceRefId: 'pay-3',
      failureCode: 'CARD_EXPIRED',
      customerName: 'Rohan Gupta',
      amount: 4000,
      attemptNumber: 1,
    });

    expect(result.rootCause).toBe('card_expired');
    expect(result.recommendedAction).toBe('suggest_alt_payment_method');
    expect(result.modelUsed).toBe('rules');
  });

  it('Classifies MANDATE_EXPIRED and recommends send_mandate_reauth_link', async () => {
    const result = await diagnosisService.diagnose({
      lane: 'PAYMENT',
      sourceRefId: 'mandate-1',
      failureCode: 'MANDATE_EXPIRED',
      customerName: 'Neha Verma',
      amount: 999,
      attemptNumber: 1,
    });

    expect(result.rootCause).toBe('mandate_expired');
    expect(result.recommendedAction).toBe('send_mandate_reauth_link');
    expect(result.modelUsed).toBe('rules');
  });

  it('Classifies RISK_DECLINE and terminates with escalate_to_human', async () => {
    const result = await diagnosisService.diagnose({
      lane: 'PAYMENT',
      sourceRefId: 'pay-risk',
      failureCode: 'RISK_DECLINE',
      customerName: 'Suspicious User',
      amount: 50000,
      attemptNumber: 1,
    });

    expect(result.rootCause).toBe('risk_decline');
    expect(result.recommendedAction).toBe('escalate_to_human');
    expect(result.modelUsed).toBe('rules');
  });

  it('Applies recovery incentive on higher-value abandoned carts on retry attempt', async () => {
    const result = await diagnosisService.diagnose({
      lane: 'CHECKOUT',
      sourceRefId: 'cart-1',
      customerName: 'Vikram Singh',
      amount: 3500, // >= 2000
      attemptNumber: 2, // attempt >= 2
    });

    expect(result.recommendedAction).toBe('apply_recovery_incentive');
    expect(result.modelUsed).toBe('rules');
  });

  it('Offers payment plan for large overdue receivables on second touch', async () => {
    const result = await diagnosisService.diagnose({
      lane: 'RECEIVABLE',
      sourceRefId: 'inv-101',
      customerName: 'Enterprise Corp',
      amount: 75000, // >= 50000
      attemptNumber: 2,
    });

    expect(result.recommendedAction).toBe('offer_payment_plan');
    expect(result.modelUsed).toBe('rules');
  });

  it('Falls back to Gemini/static fallback when failure code is unrecognized', async () => {
    const spy = vi.spyOn(geminiAdapter, 'diagnoseAndDraft').mockResolvedValueOnce({
      result: {
        rootCause: 'unknown',
        confidence: 0.75,
        explanation: 'Ambiguous bank decline diagnosed via Gemini AI.',
        recommendedAction: 'send_retry_link',
        customerCopy: {
          channel: 'email',
          subject: 'Payment notice',
          body: 'Please complete your transaction.',
        },
      },
      modelUsed: 'gemini-2.0-flash',
      fallbackUsed: false,
    });

    const result = await diagnosisService.diagnose({
      lane: 'PAYMENT',
      sourceRefId: 'pay-custom',
      failureCode: 'UNKNOWN_CUSTOM_BANK_CODE_999',
      failureReasonRaw: 'Weird bank message',
      customerName: 'Aditya Joshi',
      amount: 1000,
      attemptNumber: 1,
    });

    expect(spy).toHaveBeenCalled();
    expect(result.modelUsed).toBe('gemini-2.0-flash');
    expect(result.explanation).toContain('Gemini AI');
  });
});
