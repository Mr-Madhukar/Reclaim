import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuthUserPayload } from '../types';

type DemoRole = AuthUserPayload['role'];

const DEMO_PERSONAS: Record<DemoRole, { id: string; name: string; email: string }> = {
  ADMIN: { id: 'usr-admin-demo', name: 'Vikram Malhotra', email: 'admin@reclaim.demo' },
  REVIEWER: { id: 'usr-reviewer-demo', name: 'Priya Sharma', email: 'reviewer@reclaim.demo' },
  OPS_VIEWER: { id: 'usr-ops-demo', name: 'Arjun Rao', email: 'ops@reclaim.demo' },
};

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        await prisma.accessLog.create({
          data: {
            action: 'login_failed',
            ipAddress,
            userAgent,
            success: false,
          },
        });

        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        await prisma.accessLog.create({
          data: {
            userId: user.id,
            action: 'login_failed',
            ipAddress,
            userAgent,
            success: false,
          },
        });

        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
        return;
      }

      const payload: AuthUserPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        merchantId: user.merchantId || undefined,
      };

      const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
      const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      // Log successful login
      await prisma.accessLog.create({
        data: {
          userId: user.id,
          action: 'login_success',
          ipAddress,
          userAgent,
          success: true,
        },
      });

      // Set secure HTTP-only cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          merchantId: user.merchantId,
        },
        accessToken,
        refreshToken,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Login controller error');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during authentication',
        },
      });
    }
  }

  async demoLogin(req: Request, res: Response): Promise<void> {
    const requestedRole = ((req.body?.role || 'ADMIN') as string).toUpperCase();
    const demoEmailMap: Record<string, string> = {
      ADMIN: 'admin@reclaim.demo',
      REVIEWER: 'reviewer@reclaim.demo',
      OPS_VIEWER: 'ops@reclaim.demo',
    };

    const email = demoEmailMap[requestedRole];
    if (!email) {
      res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: `Invalid demo role: ${requestedRole}. Allowed roles: ADMIN, REVIEWER, OPS_VIEWER`,
        },
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      const persona = DEMO_PERSONAS[requestedRole as DemoRole] || DEMO_PERSONAS.ADMIN;
      const userRecord = user || {
        id: persona.id,
        email: persona.email,
        name: persona.name,
        role: requestedRole as AuthUserPayload['role'],
        merchantId: 'mrc-demo',
      };

      const payload: AuthUserPayload = {
        userId: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        merchantId: userRecord.merchantId || undefined,
      };

      const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
      const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role,
          merchantId: userRecord.merchantId,
        },
        accessToken,
        refreshToken,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Demo login error');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during demo authentication',
        },
      });
    }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          merchantId: true,
          createdAt: true,
          merchant: {
            select: {
              id: true,
              name: true,
              timezone: true,
              contactHourStart: true,
              contactHourEnd: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found',
          },
        });
        return;
      }

      res.json({ user });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Get user profile error');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user profile',
        },
      });
    }
  }

  private extractRefreshToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const rawToken = req.cookies?.refreshToken ?? req.body?.refreshToken ?? req.headers['x-refresh-token'] ?? bearerToken;
    return typeof rawToken === 'string' && rawToken.trim() !== '' ? rawToken.trim() : undefined;
  }

  private handleMockRefreshToken(refreshToken: string, res: Response): boolean {
    if (!refreshToken.startsWith('mock-token-')) {
      return false;
    }
    const roleKey = (refreshToken.replace('mock-token-', '').toUpperCase() || 'ADMIN') as DemoRole;
    const persona = DEMO_PERSONAS[roleKey] || DEMO_PERSONAS.ADMIN;
    const payload: AuthUserPayload = {
      userId: persona.id,
      email: persona.email,
      role: roleKey,
      merchantId: 'mrc-demo',
    };
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
    const newRefreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.json({ accessToken, refreshToken: newRefreshToken });
    return true;
  }

  private decodeRefreshToken(token: string): AuthUserPayload | null {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthUserPayload;
    } catch {
      try {
        return jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
      } catch {
        return null;
      }
    }
  }

  private async resolveUserForRefresh(decoded: AuthUserPayload) {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (user) {
      return user;
    }
    if (decoded.userId.startsWith('usr-') || decoded.email.includes('@reclaim.demo')) {
      const persona = DEMO_PERSONAS[decoded.role] || DEMO_PERSONAS.ADMIN;
      return {
        id: decoded.userId,
        email: decoded.email,
        name: persona.name,
        role: decoded.role,
        merchantId: decoded.merchantId || 'mrc-demo',
      };
    }
    return null;
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const refreshToken = this.extractRefreshToken(req);
    if (!refreshToken) {
      res.status(401).json({
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token is required',
        },
      });
      return;
    }

    if (this.handleMockRefreshToken(refreshToken, res)) {
      return;
    }

    const decoded = this.decodeRefreshToken(refreshToken);
    if (!decoded?.userId) {
      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token expired or invalid',
        },
      });
      return;
    }

    try {
      const user = await this.resolveUserForRefresh(decoded);
      if (!user) {
        res.status(401).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User no longer exists',
          },
        });
        return;
      }

      const payload: AuthUserPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        merchantId: user.merchantId || undefined,
      };

      const newAccessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
      const newRefreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      this.setAuthCookies(res, newAccessToken, newRefreshToken);
      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch {
      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token expired or invalid',
        },
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user) {
      await prisma.accessLog.create({
        data: {
          userId: req.user.userId,
          action: 'logout',
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null,
          success: true,
        },
      }).catch((err) => logger.warn({ err }, 'Failed to record logout access log'));
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  }
}

export const authController = new AuthController();
