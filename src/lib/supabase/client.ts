import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/config/env";

export const createClient = () => {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

import { DISCORD_CONFIG, ROUTES } from "@/lib/config/constants";

export const signInWithDiscord = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${window.location.origin}${ROUTES.auth.callback}`,
      scopes: DISCORD_CONFIG.oauth.scopes,
    },
  });

  if (error) {
    console.error("Error signing in with Discord:", error);
    throw error;
  }

  return data;
};

export const signOut = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
