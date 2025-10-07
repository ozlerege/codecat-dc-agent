/**
 * Guild Feature Types
 * 
 * Type definitions for guild-related data and operations.
 * 
 * @module features/guilds/types
 */

import type { GuildRecord } from '@/lib/db/repositories';
import type { DiscordRole } from '@/lib/discord/roles';

/**
 * Guild permissions structure
 */
export type GuildPermissionsShape = {
  create_roles: string[];
  confirm_roles: string[];
};

/**
 * Guild summary for list views
 */
export type GuildSummary = {
  id: string;
  name: string;
  icon: string | null;
};

/**
 * Guild detail with all information
 */
export type GuildDetail = {
  guild: {
    id: string;
    name: string;
    icon: string | null;
    defaultRepo: string | null;
    defaultBranch: string | null;
    permissions: GuildPermissionsShape;
    defaultJulesApiKeySet: boolean;
    createdAt: string | null;
  };
  tasks: GuildTaskSummary[];
};

/**
 * Task summary for guild task lists
 */
export type GuildTaskSummary = {
  id: string;
  prompt: string;
  status:
    | 'pending_confirmation'
    | 'in_progress'
    | 'rejected'
    | 'completed'
    | null;
  prUrl: string | null;
  createdAt: string | null;
};

/**
 * Guilds query result from API
 */
export type GuildsQueryResult = {
  userName: string;
  savedGuilds: GuildSummary[];
  unsavedGuilds: GuildSummary[];
};

/**
 * Guild detail query result
 */
export type GuildDetailResult = GuildDetail;

/**
 * Input for creating a guild
 */
export type CreateGuildInput = {
  guildId: string;
  name?: string | null;
};

/**
 * Input for updating a guild
 */
export type UpdateGuildInput = {
  defaultRepo?: string | null;
  defaultBranch?: string | null;
  defaultJulesApiKey?: string | null;
  permissions?: GuildPermissionsShape;
};

/**
 * Guild roles query result
 */
export type GuildRolesResult = {
  roles: DiscordRole[];
  warning?: string;
};

/**
 * Guild detail error types
 */
export enum GuildDetailErrorCode {
  GUILD_NOT_FOUND = 'guild_not_found',
  GUILD_LOOKUP_FAILED = 'guild_lookup_failed',
  TASKS_FETCH_FAILED = 'tasks_fetch_failed',
}

/**
 * Guild detail error class
 */
export class GuildDetailError extends Error {
  constructor(
    public code: GuildDetailErrorCode,
    public status: number,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'GuildDetailError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GuildDetailError);
    }
  }
}

/**
 * Options for loading guild detail
 */
export type LoadGuildDetailOptions = {
  includeTasks?: boolean;
};

/**
 * Re-export GuildRecord from repositories
 */
export type { GuildRecord };
