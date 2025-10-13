# CodeCat Discord Developer Agent — Open Source Documentation (v1.0)

## Stack

• 🗄️ Database: Supabase (PostgreSQL + Auth + Roles)
• 🔐 Auth: Supabase Auth (Discord OAuth provider)
• ⚙️ Backend: Railway (Bot + API)
• 💻 Frontend: Vercel (Next.js dashboard)
• 🤖 Integrations: Discord + GitHub + CodeCat API

## 1. Overview

The CodeCat Discord Developer Agent allows teams to run AI-powered development tasks directly from Discord via simple commands like:

`/codecat remove async functions [branchName]`

Each task triggers the CodeCat API to generate and open a pull request (PR) in a connected GitHub repository — after an optional confirmation step depending on the user's Discord role permissions in the guild.

The web app dashboard is designed for Discord server admins to orchestrate the process: manage guilds, set permissions for which Discord roles can create tasks or confirm/reject them, configure default CodeCat API keys for the guild, and view tasks.

Roles and flow summary:
• Users with confirm permissions → can run and confirm tasks directly (PR created immediately).
• Users with create permissions → can propose tasks; users with confirm permissions approve via Discord buttons before PR creation.
• Each user can bring their own CodeCat API key via the web app (stored securely in Supabase), with guild-level default keys as fallback for non-authenticated users.

## 2. Architecture

```
Discord Slash Command (/codecat)
   ↓
Railway Backend (Bot + API)
   ↓
Supabase (Auth, Roles, CodeCat Keys, Tasks)
   ↓
CodeCat API → GitHub PR Creation
   ↓
Discord Bot updates feed (progress + completion)
   ↓
Frontend Dashboard (Admin / Dev management)
```

## 3. Role-Based Workflow

### Permissions Setup (Admin via Web App)

Admins sign in to the web app, select a guild, and configure:

- `create_roles`: Array of Discord role IDs allowed to run `/codecat` commands.
- `confirm_roles`: Array of Discord role IDs allowed to confirm/reject tasks.
- `default_codecat_api_key`: Fallback API key for guild tasks if user doesn't have personal key.

### 🧑‍💻 User Flow (Discord)

1. User (with create permission) runs `/codecat <prompt> [branch]`.
2. Bot checks if user has create role in guild permissions; if not, denies command.
3. Task created in Supabase with status `pending_confirmation`, including `discord_user_id`.
4. Bot looks up user by `discord_user_id` in users table; if found and has `codecat_api_key`, use it; else use guild's `default_codecat_api_key`. If no key available, reject task.
5. Bot posts a Discord message with:
   - task summary,
   - user name,
   - ✅ Confirm / ❌ Reject buttons (interactable only by users with confirm roles).
6. When a user with confirm role clicks "Confirm", backend triggers CodeCat API.
7. Bot posts "🛠 Development started…" message.
8. When CodeCat finishes, bot posts "✅ PR ready" with GitHub link.
9. If rejected, bot marks task rejected and posts a rejection notice.

### 👑 Confirm User Flow

• Users with confirm roles' commands skip confirmation (treated as direct).
• Bot immediately starts the CodeCat task (using personal or default key) and posts "🛠 Development started…" → followed by "✅ PR ready" when done.

## 4. Data Flow

| Entity        | Source                                   | Purpose                                                          |
| ------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| User          | Supabase Auth (Discord OAuth)            | Stores Discord info + personal role & CodeCat key (optional)       |
| CodeCat API Key | User input in dashboard or guild default | Used to trigger CodeCat tasks (personal preferred, guild fallback) |
| Guild         | Discord server                           | Stores permissions, default key, and task mapping                |
| Task          | Created per /codecat command               | Tracks status, Discord user, role, and PR URL                    |

## 5. Database Schema (Supabase)

```sql
-- users
create table users (
  id uuid primary key default uuid_generate_v4(),
  discord_id text unique not null,
  discord_username text,
  email text,
  role text default 'developer' check (role in ('admin','developer')), -- web app role
  codecat_api_key text, -- stored encrypted using pgcrypto or supabase vault
  created_at timestamp default now()
);

-- guilds
create table guilds (
  id uuid primary key default uuid_generate_v4(),
  guild_id text unique not null,
  installer_user_id uuid references users(id),
  default_repo text,
  default_branch text default 'main',
  permissions jsonb default '{"create_roles": [], "confirm_roles": []}'::jsonb, -- Discord role IDs
  default_codecat_api_key text, -- encrypted, fallback for non-auth users
  created_at timestamp default now()
);

-- tasks
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id), -- optional, for web-authenticated users with personal key
  discord_user_id text not null, -- Discord user who ran the command
  guild_id uuid references guilds(id),
  prompt text not null,
  status text default 'pending_confirmation' check (status in (
    'pending_confirmation','in_progress','rejected','completed'
  )),
  pr_url text,
  created_at timestamp default now()
);
```

## 6. Environment Variables

| Key                       | Description                          |
| ------------------------- | ------------------------------------ |
| DISCORD_APP_ID            | Discord application ID               |
| DISCORD_PUBLIC_KEY        | Signature verification key           |
| DISCORD_TOKEN             | Bot token                            |
| SUPABASE_URL              | Supabase project URL                 |
| SUPABASE_ANON_KEY         | Public client key                    |
| SUPABASE_SERVICE_ROLE_KEY | Server secret key                    |
| GITHUB_APP_ID             | GitHub App ID                        |
| GITHUB_APP_SECRET         | GitHub App secret                    |
| FRONTEND_URL              | e.g. https://yourfrontend.vercel.app |
| BACKEND_URL               | e.g. https://yourapp.up.railway.app  |

## 7. Frontend (Vercel) — Dashboard Features

| Page           | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| Sign in        | Sign in via Discord (Supabase Auth)                                              |
| Profile        | Manage web app role + add/update personal CodeCat API key                          |
| Guilds         | Shows servers where bot is installed; click to manage                            |
| Guild Settings | Configure Discord role permissions for create/confirm, set default CodeCat API key |
| Tasks          | View all tasks with status + PR links                                            |
| Admin Panel    | Promote/demote web app users, view pending confirmations                         |

## 8. Backend API (Railway)

| Endpoint              | Method   | Purpose                                  |
| --------------------- | -------- | ---------------------------------------- |
| /interactions         | POST     | Handles Discord slash commands & buttons |
| /webhook/codecat        | POST     | Receives CodeCat task updates              |
| /api/confirm/:task_id | POST     | Admin confirms task → triggers CodeCat API |
| /api/reject/:task_id  | POST     | Admin rejects task                       |
| /api/profile          | GET/POST | Manage user roles + CodeCat API key        |
| /api/tasks            | GET      | Fetch task history                       |

## 9. Discord Integration Details

### Slash Command

```json
{
  "name": "codecat",
  "description": "Run a CodeCat AI development task",
  "options": [
    {
      "name": "prompt",
      "description": "Task description",
      "type": 3,
      "required": true
    },
    {
      "name": "repo",
      "description": "Target repo (owner/name)",
      "type": 3
    },
    {
      "name": "branch",
      "description": "Target branch",
      "type": 3
    }
  ]
}
```

### Interaction Flow

1. Developer issues `/codecat`.
2. Bot verifies signature → creates task (status = `pending_confirmation`).
3. Posts Discord message:

   ```
   🧠 New CodeCat Task Requested by @devuser
   Prompt: "remove async functions"
   Repo: myorg/api-server

   Buttons: [✅ Confirm] [❌ Reject] (visible to admins).
   ```

4. If Confirmed → backend fetches user's CodeCat API key → triggers task.
5. Bot posts progress messages:
   ```
   🛠 Development started by CodeCat...
   ✅ PR ready: https://github.com/org/repo/pull/42
   ```

## 10. Security Rules

| Concern                  | Mitigation                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Discord message spoofing | Verify Ed25519 signatures                                                             |
| API key leaks            | Encrypt personal and default CodeCat API keys in Supabase or Vault                      |
| Role misuse              | Check Discord member roles against guild permissions before allowing commands/buttons |
| Unauthorized PRs         | Only confirm_roles can approve; use personal/guild keys scoped to repo                |
| Bot flooding             | Command rate-limit per user/guild                                                     |
| Non-auth task creation   | Require guild default key; log usage for audit                                        |

## 11. Task Lifecycle

| Status               | Trigger                        | Description                      |
| -------------------- | ------------------------------ | -------------------------------- |
| pending_confirmation | /codecat by developer            | Waiting for admin approval       |
| in_progress          | Admin confirms / admin command | CodeCat task running               |
| rejected             | Admin rejects                  | Task closed                      |
| completed            | CodeCat webhook                  | PR created and posted to Discord |

## 12. Discord Bot Responses

### Developer Command Example

```
🧠 @devuser requested a new CodeCat task
"Remove async functions"
Repo: myorg/api-server
Waiting for admin confirmation…
```

### Admin Confirm Message

```
🛠 Development started… CodeCat is generating PR.
```

### Completion Message

```
✅ PR created: https://github.com/org/repo/pull/145
```

### Rejection Message

```
❌ Task rejected by Admin.
```

## 13. Permissions Model

| Role Type         | Description                                                       | Permissions               |
| ----------------- | ----------------------------------------------------------------- | ------------------------- |
| Web App Admin     | Can manage guilds, set permissions, promote web users             | Full web access           |
| Web App Developer | Can view tasks, set personal API key                              | Limited web access        |
| Discord Create    | Users with guild create_roles can propose tasks                   | Needs confirm approval    |
| Discord Confirm   | Users with guild confirm_roles can approve/reject/create directly | Full Discord task control |

## 14. Security & Privacy

- CodeCat API keys are per-user, encrypted, and never shared across accounts.
- PR creation uses the requester's key, ensuring clear ownership.
- Discord commands and buttons require verified user roles.
- Supabase Auth sessions expire regularly; refresh via OAuth.
