/**
 * GitHub Authentication Helpers
 *
 * Utilities for handling GitHub OAuth tokens and connection status.
 *
 * @module github/auth
 */

import type { User } from "@supabase/supabase-js";
import type { GitHubConnectionStatus } from "./types";

/**
 * Extract GitHub access token from Supabase user metadata
 *
 * @param user - Supabase user object
 * @param providerToken - Optional provider token from session
 * @returns GitHub access token or null if not found
 */
export const getGitHubAccessToken = (user: User, providerToken?: string | null): string | null => {
  if (!user) return null;

  // First check if provider token was passed directly (from session.provider_token)
  if (providerToken) {
    return providerToken;
  }

  // Check user metadata (where we might store it after OAuth)
  const metadata = user.user_metadata;
  if (metadata?.github_access_token) {
    return metadata.github_access_token;
  }

  // Fallback: Check for GitHub identity in user identities
  const githubIdentity = user.identities?.find(
    (identity) => identity.provider === "github"
  );

  if (githubIdentity) {
    const identityData = githubIdentity.identity_data as
      | Record<string, unknown>
      | null;

    const getStringValue = (value: unknown): string | null =>
      typeof value === "string" && value.trim().length > 0 ? value : null;

    // Try different possible token locations in identity
    const token =
      getStringValue(identityData?.["access_token"]) ??
      getStringValue(identityData?.["provider_token"]) ??
      getStringValue(identityData?.["token"]);

    if (token) {
      return token;
    }
  }

  return null;
};

/**
 * Check if user has GitHub OAuth connection
 *
 * @param user - Supabase user object
 * @returns True if user has GitHub connection
 */
export const hasGitHubConnection = (user: User): boolean => {
  return getGitHubAccessToken(user) !== null;
};

/**
 * Get detailed GitHub connection status
 *
 * @param user - Supabase user object
 * @returns GitHub connection status details
 */
export const getGitHubConnectionStatus = (
  user: User
): GitHubConnectionStatus => {
  const token = getGitHubAccessToken(user);

  return {
    connected: token !== null,
    hasToken: token !== null,
    tokenExpired: false, // TODO: Implement token expiration check
  };
};

/**
 * Check if GitHub token is expired
 *
 * @param token - GitHub access token
 * @returns True if token is expired
 */
export const isGitHubTokenExpired = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    return response.status === 401;
  } catch {
    return true; // Assume expired if we can't check
  }
};

/**
 * Validate GitHub token by making a test API call
 *
 * @param token - GitHub access token
 * @returns True if token is valid
 */
export const validateGitHubToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
};
