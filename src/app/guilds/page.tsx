import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuildsContent } from "./guilds-content";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserDisplayName } from "@/lib/users/display-name";

type TypedSupabaseClient = SupabaseClient;

export default async function GuildsPage() {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Error retrieving user session:", error);
    redirect("/?error=session");
  }

  const session = data.session;

  if (!session?.user) {
    redirect("/?error=unauthenticated");
  }

  const initialUserName = getUserDisplayName(session.user);

  return <GuildsContent initialUserName={initialUserName} />;
}
