/**
 * Guild Repository
 *
 * Handles all database operations related to Discord guilds.
 * Provides a clean interface for guild CRUD operations.
 *
 * @module db/repositories
 */

import { BaseRepository } from "./base-repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GuildPermissions } from "@/lib/supabase/schema";
import { GUILD_CONFIG } from "@/lib/config/constants";

/**
 * Guild record type from database
 */
export type GuildRecord = {
  id: string;
  guild_id: string;
  installer_user_id: string | null;
  name: string | null;
  default_repo: string | null;
  default_branch: string | null;
  permissions: GuildPermissions | null;
  default_openrouter_api_key: string | null;
  default_model: string | null;
  github_repo_id: number | null;
  github_repo_name: string | null;
  github_connected: boolean | null;
  github_access_token: string | null;
  created_at: string | null;
};

/**
 * Input for creating a new guild
 */
export type CreateGuildInput = {
  guildId: string;
  installerUserId: string;
  name?: string | null;
  permissions?: GuildPermissions;
  defaultBranch?: string | null;
  defaultRepo?: string | null;
  defaultOpenRouterApiKey?: string | null;
  defaultModel?: string | null;
};

/**
 * Input for updating a guild
 */
export type UpdateGuildInput = {
  name?: string | null;
  defaultRepo?: string | null;
  defaultBranch?: string | null;
  defaultOpenRouterApiKey?: string | null;
  defaultModel?: string | null;
  permissions?: GuildPermissions;
  githubRepoId?: number | null;
  githubRepoName?: string | null;
  githubConnected?: boolean | null;
  githubAccessToken?: string | null;
};

/**
 * Guild Repository
 * Manages all guild-related database operations
 */
export class GuildRepository extends BaseRepository {
  constructor(client: SupabaseClient<Database>) {
    super(client, "GuildRepository");
  }

  /**
   * Find guild by ID and user ID
   *
   * @param guildId - Discord guild ID
   * @param userId - User ID who should own this guild
   * @returns Guild record or null if not found
   */
  async findById(guildId: string, userId: string): Promise<GuildRecord | null> {
    this.validateRequired({ guildId, userId }, "findById");

    try {
      const { data, error } = await this.client
        .from("guilds")
        .select("*")
        .eq("guild_id", guildId)
        .eq("installer_user_id", userId)
        .maybeSingle();

      if (error) throw error;

      this.logSuccess("findById", { guildId, userId, found: !!data });
      return data as GuildRecord | null;
    } catch (error) {
      this.handleError(error, "findById", { guildId, userId });
    }
  }

  /**
   * Find multiple guilds by their IDs
   *
   * @param guildIds - Array of Discord guild IDs
   * @returns Array of matching guild records
   */
  async findByIds(
    guildIds: string[]
  ): Promise<Pick<GuildRecord, "guild_id">[]> {
    if (guildIds.length === 0) {
      return [];
    }

    try {
      const { data, error } = await this.client
        .from("guilds")
        .select("guild_id")
        .in("guild_id", guildIds);

      if (error) throw error;

      this.logSuccess("findByIds", {
        count: guildIds.length,
        found: data?.length ?? 0,
      });
      return this.safeArray(data);
    } catch (error) {
      this.handleError(error, "findByIds", { guildIds });
    }
  }

  /**
   * Create a new guild record
   *
   * @param input - Guild creation data
   */
  async create(input: CreateGuildInput): Promise<void> {
    this.validateRequired(
      { guildId: input.guildId, installerUserId: input.installerUserId },
      "create"
    );

    const {
      guildId,
      installerUserId,
      name = null,
      permissions = GUILD_CONFIG.defaultPermissions,
      defaultBranch = GUILD_CONFIG.defaultBranch,
      defaultRepo = null,
      defaultOpenRouterApiKey = null,
      defaultModel = "anthropic/claude-3.5-sonnet",
    } = input;

    try {
      const insertPayload = {
        guild_id: guildId,
        installer_user_id: installerUserId,
        name,
        default_branch: defaultBranch,
        permissions,
        default_repo: defaultRepo,
        default_openrouter_api_key: defaultOpenRouterApiKey,
        default_model: defaultModel,
      } satisfies Database["public"]["Tables"]["guilds"]["Insert"];

      const { error } = await this.client
        .from("guilds")
        .insert(insertPayload as never);

      if (error) {
        // Ignore duplicate key errors (guild already exists)
        if (error.code === "23505") {
          this.logSuccess("create", { guildId, status: "already_exists" });
          return;
        }
        throw error;
      }

      this.logSuccess("create", { guildId });

      // Update name if provided (for existing guilds)
      if (name) {
        await this.updateName(guildId, installerUserId, name);
      }
    } catch (error) {
      this.handleError(error, "create", { guildId, installerUserId });
    }
  }

  /**
   * Update guild name
   *
   * @param guildId - Discord guild ID
   * @param userId - User ID who owns this guild
   * @param name - New guild name
   */
  async updateName(
    guildId: string,
    userId: string,
    name: string
  ): Promise<void> {
    this.validateRequired({ guildId, userId, name }, "updateName");

    try {
      const updatePayload = {
        name,
      } satisfies Database["public"]["Tables"]["guilds"]["Update"];

      const { error } = await this.client
        .from("guilds")
        .update(updatePayload as never)
        .eq("guild_id", guildId)
        .eq("installer_user_id", userId);

      if (error) throw error;

      this.logSuccess("updateName", { guildId, name });
    } catch (error) {
      // Log but don't throw - name update is not critical
      console.warn("[GuildRepository] updateName failed:", error);
    }
  }

  /**
   * Update guild record
   *
   * @param guildId - Discord guild ID
   * @param userId - User ID who owns this guild
   * @param updates - Fields to update
   * @returns Updated guild record
   */
  async update(
    guildId: string,
    userId: string,
    updates: UpdateGuildInput
  ): Promise<GuildRecord> {
    this.validateRequired({ guildId, userId }, "update");

    if (Object.keys(updates).length === 0) {
      throw this.handleError(new Error("No updates provided"), "update", {
        guildId,
        userId,
      });
    }

    try {
      const dbUpdates: Database["public"]["Tables"]["guilds"]["Update"] = {};

      if (updates.defaultRepo !== undefined) {
        dbUpdates.default_repo = updates.defaultRepo;
      }
      if (updates.defaultBranch !== undefined) {
        dbUpdates.default_branch = updates.defaultBranch;
      }
      if (updates.defaultOpenRouterApiKey !== undefined) {
        dbUpdates.default_openrouter_api_key = updates.defaultOpenRouterApiKey;
      }
      if (updates.defaultModel !== undefined) {
        dbUpdates.default_model = updates.defaultModel;
      }
      if (updates.permissions !== undefined) {
        dbUpdates.permissions = updates.permissions;
      }
      if (updates.name !== undefined) {
        dbUpdates.name = updates.name;
      }
      if (updates.githubRepoId !== undefined) {
        dbUpdates.github_repo_id = updates.githubRepoId;
      }
      if (updates.githubRepoName !== undefined) {
        dbUpdates.github_repo_name = updates.githubRepoName;
      }
      if (updates.githubConnected !== undefined) {
        dbUpdates.github_connected = updates.githubConnected;
      }
      if (updates.githubAccessToken !== undefined) {
        dbUpdates.github_access_token = updates.githubAccessToken;
      }

      const { data, error } = await this.client
        .from("guilds")
        .update(dbUpdates as never)
        .eq("guild_id", guildId)
        .eq("installer_user_id", userId)
        .select("*")
        .single();

      if (error) throw error;

      const guild = this.requireData(data, "update", "Guild");
      this.logSuccess("update", {
        guildId,
        updatedFields: Object.keys(dbUpdates),
      });

      return guild as GuildRecord;
    } catch (error) {
      this.handleError(error, "update", { guildId, userId, updates });
    }
  }

  /**
   * Delete a guild record
   *
   * @param guildId - Discord guild ID
   * @param userId - User ID who owns this guild
   */
  async delete(guildId: string, userId: string): Promise<void> {
    this.validateRequired({ guildId, userId }, "delete");

    try {
      const { error } = await this.client
        .from("guilds")
        .delete()
        .eq("guild_id", guildId)
        .eq("installer_user_id", userId);

      if (error) throw error;

      this.logSuccess("delete", { guildId });
    } catch (error) {
      this.handleError(error, "delete", { guildId, userId });
    }
  }

  /**
   * Check if a guild exists
   *
   * @param guildId - Discord guild ID
   * @returns True if guild exists
   */
  async exists(guildId: string): Promise<boolean> {
    this.validateRequired({ guildId }, "exists");

    try {
      const { data, error } = await this.client
        .from("guilds")
        .select("guild_id")
        .eq("guild_id", guildId)
        .maybeSingle();

      if (error) throw error;

      return data !== null;
    } catch (error) {
      this.handleError(error, "exists", { guildId });
    }
  }
}
