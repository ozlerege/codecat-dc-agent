import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRepositories } from "@/lib/db/repositories";
import { getGitHubAccessToken } from "@/lib/github/auth";
import { loadGuildDetail, GuildDetailError } from "@/lib/guilds/service";
import { normalizeGuildId } from "@/lib/guilds/validation";

/**
 * POST /api/guilds/[guildId]/github
 *
 * Connect a GitHub repository to a guild
 */
export async function POST(
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

  const { repoId, repoName } = payload as {
    repoId?: unknown;
    repoName?: unknown;
  };

  if (typeof repoId !== "number" || typeof repoName !== "string") {
    return NextResponse.json(
      {
        error: "invalid_repo_data",
        message:
          "Repository ID must be a number and repository name must be a string",
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Verify user owns the guild
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

  // Get user's GitHub access token from session provider_token or user metadata
  const accessToken = getGitHubAccessToken(
    data.session.user,
    data.session.provider_token
  );

  if (!accessToken) {
    return NextResponse.json(
      {
        error: "github_not_connected",
        message: "GitHub account not connected",
      },
      { status: 400 }
    );
  }

  const repos = createRepositories(supabase);

  try {
    // Update guild with GitHub repository information
    await repos.guilds.update(guildId, data.session.user.id, {
      githubRepoId: repoId,
      githubRepoName: repoName,
      githubConnected: true,
      githubAccessToken: accessToken,
    });

    // Return updated guild data
    const detail = await loadGuildDetail(supabase, data.session, guildId, {
      includeTasks: false,
    });

    return NextResponse.json({
      success: true,
      guild: detail.guild,
    });
  } catch (updateError) {
    console.error("Error connecting GitHub repository to guild:", updateError);
    return NextResponse.json(
      {
        error: "github_connection_failed",
        message: "Failed to connect GitHub repository to guild",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/guilds/[guildId]/github
 *
 * Disconnect GitHub repository from guild
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ guildId: string }> }
) {
  const params = await context.params;
  const { guildId: rawGuildId } = params;
  const guildId = normalizeGuildId(rawGuildId);

  if (!guildId) {
    return NextResponse.json({ error: "invalid_guild_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Verify user owns the guild
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

  const repos = createRepositories(supabase);

  try {
    // Clear GitHub connection from guild
    await repos.guilds.update(guildId, data.session.user.id, {
      githubRepoId: null,
      githubRepoName: null,
      githubConnected: false,
      githubAccessToken: null,
    });

    // Return updated guild data
    const detail = await loadGuildDetail(supabase, data.session, guildId, {
      includeTasks: false,
    });

    return NextResponse.json({
      success: true,
      guild: detail.guild,
    });
  } catch (updateError) {
    console.error(
      "Error disconnecting GitHub repository from guild:",
      updateError
    );
    return NextResponse.json(
      {
        error: "github_disconnection_failed",
        message: "Failed to disconnect GitHub repository from guild",
      },
      { status: 500 }
    );
  }
}
