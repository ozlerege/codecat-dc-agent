import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GitHubClient } from "@/lib/github/client";
import { GitHubApiError } from "@/lib/github/types";
import type { Database } from "@/lib/supabase/schema";

type UserGitHubFields = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "github_access_token" | "github_username"
>;

/**
 * GET /api/github/repositories
 *
 * Fetch user's personal GitHub repositories
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Get token from users table (stored from GitHub OAuth callback)
  let accessToken: string | null = null;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("github_access_token, github_username")
    .eq("id", data.user.id)
    .single<UserGitHubFields>();

  if (userError) {
    console.error("Error fetching user GitHub token:", userError);
  } else if (userData?.github_access_token) {
    accessToken = userData.github_access_token;
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        error: "github_not_connected",
        message: "GitHub account not connected",
      },
      { status: 400 }
    );
  }

  try {
    const client = new GitHubClient();
    const repositories = await client.fetchUserRepositories(accessToken, {
      perPage: 100,
      sort: "updated",
      direction: "desc",
    });

    // Get the authenticated user's username for filtering
    const authenticatedUser = await client.getAuthenticatedUser(accessToken);

    // Filter to only personal repositories (not organization repos)
    const personalRepos = repositories.filter(
      (repo) => repo.owner.login === authenticatedUser.login
    );

    // Convert to UI-friendly format
    const repoOptions = GitHubClient.toRepoOptions(personalRepos);

    return NextResponse.json({
      repositories: repoOptions,
      count: repoOptions.length,
    });
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);

    if (error instanceof GitHubApiError) {
      // Handle specific GitHub API errors
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: "github_token_expired",
            message: "GitHub token has expired. Please reconnect your account.",
          },
          { status: 401 }
        );
      }

      if (error.status === 403) {
        return NextResponse.json(
          {
            error: "github_rate_limit",
            message: "GitHub API rate limit exceeded. Please try again later.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "github_api_error",
          message: error.message,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: "github_fetch_failed",
        message: "Failed to fetch GitHub repositories",
      },
      { status: 500 }
    );
  }
}
