import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";
import { normalizeGuildId } from "@/lib/guilds/validation";
import { loadGuildDetail, GuildDetailError } from "@/lib/guilds/service";
import { GuildRouteProvider } from "@/features/guilds/context";
import { GuildSidebarLayout } from "@/features/guilds/components/guild-sidebar-nav";
import type { GuildDetailResult } from "@/lib/guilds/hooks";

type TypedSupabaseClient = SupabaseClient<Database>;

type GuildLayoutProps = {
  children: ReactNode;
  params: { guildId: string };
};

const GuildLayout = async ({ children, params }: GuildLayoutProps) => {
  const normalizedGuildId = normalizeGuildId(params.guildId);

  if (!normalizedGuildId) {
    notFound();
  }

  const supabase = (await createClient()) as TypedSupabaseClient;
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Error retrieving user session:", error);
    redirect("/?error=session");
  }

  if (!data.session?.user) {
    redirect("/?error=unauthenticated");
  }

  try {
    const detail = await loadGuildDetail(supabase, data.session, normalizedGuildId, {
      includeTasks: false,
    });

    const initialDetail: GuildDetailResult = {
      ...detail,
      tasks: detail.tasks ?? [],
    };

    return (
      <GuildRouteProvider
        value={{
          guildId: normalizedGuildId,
          guildName: detail.guild.name,
          guildIcon: detail.guild.icon,
          initialDetail,
        }}
      >
        <GuildSidebarLayout>{children}</GuildSidebarLayout>
      </GuildRouteProvider>
    );
  } catch (loadError) {
    if (loadError instanceof GuildDetailError && loadError.status === 404) {
      notFound();
    }

    console.error("Error loading guild detail:", loadError);
    redirect("/guilds?error=guild_not_found");
  }

  return null;
};

export default GuildLayout;
