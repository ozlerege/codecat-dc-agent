import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";
import { sanitizeGuildPermissions, updateGuildRecord } from "@/lib/supabase/guilds";
import { loadGuildDetail, GuildDetailError } from "@/lib/guilds/service";
import { normalizeGuildId } from "@/lib/guilds/validation";
import type { GuildPermissions } from "@/lib/supabase/schema";

type TypedSupabaseClient = SupabaseClient<Database>;

const createSupabaseClient = async () => (await createClient()) as TypedSupabaseClient;

export async function GET(
  request: Request,
  context: { params: { guildId: string } }
) {
  const { guildId: rawGuildId } = context.params;
  const guildId = normalizeGuildId(rawGuildId);

  if (!guildId) {
    return NextResponse.json({ error: "invalid_guild_id" }, { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const includeTasksParam = requestUrl.searchParams.get("includeTasks");
  const includeTasks = includeTasksParam !== "false" && includeTasksParam !== "0";

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const detail = await loadGuildDetail(supabase, data.session, guildId, {
      includeTasks,
    });
    return NextResponse.json(detail);
  } catch (loadError) {
    if (loadError instanceof GuildDetailError) {
      return NextResponse.json({ error: loadError.code }, { status: loadError.status });
    }

    console.error("Unexpected guild detail error:", loadError);
    return NextResponse.json({ error: "guild_lookup_failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { guildId: string } }
) {
  const { guildId: rawGuildId } = context.params;
  const guildId = normalizeGuildId(rawGuildId);

  if (!guildId) {
    return NextResponse.json({ error: "invalid_guild_id" }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    await loadGuildDetail(supabase, data.session, guildId, { includeTasks: false });
  } catch (loadError) {
    if (loadError instanceof GuildDetailError) {
      return NextResponse.json({ error: loadError.code }, { status: loadError.status });
    }

    console.error("Unexpected guild detail error:", loadError);
    return NextResponse.json({ error: "guild_lookup_failed" }, { status: 500 });
  }

  const {
    defaultRepo: incomingRepo,
    defaultBranch: incomingBranch,
    defaultJulesApiKey: incomingDefaultKey,
    permissions: incomingPermissions,
  } = (payload ?? {}) as {
    defaultRepo?: unknown;
    defaultBranch?: unknown;
    defaultJulesApiKey?: unknown;
    permissions?: unknown;
  };

  const updates: {
    defaultRepo?: string | null;
    defaultBranch?: string | null;
    defaultJulesApiKey?: string | null;
    permissions?: GuildPermissions;
  } = {};

  if (incomingRepo !== undefined) {
    if (incomingRepo === null) {
      updates.defaultRepo = null;
    } else if (typeof incomingRepo === "string") {
      updates.defaultRepo = incomingRepo.trim() || null;
    } else {
      return NextResponse.json({ error: "invalid_default_repo" }, { status: 400 });
    }
  }

  if (incomingBranch !== undefined) {
    if (incomingBranch === null) {
      updates.defaultBranch = null;
    } else if (typeof incomingBranch === "string") {
      updates.defaultBranch = incomingBranch.trim() || null;
    } else {
      return NextResponse.json({ error: "invalid_default_branch" }, { status: 400 });
    }
  }

  if (incomingDefaultKey !== undefined) {
    if (incomingDefaultKey === null) {
      updates.defaultJulesApiKey = null;
    } else if (typeof incomingDefaultKey === "string") {
      updates.defaultJulesApiKey = incomingDefaultKey.trim() || null;
    } else {
      return NextResponse.json({ error: "invalid_default_key" }, { status: 400 });
    }
  }

  if (incomingPermissions !== undefined) {
    updates.permissions = sanitizeGuildPermissions(incomingPermissions);
  }

  if (
    updates.defaultRepo === undefined &&
    updates.defaultBranch === undefined &&
    updates.defaultJulesApiKey === undefined &&
    updates.permissions === undefined
  ) {
    return NextResponse.json({ error: "no_updates_provided" }, { status: 400 });
  }

  try {
    await updateGuildRecord(supabase, {
      guildId,
      installerUserId: data.session.user.id,
      defaultRepo: updates.defaultRepo,
      defaultBranch: updates.defaultBranch,
      defaultJulesApiKey: updates.defaultJulesApiKey,
      permissions: updates.permissions,
    });
  } catch (updateError) {
    console.error("Error updating guild:", updateError);
    return NextResponse.json({ error: "guild_update_failed" }, { status: 500 });
  }

  try {
    const detail = await loadGuildDetail(supabase, data.session, guildId, { includeTasks: false });
    return NextResponse.json({ guild: detail.guild }, { status: 200 });
  } catch (loadError) {
    if (loadError instanceof GuildDetailError) {
      return NextResponse.json({ error: loadError.code }, { status: loadError.status });
    }

    console.error("Unexpected guild detail error after update:", loadError);
    return NextResponse.json({ error: "guild_lookup_failed" }, { status: 500 });
  }
}
