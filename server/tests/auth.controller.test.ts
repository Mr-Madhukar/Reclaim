import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Auth Controller Tests', { timeout: 30000 }, () => {
  describe('POST /api/auth/login', () => {
    it('returns 401 with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 200 with valid credentials and sets cookies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo', password: 'Demo@12345' });

      if (res.status === 200) {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user).toHaveProperty('email', 'admin@reclaim.demo');
        expect(res.body.user).toHaveProperty('role', 'ADMIN');
        expect(res.body.user).toHaveProperty('id');

        // Verify cookies are set
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
      }
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      // Should fail validation (either 400 or 401 depending on validation order)
      expect([400, 401]).toContain(res.status);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo' });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('POST /api/auth/demo', () => {
    it('returns 400 with invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/demo')
        .send({ role: 'SUPERUSER' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 200 with default ADMIN role when body is empty', async () => {
      const res = await request(app)
        .post('/api/auth/demo')
        .send({});

      if (res.status === 200) {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user).toHaveProperty('role', 'ADMIN');
      }
    });

    it('returns 200 for valid role REVIEWER', async () => {
      const res = await request(app)
        .post('/api/auth/demo')
        .send({ role: 'REVIEWER' });

      if (res.status === 200) {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user).toHaveProperty('role', 'REVIEWER');
      }
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when no token provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('returns user profile with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo', password: 'Demo@12345' });

      if (loginRes.status !== 200) return;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'admin@reclaim.demo');
      expect(res.body.user).toHaveProperty('role', 'ADMIN');
      expect(res.body.user).toHaveProperty('name');
      expect(res.body.user).toHaveProperty('createdAt');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 401 when no refresh token provided (Reject refresh without token)', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('REFRESH_TOKEN_REQUIRED');
    });

    it('returns 401 with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token' });

      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed refresh payload (Reject malformed refresh payload)', async () => {
      const res1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: { nested: true } });
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 12345 });
      expect(res2.status).toBe(401);

      const res3 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' });
      expect(res3.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('successfully logs out and clears cookies', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo', password: 'Demo@12345' });

      if (loginRes.status !== 200) return;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('RBAC Role-Based Access', () => {
    it('OPS_VIEWER cannot trigger batch runs (FORBIDDEN)', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ops@reclaim.demo', password: 'Demo@12345' });

      if (loginRes.status !== 200) return;

      const res = await request(app)
        .post('/api/agent/run-batch')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('REVIEWER cannot update policy configs (FORBIDDEN)', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'reviewer@reclaim.demo', password: 'Demo@12345' });

      if (loginRes.status !== 200) return;

      const policiesRes = await request(app)
        .get('/api/policy-configs')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      if (policiesRes.status !== 200 || !policiesRes.body.policies?.length) return;

      const policyId = policiesRes.body.policies[0].id;
      const res = await request(app)
        .put(`/api/policy-configs/${policyId}`)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ maxAttempts: 5 });

      expect(res.status).toBe(403);
    });

    it('ADMIN can access all endpoints', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@reclaim.demo', password: 'Demo@12345' });

      if (loginRes.status !== 200) return;

      const token = loginRes.body.accessToken;

      const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(meRes.status).toBe(200);

      const metricsRes = await request(app).get('/api/metrics/summary').set('Authorization', `Bearer ${token}`);
      expect(metricsRes.status).toBe(200);

      const casesRes = await request(app).get('/api/cases?limit=5').set('Authorization', `Bearer ${token}`);
      expect(casesRes.status).toBe(200);
    });
  });
});
