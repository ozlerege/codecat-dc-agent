import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";
import {
  getGuildRecordsByIds,
  createGuildRecord,
  sanitizeGuildPermissions,
  DEFAULT_DB_GUILD_PERMISSIONS,
} from "@/lib/supabase/guilds";
import { fetchAdminGuilds } from "@/lib/discord/guilds";
import { getUserDisplayName } from "@/lib/users/display-name";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function GET() {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { session, guilds } = await fetchAdminGuilds(supabase, data.session);

  const guildIds = guilds.map((guild) => guild.id);
  let storedGuilds: { guild_id: string }[] = [];

  if (guildIds.length > 0) {
    try {
      storedGuilds = await getGuildRecordsByIds(supabase, guildIds);
    } catch (guildsError) {
      console.error("Error fetching guild records:", guildsError);
      return NextResponse.json(
        { error: "guild_lookup_failed" },
        { status: 500 }
      );
    }
  }

  const storedGuildSet = new Set(storedGuilds.map((guild) => guild.guild_id));

  const savedGuilds = guilds
    .filter((guild) => storedGuildSet.has(guild.id))
    .map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
    }));

  const unsavedGuilds = guilds
    .filter((guild) => !storedGuildSet.has(guild.id))
    .map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
    }));

  const userProfile = session.user;
  const displayName = getUserDisplayName(userProfile ?? null);

  return NextResponse.json({
    userName: displayName,
    savedGuilds,
    unsavedGuilds,
  });
}

export async function POST(request: Request) {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const guildId = (payload as { guildId?: unknown }).guildId;
  const guildName = (payload as { guildName?: unknown }).guildName;
  const permissionsInput = (payload as { permissions?: unknown }).permissions;

  if (typeof guildId !== "string" || guildId.trim().length === 0) {
    return NextResponse.json({ error: "missing_guild_id" }, { status: 400 });
  }

  const permissions =
    permissionsInput === undefined
      ? DEFAULT_DB_GUILD_PERMISSIONS
      : sanitizeGuildPermissions(permissionsInput);

  try {
    await createGuildRecord(supabase, {
      guildId,
      installerUserId: data.session.user.id,
      name:
        typeof guildName === "string" && guildName.trim().length > 0
          ? guildName.trim()
          : undefined,
      permissions,
    });
  } catch (insertError) {
    console.error("Error creating guild record:", insertError);
    return NextResponse.json({ error: "guild_create_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
