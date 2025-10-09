"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  PixelSelect,
  PixelSelectContent,
  PixelSelectItem,
  PixelSelectTrigger,
  PixelSelectValue,
} from "@/components/pixel-select";
import { PixelButton } from "@/components/pixel-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useGitHubRepositoriesQuery,
  useConnectGitHubRepoMutation,
} from "../hooks";
import { useGitHubConnectionStatus } from "../hooks";
import type { GitHubRepoOption } from "../types";
import { cn } from "@/lib/utils";
import { GitHubConnectButton } from "./github-connect-button";
import { useQueryClient } from "@tanstack/react-query";

type GitHubRepoSelectorProps = {
  guildId: string;
  currentRepoId?: number | null;
  currentRepoName?: string | null;
  onRepoChange?: (repo: GitHubRepoOption | null) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Repository selector component for choosing GitHub repositories
 */
export const GitHubRepoSelector = ({
  guildId,
  currentRepoId,
  currentRepoName,
  onRepoChange,
  className,
  disabled = false,
}: GitHubRepoSelectorProps) => {
  const [selectedRepoId, setSelectedRepoId] = useState<string>("none");
  const { connected, hasToken } = useGitHubConnectionStatus();
  const { data, isLoading, isError, error, refetch } =
    useGitHubRepositoriesQuery();
  const connectMutation = useConnectGitHubRepoMutation(guildId);
  const queryClient = useQueryClient();

  // Refresh GitHub connection status when component mounts
  // This handles the case when user returns from OAuth
  useEffect(() => {
    // Check if we're returning from GitHub OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const githubConnected = urlParams.get("github_connected") === "true";

    if (githubConnected) {
      // Invalidate GitHub queries to refresh the connection status
      queryClient.invalidateQueries({ queryKey: ["github"] });
      queryClient.invalidateQueries({ queryKey: ["guild"] });

      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("github_connected");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [queryClient]);

  // Initialize selected repo from props
  useEffect(() => {
    if (currentRepoId && currentRepoName) {
      setSelectedRepoId(currentRepoId.toString());
    } else {
      setSelectedRepoId("none");
    }
  }, [currentRepoId, currentRepoName]);

  const handleRepoChange = (repoId: string) => {
    setSelectedRepoId(repoId);

    if (repoId === "none") {
      onRepoChange?.(null);
      return;
    }

    const repo = data?.repositories.find((r) => r.id.toString() === repoId);
    if (repo) {
      onRepoChange?.(repo);
    }
  };

  const handleConnect = async () => {
    if (!selectedRepoId || selectedRepoId === "none") return;

    const repo = data?.repositories.find(
      (r) => r.id.toString() === selectedRepoId
    );
    if (!repo) return;

    try {
      await connectMutation.mutateAsync({
        repoId: repo.id,
        repoName: repo.fullName,
      });
    } catch (error) {
      console.error("Failed to connect repository:", error);
    }
  };

  // const handleDisconnect = async () => {
  //   try {
  //     await connectMutation.mutateAsync({
  //       repoId: null,
  //       repoName: null,
  //     });
  //     setSelectedRepoId("none");
  //     onRepoChange?.(null);
  //   } catch (error) {
  //     console.error("Failed to disconnect repository:", error);
  //   }
  // };

  if (!connected || !hasToken) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>GitHub Repository</Label>
        <div className="text-sm text-muted-foreground mb-2">
          Connect your GitHub account to select a repository
        </div>
        <GitHubConnectButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>GitHub Repository</Label>
        <Skeleton className="h-10 w-full" />
        <div className="text-xs text-muted-foreground">
          Loading your repositories...
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load repositories";
    const isTokenExpired = errorMessage.includes("github_token_expired");
    const isRateLimited = errorMessage.includes("github_rate_limit");

    return (
      <div className={cn("space-y-2", className)}>
        <Label>GitHub Repository</Label>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <div className="text-sm text-destructive">
            {isTokenExpired &&
              "GitHub token expired. Please reconnect your account."}
            {isRateLimited &&
              "GitHub API rate limit exceeded. Please try again later."}
            {!isTokenExpired && !isRateLimited && "Failed to load repositories"}
          </div>
          <PixelButton
            variant="ghost"
            onClick={() => refetch()}
            className="mt-2"
            disabled={isRateLimited}
          >
            {isRateLimited ? "Rate Limited" : "Retry"}
          </PixelButton>
        </div>
      </div>
    );
  }

  if (!data?.repositories || data.repositories.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>GitHub Repository</Label>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 p-3 text-center">
          <div className="text-sm text-muted-foreground">
            No personal repositories found
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Create a repository on GitHub to get started
          </div>
        </div>
      </div>
    );
  }

  const isConnected = currentRepoId && currentRepoName;
  const hasChanges = selectedRepoId !== (currentRepoId?.toString() ?? "none");

  // Find the currently selected repository
  const selectedRepo = data?.repositories.find(
    (repo) => repo.id.toString() === selectedRepoId
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label>GitHub Repository</Label>

      <div className="flex gap-2">
        <PixelSelect
          value={selectedRepoId}
          onValueChange={handleRepoChange}
          disabled={disabled || connectMutation.isPending}
        >
          <PixelSelectTrigger className="flex-1">
            <PixelSelectValue placeholder="Select a repository">
              {selectedRepo && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedRepo.name}</span>
                  {selectedRepo.private && (
                    <Badge variant="destructive" className="text-xs text-white">
                      Private
                    </Badge>
                  )}
                </div>
              )}
            </PixelSelectValue>
          </PixelSelectTrigger>
          <PixelSelectContent>
            <PixelSelectItem value="none">
              No repository selected
            </PixelSelectItem>
            {data.repositories.map((repo) => (
              <PixelSelectItem key={repo.id} value={repo.id.toString()}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{repo.name}</span>
                  {repo.private && (
                    <span className="text-xs text-muted-foreground">
                      <Badge
                        variant="destructive"
                        className="text-xs text-white"
                      >
                        Private
                      </Badge>
                    </span>
                  )}
                  {repo.language && (
                    <span className="text-xs text-muted-foreground">
                      {repo.language}
                    </span>
                  )}
                </div>
              </PixelSelectItem>
            ))}
          </PixelSelectContent>
        </PixelSelect>

        {/* {isConnected && !hasChanges && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disabled || connectMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            Disconnect
          </Button>
        )} */}

        {hasChanges && selectedRepoId && (
          <PixelButton
            onClick={handleConnect}
            disabled={disabled || connectMutation.isPending}
          >
            {connectMutation.isPending ? "Connecting..." : "Connect"}
          </PixelButton>
        )}
      </div>

      {isConnected && (
        <div className="text-xs text-muted-foreground">
          Currently connected:{" "}
          <span className="font-medium">{currentRepoName}</span>
        </div>
      )}

      {data.repositories.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {data.count} personal repositories available
        </div>
      )}
    </div>
  );
};
