import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per IP for testing suites
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again after 15 minutes.',
    },
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5000, // 5000 requests per minute for automated suites & real-time testing
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded. Please slow down your requests.',
    },
  },
});

