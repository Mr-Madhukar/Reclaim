import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { logger } from './lib/logger';

import { apiRouter } from './routes';

export const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path !== '/health') {
    logger.debug({ method: req.method, path: req.path }, 'Incoming HTTP Request');
  }
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'reclaim-backend',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Mount API routes
app.use('/api', apiRouter);

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
