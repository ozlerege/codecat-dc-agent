# Jules Integration Plan (discord.py)

## 1. Objective
- Extend the existing Discord automation layer with a `discord.py` bot that orchestrates Jules API sessions according to the workflows defined in `project-documentation.md`.
- Preserve the Supabase-centered source of truth for users, guild permissions, tasks, and Jules API keys.
- Deliver a maintainable integration that cleanly separates Discord event handling, Supabase persistence, and Jules API orchestration.

## 2. System Overview
- **Discord Bot (discord.py)**  
  Handles slash commands, component interactions, and permission checks based on Supabase-stored guild configuration.
- **Railway Backend Services**  
  Run the bot process and host REST endpoints/webhooks (e.g., `/webhook/jules`) consumed by the dashboard and Jules.
- **Supabase**  
  Stores users, guilds, tasks, role permissions, and Jules API keys (personal + default) with encryption.
- **Jules API**  
  Provides session lifecycle (`sources`, `sessions`, `activities`) used to create and monitor AI-driven development tasks.
- **Next.js Dashboard**  
  Remains the admin interface for configuration; interacts with Supabase and backend APIs but is not modified directly by this plan.

## 3. Key Requirements Recap
- Discord workflows: `/jules` command, confirmation buttons, bypass for confirm roles.
- Task lifecycle: `pending_confirmation → in_progress → completed/rejected`.
- API key resolution priority: user personal key → guild default key.
- Secure handling: Ed25519 verification, encrypted key storage, scoped GitHub repos.
- Observability: Clear logs for Discord events, Supabase operations, Jules API calls.

## 4. Technical Stack & Dependencies
- Runtime: Python 3.11+ (Railway image).
- Discord SDK: `discord.py` 2.x with application command support.
- HTTP client: `httpx` (async) or `aiohttp` for Jules API calls.
- Supabase client: `supabase-py` (async), or direct REST via `httpx` + service role key (preferred for typed repository layer).
- Persistence helpers: Repository pattern mirroring frontend expectations (`GuildRepository`, `TaskRepository`, etc.).
- Task queue (optional): `asyncio` background tasks within bot process for polling Jules activities if webhooks are insufficient.

## 5. Integration Workflow
1. **Bot Bootstrap**
   - Load environment variables (`DISCORD_TOKEN`, Supabase credentials, Jules defaults).
   - Initialise async clients (Discord, Supabase, HTTP).
   - Register global guild command `/jules`.

2. **Slash Command Handling (`/jules`)**
   - Validate prompt + optional repo/branch options.
   - Fetch invoking user's Discord roles via interaction payload + Discord API.
   - Query Supabase guild record by `guild_id`; determine permissions (`create_roles`, `confirm_roles`).
   - Deny command if user lacks create privileges; log audit entry.
   - Resolve Jules API key:
     1. Lookup Supabase `users` by `discord_id` to get personal key.
     2. Fallback to guild `default_jules_api_key`.
     3. Reject task if no key available.
   - Persist new `tasks` row with status `pending_confirmation` (or `in_progress` if user has confirm role).
   - Respond with ephemeral acknowledgement + post channel message summarising task and rendering buttons (Confirm/Reject) limited to confirm roles.

3. **Component Interaction Handling (Confirm/Reject Buttons)**
   - Verify button clicker has confirm role via Supabase/Discord role check.
   - On confirm:
     - Update task status to `in_progress`.
     - Kick off Jules session creation (see §7).
     - Edit message with "🛠 Development started…" status.
   - On reject:
     - Update task status to `rejected`.
     - Edit message with rejection notice; notify original requester via DM if desired.

4. **Automatic Confirmation Path**
   - If command invoker already has confirm role:
     - Skip interactive message; create task with status `in_progress`.
     - Immediately trigger Jules session.
     - Post progress message thread.

5. **Jules Session Orchestration**
   - Use Jules API key to:
     1. Ensure target repo source name via `/sources` (cache per guild).
     2. Create session via `POST /sessions` with prompt, repo context (mapping repo option or guild defaults), and optional `requirePlanApproval`.
   - Record returned session ID in `tasks` metadata (new column or JSON).
   - Schedule background job to monitor session progress either by:
     - Polling `/sessions/{id}/activities` on interval, or
     - Receiving webhook `/webhook/jules` and mapping `task_id` to updates.

6. **Progress & Completion Updates**
   - On receiving webhook or polling result indicating completion:
     - Extract PR URL or summary from Jules payload.
     - Update Supabase task status to `completed` and store `pr_url`.
     - Post channel update "✅ PR ready: {url}".
   - Handle failure states (error activity, timeout):
     - Update task to `rejected` or `failed` (consider extending enum).
     - Notify channel with actionable message and log details.

7. **Webhook Endpoint (`/webhook/jules`)**
   - Hosted via FastAPI/Quart inside same Railway service.
   - Validates shared secret from Jules, then updates relevant task.
   - Uses Supabase repositories to mutate task records and trigger Discord notifications via bot client (inter-process communication: shared event loop or message queue).

8. **Security Measures**
   - Verify Discord interactions using `discord.py` built-in signature verification (if running plain web server).
   - Never log raw API keys; mask when necessary.
   - Encrypt stored Jules keys using Supabase Vault or pgcrypto; ensure bot fetches decrypted values via service role key over TLS.
   - Rate-limit `/jules` command usage per user/guild with in-memory or Supabase counters.

9. **Error Handling & Observability**
   - Centralised exception handler for Discord command callbacks (log structured JSON with context IDs).
   - Wrap Jules API calls to surface clear error messages (HTTP status, response).
   - Use Supabase `tasks` table to store error metadata (e.g., `last_error` column).
   - Emit metrics to Railway logs (consider OpenTelemetry for future work).

10. **Testing Strategy**
    - Unit tests for permission resolution, key selection, Supabase repositories.
    - Integration tests using Discord `app_commands.CommandTree` test harness.
    - Mock Jules API via `respx` or `pytest-httpx`.
    - End-to-end dry run using staging Supabase project and test Discord server.

11. **Deployment Considerations**
    - Bundle bot + FastAPI app in single Railway service with `uvicorn` + discord bot running in same process (asyncio tasks) or separate worker dynos.
    - Configure environment variables in Railway dashboard; ensure secrets rotated.
    - Implement graceful shutdown (await pending Jules polls, close clients).
    - Continuous Deployment via GitHub Actions triggered by PR merges (optional future enhancement).

12. **Future Enhancements**
    - Support editing messages for intermediate Jules plan approvals (`requirePlanApproval = true` flows).
    - Add task retry/resume commands.
    - Introduce analytics dashboard for command usage (feeding Supabase data to Next.js frontend).

