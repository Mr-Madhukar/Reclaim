import { describe, it, expect } from 'vitest';
import { formatINR, formatRootCause, getLaneBadgeProps, getStatusBadgeProps } from '../lib/utils';

describe('Frontend Utility Helpers', () => {
  it('formats monetary values in Indian Rupees (INR)', () => {
    expect(formatINR(0)).toContain('0.00');
    expect(formatINR(2499)).toContain('2,499.00');
    expect(formatINR('142800')).toContain('1,42,800.00');
    expect(formatINR(null)).toContain('0.00');
  });

  it('formats root cause strings into human-readable labels', () => {
    expect(formatRootCause('insufficient_funds')).toBe('Insufficient Funds');
    expect(formatRootCause('bank_timeout')).toBe('Bank Timeout');
    expect(formatRootCause('card_expired')).toBe('Card Expired');
    expect(formatRootCause(null)).toBe('Under Diagnosis');
  });

  it('returns appropriate badge styling for each loss lane', () => {
    const payment = getLaneBadgeProps('PAYMENT');
    expect(payment.label).toBe('Payment Degradation');
    expect(payment.bgClass).toContain('brand-500');

    const checkout = getLaneBadgeProps('CHECKOUT');
    expect(checkout.label).toBe('Checkout Drop-off');
    expect(checkout.bgClass).toContain('indigo-500');

    const receivable = getLaneBadgeProps('RECEIVABLE');
    expect(receivable.label).toBe('B2B Receivables');
    expect(receivable.bgClass).toContain('amber-500');
  });

  it('returns appropriate badge styling for case statuses', () => {
    const open = getStatusBadgeProps('OPEN');
    expect(open.label).toBe('Active at Risk');

    const recovered = getStatusBadgeProps('RECOVERED');
    expect(recovered.label).toBe('Recovered (Receipted)');

    const stoppedMax = getStatusBadgeProps('STOPPED_MAX_ATTEMPTS');
    expect(stoppedMax.label).toBe('Stopped (Max Attempts)');

    const stoppedOpt = getStatusBadgeProps('STOPPED_OPTED_OUT');
    expect(stoppedOpt.label).toBe('Stopped (Customer Opt-out)');
  });
});
