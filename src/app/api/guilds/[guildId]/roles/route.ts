import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";
import { normalizeGuildId } from "@/lib/guilds/validation";
import { getGuildForUser } from "@/lib/supabase/guilds";
import { fetchDiscordRoles } from "@/lib/discord/roles";

type TypedSupabaseClient = SupabaseClient<Database>;

const createSupabaseClient = async () =>
  (await createClient()) as TypedSupabaseClient;

export async function GET(
  _request: Request,
  context: { params: { guildId: string } }
) {
  const guildId = normalizeGuildId(context.params.guildId);

  if (!guildId) {
    return NextResponse.json({ error: "invalid_guild_id" }, { status: 400 });
  }

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const guildRecord = await getGuildForUser(
      supabase,
      guildId,
      data.session.user.id
    );

    if (!guildRecord) {
      return NextResponse.json({ error: "guild_not_found" }, { status: 404 });
    }

    try {
      const roles = await fetchDiscordRoles(guildId);
      return NextResponse.json({ roles });
    } catch (discordError) {
      console.error(
        "Failed to fetch Discord roles from Discord API:",
        discordError
      );

      const fallbackRoleIds = [
        ...(guildRecord.permissions?.create_roles ?? []),
        ...(guildRecord.permissions?.confirm_roles ?? []),
      ];
      const fallbackRoles = Array.from(new Set(fallbackRoleIds)).map(
        (roleId) => ({
          id: roleId,
          name: roleId,
          color: 0,
          managed: false,
          mentionable: false,
          position: 0,
        })
      );

      return NextResponse.json({
        roles: fallbackRoles,
        warning: "discord_roles_unavailable",
      });
    }
  } catch (fetchError) {
    console.error("Failed to fetch Discord roles:", fetchError);

    const errorMessage =
      fetchError instanceof Error
        ? fetchError.message
        : "Failed to fetch Discord roles";
    return NextResponse.json(
      {
        error: "roles_fetch_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
