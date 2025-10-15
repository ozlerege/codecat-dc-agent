/**
 * GitHub API Client
 *
 * Handles communication with GitHub API for repository operations.
 *
 * @module github/client
 */

import {
  GitHubApiError,
  type GitHubRepository,
  type GitHubRepositoryListResponse,
  type GitHubRateLimit,
  type GitHubRepoOption,
} from "./types";

/**
 * GitHub API client for repository operations
 */
export class GitHubClient {
  private readonly baseUrl = "https://api.github.com";
  private readonly userAgent = "CodeCat-Discord-Bot/1.0";

  /**
   * Fetch user's personal repositories
   *
   * @param accessToken - GitHub access token
   * @param options - Query options
   * @returns Array of user's personal repositories
   * @throws {GitHubApiError} If API request fails
   */
  async fetchUserRepositories(
    accessToken: string,
    options: {
      perPage?: number;
      page?: number;
      sort?: "created" | "updated" | "pushed" | "full_name";
      direction?: "asc" | "desc";
    } = {}
  ): Promise<GitHubRepositoryListResponse> {
    const {
      perPage = 100,
      page = 1,
      sort = "updated",
      direction = "desc",
    } = options;

    const params = new URLSearchParams({
      per_page: perPage.toString(),
      page: page.toString(),
      sort,
      direction,
      type: "owner", // Only personal repositories
    });

    const url = `${this.baseUrl}/user/repos?${params}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new GitHubApiError(
          response.status,
          response.statusText,
          errorBody,
          `Failed to fetch repositories: ${response.status} ${response.statusText}`
        );
      }

      const repositories =
        (await response.json()) as GitHubRepositoryListResponse;

      return repositories;
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }

      throw new GitHubApiError(
        0,
        "Network Error",
        { message: "Failed to fetch repositories" },
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }

  /**
   * Get GitHub API rate limit information
   *
   * @param accessToken - GitHub access token
   * @returns Rate limit information
   */
  async getRateLimit(accessToken: string): Promise<GitHubRateLimit> {
    const response = await fetch(`${this.baseUrl}/rate_limit`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      throw new GitHubApiError(response.status, response.statusText, {
        message: "Failed to fetch rate limit",
      });
    }

    const data = await response.json();
    return data.rate;
  }

  /**
   * Convert GitHub repository to UI option format
   *
   * @param repo - GitHub repository
   * @returns Repository option for UI
   */
  static toRepoOption(repo: GitHubRepository): GitHubRepoOption {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      updatedAt: repo.updated_at,
    };
  }

  /**
   * Convert array of repositories to UI options
   *
   * @param repos - Array of GitHub repositories
   * @returns Array of repository options for UI
   */
  static toRepoOptions(
    repos: GitHubRepositoryListResponse
  ): GitHubRepoOption[] {
    return repos.map(this.toRepoOption);
  }

  /**
   * Extract username from GitHub token (for filtering personal repos)
   * This is a fallback method - in practice, we should use the API
   *
   * @param accessToken - GitHub access token
   * @returns Username or empty string
   */
  private extractUsernameFromToken(accessToken: string): string {
    // This is a simplified approach. In a real implementation,
    // we should make an API call to get the authenticated user's username
    // For now, we'll rely on the API filtering
    return "";
  }

  /**
   * Get authenticated user's username
   *
   * @param accessToken - GitHub access token
   * @returns Username
   */
  async getAuthenticatedUser(accessToken: string): Promise<{ login: string }> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new GitHubApiError(
        response.status,
        response.statusText,
        errorBody,
        `Failed to get authenticated user: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }
}
