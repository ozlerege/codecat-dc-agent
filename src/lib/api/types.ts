/**
 * API response type wrapper for type-safe API responses
 */
export type ApiResponse<T = unknown> = T;

/**
 * Custom API Error class for consistent error handling across the application
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is an authentication error (401)
   */
  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Check if error is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if error is a validation error (400)
   */
  isValidationError(): boolean {
    return this.statusCode === 400;
  }

  /**
   * Check if error is a server error (500+)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

/**
 * Extract error message from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request configuration options
 */
export interface RequestConfig extends Omit<RequestInit, 'method' | 'body'> {
  params?: Record<string, string | number | boolean>;
}
