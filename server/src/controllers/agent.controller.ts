import { Response } from 'express';
import { caseService } from '../services/case.service';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AgentController {
  async runBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info({ userId: req.user?.userId }, 'Starting autonomous recovery batch run via API');

      const batchResult = await caseService.runBatch(req.user?.merchantId);
      const metrics = await caseService.getMetrics(req.user?.merchantId);

      res.json({
        message: 'Batch run finished',
        processedCount: batchResult.processedCount,
        results: batchResult.results,
        metrics,
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Agent batch run controller error');
      res.status(500).json({
        error: {
          code: 'BATCH_RUN_FAILED',
          message: err.message || 'Failed to complete agent batch run',
        },
      });
    }
  }
}

export const agentController = new AgentController();
