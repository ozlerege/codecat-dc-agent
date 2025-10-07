import type { User } from "@supabase/supabase-js";

export const getUserDisplayName = (user: User | null | undefined) => {
  if (!user) {
    return "User";
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const customClaims =
    (metadata.custom_claims as { global_name?: string } | null | undefined) ?? undefined;

  return (
    customClaims?.global_name ||
    (metadata.name as string | undefined) ||
    (metadata.full_name as string | undefined) ||
    user.email ||
    (metadata.preferred_username as string | undefined) ||
    "User"
  );
};

