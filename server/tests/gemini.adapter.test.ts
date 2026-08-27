import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAdapter } from '../src/integrations/gemini/gemini.adapter';

describe('GeminiAdapter Tests', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    adapter = new GeminiAdapter();
  });

  describe('getStaticFallback — Deterministic Fallback', () => {
    it('returns correct PAYMENT lane fallback in English', () => {
      const result = adapter.getStaticFallback({
        lane: 'PAYMENT',
        customerName: 'Aarav Sharma',
        amount: 2500,
        currency: 'INR',
      });

      expect(result.rootCause).toBe('network_error');
      expect(result.confidence).toBe(0.8);
      expect(result.recommendedAction).toBe('send_retry_link');
      expect(result.customerCopy.channel).toBe('email');
      expect(result.customerCopy.body).toContain('Aarav Sharma');
      expect(result.customerCopy.body).toContain('INR');
      expect(result.customerCopy.body).toContain('2500');
    });

    it('returns correct PAYMENT lane fallback in Hinglish', () => {
      const result = adapter.getStaticFallback({
        lane: 'PAYMENT',
        customerName: 'Priya Patel',
        amount: 1500,
        locale: 'hinglish',
      });

      expect(result.customerCopy.body).toContain('Namaste');
      expect(result.customerCopy.body).toContain('Priya Patel');
      expect(result.customerCopy.subject).toContain('pending payment');
    });

    it('returns correct CHECKOUT lane fallback', () => {
      const result = adapter.getStaticFallback({
        lane: 'CHECKOUT',
        customerName: 'Vikram Singh',
        amount: 3500,
      });

      expect(result.rootCause).toBe('unknown');
      expect(result.confidence).toBe(0.85);
      expect(result.recommendedAction).toBe('send_checkout_recovery_nudge');
      expect(result.customerCopy.body).toContain('Vikram Singh');
      expect(result.customerCopy.body).toContain('cart');
    });

    it('returns correct CHECKOUT lane fallback in Hinglish', () => {
      const result = adapter.getStaticFallback({
        lane: 'CHECKOUT',
        customerName: 'Neha Verma',
        amount: 2000,
        locale: 'hinglish',
      });

      expect(result.customerCopy.body).toContain('Namaste');
      expect(result.customerCopy.body).toContain('cart');
    });

    it('returns correct RECEIVABLE lane fallback', () => {
      const result = adapter.getStaticFallback({
        lane: 'RECEIVABLE',
        customerName: 'Enterprise Corp',
        amount: 75000,
        currency: 'USD',
      });

      expect(result.rootCause).toBe('unknown');
      expect(result.confidence).toBe(0.9);
      expect(result.recommendedAction).toBe('send_reminder');
      expect(result.customerCopy.body).toContain('Enterprise Corp');
      expect(result.customerCopy.body).toContain('USD');
      expect(result.customerCopy.body).toContain('75000');
    });

    it('defaults currency to INR when not provided', () => {
      const result = adapter.getStaticFallback({
        lane: 'PAYMENT',
        customerName: 'Test User',
        amount: 1000,
      });

      expect(result.customerCopy.body).toContain('INR');
    });
  });

  describe('diagnoseAndDraft — Outage Simulation', () => {
    it('returns static fallback when simulateOutage is true', async () => {
      const result = await adapter.diagnoseAndDraft({
        lane: 'PAYMENT',
        sourceRefId: 'pay-outage-test',
        customerName: 'Outage Test User',
        amount: 5000,
        attemptNumber: 1,
        simulateOutage: true,
      });

      expect(result.fallbackUsed).toBe(true);
      expect(result.modelUsed).toBe('fallback_template');
      expect(result.result.rootCause).toBe('network_error');
    });

    it('returns static fallback when API key is not configured', async () => {
      // Create adapter without API key (genAI will be null)
      const noKeyAdapter = new GeminiAdapter();
      // The constructor checks env.GEMINI_API_KEY which may be empty in test
      const result = await noKeyAdapter.diagnoseAndDraft({
        lane: 'CHECKOUT',
        sourceRefId: 'checkout-nokey-test',
        customerName: 'No Key User',
        amount: 2000,
        attemptNumber: 1,
      });

      // Should use fallback since no key or simulateOutage not set
      expect(result.result).toBeDefined();
      expect(result.result.customerCopy).toBeDefined();
      expect(result.result.customerCopy.body.length).toBeGreaterThan(0);
    });
  });

  describe('diagnoseAndDraft — Output Schema Validation', () => {
    it('fallback result conforms to LLMDiagnosisOutput schema', async () => {
      const result = await adapter.diagnoseAndDraft({
        lane: 'RECEIVABLE',
        sourceRefId: 'inv-schema-test',
        customerName: 'Schema Test',
        amount: 10000,
        attemptNumber: 1,
        simulateOutage: true,
      });

      const output = result.result;

      // Validate all required fields exist
      expect(output).toHaveProperty('rootCause');
      expect(output).toHaveProperty('confidence');
      expect(output).toHaveProperty('explanation');
      expect(output).toHaveProperty('recommendedAction');
      expect(output).toHaveProperty('customerCopy');
      expect(output.customerCopy).toHaveProperty('channel');
      expect(output.customerCopy).toHaveProperty('body');

      // Validate types
      expect(typeof output.rootCause).toBe('string');
      expect(typeof output.confidence).toBe('number');
      expect(output.confidence).toBeGreaterThanOrEqual(0);
      expect(output.confidence).toBeLessThanOrEqual(1);
      expect(['email', 'sms', 'whatsapp']).toContain(output.customerCopy.channel);
    });
  });
});
