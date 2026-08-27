/**
 * Shared error handling utilities for consistent, type-safe error management.
 */

/**
 * Safely extracts a human-readable error message from an unknown caught value.
 * Use this in every `catch (err: unknown)` block instead of `err.message`.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}

/**
 * Structured application error with HTTP status code and machine-readable error code.
 * Throw this from services/controllers for consistent API error responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
