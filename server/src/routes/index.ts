import { Router } from 'express';
import { authRouter } from './auth.routes';
import { caseRouter } from './case.routes';
import { metricsRouter } from './metrics.routes';
import { policyRouter } from './policy.routes';
import { auditRouter } from './audit.routes';
import { agentRouter } from './agent.routes';
import { webhookRouter } from './webhook.routes';
import { apiRateLimiter } from '../middleware/rate-limit.middleware';

export const apiRouter = Router();

// Apply general API rate limiting across API routes
apiRouter.use(apiRateLimiter);

apiRouter.use('/auth', authRouter);
apiRouter.use('/cases', caseRouter);
apiRouter.use('/metrics', metricsRouter);
apiRouter.use('/policy-configs', policyRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/agent', agentRouter);
apiRouter.use('/webhooks', webhookRouter);
