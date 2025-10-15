import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = (await createClient()) as SupabaseClient<Database>;
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error("Error fetching authenticated user:", userError);
      return NextResponse.redirect(`${origin}/?error=user_fetch_failed`);
    }

    const identities = userData.user.identities ?? [];
    const discordIdentity = identities.find(
      (identity) => identity.provider === "discord"
    );
    const githubIdentity = identities.find(
      (identity) => identity.provider === "github"
    );

    // Handle Discord OAuth
    if (discordIdentity) {
      const discordId =
        userData.user.user_metadata?.provider_id ||
        discordIdentity?.identity_data?.provider_id ||
        userData.user.user_metadata?.sub ||
        discordIdentity?.identity_data?.id;

      if (!discordId) {
        console.error("Discord ID missing from user metadata");
        return NextResponse.redirect(`${origin}/?error=discord_id_missing`);
      }

      const displayName =
        userData.user.user_metadata?.custom_claims?.global_name ||
        userData.user.user_metadata?.name ||
        userData.user.user_metadata?.full_name ||
        userData.user.email ||
        "Discord User";

      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing user:", fetchError);
        return NextResponse.redirect(`${origin}/?error=user_lookup_failed`);
      }

      if (!existingUser) {
        const insertPayload = {
          id: userData.user.id,
          discord_id: discordId,
          discord_username: displayName,
          email: userData.user.email,
        } satisfies Database["public"]["Tables"]["users"]["Insert"];

        const { error: insertError } = await supabase
          .from("users")
          .insert(insertPayload as never);

        if (insertError) {
          console.error("Error inserting new user record:", insertError);
          return NextResponse.redirect(`${origin}/?error=profile_init_failed`);
        }
      }

      return NextResponse.redirect(`${origin}/guilds`);
    }

    // Handle GitHub OAuth - redirect back to settings with refresh parameter
    if (githubIdentity) {
      const githubIdentityData = githubIdentity.identity_data as
        | Record<string, unknown>
        | null;

      const getStringValue = (value: unknown): string | null =>
        typeof value === "string" && value.trim().length > 0 ? value : null;

      // Extract GitHub token and username
      const githubToken =
        getStringValue(githubIdentityData?.["access_token"]) ??
        getStringValue(githubIdentityData?.["provider_token"]) ??
        getStringValue(userData.user.user_metadata?.["github_token"]);

      const githubUsername =
        getStringValue(githubIdentityData?.["user_name"]) ??
        getStringValue(githubIdentityData?.["login"]) ??
        getStringValue(userData.user.user_metadata?.["user_name"]);

      if (githubToken) {
        // Store GitHub token and username in users table
        const updatePayload = {
          github_access_token: githubToken,
          github_username: githubUsername,
        } satisfies Database["public"]["Tables"]["users"]["Update"];

        const { error: updateError } = await supabase
          .from("users")
          .update(updatePayload as never)
          .eq("id", userData.user.id);

        if (updateError) {
          console.error(
            "Error storing GitHub token in users table:",
            updateError
          );
        } else {
          console.log("GitHub token stored successfully in users table");
        }
      }

      // Check if there's a state parameter that might contain the redirect URL
      const redirectUrl = state
        ? decodeURIComponent(state)
        : `${origin}/guilds`;
      return NextResponse.redirect(`${redirectUrl}?github_connected=true`);
    }
  }

  return NextResponse.redirect(`${origin}/guilds`);
}
