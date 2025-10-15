/**
 * Base Repository Class
 * 
 * Provides common functionality for all repositories including
 * error handling, logging, and shared database operations.
 * 
 * @module db/repositories
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/schema';

/**
 * Custom repository error class for better error handling
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }
}

/**
 * Base repository class that all repositories extend from
 * Provides common database operations and error handling
 */
export abstract class BaseRepository {
  protected readonly client: SupabaseClient<Database>;
  protected readonly repositoryName: string;

  constructor(client: SupabaseClient<Database>, repositoryName: string) {
    this.client = client;
    this.repositoryName = repositoryName;
  }

  /**
   * Handle repository errors with consistent logging and error wrapping
   * 
   * @param error - The original error
   * @param operation - The operation that failed
   * @param context - Additional context for debugging
   * @throws {RepositoryError}
   */
  protected handleError(
    error: unknown,
    operation: string,
    context?: Record<string, unknown>
  ): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const contextStr = context ? ` Context: ${JSON.stringify(context)}` : '';
    
    console.error(
      `[${this.repositoryName}] ${operation} failed: ${errorMessage}${contextStr}`,
      error
    );
    
    throw new RepositoryError(
      `${this.repositoryName}: ${operation} failed - ${errorMessage}`,
      operation,
      error
    );
  }

  /**
   * Log successful operations in development
   */
  protected logSuccess(operation: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      console.log(`[${this.repositoryName}] ${operation} succeeded${contextStr}`);
    }
  }

  /**
   * Validate required parameters
   * 
   * @throws {RepositoryError} if validation fails
   */
  protected validateRequired(params: Record<string, unknown>, operation: string): void {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        throw new RepositoryError(
          `Missing required parameter: ${key}`,
          operation
        );
      }
    }
  }

  /**
   * Handle Supabase response with null data
   * Throws if data is null, returns data otherwise
   */
  protected requireData<T>(
    data: T | null,
    operation: string,
    resourceName: string
  ): T {
    if (data === null) {
      throw new RepositoryError(
        `${resourceName} not found`,
        operation
      );
    }
    return data;
  }

  /**
   * Safe array return - ensures we always return an array
   */
  protected safeArray<T>(data: T[] | null): T[] {
    return data ?? [];
  }
}
