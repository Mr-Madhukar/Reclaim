import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const metricsRouter = Router();

metricsRouter.get('/summary', authenticateToken, (req, res) => {
  metricsController.getSummary(req, res);
});

metricsRouter.get('/by-lane', authenticateToken, (req, res) => {
  metricsController.getByLane(req, res);
});
