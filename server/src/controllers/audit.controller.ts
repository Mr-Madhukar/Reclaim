import { Response } from 'express';
import { auditService } from '../services/audit.service';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuditController {
  async listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityId, entityType, eventType, page, limit } = req.query;

      const result = await auditService.getAuditLogs({
        entityId: entityId ? String(entityId) : undefined,
        entityType: entityType ? String(entityType) : undefined,
        eventType: eventType ? String(eventType) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.json(result);
    } catch (err: any) {
      logger.error({ err: err.message }, 'List audit logs error');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve audit logs',
        },
      });
    }
  }
}

export const auditController = new AuditController();
