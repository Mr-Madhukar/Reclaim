import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import crypto from 'crypto';
import { env } from './config/env';
import { logger } from './lib/logger';

import { apiRouter } from './routes';

export const app = express();

// Response compression (gzip/deflate for payloads > 1KB)
app.use(
  compression({
    threshold: 1024,
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Security headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Additional security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS configuration — supports comma-separated origins and ignores trailing slashes
const allowedOrigins = env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, ''));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*') || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(null, true); // Allow origin dynamically for credentials
    },
    credentials: true,
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request ID correlation — thread a unique ID through each request for tracing
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  (req as Request & { requestId: string }).requestId = requestId;
  next();
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path !== '/health') {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.debug({ method: req.method, path: req.path, requestId }, 'Incoming HTTP Request');
  }
  next();
});

// Health check endpoint
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'reclaim-backend',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Mount API routes (both /api prefix and direct paths)
app.use('/api', apiRouter);
app.use(apiRouter);

interface AppError extends Partial<Error> {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: unknown;
}

// Centralized error handler
app.use((err: AppError, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(
    {
      err: err.stack || err,
      path: req.path,
      method: req.method,
      statusCode,
    },
    'Unhandled request error'
  );

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' && statusCode === 500 ? 'An unexpected error occurred' : message,
      details: err.details || undefined,
    },
  });
});
