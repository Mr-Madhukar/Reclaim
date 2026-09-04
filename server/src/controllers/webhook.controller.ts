import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { auditService } from '../services/audit.service';
import { caseService } from '../services/case.service';
import { logger, sanitizeLog } from '../lib/logger';
import { cacheService } from '../lib/cache';
import { Lane, PaymentStatus, InvoiceStatus, CaseStatus } from '@prisma/client';

export const WEBHOOK_EVENTS = {
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_CAPTURED: 'payment.captured',
  ORDER_PAID: 'order.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
} as const;

const DEFAULT_CUSTOMER_NAME = 'Vikram Malhotra';
const FALLBACK_NAMES = ['Rohit Sharma', 'Ananya Iyer', 'Siddharth Verma', 'Deepika Rao', DEFAULT_CUSTOMER_NAME];

interface WebhookEntity {
  id?: string;
  amount?: number | string;
  amount_due?: number | string;
  currency?: string;
  status?: string;
  method?: string;
  error_code?: string;
  error_description?: string;
  email?: string;
  contact?: string;
  name?: string;
  order_id?: string;
  expire_by?: number;
  customer_name?: string;
  customer_email?: string;
  customer_contact?: string;
  notes?: {
    customer_name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface WebhookPayload {
  payment?: { entity?: WebhookEntity };
  order?: { entity?: WebhookEntity };
  invoice?: { entity?: WebhookEntity };
  [key: string]: unknown;
}

export class WebhookController {
  private verifySignature(rawBody: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return (
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    );
  }

  private async handlePaymentFailed(payload: WebhookPayload): Promise<void> {
    const payment = payload?.payment?.entity;
    if (!payment) return;

    let merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          name: 'Reclaim Demo Merchant Store',
          timezone: 'Asia/Kolkata',
        },
      });
    }

    const customerNameInput = payment.notes?.customer_name || payment.name;
    let customer = await prisma.customer.findFirst({
      where: { email: payment.email || 'customer@example.com' },
    });

    if (!customer) {
      const randomName = FALLBACK_NAMES[crypto.randomInt(0, FALLBACK_NAMES.length)];
      const resolvedName = customerNameInput || randomName;
      const emailPrefix = resolvedName.toLowerCase().replace(/\s+/g, '.');
      const randomSuffix = crypto.randomInt(100, 999);
      customer = await prisma.customer.create({
        data: {
          merchantId: merchant.id,
          name: customerNameInput || payment.notes?.customer_name || payment.name || randomName,
          email: payment.email || `${emailPrefix}.${randomSuffix}@example.com`,
          phone: payment.contact || '+919876543210',
        },
      });
    } else if (customerNameInput && customer.name !== customerNameInput) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: customerNameInput },
      });
    }

    const paymentAttempt = await prisma.paymentAttempt.create({
      data: {
        customerId: customer.id,
        orderId: payment.order_id || payment.id || `order_${Date.now()}`,
        amount: Number(payment.amount || 0) / 100, // paise to INR
        currency: payment.currency || 'INR',
        status: PaymentStatus.FAILED,
        failureCode: payment.error_code || 'GATEWAY_ERROR',
        failureReasonRaw: payment.error_description || 'Payment processing failed',
        paymentMethod: payment.method || 'card',
      },
    });

    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        lane: Lane.PAYMENT,
        sourceRefId: paymentAttempt.id,
        rootCause: payment.error_code?.toLowerCase() || 'unknown',
        status: 'OPEN',
        amount: Number(payment.amount || 0) / 100,
        shouldRecover: !customer.optedOut,
      },
    });

    const rawErrorDesc = typeof payment.error_description === 'string'
      ? payment.error_description.replace(/[\r\n]/g, ' ').trim().slice(0, 200)
      : 'Payment Failed';
    const safeErrorDesc = sanitizeLog(rawErrorDesc);
    const safePaymentId = typeof payment.id === 'string'
      ? payment.id.replace(/[\r\n]/g, '').trim().slice(0, 100)
      : '';

    await auditService.log({
      actor: 'system',
      entityType: 'RecoveryCase',
      entityId: recoveryCase.id,
      eventType: 'case_created',
      afterJson: { event: WEBHOOK_EVENTS.PAYMENT_FAILED, paymentId: safePaymentId, amount: Number(payment.amount || 0) / 100 },
      reason: `Recovery case opened via Razorpay webhook: ${safeErrorDesc}`,
    });

    await cacheService.invalidateMetrics(merchant.id);

    // Trigger immediate autonomous triage & policy evaluation
    try {
      await caseService.processCase(recoveryCase.id);
    } catch (procErr) {
      const procErrMsg = sanitizeLog(procErr instanceof Error ? procErr.message : procErr);
      logger.warn({ err: procErrMsg, caseId: sanitizeLog(recoveryCase.id) }, 'Autonomous case processing completed with note');
    }
  }

  private async handlePaymentCaptured(payload: WebhookPayload): Promise<void> {
    const payment = payload?.payment?.entity || payload?.order?.entity;
    if (!payment) return;

    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return;

    const email = payment.email || payment.customer_email || 'customer@example.com';
    const orderId = payment.order_id || payment.id || '';

    // 1. Try finding by matching orderId in paymentAttempts
    let recoveryCase = await prisma.recoveryCase.findFirst({
      where: {
        OR: [
          { sourceRefId: orderId },
          { customer: { email } },
        ],
        status: 'OPEN',
      },
      select: { id: true, amount: true, merchantId: true },
      orderBy: { openedAt: 'desc' },
    });

    // 2. Fallback: resolve the latest open case in the system for the merchant
    if (!recoveryCase) {
      recoveryCase = await prisma.recoveryCase.findFirst({
        where: {
          merchantId: merchant.id,
          status: 'OPEN',
        },
        select: { id: true, amount: true, merchantId: true },
        orderBy: { openedAt: 'desc' },
      });
    }

    if (!recoveryCase) {
      logger.info('No open case found to recover for payment captured event');
      return;
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.recoveryCase.update({
          where: { id: recoveryCase.id },
          data: {
            status: CaseStatus.RECOVERED,
            closedAt: new Date(),
            closedReason: `Payment captured successfully via webhook (${payment.id || orderId || 'captured'})`,
          },
        });

        const rawPaymentRef = typeof (payment.id || orderId) === 'string'
          ? String(payment.id || orderId).replace(/[\r\n]/g, '').trim().slice(0, 100)
          : 'captured';
        const paymentRef = sanitizeLog(rawPaymentRef);
        await auditService.log(
          {
            actor: 'system',
            entityType: 'RecoveryCase',
            entityId: recoveryCase.id,
            eventType: 'case_recovered',
            afterJson: { paymentId: paymentRef, amount: Number(recoveryCase.amount) },
            reason: `Case recovered: Payment captured on Razorpay (${paymentRef})`,
          },
          tx
        );
      },
      { timeout: 15000 }
    );

    await cacheService.invalidateMetrics(recoveryCase.merchantId || merchant.id);
  }

  private async handleInvoiceOverdue(payload: WebhookPayload): Promise<void> {
    const invoiceData = payload?.invoice?.entity;
    if (!invoiceData) return;

    const merchant = await prisma.merchant.findFirst({
      select: { id: true },
    });
    if (!merchant) return;

    let customer = await prisma.customer.findFirst({
      where: { email: invoiceData.customer_email || 'b2b@example.com' },
      select: { id: true, optedOut: true },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          merchantId: merchant.id,
          name: invoiceData.customer_name || 'B2B Client',
          email: invoiceData.customer_email || `b2b_${Date.now()}@example.com`,
          phone: invoiceData.customer_contact,
        },
        select: { id: true, optedOut: true },
      });
    } else if (invoiceData.customer_name) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { name: invoiceData.customer_name },
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        customerId: customer.id,
        invoiceNumber: invoiceData.id || `INV-${Date.now()}`,
        amountDue: Number(invoiceData.amount_due || invoiceData.amount) / 100,
        dueDate: new Date(invoiceData.expire_by ? invoiceData.expire_by * 1000 : Date.now() - 86400000),
        status: InvoiceStatus.OVERDUE,
      },
    });

    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        lane: Lane.RECEIVABLE,
        sourceRefId: invoice.id,
        rootCause: 'unknown',
        status: 'OPEN',
        amount: Number(invoice.amountDue),
        shouldRecover: !customer.optedOut,
      },
    });

    const rawInvoiceNum = typeof invoice.invoiceNumber === 'string'
      ? invoice.invoiceNumber.replace(/[\r\n]/g, '').trim().slice(0, 100)
      : 'INV-UNKNOWN';
    const safeInvoiceNum = sanitizeLog(rawInvoiceNum);
    const safeInvoiceId = typeof invoice.id === 'string'
      ? invoice.id.replace(/[\r\n]/g, '').trim().slice(0, 100)
      : '';
    await auditService.log({
      actor: 'system',
      entityType: 'RecoveryCase',
      entityId: recoveryCase.id,
      eventType: 'case_created',
      afterJson: { event: WEBHOOK_EVENTS.INVOICE_OVERDUE, invoiceId: safeInvoiceId, amountDue: Number(invoice.amountDue) },
      reason: `Receivables case created for overdue invoice ${safeInvoiceNum}`,
    });

    await cacheService.invalidateMetrics(merchant.id);
  }

  async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
    const rawSignature = typeof req.headers['x-razorpay-signature'] === 'string'
      ? req.headers['x-razorpay-signature'].replace(/[\r\n]/g, '').trim()
      : '';

    if (!rawSignature) {
      res.status(400).json({
        error: {
          code: 'MISSING_SIGNATURE',
          message: 'Razorpay webhook signature header missing',
        },
      });
      return;
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!this.verifySignature(rawBody, rawSignature)) {
      logger.warn('Invalid Razorpay webhook signature');
      res.status(400).json({
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Razorpay webhook signature verification failed',
        },
      });
      return;
    }

    const safeEvent = typeof req.body?.event === 'string'
      ? req.body.event.replace(/[\r\n]/g, '').trim().slice(0, 100)
      : 'unknown';
    logger.info('Received verified Razorpay webhook event');

    try {
      switch (safeEvent) {
        case WEBHOOK_EVENTS.PAYMENT_FAILED:
          await this.handlePaymentFailed(req.body?.payload);
          break;
        case WEBHOOK_EVENTS.PAYMENT_CAPTURED:
        case WEBHOOK_EVENTS.ORDER_PAID:
          await this.handlePaymentCaptured(req.body?.payload);
          break;
        case WEBHOOK_EVENTS.INVOICE_OVERDUE:
          await this.handleInvoiceOverdue(req.body?.payload);
          break;
        default:
          // Unhandled event types acknowledged without action
          break;
      }

      res.json({ status: 'ok', received: true });
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : String(err)).replace(/[\r\n]/g, ' ').slice(0, 500);
      logger.error({ err: errorMessage }, 'Error processing Razorpay webhook');
      res.status(500).json({
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Error handling webhook payload',
        },
      });
    }
  }

  async simulateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const rawEvent = typeof req.body?.event === 'string'
        ? req.body.event.replace(/[\r\n]/g, '').trim()
        : '';
      const allowedEvents: string[] = Object.values(WEBHOOK_EVENTS);
      const generatedEvent = allowedEvents.includes(rawEvent)
        ? (rawEvent as typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS])
        : WEBHOOK_EVENTS.PAYMENT_FAILED;

      const rawAmount = typeof req.body?.amount === 'number' && Number.isFinite(req.body.amount)
        ? Math.max(1, req.body.amount)
        : 2499;
      const payloadAmount = rawAmount * 100; // in paise

      const safeFailureCode = typeof req.body?.failureCode === 'string'
        ? req.body.failureCode.replace(/[\r\n]/g, '').trim().slice(0, 100) || 'BAD_REQUEST_PAYMENT_TIMED_OUT'
        : 'BAD_REQUEST_PAYMENT_TIMED_OUT';

      const safeFailureReason = typeof req.body?.failureReason === 'string'
        ? req.body.failureReason.replace(/[\r\n]/g, ' ').trim().slice(0, 500) || 'Bank gateway timed out during 3DS verification'
        : 'Bank gateway timed out during 3DS verification';

      const safeCustomerEmail = typeof req.body?.customerEmail === 'string'
        ? req.body.customerEmail.replace(/[\r\n]/g, '').trim().slice(0, 255) || 'demo_customer@example.com'
        : 'demo_customer@example.com';

      const safeCustomerName = typeof req.body?.customerName === 'string'
        ? req.body.customerName.replace(/[\r\n]/g, '').trim().slice(0, 100) || DEFAULT_CUSTOMER_NAME
        : DEFAULT_CUSTOMER_NAME;

      const paymentId = `pay_sim_${Date.now()}`;
      const orderId = `order_sim_${Date.now()}`;

      let webhookPayload: Record<string, unknown> = {};

      if (generatedEvent === WEBHOOK_EVENTS.PAYMENT_FAILED) {
        webhookPayload = {
          event: WEBHOOK_EVENTS.PAYMENT_FAILED,
          payload: {
            payment: {
              entity: {
                id: paymentId,
                amount: payloadAmount,
                currency: 'INR',
                status: 'failed',
                order_id: orderId,
                method: 'card',
                error_code: safeFailureCode,
                error_description: safeFailureReason,
                email: safeCustomerEmail,
                contact: '+919876543210',
                name: safeCustomerName,
                notes: {
                  customer_name: safeCustomerName,
                },
              },
            },
          },
        };
      } else if (generatedEvent === WEBHOOK_EVENTS.PAYMENT_CAPTURED || generatedEvent === WEBHOOK_EVENTS.ORDER_PAID) {
        webhookPayload = {
          event: generatedEvent,
          payload: {
            payment: {
              entity: {
                id: paymentId,
                amount: payloadAmount,
                currency: 'INR',
                status: 'captured',
                order_id: orderId,
                email: safeCustomerEmail,
                name: safeCustomerName,
              },
            },
          },
        };
      } else if (generatedEvent === WEBHOOK_EVENTS.INVOICE_OVERDUE) {
        webhookPayload = {
          event: WEBHOOK_EVENTS.INVOICE_OVERDUE,
          payload: {
            invoice: {
              entity: {
                id: `inv_sim_${Date.now()}`,
                amount: payloadAmount,
                amount_due: payloadAmount,
                currency: 'INR',
                status: 'overdue',
                customer_name: safeCustomerName || 'Enterprise Client Ltd',
                customer_email: safeCustomerEmail || 'finance@enterprise.demo',
                customer_contact: '+919876500000',
              },
            },
          },
        };
      }

      // Generate authentic HMAC SHA-256 signature
      const rawPayload = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      // Create fake request to self handler
      const simReq = {
        headers: { 'x-razorpay-signature': signature },
        body: webhookPayload,
      } as unknown as Request;

      let simulatedResponseSent = false;
      const simRes = {
        status: (code: number) => ({
          json: (data: unknown) => {
            simulatedResponseSent = true;
            res.status(code).json({ simulated: true, signature, event: generatedEvent, payload: webhookPayload, result: data });
          },
        }),
        json: (data: unknown) => {
          simulatedResponseSent = true;
          res.json({ simulated: true, signature, event: generatedEvent, payload: webhookPayload, result: data });
        },
      } as unknown as Response;

      await this.handleRazorpayWebhook(simReq, simRes);

      if (!simulatedResponseSent) {
        res.json({ simulated: true, signature, event: generatedEvent, payload: webhookPayload });
      }
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : 'Failed to simulate webhook').replace(/[\r\n]/g, ' ').slice(0, 500);
      logger.error({ err: errorMessage }, 'Simulate webhook error');
      res.status(500).json({
        error: {
          code: 'SIMULATION_ERROR',
          message: errorMessage,
        },
      });
    }
  }
}

export const webhookController = new WebhookController();
