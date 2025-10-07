/**
 * Authentication Types
 * 
 * Type definitions for authentication-related data and operations.
 * 
 * @module features/auth/types
 */

import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication state
 */
export type AuthState = {
  /** Current user session */
  session: Session | null;
  /** Current user */
  user: User | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is being loaded */
  isLoading: boolean;
};

/**
 * Sign in options
 */
export type SignInOptions = {
  /** Redirect URL after successful sign in */
  redirectTo?: string;
  /** OAuth scopes to request */
  scopes?: string;
};

/**
 * Sign out options
 */
export type SignOutOptions = {
  /** Whether to redirect after sign out */
  redirect?: boolean;
  /** Redirect path after sign out */
  redirectTo?: string;
};

/**
 * Auth error types
 */
export enum AuthErrorType {
  SIGN_IN_FAILED = 'SIGN_IN_FAILED',
  SIGN_OUT_FAILED = 'SIGN_OUT_FAILED',
  SESSION_REFRESH_FAILED = 'SESSION_REFRESH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/**
 * Auth error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public type: AuthErrorType,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}

/**
 * Discord user metadata
 */
export type DiscordUserMetadata = {
  avatar_url?: string;
  custom_claims?: {
    global_name?: string;
  };
  email?: string;
  email_verified?: boolean;
  full_name?: string;
  iss?: string;
  name?: string;
  preferred_username?: string;
  provider_id?: string;
  sub?: string;
};
