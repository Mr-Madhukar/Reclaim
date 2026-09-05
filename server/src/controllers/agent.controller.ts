import { Response } from 'express';
import { caseService } from '../services/case.service';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AgentController {
  async runBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      logger.info({ userId: req.user?.userId }, 'Starting autonomous recovery batch run via API');

      const { limit } = req.body || {};
      const batchResult = await caseService.runBatch(req.user?.merchantId, { limit });
      const metrics = await caseService.getMetrics(req.user?.merchantId);

      const results = batchResult.results || [];
      const recoveredCount = results.filter(
        (r) => r.status === 'RECOVERED' || r.outcome === 'recovered'
      ).length;
      const stoppedCount = results.filter(
        (r) => r.ruleTriggered || r.outcome === 'stopped' || r.outcome === 'guardrail_stop'
      ).length;
      const escalatedCount = results.filter(
        (r) => r.status === 'ESCALATED_TO_HUMAN' || (r.status as string) === 'ESCALATED' || r.outcome === 'escalated'
      ).length;
      const errorsCount = results.filter(
        (r) => r.outcome === 'error'
      ).length;
      const durationMs = Date.now() - startTime;

      res.json({
        message: 'Batch run finished',
        processedCount: batchResult.processedCount,
        recoveredCount,
        stoppedCount,
        escalatedCount,
        errorsCount,
        durationMs,
        results: batchResult.results,
        metrics,
        evaluation: metrics.evaluation,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Agent batch run controller error');
      res.status(500).json({
        error: {
          code: 'BATCH_RUN_FAILED',
          message: message || 'Failed to complete agent batch run',
        },
      });
    }
  }

  async getEvaluation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const benchmark = await caseService.getEvaluationBenchmark(req.user?.merchantId);
      res.json(benchmark);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Get evaluation benchmark error');
      res.status(500).json({
        error: {
          code: 'EVALUATION_ERROR',
          message: 'Failed to compute evaluation benchmark',
        },
      });
    }
  }
}

export const agentController = new AgentController();
