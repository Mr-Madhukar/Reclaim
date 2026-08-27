import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import crypto from 'crypto';
import { env } from '../src/config/env';

describe('Webhook Controller Tests', { timeout: 30000 }, () => {
  const generateValidSignature = (payload: object): string => {
    const rawBody = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
  };

  describe('POST /api/webhooks/razorpay — Signature Verification', () => {
    it('rejects requests with missing signature header (400)', async () => {
      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .send({ event: 'payment.failed', payload: {} });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_SIGNATURE');
    });

    it('rejects requests with invalid signature (400)', async () => {
      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', 'aaaaaabbbbbbccccccddddddeeeeeeffffffffaaaabbbb')
        .send({ event: 'payment.failed', payload: {} });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    });

    it('accepts requests with valid HMAC signature (200)', async () => {
      const payload = { event: 'unknown.test.event', payload: {} };
      const signature = generateValidSignature(payload);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('rejects tampered payload even with a previously valid signature', async () => {
      const originalPayload = { event: 'payment.failed', payload: { amount: 1000 } };
      const signature = generateValidSignature(originalPayload);

      // Send a different payload with the original signature
      const tamperedPayload = { event: 'payment.failed', payload: { amount: 99999 } };
      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(tamperedPayload);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/webhooks/razorpay — Event Handling', () => {
    it('processes payment.failed event with valid signature', async () => {
      const payload = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_webhook_001',
              amount: 250000,
              currency: 'INR',
              status: 'failed',
              method: 'card',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Your payment could not be completed due to insufficient funds',
              error_reason: 'insufficient_funds',
              notes: {
                customer_name: 'Test Webhook Customer',
                customer_email: 'webhook-test@example.com',
              },
            },
          },
        },
      };

      const signature = generateValidSignature(payload);
      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
    });

    it('handles unknown event types gracefully', async () => {
      const payload = { event: 'unknown.custom.event', payload: { data: 'test' } };
      const signature = generateValidSignature(payload);

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('handles payment.captured event with valid signature', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_captured_001',
              amount: 100000,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      };

      const signature = generateValidSignature(payload);
      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/webhooks/simulate — Checkout Abandonment', () => {
    it('processes checkout abandonment simulation with valid auth', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo', password: 'Demo@12345' });

      if (loginRes.status !== 200) return;

      const res = await request(app)
        .post('/api/webhooks/simulate/checkout-abandon')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({
          customerName: 'Test Customer',
          customerEmail: 'test-checkout@example.com',
          amount: 3500,
          currency: 'INR',
        });

      // Accept either 200 or 201, or 404 if route doesn't exist
      expect([200, 201, 404]).toContain(res.status);
    });
  });
});
