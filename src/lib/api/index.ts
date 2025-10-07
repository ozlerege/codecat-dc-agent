/**
 * API module exports
 * 
 * This module provides centralized HTTP client functionality with
 * consistent error handling across the application.
 * 
 * @example
 * ```ts
 * import { apiClient, ApiError, getErrorMessage } from '@/lib/api';
 * 
 * try {
 *   const data = await apiClient.get('/api/guilds');
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error('API Error:', error.message, error.statusCode);
 *   }
 * }
 * ```
 */

export { apiClient, ApiClient } from './client';
export { 
  ApiError, 
  isApiError, 
  getErrorMessage,
  type ApiResponse,
  type HttpMethod,
  type RequestConfig
} from './types';
