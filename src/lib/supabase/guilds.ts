import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GuildPermissions } from "./schema";

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
  name?: string | null;
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
    name = null,
    permissions = DEFAULT_DB_GUILD_PERMISSIONS,
    defaultBranch = "main",
    defaultRepo = null,
    defaultJulesApiKey = null,
  } = input;

  const { error } = await client.from("guilds").insert(
    {
      guild_id: guildId,
      installer_user_id: installerUserId,
      name,
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

  if (name) {
    await client
      .from("guilds")
      .update({ name })
      .eq("guild_id", guildId)
      .eq("installer_user_id", installerUserId);
  }
};

export type GuildRecord = {
  id: string;
  guild_id: string;
  installer_user_id: string | null;
  name: string | null;
  default_repo: string | null;
  default_branch: string | null;
  permissions: GuildPermissions | null;
  default_jules_api_key: string | null;
  created_at: string | null;
};

export const getGuildForUser = async (
  client: TypedSupabaseClient,
  guildId: string,
  userId: string
) => {
  const { data, error } = await client
    .from("guilds")
    .select(
      "id, guild_id, installer_user_id, name, default_repo, default_branch, permissions, default_jules_api_key, created_at"
    )
    .eq("guild_id", guildId)
    .eq("installer_user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GuildRecord | null) ?? null;
};

type UpdateGuildRecordInput = {
  guildId: string;
  installerUserId: string;
  defaultRepo?: string | null;
  defaultBranch?: string | null;
  defaultJulesApiKey?: string | null;
  permissions?: GuildPermissions;
  name?: string | null;
};

export const updateGuildRecord = async (
  client: TypedSupabaseClient,
  input: UpdateGuildRecordInput
) => {
  const {
    guildId,
    installerUserId,
    defaultRepo,
    defaultBranch,
    defaultJulesApiKey,
    permissions,
    name,
  } = input;

  const updates: Record<string, unknown> = {};

  if (defaultRepo !== undefined) {
    updates.default_repo = defaultRepo;
  }

  if (defaultBranch !== undefined) {
    updates.default_branch = defaultBranch;
  }

  if (defaultJulesApiKey !== undefined) {
    updates.default_jules_api_key = defaultJulesApiKey;
  }

  if (permissions !== undefined) {
    updates.permissions = permissions;
  }

  if (name !== undefined) {
    updates.name = name;
  }

  const { data, error } = await client
    .from("guilds")
    .update(updates)
    .eq("guild_id", guildId)
    .eq("installer_user_id", installerUserId)
    .select(
      "id, guild_id, installer_user_id, name, default_repo, default_branch, permissions, default_jules_api_key, created_at"
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as GuildRecord | null) ?? null;
};

export type GuildTask = {
  id: string;
  prompt: string;
  status:
    | "pending_confirmation"
    | "in_progress"
    | "rejected"
    | "completed"
    | null;
  pr_url: string | null;
  created_at: string | null;
};

export const getRecentGuildTasks = async (
  client: TypedSupabaseClient,
  guildUuid: string,
  limit = 10
) => {
  const { data, error } = await client
    .from("tasks")
    .select("id, prompt, status, pr_url, created_at")
    .eq("guild_id", guildUuid)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as GuildTask[]) ?? [];
};
