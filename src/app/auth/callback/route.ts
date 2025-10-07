import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

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
    const discordIdentity = identities.find((identity) => identity.provider === "discord");

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
      const { error: insertError } = await supabase.from("users").insert({
        id: userData.user.id,
        discord_id: discordId,
        discord_username: displayName,
        email: userData.user.email,
      });

      if (insertError) {
        console.error("Error inserting new user record:", insertError);
        return NextResponse.redirect(`${origin}/?error=profile_init_failed`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/guilds`);
}
