import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validateBody, validateQuery } from '../src/middleware/validation.middleware';
import { z } from 'zod';

function createMocks(body?: unknown, query?: unknown) {
  const req = {
    body: body || {},
    query: query || {},
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

describe('Validation Middleware — validateBody', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
    email: z.string().email().optional(),
  });

  it('calls next() with valid body', () => {
    const { req, res, next } = createMocks({ name: 'Test User', age: 25 });

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with missing required field', () => {
    const { req, res, next } = createMocks({ age: 25 });

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
          ]),
        }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 with invalid type', () => {
    const { req, res, next } = createMocks({ name: 'Test', age: 'not_a_number' });

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('returns 400 with negative age (positive constraint)', () => {
    const { req, res, next } = createMocks({ name: 'Test', age: -5 });

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 with invalid email format', () => {
    const { req, res, next } = createMocks({ name: 'Test', age: 25, email: 'not-an-email' });

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
          ]),
        }),
      })
    );
  });

  it('passes validation with optional field omitted', () => {
    const { req, res, next } = createMocks({ name: 'Test', age: 25 });

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('strips unknown fields via schema parsing', () => {
    const { req, res, next } = createMocks({
      name: 'Test',
      age: 25,
      maliciousField: '<script>alert("xss")</script>',
    });

    const middleware = validateBody(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // After parsing, req.body should not contain the unknown field
    expect(req.body).not.toHaveProperty('maliciousField');
  });
});

describe('Validation Middleware — validateQuery', () => {
  const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  });

  it('calls next() with valid query params', () => {
    const { req, res, next } = createMocks(undefined, { page: '2', limit: '10' });

    const middleware = validateQuery(querySchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('applies defaults when params are missing', () => {
    const { req, res, next } = createMocks(undefined, {});

    const middleware = validateQuery(querySchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual(
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('returns 400 when limit exceeds max', () => {
    const { req, res, next } = createMocks(undefined, { page: '1', limit: '999' });

    const middleware = validateQuery(querySchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when page is negative', () => {
    const { req, res, next } = createMocks(undefined, { page: '-1' });

    const middleware = validateQuery(querySchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('coerces string numbers to actual numbers', () => {
    const { req, res, next } = createMocks(undefined, { page: '3', limit: '50' });

    const middleware = validateQuery(querySchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual(
      expect.objectContaining({ page: 3, limit: 50 })
    );
  });
});
