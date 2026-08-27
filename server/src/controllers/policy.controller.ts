import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { auditService } from '../services/audit.service';
import { logger } from '../lib/logger';
import { cacheService } from '../lib/cache';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class PolicyController {
  async getPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const where = req.user?.merchantId ? { merchantId: req.user.merchantId } : {};
      const policies = await prisma.policyConfig.findMany({
        where,
        orderBy: { lane: 'asc' },
      });

      res.json({ policies });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, 'Get policy configs error');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve policy configurations',
        },
      });
    }
  }

  async updatePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        maxAttempts,
        cooldownMinutes,
        contactHourStart,
        contactHourEnd,
        maxIncentiveAmount,
        dailyCapGlobal,
      } = req.body;

      const existing = await prisma.policyConfig.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({
          error: {
            code: 'POLICY_NOT_FOUND',
            message: `Policy config ${id} not found`,
          },
        });
        return;
      }

      if (req.user?.merchantId && existing.merchantId !== req.user.merchantId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this policy',
          },
        });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.policyConfig.update({
          where: { id },
          data: {
            ...(maxAttempts !== undefined && { maxAttempts }),
            ...(cooldownMinutes !== undefined && { cooldownMinutes }),
            ...(contactHourStart !== undefined && { contactHourStart }),
            ...(contactHourEnd !== undefined && { contactHourEnd }),
            ...(maxIncentiveAmount !== undefined && { maxIncentiveAmount }),
            ...(dailyCapGlobal !== undefined && { dailyCapGlobal }),
          },
        });

        await auditService.log(
          {
            actor: req.user ? `human:${req.user.userId}` : 'system',
            entityType: 'PolicyConfig',
            entityId: id,
            eventType: 'policy_config_updated',
            beforeJson: existing,
            afterJson: result,
            reason: `Policy config for lane ${existing.lane} updated by Admin`,
          },
          tx
        );

        return result;
      });

      // Invalidate metrics cache as policy changes may affect caps and thresholds
      await cacheService.invalidateMetrics(existing.merchantId || undefined);

      res.json({
        message: 'Policy configuration updated successfully',
        policy: updated,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message, policyId: req.params.id }, 'Update policy config error');
      res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: message || 'Failed to update policy configuration',
        },
      });
    }
  }
}

export const policyController = new PolicyController();
