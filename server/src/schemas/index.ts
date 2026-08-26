import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Valid email required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const updatePolicyConfigSchema = z.object({
  maxAttempts: z.number().int().min(1).max(10).optional(),
  cooldownMinutes: z.number().int().min(1).max(10080).optional(),
  contactHourStart: z.number().int().min(0).max(23).optional(),
  contactHourEnd: z.number().int().min(0).max(23).optional(),
  maxIncentiveAmount: z.number().min(0).max(10000).optional(),
  dailyCapGlobal: z.number().int().min(1).max(5000).optional(),
});

export const caseFilterSchema = z.object({
  lane: z.enum(['PAYMENT', 'CHECKOUT', 'RECEIVABLE']).optional(),
  status: z.enum([
    'OPEN',
    'RECOVERED',
    'STOPPED_MAX_ATTEMPTS',
    'STOPPED_OPTED_OUT',
    'ESCALATED_TO_HUMAN',
    'EXPIRED',
  ]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const escalateResponseSchema = z.object({
  resolution: z.enum(['RECOVERED', 'EXPIRED']),
  notes: z.string().min(3, { message: 'Resolution notes required' }),
});

export const promiseToPaySchema = z.object({
  promisedAmount: z.number().positive(),
  promisedDate: z.string().datetime(),
});

export const webhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.record(z.any()),
});
