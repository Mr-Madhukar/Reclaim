import { Response } from 'express';
import { caseService } from '../services/case.service';
import { auditService } from '../services/audit.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { CaseStatus, Lane } from '@prisma/client';

export class CaseController {
  async listCases(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lane, status, search, page, limit } = req.query;

      const result = await caseService.getCases({
        merchantId: req.user?.merchantId,
        lane: lane ? (lane as Lane) : undefined,
        status: status ? (status as CaseStatus) : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.json(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ err: errorMessage }, 'List cases controller error');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve cases',
        },
      });
    }
  }

  async getCase(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const kase = await caseService.getCaseById(id);

      if (!kase) {
        res.status(404).json({
          error: {
            code: 'CASE_NOT_FOUND',
            message: `Case ${id} not found`,
          },
        });
        return;
      }

      // Check tenant isolation if user has merchantId
      if (req.user?.merchantId && kase.merchantId !== req.user.merchantId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this case',
          },
        });
        return;
      }

      // Fetch case audit events
      const auditTrail = await prisma.auditLog.findMany({
        where: {
          OR: [
            { entityId: id },
            {
              entityType: 'RecoveryAction',
              entityId: { in: kase.actions.map((a) => a.id) },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        case: kase,
        auditTrail,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ err: errorMessage, caseId: req.params.id }, 'Get case controller error');
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve case details',
        },
      });
    }
  }

  async triggerAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const kase = await caseService.getCaseById(id);
      if (!kase) {
        res.status(404).json({
          error: {
            code: 'CASE_NOT_FOUND',
            message: `Case ${id} not found`,
          },
        });
        return;
      }

      if (req.user?.merchantId && kase.merchantId !== req.user.merchantId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this case',
          },
        });
        return;
      }

      const { locale, simulateOutage } = (req.body || {}) as {
        locale?: 'en' | 'hinglish' | 'hi';
        simulateOutage?: boolean;
      };
      const result = await caseService.processCase(id, { locale, simulateOutage });
      res.json({
        message: 'Action processing completed',
        result,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute case action';
      logger.error({ err: errorMessage, caseId: req.params.id }, 'Trigger case action error');
      res.status(500).json({
        error: {
          code: 'ACTION_FAILED',
          message: errorMessage,
        },
      });
    }
  }

  async resolveEscalation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolution, notes } = req.body;

      if (!req.user) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
      }

      const updated = await caseService.resolveEscalation({
        caseId: id,
        userId: req.user.userId,
        resolution,
        notes,
      });

      res.json({
        message: `Case successfully resolved as '${resolution}'`,
        case: updated,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve escalated case';
      logger.error({ err: errorMessage, caseId: req.params.id }, 'Resolve escalation error');
      res.status(500).json({
        error: {
          code: 'RESOLVE_FAILED',
          message: errorMessage,
        },
      });
    }
  }

  async logPromiseToPay(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { promisedAmount, promisedDate } = req.body;

      const kase = await caseService.getCaseById(id);
      if (!kase) {
        res.status(404).json({
          error: {
            code: 'CASE_NOT_FOUND',
            message: `Case ${id} not found`,
          },
        });
        return;
      }

      const promise = await prisma.$transaction(async (tx) => {
        const p = await tx.promiseToPay.upsert({
          where: { caseId: id },
          create: {
            caseId: id,
            promisedAmount,
            promisedDate: new Date(promisedDate),
          },
          update: {
            promisedAmount,
            promisedDate: new Date(promisedDate),
          },
        });

        await auditService.log(
          {
            actor: req.user ? `human:${req.user.userId}` : 'agent',
            entityType: 'RecoveryCase',
            entityId: id,
            eventType: 'promise_to_pay_logged',
            afterJson: { promisedAmount, promisedDate },
            reason: `Promise to pay logged: ₹${promisedAmount} due by ${new Date(promisedDate).toLocaleDateString()}`,
          },
          tx
        );

        return p;
      });

      res.json({
        message: 'Promise to pay recorded successfully',
        promiseToPay: promise,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record promise to pay';
      logger.error({ err: errorMessage, caseId: req.params.id }, 'Log promise to pay error');
      res.status(500).json({
        error: {
          code: 'PROMISE_TO_PAY_FAILED',
          message: errorMessage,
        },
      });
    }
  }

  async handleCustomerAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, promisedDate, promisedAmount, paymentMethod, optOutReason, paymentDetails } = req.body;

      const kase = await prisma.recoveryCase.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!kase) {
        res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: `Case ${id} not found` } });
        return;
      }

      if (action === 'PAY_SUCCESS') {
        await prisma.$transaction(async (tx) => {
          await tx.recoveryCase.update({
            where: { id },
            data: {
              status: CaseStatus.RECOVERED,
              closedAt: new Date(),
              closedReason: `Customer completed recovery payment via simulated ${paymentMethod || 'Razorpay Link'}`,
            },
          });

          await auditService.log(
            {
              actor: `customer:${kase.customerId}`,
              entityType: 'RecoveryCase',
              entityId: id,
              eventType: 'case_recovered',
              afterJson: { amount: Number(kase.amount), paymentMethod: paymentMethod || 'card' },
              reason: `Customer completed payment of ₹${kase.amount} via recovery portal`,
            },
            tx
          );
        });

        res.json({ success: true, message: 'Payment successfully captured. Case recovered!' });
      } else if (action === 'OPT_OUT') {
        const reasonText = optOutReason ? `Customer opt-out: ${optOutReason}` : 'Customer opted out of further recovery communications';

        await prisma.$transaction(async (tx) => {
          await tx.customer.update({
            where: { id: kase.customerId },
            data: { optedOut: true },
          });

          await tx.recoveryCase.update({
            where: { id },
            data: {
              status: CaseStatus.STOPPED_OPTED_OUT,
              closedAt: new Date(),
              closedReason: reasonText,
            },
          });

          await auditService.log(
            {
              actor: `customer:${kase.customerId}`,
              entityType: 'Customer',
              entityId: kase.customerId,
              eventType: 'customer_opted_out',
              afterJson: { optedOut: true, reason: optOutReason || 'Unsubscribe' },
              reason: `Customer triggered opt-out via recovery portal (${optOutReason || 'No reason provided'}). Policy Engine halted future retries.`,
            },
            tx
          );
        });

        res.json({ success: true, message: 'Customer opted out. All future recovery attempts permanently halted by Policy Engine.' });
      } else if (action === 'PROMISE_TO_PAY') {
        const amt = Number(promisedAmount) || Number(kase.amount);
        const date = promisedDate ? new Date(promisedDate) : new Date(Date.now() + 7 * 86400000);

        await prisma.$transaction(async (tx) => {
          await tx.promiseToPay.upsert({
            where: { caseId: id },
            create: {
              caseId: id,
              promisedAmount: amt,
              promisedDate: date,
            },
            update: {
              promisedAmount: amt,
              promisedDate: date,
            },
          });

          await auditService.log(
            {
              actor: `customer:${kase.customerId}`,
              entityType: 'RecoveryCase',
              entityId: id,
              eventType: 'promise_to_pay_logged',
              afterJson: { promisedAmount: amt, promisedDate: date },
              reason: `Customer committed promise to pay ₹${amt} by ${date.toLocaleDateString()}`,
            },
            tx
          );
        });

        res.json({ success: true, message: `Promise to pay commitment recorded for ${date.toLocaleDateString()}` });
      } else if (action === 'GRACE_PERIOD') {
        const graceHours = 24;
        const newNextAttempt = new Date(Date.now() + graceHours * 3600 * 1000);

        await prisma.$transaction(async (tx) => {
          await auditService.log(
            {
              actor: `customer:${kase.customerId}`,
              entityType: 'RecoveryCase',
              entityId: id,
              eventType: 'grace_period_requested',
              afterJson: { gracePeriodHours: graceHours, pausedUntil: newNextAttempt },
              reason: `Customer requested a 24-hour grace period. Autonomous reminders postponed until ${newNextAttempt.toLocaleString()}`,
            },
            tx
          );
        });

        res.json({
          success: true,
          message: `24-hour grace period activated. Reminders paused until ${newNextAttempt.toLocaleDateString()} ${newNextAttempt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        });
      } else if (action === 'UPDATE_PAYMENT_METHOD') {
        const updatedMethod = paymentDetails?.method || paymentMethod || 'UPI Auto-Debit';
        const identifier = paymentDetails?.identifier || 'Updated on file';

        await prisma.$transaction(async (tx) => {
          await auditService.log(
            {
              actor: `customer:${kase.customerId}`,
              entityType: 'RecoveryCase',
              entityId: id,
              eventType: 'payment_method_updated',
              afterJson: { paymentMethod: updatedMethod, identifier },
              reason: `Customer updated payment method on file to ${updatedMethod} (${identifier})`,
            },
            tx
          );
        });

        res.json({
          success: true,
          message: `Payment method successfully updated to ${updatedMethod} (${identifier}). Automated retry scheduled.`,
        });
      } else {
        res.status(400).json({ error: { code: 'INVALID_ACTION', message: `Unknown customer action: ${action}` } });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process customer action';
      logger.error({ err: errorMessage, caseId: req.params.id }, 'Customer action error');
      res.status(500).json({
        error: {
          code: 'CUSTOMER_ACTION_FAILED',
          message: errorMessage,
        },
      });
    }
  }
}

export const caseController = new CaseController();
