import pino from 'pino';
import { env } from '../config/env';

/**
 * Sanitize untrusted input before logging to prevent log injection (CWE-117 / S5145)
 */
export function sanitizeLog(input: unknown): string {
  const str = typeof input === 'string' ? input : String(input ?? '');
  return str.replace(/[\r\n\t]/g, '_').slice(0, 500);
}

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'password',
      'passwordHash',
      'email',
      'phone',
      'customer.email',
      'customer.phone',
      'RAZORPAY_KEY_SECRET',
      'GEMINI_API_KEY',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
});
