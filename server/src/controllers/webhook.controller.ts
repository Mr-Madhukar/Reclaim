import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { auditService } from '../services/audit.service';
import { logger } from '../lib/logger';
import { Lane, PaymentStatus, InvoiceStatus } from '@prisma/client';

export class WebhookController {
  async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      res.status(400).json({
        error: {
          code: 'MISSING_SIGNATURE',
          message: 'Razorpay webhook signature header missing',
        },
      });
      return;
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // Timing-safe signature comparison
    const isSignatureValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isSignatureValid) {
      logger.warn({ receivedSignature: signature }, 'Invalid Razorpay webhook signature');
      res.status(400).json({
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Razorpay webhook signature verification failed',
        },
      });
      return;
    }

    const { event, payload } = req.body;
    logger.info({ event }, 'Received verified Razorpay webhook event');

    try {
      if (event === 'payment.failed') {
        const payment = payload.payment?.entity;
        if (payment) {
          // Check for existing customer or merchant
          const merchant = await prisma.merchant.findFirst();
          if (merchant) {
            let customer = await prisma.customer.findFirst({
              where: { email: payment.email || 'customer@example.com' },
            });

            if (!customer) {
              customer = await prisma.customer.create({
                data: {
                  merchantId: merchant.id,
                  name: payment.contact || 'Customer',
                  email: payment.email || `customer_${Date.now()}@example.com`,
                  phone: payment.contact,
                },
              });
            }

            const paymentAttempt = await prisma.paymentAttempt.create({
              data: {
                customerId: customer.id,
                orderId: payment.order_id || payment.id,
                amount: Number(payment.amount) / 100, // paise to INR
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
                amount: Number(payment.amount) / 100,
                shouldRecover: !customer.optedOut,
              },
            });

            await auditService.log({
              actor: 'system',
              entityType: 'RecoveryCase',
              entityId: recoveryCase.id,
              eventType: 'case_created',
              afterJson: { event, paymentId: payment.id, amount: Number(payment.amount) / 100 },
              reason: `Recovery case opened via Razorpay webhook: ${payment.error_description || 'Payment Failed'}`,
            });
          }
        }
      } else if (event === 'payment.captured' || event === 'order.paid') {
        const payment = payload.payment?.entity || payload.order?.entity;
        if (payment) {
          // Find matching payment attempt or order
          const paymentAttempt = await prisma.paymentAttempt.findFirst({
            where: { orderId: payment.order_id || payment.id },
          });

          if (paymentAttempt) {
            const recoveryCase = await prisma.recoveryCase.findFirst({
              where: { sourceRefId: paymentAttempt.id, status: 'OPEN' },
            });

            if (recoveryCase) {
              await prisma.$transaction(async (tx) => {
                await tx.recoveryCase.update({
                  where: { id: recoveryCase.id },
                  data: {
                    status: 'RECOVERED',
                    closedAt: new Date(),
                    closedReason: `Payment captured successfully via webhook (${payment.id})`,
                  },
                });

                await auditService.log(
                  {
                    actor: 'system',
                    entityType: 'RecoveryCase',
                    entityId: recoveryCase.id,
                    eventType: 'case_recovered',
                    afterJson: { paymentId: payment.id, amount: Number(recoveryCase.amount) },
                    reason: `Case recovered: Payment captured on Razorpay (${payment.id})`,
                  },
                  tx
                );
              });
            }
          }
        }
      } else if (event === 'invoice.overdue') {
        const invoiceData = payload.invoice?.entity;
        if (invoiceData) {
          const merchant = await prisma.merchant.findFirst();
          if (merchant) {
            let customer = await prisma.customer.findFirst({
              where: { email: invoiceData.customer_email || 'b2b@example.com' },
            });

            if (!customer) {
              customer = await prisma.customer.create({
                data: {
                  merchantId: merchant.id,
                  name: invoiceData.customer_name || 'B2B Client',
                  email: invoiceData.customer_email || `b2b_${Date.now()}@example.com`,
                  phone: invoiceData.customer_contact,
                },
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

            await auditService.log({
              actor: 'system',
              entityType: 'RecoveryCase',
              entityId: recoveryCase.id,
              eventType: 'case_created',
              afterJson: { event, invoiceId: invoice.id, amountDue: Number(invoice.amountDue) },
              reason: `Receivables case created for overdue invoice ${invoice.invoiceNumber}`,
            });
          }
        }
      }

      res.json({ status: 'ok', received: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error({ err: errorMessage, event }, 'Error processing Razorpay webhook');
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
      const { event, amount, failureCode, failureReason, customerEmail, customerName } = req.body;

      const payloadAmount = (amount || 2499) * 100; // in paise
      const generatedEvent = event || 'payment.failed';
      const paymentId = `pay_sim_${Date.now()}`;
      const orderId = `order_sim_${Date.now()}`;

      let webhookPayload: Record<string, unknown> = {};

      if (generatedEvent === 'payment.failed') {
        webhookPayload = {
          event: 'payment.failed',
          payload: {
            payment: {
              entity: {
                id: paymentId,
                amount: payloadAmount,
                currency: 'INR',
                status: 'failed',
                order_id: orderId,
                method: 'card',
                error_code: failureCode || 'BAD_REQUEST_PAYMENT_TIMED_OUT',
                error_description: failureReason || 'Bank gateway timed out during 3DS verification',
                email: customerEmail || 'demo_customer@example.com',
                contact: '+919876543210',
              },
            },
          },
        };
      } else if (generatedEvent === 'payment.captured' || generatedEvent === 'order.paid') {
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
                email: customerEmail || 'demo_customer@example.com',
              },
            },
          },
        };
      } else if (generatedEvent === 'invoice.overdue') {
        webhookPayload = {
          event: 'invoice.overdue',
          payload: {
            invoice: {
              entity: {
                id: `inv_sim_${Date.now()}`,
                amount: payloadAmount,
                amount_due: payloadAmount,
                currency: 'INR',
                status: 'overdue',
                customer_name: customerName || 'Enterprise Client Ltd',
                customer_email: customerEmail || 'finance@enterprise.demo',
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to simulate webhook';
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
