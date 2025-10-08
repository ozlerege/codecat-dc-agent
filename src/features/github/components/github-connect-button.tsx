"use client";

import { Button } from "@/components/ui/button";
import { useGitHubConnectionStatus } from "../hooks";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getGitHubOAuthUrl } from "@/lib/github/oauth";
import { createClient } from "@/lib/supabase/client";

type GitHubConnectButtonProps = {
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

/**
 * Button component for GitHub connection status and actions
 */
export const GitHubConnectButton = ({
  className,
  onConnect,
  onDisconnect,
}: GitHubConnectButtonProps) => {
  const { connected, hasToken, tokenExpired, isLoading, isNotConnected } =
    useGitHubConnectionStatus();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const handleConnect = async () => {
    try {
      // For reconnection, try to refresh the repositories first
      if (hasToken && !connected) {
        try {
          const response = await fetch("/api/github/repositories");
          if (response.ok) {
            console.log("GitHub token refreshed successfully");
            onConnect?.();
            return;
          }
        } catch (error) {
          console.log(
            "GitHub token refresh failed, proceeding with reconnection"
          );
        }
      }

      // Use direct GitHub OAuth flow (doesn't interfere with Supabase Auth)
      const currentUrl = window.location.pathname + window.location.search;

      // Get current user ID to pass in state
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      console.log("GitHub Connect - Session data:", {
        hasSession: !!session,
        userId: userId,
        currentUrl: currentUrl,
      });

      if (!userId) {
        console.error("No user session found");
        return;
      }

      try {
        const stateParam = encodeURIComponent(`${currentUrl}|${userId}`);
        const oauthUrl = getGitHubOAuthUrl(stateParam);

        console.log("GitHub OAuth URL:", oauthUrl);
        console.log("State parameter:", stateParam);

        // Redirect to GitHub OAuth
        window.location.href = oauthUrl;
      } catch (error) {
        console.error("Failed to generate GitHub OAuth URL:", error);
        alert(
          "GitHub OAuth is not configured. Please check your environment variables."
        );
      }
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
    }
  };

  const handleDisconnect = () => {
    onDisconnect?.();
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={cn("w-full", className)}>
        Checking GitHub connection...
      </Button>
    );
  }

  if (tokenExpired) {
    return (
      <Button
        variant="outline"
        onClick={handleConnect}
        className={cn("w-full", className)}
      >
        🔄 Reconnect GitHub
      </Button>
    );
  }

  if (connected && hasToken) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          ✅ GitHub Connected
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleConnect}
          className="text-xs text-muted-foreground"
        >
          Switch Account
        </Button>
      </div>
    );
  }

  // Show connect button for not connected or token expired states
  return (
    <Button
      variant="outline"
      onClick={handleConnect}
      className={cn("w-full", className)}
    >
      {isNotConnected ? "🔗 Connect GitHub" : "🔄 Reconnect GitHub"}
    </Button>
  );
};
