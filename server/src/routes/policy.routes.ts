import { Router } from 'express';
import { policyController } from '../controllers/policy.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { updatePolicyConfigSchema } from '../schemas';

export const policyRouter = Router();

policyRouter.get('/', authenticateToken, (req, res) => {
  policyController.getPolicies(req, res);
});

policyRouter.put('/:id', authenticateToken, requireRole(['ADMIN']), validateBody(updatePolicyConfigSchema), (req, res) => {
  policyController.updatePolicy(req, res);
});
