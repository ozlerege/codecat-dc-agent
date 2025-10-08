/**
 * GitHub Feature Types
 *
 * Type definitions for the GitHub feature module.
 *
 * @module features/github/types
 */

export type {
  GitHubRepository,
  GitHubRepoOption,
  GitHubConnectionStatus,
  GitHubApiError,
} from "@/lib/github/types";

/**
 * GitHub repository selection for connecting to guild
 */
export type GitHubRepoConnection = {
  repoId: number;
  repoName: string;
};

/**
 * GitHub repositories query result
 */
export type GitHubRepositoriesResult = {
  repositories: import("@/lib/github/types").GitHubRepoOption[];
  count: number;
};

/**
 * GitHub connection error types
 */
export type GitHubConnectionError =
  | "github_not_connected"
  | "github_token_expired"
  | "github_rate_limit"
  | "github_api_error"
  | "github_fetch_failed"
  | "github_connection_failed"
  | "github_disconnection_failed";
