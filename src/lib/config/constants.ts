/**
 * Application Constants Configuration
 * 
 * Central location for all application constants, magic numbers, and configuration values.
 * This improves maintainability and makes it easier to update values across the application.
 * 
 * @module config/constants
 */

/**
 * Application metadata and branding
 */
export const APP_CONFIG = {
  name: 'CodeCat Discord Developer Agent',
  description: 'AI-powered development tasks directly from Discord',
  version: '1.0.0',
} as const;

/**
 * Discord-related constants
 */
export const DISCORD_CONFIG = {
  /**
   * Discord permission bit flags
   */
  permissions: {
    /** Administrator permission bit (1 << 3) */
    adminBit: BigInt(1) << BigInt(3),
    /** Manage Roles permission (268435456) */
    manageRoles: 268435456,
  },
  
  /**
   * Discord CDN URLs
   */
  cdn: {
    /** Default Discord avatar when guild has no icon */
    defaultAvatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
    /** Base URL for Discord CDN */
    base: 'https://cdn.discordapp.com',
  },
  
  /**
   * Discord OAuth configuration
   */
  oauth: {
    /** OAuth scopes for Discord login */
    scopes: 'identify email guilds',
    /** OAuth authorize URL */
    authorizeUrl: 'https://discord.com/oauth2/authorize',
    /** Bot invite scopes */
    botScopes: 'bot applications.commands',
  },
  
  /**
   * Discord API configuration
   */
  api: {
    /** Discord API base URL */
    baseUrl: 'https://discord.com/api',
    /** API version */
    version: 'v10',
  },
} as const;

/**
 * Guild (Discord server) configuration
 */
export const GUILD_CONFIG = {
  /**
   * Default Git branch name for guilds
   */
  defaultBranch: 'main',
  
  /**
   * Guild ID validation pattern (17-20 digit snowflake)
   */
  idPattern: /^\d{17,20}$/,
  
  /**
   * Default guild permissions structure
   */
  defaultPermissions: {
    create_roles: [] as string[],
    confirm_roles: [] as string[],
  },
} as const;

/**
 * Task-related constants
 */
export const TASK_CONFIG = {
  /**
   * Task fetch limits
   */
  limits: {
    /** Default number of tasks to fetch */
    default: 10,
    /** Maximum number of tasks to fetch */
    max: 100,
  },
  
  /**
   * Task status constants
   */
  status: {
    PENDING: 'pending_confirmation',
    IN_PROGRESS: 'in_progress',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
  },
  
  /**
   * Task status display labels
   */
  statusLabels: {
    pending_confirmation: 'Pending Confirmation',
    in_progress: 'In Progress',
    rejected: 'Rejected',
    completed: 'Completed',
  },
} as const;

/**
 * Task status type derived from constants
 */
export type TaskStatus = typeof TASK_CONFIG.status[keyof typeof TASK_CONFIG.status];

/**
 * Discord image size options
 */
export const IMAGE_SIZES = {
  SMALL: 64,
  MEDIUM: 128,
  LARGE: 256,
  XLARGE: 512,
} as const;

/**
 * Route paths for internal navigation
 */
export const ROUTES = {
  home: '/',
  guilds: {
    base: '/guilds',
    detail: (guildId: string) => `/guilds/${guildId}`,
    settings: (guildId: string) => `/guilds/${guildId}/settings`,
    tasks: (guildId: string) => `/guilds/${guildId}/tasks`,
  },
  api: {
    guilds: {
      base: '/api/guilds',
      detail: (guildId: string) => `/api/guilds/${guildId}`,
      roles: (guildId: string) => `/api/guilds/${guildId}/roles`,
    },
  },
  auth: {
    callback: '/auth/callback',
  },
} as const;

/**
 * Query parameter names
 */
export const QUERY_PARAMS = {
  error: 'error',
  includeTasks: 'includeTasks',
  guildId: 'guildId',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  theme: 'codecat-theme',
  lastVisitedGuild: 'codecat-last-guild',
} as const;

/**
 * UI constants
 */
export const UI_CONFIG = {
  /**
   * Debounce delays in milliseconds
   */
  debounce: {
    search: 300,
    input: 500,
  },
  
  /**
   * Animation durations in milliseconds
   */
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  /**
   * Toast notification duration
   */
  toast: {
    duration: 5000,
  },
} as const;

/**
 * Validation patterns
 */
export const VALIDATION = {
  /**
   * GitHub repository format (owner/repo)
   */
  githubRepo: /^[\w.-]+\/[\w.-]+$/,
  
  /**
   * Git branch name (basic validation)
   */
  gitBranch: /^[\w\/-]+$/,
  
  /**
   * Discord snowflake ID (17-20 digits)
   */
  discordId: /^\d{17,20}$/,
} as const;

/**
 * Error codes used across the application
 */
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHENTICATED: 'unauthenticated',
  UNAUTHORIZED: 'unauthorized',
  
  // Guild errors
  GUILD_NOT_FOUND: 'guild_not_found',
  GUILD_LOOKUP_FAILED: 'guild_lookup_failed',
  GUILD_CREATE_FAILED: 'guild_create_failed',
  GUILD_UPDATE_FAILED: 'guild_update_failed',
  INVALID_GUILD_ID: 'invalid_guild_id',
  
  // Task errors
  TASKS_FETCH_FAILED: 'tasks_fetch_failed',
  
  // Validation errors
  INVALID_PAYLOAD: 'invalid_payload',
  MISSING_GUILD_ID: 'missing_guild_id',
  INVALID_DEFAULT_REPO: 'invalid_default_repo',
  INVALID_DEFAULT_BRANCH: 'invalid_default_branch',
  INVALID_DEFAULT_KEY: 'invalid_default_key',
  NO_UPDATES_PROVIDED: 'no_updates_provided',
  
  // API errors
  NETWORK_ERROR: 'network_error',
  PARSE_ERROR: 'parse_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

/**
 * Helper to check if a value is a valid task status
 */
export const isValidTaskStatus = (value: unknown): value is TaskStatus => {
  return (
    typeof value === 'string' &&
    Object.values(TASK_CONFIG.status).includes(value as TaskStatus)
  );
};

/**
 * Helper to get task status label
 */
export const getTaskStatusLabel = (status: TaskStatus | null): string => {
  if (!status) return 'Unknown';
  return TASK_CONFIG.statusLabels[status] || status;
};

/**
 * Helper to build Discord guild icon URL
 */
export const getDiscordGuildIconUrl = (
  guildId: string,
  icon: string | null | undefined,
  size: number = IMAGE_SIZES.MEDIUM
): string => {
  if (!icon) {
    return DISCORD_CONFIG.cdn.defaultAvatar;
  }
  return `${DISCORD_CONFIG.cdn.base}/icons/${guildId}/${icon}.png?size=${size}`;
};

/**
 * Helper to build Discord bot invite URL
 */
export const getDiscordBotInviteUrl = (
  clientId: string,
  guildId?: string
): string => {
  const url = new URL(DISCORD_CONFIG.oauth.authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', DISCORD_CONFIG.oauth.botScopes);
  url.searchParams.set('permissions', String(DISCORD_CONFIG.permissions.manageRoles));
  
  if (guildId) {
    url.searchParams.set('guild_id', guildId);
    url.searchParams.set('disable_guild_select', 'true');
  }
  
  return url.toString();
};
