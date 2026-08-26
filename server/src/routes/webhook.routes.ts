import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

export const webhookRouter = Router();

webhookRouter.post('/razorpay', (req, res) => {
  webhookController.handleRazorpayWebhook(req, res);
});

webhookRouter.post('/simulate', (req, res) => {
  webhookController.simulateWebhook(req, res);
});
