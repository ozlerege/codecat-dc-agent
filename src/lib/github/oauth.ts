/**
 * GitHub OAuth Helper
 *
 * Handles GitHub OAuth flow without interfering with Supabase Auth session
 */

import { env } from "@/lib/config/env";

const GITHUB_CLIENT_ID = env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = `${
  env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}/auth/github/callback`;

/**
 * Generate GitHub OAuth URL
 */
export const getGitHubOAuthUrl = (state?: string): string => {
  console.log("GitHub OAuth Config:", {
    clientId: GITHUB_CLIENT_ID,
    redirectUri: GITHUB_REDIRECT_URI,
    state: state,
  });

  if (!GITHUB_CLIENT_ID) {
    console.error(
      "GitHub Client ID is not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID environment variable."
    );
    throw new Error("GitHub OAuth not configured");
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo",
    state: state || "github_connect",
  });

  const oauthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  console.log("Generated OAuth URL:", oauthUrl);

  return oauthUrl;
};

/**
 * Exchange GitHub code for access token
 */
export const exchangeGitHubCode = async (
  code: string
): Promise<{ access_token: string; scope: string }> => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange GitHub code for token");
  }

  return response.json();
};

/**
 * Get GitHub user info
 */
export const getGitHubUserInfo = async (
  accessToken: string
): Promise<{ login: string; name: string; id: number }> => {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user info");
  }

  return response.json();
};
