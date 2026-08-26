import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load from root .env or local .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/reclaim_dev?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().default('super-secret-reclaim-access-jwt-key-2026-secure'),
  JWT_REFRESH_SECRET: z.string().default('super-secret-reclaim-refresh-jwt-key-2026-secure'),

  RAZORPAY_KEY_ID: z.string().default('rzp_test_reclaim_demo'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_secret_reclaim_demo'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_webhook_secret_reclaim_demo'),

  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default('reclaim_demo@ethereal.email'),
  SMTP_PASS: z.string().default('reclaim_demo_password'),
});

export const env = envSchema.parse(process.env);
