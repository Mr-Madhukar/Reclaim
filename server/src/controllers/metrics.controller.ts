import { Response } from 'express';
import { caseService } from '../services/case.service';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class MetricsController {
  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const summary = await caseService.getMetrics(req.user?.merchantId);
      res.json(summary);
    } catch (err: any) {
      logger.error({ err: err.message }, 'Get metrics summary error');
      res.status(500).json({
        error: {
          code: 'METRICS_ERROR',
          message: 'Failed to compute recovery metrics',
        },
      });
    }
  }

  async getByLane(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const summary = await caseService.getMetrics(req.user?.merchantId);
      res.json({
        laneMetrics: summary.laneMetrics,
        rootCauseBreakdown: summary.rootCauseBreakdown,
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Get lane metrics error');
      res.status(500).json({
        error: {
          code: 'METRICS_ERROR',
          message: 'Failed to compute lane metrics',
        },
      });
    }
  }
}

export const metricsController = new MetricsController();
