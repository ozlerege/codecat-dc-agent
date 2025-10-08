/**
 * Authentication Service
 *
 * Centralized service for all authentication operations.
 * Handles Discord OAuth, session management, and sign out.
 *
 * @module features/auth/services
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { DISCORD_CONFIG, ROUTES } from "@/lib/config/constants";
import {
  AuthError,
  AuthErrorType,
  type SignInOptions,
  type SignOutOptions,
} from "../types";

/**
 * Authentication Service Class
 *
 * Provides methods for authentication operations including
 * Discord OAuth sign in, sign out, and session management.
 *
 * @example
 * ```ts
 * const authService = new AuthService();
 *
 * // Sign in with Discord
 * await authService.signInWithDiscord();
 *
 * // Sign out
 * await authService.signOut();
 *
 * // Get current session
 * const session = await authService.getSession();
 * ```
 */
export class AuthService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client ?? createClient();
  }

  /**
   * Sign in with Discord OAuth
   *
   * @param options - Sign in options
   * @throws {AuthError} If sign in fails
   *
   * @example
   * ```ts
   * await authService.signInWithDiscord({
   *   redirectTo: '/dashboard',
   *   scopes: 'identify email guilds'
   * });
   * ```
   */
  async signInWithDiscord(options?: SignInOptions): Promise<void> {
    try {
      const redirectTo = options?.redirectTo
        ? `${window.location.origin}${options.redirectTo}`
        : `${window.location.origin}${ROUTES.auth.callback}`;

      const scopes = options?.scopes ?? DISCORD_CONFIG.oauth.scopes;

      const { error } = await this.client.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo,
          scopes,
        },
      });

      if (error) {
        throw new AuthError(
          "Failed to initiate Discord sign in",
          AuthErrorType.SIGN_IN_FAILED,
          error
        );
      }

      // OAuth redirect will happen automatically
      return;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      throw new AuthError(
        "An unexpected error occurred during sign in",
        AuthErrorType.SIGN_IN_FAILED,
        error
      );
    }
  }

  /**
   * Sign in with GitHub OAuth
   *
   * @param options - Sign in options
   * @throws {AuthError} If sign in fails
   *
   * @example
   * ```ts
   * await authService.signInWithGitHub({
   *   redirectTo: '/guilds/123/settings',
   *   scopes: 'repo'
   * });
   * ```
   */
  async signInWithGitHub(options?: SignInOptions): Promise<void> {
    try {
      const redirectTo = options?.redirectTo
        ? `${window.location.origin}${options.redirectTo}`
        : `${window.location.origin}${ROUTES.auth.callback}`;

      const scopes = options?.scopes ?? "repo";

      const { error } = await this.client.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo,
          scopes,
        },
      });

      if (error) {
        throw new AuthError(
          "Failed to initiate GitHub sign in",
          AuthErrorType.SIGN_IN_FAILED,
          error
        );
      }

      // OAuth redirect will happen automatically
      return;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      throw new AuthError(
        "An unexpected error occurred during GitHub sign in",
        AuthErrorType.SIGN_IN_FAILED,
        error
      );
    }
  }

  /**
   * Sign out the current user
   *
   * @param options - Sign out options
   * @throws {AuthError} If sign out fails
   *
   * @example
   * ```ts
   * await authService.signOut({ redirectTo: '/' });
   * ```
   */
  async signOut(_options?: SignOutOptions): Promise<void> {
    try {
      const { error } = await this.client.auth.signOut();

      if (error) {
        throw new AuthError(
          "Failed to sign out",
          AuthErrorType.SIGN_OUT_FAILED,
          error
        );
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      throw new AuthError(
        "An unexpected error occurred during sign out",
        AuthErrorType.SIGN_OUT_FAILED,
        error
      );
    }
  }

  /**
   * Get the current session
   *
   * @returns Current session or null if not authenticated
   *
   * @example
   * ```ts
   * const session = await authService.getSession();
   * if (session) {
   *   console.log('User is authenticated:', session.user.email);
   * }
   * ```
   */
  async getSession() {
    try {
      const { data, error } = await this.client.auth.getSession();

      if (error) {
        console.error("Failed to get session:", error);
        return null;
      }

      return data.session;
    } catch (error) {
      console.error("Unexpected error getting session:", error);
      return null;
    }
  }

  /**
   * Refresh the current session
   *
   * @throws {AuthError} If session refresh fails
   *
   * @example
   * ```ts
   * const session = await authService.refreshSession();
   * ```
   */
  async refreshSession() {
    try {
      const { data, error } = await this.client.auth.refreshSession();

      if (error) {
        throw new AuthError(
          "Failed to refresh session",
          AuthErrorType.SESSION_REFRESH_FAILED,
          error
        );
      }

      return data.session;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      throw new AuthError(
        "An unexpected error occurred during session refresh",
        AuthErrorType.SESSION_REFRESH_FAILED,
        error
      );
    }
  }

  /**
   * Subscribe to auth state changes
   *
   * @param callback - Function to call when auth state changes
   * @returns Unsubscribe function
   *
   * @example
   * ```ts
   * const unsubscribe = authService.onAuthStateChange((event, session) => {
   *   console.log('Auth state changed:', event, session);
   * });
   *
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   */
  onAuthStateChange(
    callback: (
      event: string,
      session: ReturnType<typeof this.getSession>
    ) => void
  ) {
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange((event, session) => {
      callback(event, Promise.resolve(session));
    });

    return () => subscription.unsubscribe();
  }

  /**
   * Check if user is authenticated
   *
   * @returns True if user has an active session
   *
   * @example
   * ```ts
   * if (await authService.isAuthenticated()) {
   *   console.log('User is logged in');
   * }
   * ```
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Get the current user
   *
   * @returns Current user or null if not authenticated
   *
   * @example
   * ```ts
   * const user = await authService.getUser();
   * if (user) {
   *   console.log('Current user:', user.email);
   * }
   * ```
   */
  async getUser() {
    const session = await this.getSession();
    return session?.user ?? null;
  }
}

/**
 * Default auth service instance
 *
 * @example
 * ```ts
 * import { authService } from '@/features/auth/services/auth-service';
 *
 * await authService.signInWithDiscord();
 * ```
 */
export const authService = new AuthService();
