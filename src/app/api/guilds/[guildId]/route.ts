import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";
import { createRepositories } from "@/lib/db/repositories";
import { sanitizeGuildPermissions } from "@/lib/supabase/guilds";
import { loadGuildDetail, GuildDetailError } from "@/lib/guilds/service";
import { normalizeGuildId } from "@/lib/guilds/validation";
import type { GuildPermissions } from "@/lib/supabase/schema";

type TypedSupabaseClient = SupabaseClient<Database>;

const createSupabaseClient = async () =>
  (await createClient()) as TypedSupabaseClient;

export async function GET(
  request: Request,
  context: { params: Promise<{ guildId: string }> }
) {
  const params = await context.params;
  const { guildId: rawGuildId } = params;
  const guildId = normalizeGuildId(rawGuildId);

  if (!guildId) {
    return NextResponse.json({ error: "invalid_guild_id" }, { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const includeTasksParam = requestUrl.searchParams.get("includeTasks");
  const includeTasks =
    includeTasksParam !== "false" && includeTasksParam !== "0";

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
      return NextResponse.json(
        { error: loadError.code },
        { status: loadError.status }
      );
    }

    console.error("Unexpected guild detail error:", loadError);
    return NextResponse.json({ error: "guild_lookup_failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ guildId: string }> }
) {
  const params = await context.params;
  const { guildId: rawGuildId } = params;
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
    await loadGuildDetail(supabase, data.session, guildId, {
      includeTasks: false,
    });
  } catch (loadError) {
    if (loadError instanceof GuildDetailError) {
      return NextResponse.json(
        { error: loadError.code },
        { status: loadError.status }
      );
    }

    console.error("Unexpected guild detail error:", loadError);
    return NextResponse.json({ error: "guild_lookup_failed" }, { status: 500 });
  }

  const {
    defaultRepo: incomingRepo,
    defaultBranch: incomingBranch,
    defaultOpenRouterApiKey: incomingDefaultKey,
    defaultModel: incomingDefaultModel,
    permissions: incomingPermissions,
    githubRepoId: incomingGithubRepoId,
    githubRepoName: incomingGithubRepoName,
    githubConnected: incomingGithubConnected,
    githubAccessToken: incomingGithubAccessToken,
  } = (payload ?? {}) as {
    defaultRepo?: unknown;
    defaultBranch?: unknown;
    defaultOpenRouterApiKey?: unknown;
    defaultModel?: unknown;
    permissions?: unknown;
    githubRepoId?: unknown;
    githubRepoName?: unknown;
    githubConnected?: unknown;
    githubAccessToken?: unknown;
  };

  const updates: {
    defaultRepo?: string | null;
    defaultBranch?: string | null;
    defaultOpenRouterApiKey?: string | null;
    defaultModel?: string | null;
    permissions?: GuildPermissions;
    githubRepoId?: number | null;
    githubRepoName?: string | null;
    githubConnected?: boolean | null;
    githubAccessToken?: string | null;
  } = {};

  if (incomingRepo !== undefined) {
    if (incomingRepo === null) {
      updates.defaultRepo = null;
    } else if (typeof incomingRepo === "string") {
      updates.defaultRepo = incomingRepo.trim() || null;
    } else {
      return NextResponse.json(
        { error: "invalid_default_repo" },
        { status: 400 }
      );
    }
  }

  if (incomingBranch !== undefined) {
    if (incomingBranch === null) {
      updates.defaultBranch = null;
    } else if (typeof incomingBranch === "string") {
      updates.defaultBranch = incomingBranch.trim() || null;
    } else {
      return NextResponse.json(
        { error: "invalid_default_branch" },
        { status: 400 }
      );
    }
  }

  if (incomingDefaultKey !== undefined) {
    if (incomingDefaultKey === null) {
      updates.defaultOpenRouterApiKey = null;
    } else if (typeof incomingDefaultKey === "string") {
      updates.defaultOpenRouterApiKey = incomingDefaultKey.trim() || null;
    } else {
      return NextResponse.json(
        { error: "invalid_default_key" },
        { status: 400 }
      );
    }
  }

  if (incomingDefaultModel !== undefined) {
    if (incomingDefaultModel === null) {
      updates.defaultModel = null;
    } else if (typeof incomingDefaultModel === "string") {
      updates.defaultModel = incomingDefaultModel.trim() || null;
    } else {
      return NextResponse.json(
        { error: "invalid_default_model" },
        { status: 400 }
      );
    }
  }

  if (incomingPermissions !== undefined) {
    updates.permissions = sanitizeGuildPermissions(incomingPermissions);
  }

  if (incomingGithubRepoId !== undefined) {
    if (incomingGithubRepoId === null) {
      updates.githubRepoId = null;
    } else if (typeof incomingGithubRepoId === "number") {
      updates.githubRepoId = incomingGithubRepoId;
    } else {
      return NextResponse.json(
        { error: "invalid_github_repo_id" },
        { status: 400 }
      );
    }
  }

  if (incomingGithubRepoName !== undefined) {
    if (incomingGithubRepoName === null) {
      updates.githubRepoName = null;
    } else if (typeof incomingGithubRepoName === "string") {
      updates.githubRepoName = incomingGithubRepoName.trim() || null;
    } else {
      return NextResponse.json(
        { error: "invalid_github_repo_name" },
        { status: 400 }
      );
    }
  }

  if (incomingGithubConnected !== undefined) {
    if (incomingGithubConnected === null) {
      updates.githubConnected = null;
    } else if (typeof incomingGithubConnected === "boolean") {
      updates.githubConnected = incomingGithubConnected;
    } else {
      return NextResponse.json(
        { error: "invalid_github_connected" },
        { status: 400 }
      );
    }
  }

  if (incomingGithubAccessToken !== undefined) {
    if (incomingGithubAccessToken === null) {
      updates.githubAccessToken = null;
    } else if (typeof incomingGithubAccessToken === "string") {
      updates.githubAccessToken = incomingGithubAccessToken.trim() || null;
    } else {
      return NextResponse.json(
        { error: "invalid_github_access_token" },
        { status: 400 }
      );
    }
  }

  if (
    updates.defaultRepo === undefined &&
    updates.defaultBranch === undefined &&
    updates.defaultOpenRouterApiKey === undefined &&
    updates.defaultModel === undefined &&
    updates.permissions === undefined &&
    updates.githubRepoId === undefined &&
    updates.githubRepoName === undefined &&
    updates.githubConnected === undefined &&
    updates.githubAccessToken === undefined
  ) {
    return NextResponse.json({ error: "no_updates_provided" }, { status: 400 });
  }

  const repos = createRepositories(supabase);

  try {
    await repos.guilds.update(guildId, data.session.user.id, {
      defaultRepo: updates.defaultRepo,
      defaultBranch: updates.defaultBranch,
      defaultOpenRouterApiKey: updates.defaultOpenRouterApiKey,
      defaultModel: updates.defaultModel,
      permissions: updates.permissions,
      githubRepoId: updates.githubRepoId,
      githubRepoName: updates.githubRepoName,
      githubConnected: updates.githubConnected,
      githubAccessToken: updates.githubAccessToken,
    });
  } catch (updateError) {
    console.error("Error updating guild:", updateError);
    return NextResponse.json({ error: "guild_update_failed" }, { status: 500 });
  }

  try {
    const detail = await loadGuildDetail(supabase, data.session, guildId, {
      includeTasks: false,
    });
    return NextResponse.json({ guild: detail.guild }, { status: 200 });
  } catch (loadError) {
    if (loadError instanceof GuildDetailError) {
      return NextResponse.json(
        { error: loadError.code },
        { status: loadError.status }
      );
    }

    console.error("Unexpected guild detail error after update:", loadError);
    return NextResponse.json({ error: "guild_lookup_failed" }, { status: 500 });
  }
}
