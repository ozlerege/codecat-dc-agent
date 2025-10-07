/**
 * Configuration Module Exports
 * 
 * Central access point for all application configuration including
 * environment variables, constants, routes, and validation patterns.
 * 
 * @example
 * ```ts
 * import { env, DISCORD_CONFIG, ROUTES } from '@/lib/config';
 * 
 * // Type-safe environment variables
 * const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 * 
 * // Constants
 * const adminBit = DISCORD_CONFIG.permissions.adminBit;
 * 
 * // Routes
 * const guildUrl = ROUTES.guilds.detail('123456789');
 * ```
 * 
 * @module config
 */

// Environment configuration
export {
  env,
  type Env,
  hasDiscordBotToken,
  hasDiscordAppId,
  requireDiscordBotToken,
  requireDiscordAppId,
} from './env';

// Application constants
export {
  APP_CONFIG,
  DISCORD_CONFIG,
  GUILD_CONFIG,
  TASK_CONFIG,
  IMAGE_SIZES,
  ROUTES,
  QUERY_PARAMS,
  STORAGE_KEYS,
  UI_CONFIG,
  VALIDATION,
  ERROR_CODES,
  type TaskStatus,
  isValidTaskStatus,
  getTaskStatusLabel,
  getDiscordGuildIconUrl,
  getDiscordBotInviteUrl,
} from './constants';
