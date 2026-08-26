import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    if (env.NODE_ENV === 'test') return null;
    return Math.min(times * 100, 3000);
  },
});

redisConnection.on('error', (err) => {
  if (env.NODE_ENV !== 'test') {
    logger.warn({ err: err.message }, 'Redis connection warning (background queue features will queue or retry)');
  }
});
