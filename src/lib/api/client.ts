import { ApiError, type ApiResponse, type RequestConfig } from './types';

/**
 * Centralized API client for making HTTP requests with consistent error handling
 * 
 * @example
 * ```ts
 * // Simple GET request
 * const guilds = await apiClient.get<GuildsResponse>('/api/guilds');
 * 
 * // POST with data
 * const created = await apiClient.post('/api/guilds', { guildId: '123', guildName: 'Test' });
 * 
 * // PATCH with data
 * const updated = await apiClient.patch('/api/guilds/123', { defaultRepo: 'owner/repo' });
 * ```
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an HTTP request with standardized error handling
   * 
   * @param endpoint - API endpoint (e.g., '/api/guilds')
   * @param method - HTTP method
   * @param data - Request body data (for POST, PATCH, PUT)
   * @param config - Additional request configuration
   * @returns Parsed JSON response
   * @throws {ApiError} When request fails
   */
  private async request<T>(
    endpoint: string,
    method: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    const requestConfig: RequestInit = {
      method,
      credentials: 'include',
      ...config,
      headers,
    };

    // Add body for POST, PATCH, PUT requests
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      requestConfig.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestConfig);

      // Handle non-OK responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as ApiResponse<T>;
      }

      // Parse and return JSON response
      return await response.json() as ApiResponse<T>;
    } catch (error) {
      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('Network error: Unable to connect to server', 0, 'NETWORK_ERROR');
      }

      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        throw new ApiError('Invalid response from server', 500, 'PARSE_ERROR');
      }

      // Handle unknown errors
      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Handle error responses from the API
   * 
   * @param response - Fetch Response object
   * @throws {ApiError} Always throws with appropriate error message
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = 'Request failed';
    let errorCode: string | undefined;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorBody.message || errorMessage;
      errorCode = errorBody.code || errorBody.error;
    } catch {
      // If error body is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  /**
   * Make a GET request
   * 
   * @param endpoint - API endpoint
   * @param config - Request configuration
   * @returns Parsed response data
   * 
   * @example
   * ```ts
   * const guilds = await apiClient.get<GuildsResponse>('/api/guilds');
   * ```
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, config);
  }

  /**
   * Make a POST request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param config - Request configuration
   * @returns Parsed response data
   * 
   * @example
   * ```ts
   * const result = await apiClient.post('/api/guilds', { guildId: '123' });
   * ```
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', data, config);
  }

  /**
   * Make a PUT request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param config - Request configuration
   * @returns Parsed response data
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data, config);
  }

  /**
   * Make a PATCH request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param config - Request configuration
   * @returns Parsed response data
   * 
   * @example
   * ```ts
   * const updated = await apiClient.patch('/api/guilds/123', { defaultRepo: 'owner/repo' });
   * ```
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', data, config);
  }

  /**
   * Make a DELETE request
   * 
   * @param endpoint - API endpoint
   * @param config - Request configuration
   * @returns Parsed response data
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, config);
  }
}

/**
 * Default API client instance
 * 
 * @example
 * ```ts
 * import { apiClient } from '@/lib/api/client';
 * 
 * const data = await apiClient.get('/api/guilds');
 * ```
 */
export const apiClient = new ApiClient();

/**
 * Export ApiClient class for testing or custom instances
 */
export { ApiClient };
