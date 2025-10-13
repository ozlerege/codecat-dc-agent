# Configuration Module

## Overview

The configuration module provides centralized, type-safe access to all application configuration including environment variables, constants, routes, and validation patterns. This eliminates magic strings/numbers and provides a single source of truth for configuration values.

## Features

- ✅ **Type-Safe Environment Variables**: Validated at startup with helpful error messages
- ✅ **Centralized Constants**: No more magic strings or numbers scattered across the code
- ✅ **Route Definitions**: Type-safe route generation functions
- ✅ **Validation Patterns**: Reusable regex patterns for common validations
- ✅ **Helper Functions**: Utility functions for common configuration tasks
- ✅ **Fail-Fast Validation**: Missing required env vars cause immediate failure with clear error messages

## Quick Start

### Basic Usage

```typescript
import { env, DISCORD_CONFIG, ROUTES } from '@/lib/config';

// Environment variables (type-safe, validated at startup)
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const isDev = env.isDevelopment;

// Constants
const adminPermission = DISCORD_CONFIG.permissions.adminBit;
const defaultBranch = GUILD_CONFIG.defaultBranch;

// Routes
const guildDetailUrl = ROUTES.guilds.detail('123456789');
const apiEndpoint = ROUTES.api.guilds.base;

// Validation
if (VALIDATION.discordId.test(guildId)) {
  // Valid Discord ID
}
```

## Module Structure

```
src/lib/config/
├── env.ts          # Environment variables with validation
├── constants.ts    # Application constants and helpers
├── index.ts        # Centralized exports
└── README.md       # This file
```

---

## Environment Configuration (`env.ts`)

### Required Environment Variables

These variables **must** be set or the application will fail to start:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional Environment Variables

These variables are optional and default to empty strings:

- `DISCORD_BOT_TOKEN` - Discord bot token for API calls
- `NEXT_PUBLIC_DISCORD_APP_ID` - Discord application/client ID
- `FRONTEND_URL` - Frontend URL (for OAuth redirects)
- `BACKEND_URL` - Backend API URL

### Usage

```typescript
import { env, requireDiscordBotToken, hasDiscordAppId } from '@/lib/config/env';

// Direct access (always safe, validated at startup)
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

// Check if optional var is set
if (hasDiscordAppId()) {
  const appId = env.NEXT_PUBLIC_DISCORD_APP_ID;
}

// Require optional var (throws if not set)
try {
  const botToken = requireDiscordBotToken();
} catch (error) {
  console.error('Bot token not configured');
}

// Environment checks
if (env.isDevelopment) {
  console.log('Running in development mode');
}
```

### Helper Functions

#### `hasDiscordBotToken(): boolean`
Check if Discord bot token is configured.

#### `hasDiscordAppId(): boolean`
Check if Discord app ID is configured.

#### `requireDiscordBotToken(): string`
Get Discord bot token or throw error if not configured.

#### `requireDiscordAppId(): string`
Get Discord app ID or throw error if not configured.

---

## Constants Configuration (`constants.ts`)

### Application Config

```typescript
import { APP_CONFIG } from '@/lib/config';

console.log(APP_CONFIG.name); // 'CodeCat Discord Developer Agent'
console.log(APP_CONFIG.description);
console.log(APP_CONFIG.version);
```

### Discord Config

```typescript
import { DISCORD_CONFIG } from '@/lib/config';

// Permissions
const isAdmin = (perms: string) => {
  const bits = BigInt(perms);
  return (bits & DISCORD_CONFIG.permissions.adminBit) === DISCORD_CONFIG.permissions.adminBit;
};

const manageRolesPermission = DISCORD_CONFIG.permissions.manageRoles;

// CDN URLs
const defaultAvatar = DISCORD_CONFIG.cdn.defaultAvatar;
const cdnBase = DISCORD_CONFIG.cdn.base;

// OAuth
const oauthScopes = DISCORD_CONFIG.oauth.scopes;
const authorizeUrl = DISCORD_CONFIG.oauth.authorizeUrl;

// API
const apiBaseUrl = DISCORD_CONFIG.api.baseUrl;
const apiVersion = DISCORD_CONFIG.api.version;
```

### Guild Config

```typescript
import { GUILD_CONFIG } from '@/lib/config';

const defaultBranch = GUILD_CONFIG.defaultBranch; // 'main'
const idPattern = GUILD_CONFIG.idPattern; // Regex for validation
const defaultPermissions = GUILD_CONFIG.defaultPermissions;
```

### Task Config

```typescript
import { TASK_CONFIG, type TaskStatus } from '@/lib/config';

// Limits
const defaultLimit = TASK_CONFIG.limits.default; // 10
const maxLimit = TASK_CONFIG.limits.max; // 100

// Status constants
const pending = TASK_CONFIG.status.PENDING; // 'pending_confirmation'
const inProgress = TASK_CONFIG.status.IN_PROGRESS; // 'in_progress'

// Status labels
const label = TASK_CONFIG.statusLabels.pending_confirmation; // 'Pending Confirmation'
```

### Routes

```typescript
import { ROUTES } from '@/lib/config';

// Page routes
const homePage = ROUTES.home; // '/'
const guildsPage = ROUTES.guilds.base; // '/guilds'
const guildDetail = ROUTES.guilds.detail('123'); // '/guilds/123'
const guildSettings = ROUTES.guilds.settings('123'); // '/guilds/123/settings'
const guildTasks = ROUTES.guilds.tasks('123'); // '/guilds/123/tasks'

// API routes
const guildsApi = ROUTES.api.guilds.base; // '/api/guilds'
const guildDetailApi = ROUTES.api.guilds.detail('123'); // '/api/guilds/123'
const guildRolesApi = ROUTES.api.guilds.roles('123'); // '/api/guilds/123/roles'

// Auth routes
const authCallback = ROUTES.auth.callback; // '/auth/callback'
```

### Image Sizes

```typescript
import { IMAGE_SIZES } from '@/lib/config';

const small = IMAGE_SIZES.SMALL; // 64
const medium = IMAGE_SIZES.MEDIUM; // 128
const large = IMAGE_SIZES.LARGE; // 256
const xlarge = IMAGE_SIZES.XLARGE; // 512
```

### UI Config

```typescript
import { UI_CONFIG } from '@/lib/config';

// Debounce delays
const searchDebounce = UI_CONFIG.debounce.search; // 300ms
const inputDebounce = UI_CONFIG.debounce.input; // 500ms

// Animation durations
const fastAnimation = UI_CONFIG.animation.fast; // 150ms
const normalAnimation = UI_CONFIG.animation.normal; // 300ms

// Toast duration
const toastDuration = UI_CONFIG.toast.duration; // 5000ms
```

### Validation Patterns

```typescript
import { VALIDATION } from '@/lib/config';

// GitHub repository (owner/repo)
if (VALIDATION.githubRepo.test('owner/repo')) {
  // Valid format
}

// Git branch name
if (VALIDATION.gitBranch.test('feature/new-feature')) {
  // Valid branch name
}

// Discord snowflake ID
if (VALIDATION.discordId.test('123456789012345678')) {
  // Valid Discord ID
}
```

### Error Codes

```typescript
import { ERROR_CODES } from '@/lib/config';

// Authentication
throw new Error(ERROR_CODES.UNAUTHENTICATED);

// Guild errors
throw new Error(ERROR_CODES.GUILD_NOT_FOUND);
throw new Error(ERROR_CODES.INVALID_GUILD_ID);

// Validation errors
throw new Error(ERROR_CODES.INVALID_PAYLOAD);

// API errors
throw new Error(ERROR_CODES.NETWORK_ERROR);
```

### Helper Functions

#### `isValidTaskStatus(value: unknown): value is TaskStatus`

Type guard to check if a value is a valid task status.

```typescript
import { isValidTaskStatus } from '@/lib/config';

if (isValidTaskStatus(status)) {
  // TypeScript knows status is TaskStatus
  console.log('Valid status:', status);
}
```

#### `getTaskStatusLabel(status: TaskStatus | null): string`

Get human-readable label for a task status.

```typescript
import { getTaskStatusLabel } from '@/lib/config';

const label = getTaskStatusLabel('pending_confirmation');
// Returns: 'Pending Confirmation'
```

#### `getDiscordGuildIconUrl(guildId: string, icon: string | null, size?: number): string`

Build Discord CDN URL for guild icon.

```typescript
import { getDiscordGuildIconUrl, IMAGE_SIZES } from '@/lib/config';

const iconUrl = getDiscordGuildIconUrl('123456', 'abc123', IMAGE_SIZES.LARGE);
// Returns: 'https://cdn.discordapp.com/icons/123456/abc123.png?size=256'

const defaultIcon = getDiscordGuildIconUrl('123456', null);
// Returns default Discord avatar URL
```

#### `getDiscordBotInviteUrl(clientId: string, guildId?: string): string`

Build Discord bot invite URL.

```typescript
import { getDiscordBotInviteUrl } from '@/lib/config';

// Generic invite
const inviteUrl = getDiscordBotInviteUrl('123456789');

// Guild-specific invite
const guildInviteUrl = getDiscordBotInviteUrl('123456789', '987654321');
```

---

## Benefits Over Direct Access

### Before (Direct Access)

```typescript
// Environment variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!; // ❌ Non-null assertion
const token = process.env.DISCORD_BOT_TOKEN; // ❌ Might be undefined

// Magic numbers
const PERMISSIONS = 268435456; // ❌ What does this mean?
.limit(10) // ❌ Magic number

// Magic strings
status === 'pending_confirmation' // ❌ String literal
if (response.error === 'guild_not_found') // ❌ String literal

// Hardcoded URLs
const url = `https://discord.com/api/users/@me/guilds`; // ❌ Hardcoded
```

**Issues:**
- ❌ No validation - app might crash at runtime
- ❌ No type safety
- ❌ Scattered magic values
- ❌ Hard to maintain
- ❌ Easy to make typos

### After (Config Module)

```typescript
// Environment variables
const url = env.NEXT_PUBLIC_SUPABASE_URL; // ✅ Validated, type-safe
const token = requireDiscordBotToken(); // ✅ Fails with clear error if missing

// Constants
const permissions = DISCORD_CONFIG.permissions.manageRoles; // ✅ Self-documenting
.limit(TASK_CONFIG.limits.default) // ✅ Named constant

// Constants
status === TASK_CONFIG.status.PENDING // ✅ Type-safe constant
if (response.error === ERROR_CODES.GUILD_NOT_FOUND) // ✅ Named constant

// Helper functions
const url = `${DISCORD_CONFIG.api.baseUrl}/users/@me/guilds`; // ✅ Configurable
```

**Benefits:**
- ✅ Validated at startup
- ✅ Full type safety
- ✅ Self-documenting code
- ✅ Single source of truth
- ✅ Easy to update
- ✅ IDE autocomplete

---

## Migration Guide

### Step 1: Update Environment Variable Access

```typescript
// Before
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const token = process.env.DISCORD_BOT_TOKEN;

// After
import { env, requireDiscordBotToken } from '@/lib/config';

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const token = requireDiscordBotToken(); // or check with hasDiscordBotToken()
```

### Step 2: Replace Magic Numbers

```typescript
// Before
const PERMISSIONS = 268435456;
.limit(10)
const adminBit = BigInt(1) << BigInt(3);

// After
import { DISCORD_CONFIG, TASK_CONFIG } from '@/lib/config';

const permissions = DISCORD_CONFIG.permissions.manageRoles;
.limit(TASK_CONFIG.limits.default)
const adminBit = DISCORD_CONFIG.permissions.adminBit;
```

### Step 3: Replace Magic Strings

```typescript
// Before
status === 'pending_confirmation'
redirect('/guilds')
throw new Error('guild_not_found');

// After
import { TASK_CONFIG, ROUTES, ERROR_CODES } from '@/lib/config';

status === TASK_CONFIG.status.PENDING
redirect(ROUTES.guilds.base)
throw new Error(ERROR_CODES.GUILD_NOT_FOUND);
```

### Step 4: Use Helper Functions

```typescript
// Before
const iconUrl = icon 
  ? `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=128`
  : 'https://cdn.discordapp.com/embed/avatars/0.png';

// After
import { getDiscordGuildIconUrl } from '@/lib/config';

const iconUrl = getDiscordGuildIconUrl(guildId, icon);
```

---

## Environment Setup

### .env.local

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
DISCORD_BOT_TOKEN=your-bot-token
NEXT_PUBLIC_DISCORD_APP_ID=your-app-id
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

### Validation on Startup

The module validates required environment variables when imported. If any required variable is missing, you'll see a clear error:

```
Error: Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL
Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL is set.
```

---

## Best Practices

### 1. Always Use Config Module

```typescript
// ❌ Bad
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ✅ Good
import { env } from '@/lib/config';
const url = env.NEXT_PUBLIC_SUPABASE_URL;
```

### 2. Use Named Constants

```typescript
// ❌ Bad
if (status === 'pending_confirmation') { }

// ✅ Good
import { TASK_CONFIG } from '@/lib/config';
if (status === TASK_CONFIG.status.PENDING) { }
```

### 3. Use Route Functions

```typescript
// ❌ Bad
const url = `/guilds/${guildId}/settings`;

// ✅ Good
import { ROUTES } from '@/lib/config';
const url = ROUTES.guilds.settings(guildId);
```

### 4. Use Helper Functions

```typescript
// ❌ Bad
const iconUrl = icon 
  ? `https://cdn.discordapp.com/icons/${guildId}/${icon}.png?size=128`
  : 'https://cdn.discordapp.com/embed/avatars/0.png';

// ✅ Good
import { getDiscordGuildIconUrl } from '@/lib/config';
const iconUrl = getDiscordGuildIconUrl(guildId, icon);
```

---

## TypeScript Support

All exports are fully typed:

```typescript
import type { Env, TaskStatus } from '@/lib/config';

// Type-safe environment config
const config: Env = env;

// Type-safe task status
const status: TaskStatus = TASK_CONFIG.status.PENDING;
```

---

## Testing

For testing, you can create a test environment configuration:

```typescript
// test-setup.ts
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
```

---

## Performance

- **Zero Runtime Overhead**: All constants are inlined at build time
- **Tree-Shakeable**: Import only what you need
- **Type-Safe**: Full compile-time type checking
- **Validated Once**: Environment validation happens once at startup

---

## Related Documentation

- [Environment Variables (Next.js)](https://nextjs.org/docs/basic-features/environment-variables)
- [TypeScript Const Assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [Discord API Documentation](https://discord.com/developers/docs)
