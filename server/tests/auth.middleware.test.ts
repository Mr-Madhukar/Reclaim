import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../src/middleware/auth.middleware';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

/**
 * Helper to create mock Express req/res/next
 */
function createMocks(overrides?: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}) {
  const req = {
    headers: overrides?.headers || {},
    cookies: overrides?.cookies || {},
  } as unknown as AuthenticatedRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

describe('Auth Middleware — authenticateToken', () => {
  it('returns 401 when no token is provided', () => {
    const { req, res, next } = createMocks();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    const { req, res, next } = createMocks({
      headers: { authorization: 'Bearer invalid_garbage_token' },
    });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const expiredToken = jwt.sign(
      { userId: 'test-id', email: 'test@test.com', role: 'ADMIN' },
      env.JWT_SECRET,
      { expiresIn: '0s' }
    );

    const { req, res, next } = createMocks({
      headers: { authorization: `Bearer ${expiredToken}` },
    });

    // Small delay to ensure expiry
    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user with valid Bearer token', () => {
    const payload = { userId: 'user-123', email: 'admin@test.com', role: 'ADMIN' as const };
    const validToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });

    const { req, res, next } = createMocks({
      headers: { authorization: `Bearer ${validToken}` },
    });

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('user-123');
    expect(req.user?.email).toBe('admin@test.com');
    expect(req.user?.role).toBe('ADMIN');
  });

  it('reads token from cookie when Authorization header is missing', () => {
    const payload = { userId: 'user-456', email: 'ops@test.com', role: 'OPS_VIEWER' as const };
    const validToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });

    const { req, res, next } = createMocks({
      cookies: { accessToken: validToken },
    });

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe('user-456');
    expect(req.user?.role).toBe('OPS_VIEWER');
  });

  it('prefers Authorization header token over cookie', () => {
    const headerPayload = { userId: 'header-user', email: 'h@test.com', role: 'ADMIN' as const };
    const cookiePayload = { userId: 'cookie-user', email: 'c@test.com', role: 'REVIEWER' as const };

    const headerToken = jwt.sign(headerPayload, env.JWT_SECRET, { expiresIn: '1h' });
    const cookieToken = jwt.sign(cookiePayload, env.JWT_SECRET, { expiresIn: '1h' });

    const { req, res, next } = createMocks({
      headers: { authorization: `Bearer ${headerToken}` },
      cookies: { accessToken: cookieToken },
    });

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe('header-user');
  });
});

describe('Auth Middleware — requireRole', () => {
  it('returns 401 when req.user is not set', () => {
    const middleware = requireRole(['ADMIN']);
    const { req, res, next } = createMocks();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not in allowed list', () => {
    const middleware = requireRole(['ADMIN']);
    const { req, res, next } = createMocks();
    req.user = { userId: 'u1', email: 'ops@test.com', role: 'OPS_VIEWER' };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user role is in allowed list', () => {
    const middleware = requireRole(['ADMIN', 'REVIEWER']);
    const { req, res, next } = createMocks();
    req.user = { userId: 'u2', email: 'reviewer@test.com', role: 'REVIEWER' };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows ADMIN access to admin-only routes', () => {
    const middleware = requireRole(['ADMIN']);
    const { req, res, next } = createMocks();
    req.user = { userId: 'u3', email: 'admin@test.com', role: 'ADMIN' };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks OPS_VIEWER from write routes', () => {
    const middleware = requireRole(['ADMIN', 'REVIEWER']);
    const { req, res, next } = createMocks();
    req.user = { userId: 'u4', email: 'ops@test.com', role: 'OPS_VIEWER' };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
