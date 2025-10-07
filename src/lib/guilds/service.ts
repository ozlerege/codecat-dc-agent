import type { SupabaseClient, Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";
import {
  DEFAULT_DB_GUILD_PERMISSIONS,
  GuildRecord,
  getGuildForUser,
  getRecentGuildTasks,
  sanitizeGuildPermissions,
} from "@/lib/supabase/guilds";
import { fetchAdminGuilds } from "@/lib/discord/guilds";

type TypedSupabaseClient = SupabaseClient<Database>;

export class GuildDetailError extends Error {
  constructor(
    public code:
      | "guild_not_found"
      | "guild_lookup_failed"
      | "tasks_fetch_failed",
    public status: number,
    message?: string
  ) {
    super(message ?? code);
  }
}

export type GuildDetail = {
  guild: {
    id: string;
    name: string;
    icon: string | null;
    defaultRepo: string | null;
    defaultBranch: string | null;
    permissions: {
      create_roles: string[];
      confirm_roles: string[];
    };
    defaultJulesApiKeySet: boolean;
    createdAt: string | null;
  };
  tasks: {
    id: string;
    prompt: string;
    status:
      | "pending_confirmation"
      | "in_progress"
      | "rejected"
      | "completed"
      | null;
    prUrl: string | null;
    createdAt: string | null;
  }[];
};

type LoadGuildDetailOptions = {
  includeTasks?: boolean;
};

const mapGuildRecord = (
  record: GuildRecord,
  options?: { name?: string; icon?: string | null }
) => {
  const permissions = sanitizeGuildPermissions(
    record.permissions ?? DEFAULT_DB_GUILD_PERMISSIONS
  );

  return {
    id: record.guild_id,
    name: options?.name ?? record.guild_id,
    icon: options?.icon ?? null,
    defaultRepo: record.default_repo,
    defaultBranch: record.default_branch,
    permissions,
    defaultJulesApiKeySet: Boolean(record.default_jules_api_key),
    createdAt: record.created_at,
  };
};

export const loadGuildDetail = async (
  client: TypedSupabaseClient,
  session: Session,
  guildId: string,
  options?: LoadGuildDetailOptions
): Promise<GuildDetail> => {
  let guildRecord: GuildRecord | null = null;

  try {
    guildRecord = await getGuildForUser(client, guildId, session.user.id);
  } catch (lookupError) {
    console.error("Error fetching guild record:", lookupError);
    throw new GuildDetailError("guild_lookup_failed", 500);
  }

  if (!guildRecord) {
    throw new GuildDetailError("guild_not_found", 404);
  }

  let discordName = guildRecord.guild_id;
  let discordIcon: string | null = null;

  try {
    const { guilds } = await fetchAdminGuilds(client, session);
    const matchedGuild = guilds.find((guild) => guild.id === guildId);

    if (matchedGuild) {
      discordName = matchedGuild.name;
      discordIcon = matchedGuild.icon;
    }
  } catch (discordError) {
    console.warn("Unable to fetch Discord guild metadata:", discordError);
  }

  let tasks: GuildDetail["tasks"] = [];

  if (options?.includeTasks ?? true) {
    try {
      const guildTasks = await getRecentGuildTasks(client, guildId);
      tasks = guildTasks.map((task) => ({
        id: task.id,
        prompt: task.prompt,
        status: task.status,
        prUrl: task.pr_url,
        createdAt: task.created_at,
      }));
    } catch (taskError) {
      console.error("Error fetching guild tasks:", taskError);
      throw new GuildDetailError("tasks_fetch_failed", 500);
    }
  }

  return {
    guild: mapGuildRecord(guildRecord, {
      name: discordName,
      icon: discordIcon,
    }),
    tasks,
  };
};
