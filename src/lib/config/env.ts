/**
 * Environment Configuration Module
 *
 * Provides type-safe access to environment variables with validation.
 * All environment variables are validated at module load time to fail fast
 * if required variables are missing.
 *
 * @module config/env
 */

/**
 * Validate that a required environment variable exists
 * @throws {Error} If the environment variable is missing
 */
const requireEnv = (key: string, value: string | undefined): string => {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please check your .env.local file and ensure ${key} is set.`
    );
  }
  return value;
};

/**
 * Get optional environment variable with default value
 */
const getOptionalEnv = (
  value: string | undefined,
  defaultValue: string = ""
): string => {
  return value?.trim() || defaultValue;
};

// Required environment variables (validated at load time)
const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
} as const;

// Optional environment variables
const OPTIONAL_ENV = {
  DISCORD_BOT_TOKEN: getOptionalEnv(process.env.DISCORD_BOT_TOKEN),
  NEXT_PUBLIC_DISCORD_APP_ID: getOptionalEnv(
    process.env.NEXT_PUBLIC_DISCORD_APP_ID ||
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  ),
  FRONTEND_URL: getOptionalEnv(process.env.FRONTEND_URL),
  BACKEND_URL: getOptionalEnv(process.env.BACKEND_URL),
  NEXT_PUBLIC_GITHUB_CLIENT_ID: getOptionalEnv(
    process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  ),
  GITHUB_CLIENT_SECRET: getOptionalEnv(process.env.GITHUB_CLIENT_SECRET),
  NEXT_PUBLIC_SITE_URL: getOptionalEnv(process.env.NEXT_PUBLIC_SITE_URL),
  OPENROUTER_API_KEY: getOptionalEnv(process.env.OPENROUTER_API_KEY),
  OPENROUTER_API_BASE_URL: getOptionalEnv(process.env.OPENROUTER_API_BASE_URL),
} as const;

/**
 * Environment information
 */
const ENV_INFO = {
  NODE_ENV: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

/**
 * Validated and typed environment configuration
 *
 * @example
 * ```ts
 * import { env } from '@/lib/config/env';
 *
 * // Type-safe access to required variables
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 *
 * // Check environment
 * if (env.isDevelopment) {
 *   console.log('Running in development mode');
 * }
 *
 * // Access optional variables (returns empty string if not set)
 * const botToken = env.DISCORD_BOT_TOKEN;
 * ```
 */
export const env = {
  // Required variables
  ...REQUIRED_ENV,

  // Optional variables
  ...OPTIONAL_ENV,

  // Environment info
  ...ENV_INFO,
} as const;

/**
 * Type definition for the environment configuration
 */
export type Env = typeof env;

/**
 * Helper to check if Discord bot token is configured
 */
export const hasDiscordBotToken = (): boolean => {
  return env.DISCORD_BOT_TOKEN.length > 0;
};

/**
 * Helper to check if Discord app ID is configured
 */
export const hasDiscordAppId = (): boolean => {
  return env.NEXT_PUBLIC_DISCORD_APP_ID.length > 0;
};

/**
 * Get Discord bot token or throw error if not configured
 * @throws {Error} If Discord bot token is not configured
 */
export const requireDiscordBotToken = (): string => {
  if (!hasDiscordBotToken()) {
    throw new Error(
      "Discord bot token is not configured. " +
        "Please set DISCORD_BOT_TOKEN environment variable."
    );
  }
  return env.DISCORD_BOT_TOKEN;
};

/**
 * Get Discord app ID or throw error if not configured
 * @throws {Error} If Discord app ID is not configured
 */
export const requireDiscordAppId = (): string => {
  if (!hasDiscordAppId()) {
    throw new Error(
      "Discord app ID is not configured. " +
        "Please set NEXT_PUBLIC_DISCORD_APP_ID environment variable."
    );
  }
  return env.NEXT_PUBLIC_DISCORD_APP_ID;
};

// Validate required environment variables on module load
// This ensures the app fails fast if configuration is invalid
if (typeof window === "undefined") {
  // Server-side validation only
  console.log("✓ Environment variables validated successfully");
}
