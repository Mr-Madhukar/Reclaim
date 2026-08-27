import { Response } from 'express';
import { caseService } from '../services/case.service';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { cacheService, cacheKeys } from '../lib/cache';

export class MetricsController {
  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId;
      const forceRefresh = req.query.refresh === 'true';
      const key = cacheKeys.metricsSummary(merchantId);

      if (forceRefresh) {
        await cacheService.del(key);
      }

      const summary = await cacheService.getOrSet(
        key,
        () => caseService.getMetrics(merchantId),
        60 // 60 seconds TTL
      );

      res.json(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Get metrics summary error');
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
      const merchantId = req.user?.merchantId;
      const forceRefresh = req.query.refresh === 'true';
      const key = cacheKeys.metricsByLane(merchantId);

      if (forceRefresh) {
        await cacheService.del(key);
      }

      const laneData = await cacheService.getOrSet(
        key,
        async () => {
          const summary = await caseService.getMetrics(merchantId);
          return {
            laneMetrics: summary.laneMetrics,
            rootCauseBreakdown: summary.rootCauseBreakdown,
          };
        },
        60 // 60 seconds TTL
      );

      res.json(laneData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Get lane metrics error');
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
