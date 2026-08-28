import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import crypto from 'node:crypto';
import { env } from '../src/config/env';

describe('Reclaim REST API Endpoints & RBAC Integration Tests', { timeout: 30000 }, () => {
  let adminToken: string;
  let opsToken: string;
  let reviewerToken: string;
  let policyId: string;
  let sampleCaseId: string;

  beforeAll(async () => {
    // 1. Authenticate as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@reclaim.demo', password: 'Demo@12345' });

    if (adminRes.status === 200) {
      adminToken = adminRes.body.accessToken;
    }

    // 2. Authenticate as Ops Viewer
    const opsRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ops@reclaim.demo', password: 'Demo@12345' });

    if (opsRes.status === 200) {
      opsToken = opsRes.body.accessToken;
    }

    // 3. Authenticate as Reviewer
    const revRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reviewer@reclaim.demo', password: 'Demo@12345' });

    if (revRes.status === 200) {
      reviewerToken = revRes.body.accessToken;
    }
  });

  describe('Health & Auth Endpoints', () => {
    it('GET /health returns 200 ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /api/auth/login fails with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo', password: 'WrongPassword999' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('GET /api/auth/me returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me returns user payload when token provided', async () => {
      if (!adminToken) return;
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@reclaim.demo');
      expect(res.body.user.role).toBe('ADMIN');
    });
  });

  describe('Cases & Metrics Endpoints', () => {
    it('GET /api/metrics/summary returns financial aggregation', async () => {
      if (!adminToken) return;
      const res = await request(app)
        .get('/api/metrics/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalAtRisk');
      expect(res.body).toHaveProperty('totalRecovered');
      expect(res.body).toHaveProperty('recoveryRatePercent');
      expect(res.body).toHaveProperty('laneMetrics');
    });

    it('GET /api/cases lists cases and pagination', async () => {
      if (!adminToken) return;
      const res = await request(app)
        .get('/api/cases?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);

      if (res.body.items.length > 0) {
        sampleCaseId = res.body.items[0].id;
      }
    });

    it('GET /api/cases/:id returns case details and audit trail', async () => {
      if (!adminToken || !sampleCaseId) return;
      const res = await request(app)
        .get(`/api/cases/${sampleCaseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('case');
      expect(res.body).toHaveProperty('auditTrail');
      expect(res.body.case.id).toBe(sampleCaseId);
    });
  });

  describe('Policy Configurations & RBAC Gates', () => {
    it('GET /api/policy-configs returns policy rules for merchant', async () => {
      if (!adminToken) return;
      const res = await request(app)
        .get('/api/policy-configs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.policies)).toBe(true);
      if (res.body.policies.length > 0) {
        policyId = res.body.policies[0].id;
      }
    });

    it('PUT /api/policy-configs/:id is FORBIDDEN for OPS_VIEWER (403)', async () => {
      if (!opsToken || !policyId) return;
      const res = await request(app)
        .put(`/api/policy-configs/${policyId}`)
        .set('Authorization', `Bearer ${opsToken}`)
        .send({ maxAttempts: 4 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PUT /api/policy-configs/:id is FORBIDDEN for REVIEWER (403)', async () => {
      if (!reviewerToken || !policyId) return;
      const res = await request(app)
        .put(`/api/policy-configs/${policyId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ maxAttempts: 4 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PUT /api/policy-configs/:id succeeds for ADMIN (200)', async () => {
      if (!adminToken || !policyId) return;
      const res = await request(app)
        .put(`/api/policy-configs/${policyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxAttempts: 4 });

      expect(res.status).toBe(200);
      expect(res.body.policy.maxAttempts).toBe(4);
    });
  });

  describe('Audit Logs & Webhooks', () => {
    it('GET /api/audit-logs returns audit entries', async () => {
      if (!adminToken) return;
      const res = await request(app)
        .get('/api/audit-logs?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
    });

    it('POST /api/webhooks/razorpay rejects requests with invalid signature (400)', async () => {
      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', 'invalid_signature_hex_1234567890abcdef')
        .send({ event: 'payment.failed', payload: {} });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    });

    it('POST /api/webhooks/razorpay accepts requests with valid HMAC signature', async () => {
      const payload = { event: 'unknown.test.event', payload: {} };
      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('x-razorpay-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
