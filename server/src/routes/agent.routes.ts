import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

export const agentRouter = Router();

agentRouter.post('/run-batch', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  agentController.runBatch(req, res);
});
