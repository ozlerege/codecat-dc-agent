/**
 * GitHub Feature Hooks
 *
 * React Query hooks for GitHub integration functionality.
 *
 * @module features/github/hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/types";
import type {
  GitHubRepositoriesResult,
  GitHubRepoConnection,
  GitHubConnectionError,
} from "../types";

/**
 * Fetch user's GitHub repositories
 */
const fetchGitHubRepositories = async (): Promise<GitHubRepositoriesResult> => {
  try {
    return await apiClient.get<GitHubRepositoriesResult>(
      "/api/github/repositories"
    );
  } catch (error) {
    throw new Error(
      getErrorMessage(error) || "Failed to fetch GitHub repositories"
    );
  }
};

/**
 * Hook to fetch user's GitHub repositories
 */
export const useGitHubRepositoriesQuery = () =>
  useQuery({
    queryKey: ["github", "repositories"],
    queryFn: fetchGitHubRepositories,
    retry: (failureCount, error) => {
      // Don't retry for authentication errors
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      if (
        errorMessage.includes("github_not_connected") ||
        errorMessage.includes("github_token_expired") ||
        errorMessage.includes("unauthenticated")
      ) {
        return false;
      }
      return failureCount < 1; // Only retry once for other errors
    },
    retryDelay: 1000,
  });

/**
 * Connect GitHub repository to guild
 */
const connectGitHubRepo = async (
  guildId: string,
  connection: GitHubRepoConnection
): Promise<{ success: boolean; guild: any }> => {
  try {
    return await apiClient.post(`/api/guilds/${guildId}/github`, connection);
  } catch (error) {
    throw new Error(
      getErrorMessage(error) || "Failed to connect GitHub repository"
    );
  }
};

/**
 * Disconnect GitHub repository from guild
 */
const disconnectGitHubRepo = async (
  guildId: string
): Promise<{ success: boolean; guild: any }> => {
  try {
    return await apiClient.delete(`/api/guilds/${guildId}/github`);
  } catch (error) {
    throw new Error(
      getErrorMessage(error) || "Failed to disconnect GitHub repository"
    );
  }
};

/**
 * Hook to connect GitHub repository to guild
 */
export const useConnectGitHubRepoMutation = (guildId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connection: GitHubRepoConnection) =>
      connectGitHubRepo(guildId, connection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
    },
  });
};

/**
 * Hook to disconnect GitHub repository from guild
 */
export const useDisconnectGitHubRepoMutation = (guildId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disconnectGitHubRepo(guildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
    },
  });
};

/**
 * Check if user has GitHub connection
 * This checks the user's auth state and repositories query
 */
export const useGitHubConnectionStatus = () => {
  const repositoriesQuery = useGitHubRepositoriesQuery();

  // Check if user has GitHub connection based on query results
  const hasGitHubConnection =
    !repositoriesQuery.isError && repositoriesQuery.data !== undefined;
  const isTokenExpired =
    repositoriesQuery.error?.message?.includes("github_token_expired") ?? false;
  const isNotConnected =
    repositoriesQuery.error?.message?.includes("github_not_connected") ?? false;

  return {
    connected: hasGitHubConnection,
    hasToken: hasGitHubConnection || isTokenExpired, // Has token if connected or token expired
    tokenExpired: isTokenExpired,
    isLoading: repositoriesQuery.isLoading,
    error: repositoriesQuery.error,
    isNotConnected: isNotConnected,
  };
};
