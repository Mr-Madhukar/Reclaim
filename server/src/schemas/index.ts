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

export const escalateResponseSchema = z
  .object({
    resolution: z.enum(['RECOVERED', 'EXPIRED', 'UNRESOLVED']).optional(),
    outcome: z.enum(['RECOVERED', 'EXPIRED', 'UNRESOLVED']).optional(),
    notes: z.string().min(3, { message: 'Resolution notes required' }),
  })
  .transform((data) => ({
    resolution: (data.resolution || (data.outcome === 'UNRESOLVED' ? 'EXPIRED' : data.outcome) || 'RECOVERED') as 'RECOVERED' | 'EXPIRED',
    notes: data.notes,
  }));

export const promiseToPaySchema = z.object({
  promisedAmount: z.number().positive(),
  promisedDate: z.string().datetime(),
});

export const webhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.record(z.unknown()),
});

export const customerActionSchema = z.object({
  action: z.enum([
    'PAY_SUCCESS',
    'OPT_OUT',
    'PROMISE_TO_PAY',
    'GRACE_PERIOD',
    'UPDATE_PAYMENT_METHOD',
  ]),
  paymentMethod: z.string().optional(),
  promisedDate: z.string().optional(),
  promisedAmount: z.number().positive().optional(),
  optOutReason: z.string().optional(),
  paymentDetails: z
    .object({
      method: z.string().optional(),
      identifier: z.string().optional(),
    })
    .optional(),
});

export const createCaseSchema = z.object({
  lane: z.enum(['PAYMENT', 'CHECKOUT', 'RECEIVABLE']).optional().default('PAYMENT'),
  amount: z.number().positive().optional().default(2499),
  currency: z.string().optional().default('INR'),
  customerName: z.string().optional().default('Vikram Malhotra'),
  customerEmail: z.string().email().optional().default('demo_customer@example.com'),
  customerPhone: z.string().optional().default('+919876543210'),
  rootCause: z.string().optional().default('bank_technical_error'),
  failureCode: z.string().optional().default('BAD_REQUEST_PAYMENT_TIMED_OUT'),
  failureReason: z.string().optional().default('Payment timed out during 3DS verification'),
  status: z
    .enum(['OPEN', 'RECOVERED', 'STOPPED_MAX_ATTEMPTS', 'STOPPED_OPTED_OUT', 'ESCALATED_TO_HUMAN', 'EXPIRED'])
    .optional()
    .default('OPEN'),
});

