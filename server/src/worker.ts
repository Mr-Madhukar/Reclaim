import { logger } from './lib/logger';
import { env } from './config/env';

logger.info(`Reclaim BullMQ Worker process started [${env.NODE_ENV}]`);

// Keep worker process alive
process.on('SIGTERM', () => {
  logger.info('Worker shutting down on SIGTERM...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Worker shutting down on SIGINT...');
  process.exit(0);
});
