/**
 * Guild Validation Utilities
 * 
 * Validation functions and patterns for guild-related data.
 * 
 * @module features/guilds/utils
 */

import { GUILD_CONFIG } from '@/lib/config/constants';

/**
 * Guild ID validation regex pattern
 * Discord snowflake IDs are 17-20 digits
 */
export const GUILD_ID_REGEX = GUILD_CONFIG.idPattern;

/**
 * Normalize and validate a guild ID
 * 
 * @param value - Value to normalize (string, array, or undefined)
 * @returns Normalized guild ID or null if invalid
 * 
 * @example
 * ```ts
 * const guildId = normalizeGuildId('123456789012345678');
 * if (guildId) {
 *   console.log('Valid guild ID:', guildId);
 * }
 * ```
 */
export const normalizeGuildId = (value: string | string[] | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!GUILD_ID_REGEX.test(trimmed)) {
    return null;
  }

  return trimmed;
};

/**
 * Check if a value is a valid guild ID
 * 
 * @param value - Value to check
 * @returns True if value is a valid guild ID
 * 
 * @example
 * ```ts
 * if (isValidGuildId('123456789012345678')) {
 *   // Process valid guild ID
 * }
 * ```
 */
export const isValidGuildId = (value: unknown): value is string => {
  return typeof value === 'string' && GUILD_ID_REGEX.test(value);
};
