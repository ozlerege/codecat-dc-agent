/**
 * GitHub API Types
 *
 * Type definitions for GitHub API responses and data structures.
 *
 * @module github/types
 */

/**
 * GitHub repository data structure
 */
export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    id: number;
    login: string;
    avatar_url: string;
  };
  private: boolean;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  visibility: "public" | "private" | "internal";
};

/**
 * GitHub API error response
 */
export type GitHubApiError = {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
};

/**
 * GitHub API rate limit information
 */
export type GitHubRateLimit = {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
};

/**
 * GitHub repository list response
 */
export type GitHubRepositoryListResponse = GitHubRepository[];

/**
 * Custom error class for GitHub API errors
 */
export class GitHubApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: GitHubApiError,
    message?: string
  ) {
    super(
      message ?? body.message ?? `GitHub API error: ${status} ${statusText}`
    );
    this.name = "GitHubApiError";
  }
}

/**
 * GitHub connection status
 */
export type GitHubConnectionStatus = {
  connected: boolean;
  hasToken: boolean;
  tokenExpired?: boolean;
};

/**
 * GitHub repository selection for UI
 */
export type GitHubRepoOption = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  language: string | null;
  updatedAt: string;
};
