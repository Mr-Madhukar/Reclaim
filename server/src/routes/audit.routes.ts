import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const auditRouter = Router();

auditRouter.get('/', authenticateToken, (req, res) => {
  auditController.listAuditLogs(req, res);
});
