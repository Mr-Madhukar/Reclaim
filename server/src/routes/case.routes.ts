import { Router } from 'express';
import { caseController } from '../controllers/case.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { caseFilterSchema, escalateResponseSchema, promiseToPaySchema } from '../schemas';

export const caseRouter = Router();

caseRouter.get('/', authenticateToken, validateQuery(caseFilterSchema), (req, res) => {
  caseController.listCases(req, res);
});

caseRouter.get('/:id', authenticateToken, (req, res) => {
  caseController.getCase(req, res);
});

caseRouter.post('/:id/trigger', authenticateToken, requireRole(['ADMIN', 'REVIEWER']), (req, res) => {
  caseController.triggerAction(req, res);
});

caseRouter.post('/:id/resolve', authenticateToken, requireRole(['ADMIN', 'REVIEWER']), validateBody(escalateResponseSchema), (req, res) => {
  caseController.resolveEscalation(req, res);
});

caseRouter.post('/:id/promise-to-pay', authenticateToken, requireRole(['ADMIN', 'REVIEWER']), validateBody(promiseToPaySchema), (req, res) => {
  caseController.logPromiseToPay(req, res);
});

caseRouter.post('/:id/customer-action', (req, res) => {
  caseController.handleCustomerAction(req, res);
});
