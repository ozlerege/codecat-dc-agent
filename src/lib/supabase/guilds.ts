import type { SupabaseClient } from "@supabase/supabase-js";
import { Database, GuildPermissions } from "./schema";

type TypedSupabaseClient = SupabaseClient<Database>;

export const DEFAULT_DB_GUILD_PERMISSIONS: GuildPermissions = {
  create_roles: [],
  confirm_roles: [],
};

export const sanitizeGuildPermissions = (value: unknown): GuildPermissions => {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_DB_GUILD_PERMISSIONS };
  }

  const createRolesCandidate = (value as { create_roles?: unknown })
    .create_roles;
  const confirmRolesCandidate = (value as { confirm_roles?: unknown })
    .confirm_roles;

  const create_roles = Array.isArray(createRolesCandidate)
    ? createRolesCandidate.filter(
        (role): role is string => typeof role === "string"
      )
    : [];

  const confirm_roles = Array.isArray(confirmRolesCandidate)
    ? confirmRolesCandidate.filter(
        (role): role is string => typeof role === "string"
      )
    : [];

  return {
    create_roles,
    confirm_roles,
  };
};

export const getGuildRecordsByIds = async (
  client: TypedSupabaseClient,
  guildIds: string[]
) => {
  if (guildIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("guilds")
    .select("guild_id")
    .in("guild_id", guildIds);

  if (error) {
    throw error;
  }

  return data ?? [];
};

type CreateGuildRecordInput = {
  guildId: string;
  installerUserId: string;
  permissions?: GuildPermissions;
  defaultBranch?: string | null;
  defaultRepo?: string | null;
  defaultJulesApiKey?: string | null;
};

export const createGuildRecord = async (
  client: TypedSupabaseClient,
  input: CreateGuildRecordInput
) => {
  const {
    guildId,
    installerUserId,
    permissions = DEFAULT_DB_GUILD_PERMISSIONS,
    defaultBranch = "main",
    defaultRepo = null,
    defaultJulesApiKey = null,
  } = input;

  const { error } = await client.from("guilds").insert(
    {
      guild_id: guildId,
      installer_user_id: installerUserId,
      default_branch: defaultBranch,
      permissions,
      default_repo: defaultRepo,
      default_jules_api_key: defaultJulesApiKey,
    },
    {
      onConflict: "guild_id",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw error;
  }
};
