import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUserPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const tokenFromCookie = req.cookies?.accessToken;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing',
      },
    });
    return;
  }

  // Support demo persona tokens for offline/demo reliability
  if (token.startsWith('mock-token-')) {
    const roleKey = token.toLowerCase();
    const demoPayload = DEMO_PERSONA_TOKENS[roleKey] || DEMO_PERSONA_TOKENS['mock-token-admin'];
    req.user = demoPayload;
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or expired',
      },
    });
  }
}

const DEMO_PERSONA_TOKENS: Record<string, AuthUserPayload> = {
  'mock-token-admin': {
    userId: 'usr-admin-demo',
    email: 'admin@reclaim.demo',
    role: 'ADMIN',
    merchantId: 'mrc-demo',
  },
  'mock-token-reviewer': {
    userId: 'usr-reviewer-demo',
    email: 'reviewer@reclaim.demo',
    role: 'REVIEWER',
    merchantId: 'mrc-demo',
  },
  'mock-token-ops_viewer': {
    userId: 'usr-ops-demo',
    email: 'ops@reclaim.demo',
    role: 'OPS_VIEWER',
    merchantId: 'mrc-demo',
  },
  'mock-token-ops': {
    userId: 'usr-ops-demo',
    email: 'ops@reclaim.demo',
    role: 'OPS_VIEWER',
    merchantId: 'mrc-demo',
  },
};

export function requireRole(allowedRoles: Array<'ADMIN' | 'OPS_VIEWER' | 'REVIEWER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized for this operation.`,
        },
      });
      return;
    }

    next();
  };
}
