import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeGitHubCode, getGitHubUserInfo } from "@/lib/github/oauth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";

/**
 * GitHub OAuth Callback
 *
 * Handles GitHub OAuth callback without interfering with Supabase Auth session
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;

  if (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(`${origin}/?error=github_oauth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=github_code_missing`);
  }

  try {
    // Exchange code for access token
    const { access_token } = await exchangeGitHubCode(code);

    // Get GitHub user info
    const githubUser = await getGitHubUserInfo(access_token);

    // Extract user ID from state parameter
    const stateParts = state ? decodeURIComponent(state).split("|") : [];
    const redirectUrl = stateParts[0] || `${origin}/guilds`;
    const userId = stateParts[1];

    if (!userId) {
      console.error("No user ID found in state parameter");
      return NextResponse.redirect(`${origin}/?error=no_user_id`);
    }

    // Get Supabase client
    const supabase = await createClient();
    const db = supabase as SupabaseClient<Database>;

    // Store GitHub token and username in users table
    console.log("Storing GitHub token for user:", userId, {
      tokenLength: access_token.length,
      username: githubUser.login,
    });

    const updatePayload = {
      github_access_token: access_token,
      github_username: githubUser.login,
    } satisfies Database["public"]["Tables"]["users"]["Update"];

    const { error: updateError } = await db
      .from("users")
      .update(updatePayload as never)
      .eq("id", userId);

    if (updateError) {
      console.error("Error storing GitHub token:", updateError);
      return NextResponse.redirect(
        `${origin}/?error=github_token_storage_failed`
      );
    }

    console.log("GitHub token stored successfully for user:", userId);

    // Ensure the redirect URL is absolute
    const absoluteRedirectUrl = redirectUrl.startsWith("http")
      ? redirectUrl
      : `${origin}${redirectUrl}`;

    return NextResponse.redirect(
      `${absoluteRedirectUrl}?github_connected=true`
    );
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.redirect(
      `${origin}/?error=github_oauth_callback_failed`
    );
  }
}
