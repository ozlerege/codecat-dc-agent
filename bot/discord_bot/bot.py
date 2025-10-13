"""discord.py client implementation for the CodeCat automation bot."""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import discord
from discord import app_commands

from config import get_settings, require
from services import (
    GithubService,
    GithubServiceError,
    OpenRouterService,
    OpenRouterServiceError,
    SupabaseService,
    SupabaseServiceError,
    TaskStatus,
)
from utils import user_has_permission

from . import messages
from .types import PendingTaskContext

logger = logging.getLogger(__name__)


class CodeCatBot(discord.Client):
    """Custom Discord client that orchestrates command handling."""

    def __init__(
        self,
        *,
        supabase_service: SupabaseService,
        openrouter_service: OpenRouterService,
        github_service: GithubService,
    ):
        intents = discord.Intents.default()
        intents.members = True
        intents.guilds = True
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)
        self.supabase = supabase_service
        self.openrouter_service = openrouter_service
        self.github_service = github_service
        self.settings = get_settings()
        self._task_contexts: dict[str, PendingTaskContext] = {}
        self._task_messages: dict[str, discord.Message] = {}

    async def setup_hook(self) -> None:
        """Run after login to register slash commands."""
        from .commands import register_commands

        register_commands(self)
        await self.tree.sync()
        logger.info("Slash commands synced.")

    async def on_ready(self) -> None:  # noqa: D401
        """Log when bot becomes ready."""
        logger.info("Logged in as %s (%s)", self.user, self.user and self.user.id)

    async def close(self) -> None:
        """Cleanup resources on shutdown."""
        await super().close()

    async def handle_codecat_command(
        self,
        *,
        interaction: discord.Interaction[discord.Client],
        branch_name: str,
        task_description: str,
        repo_override: Optional[str],
    ) -> None:
        """Business logic for the /codecat command."""
        if interaction.guild_id is None or interaction.guild is None:
            await interaction.response.send_message(
                "This command is only available in servers.", ephemeral=True
            )
            return

        await interaction.response.defer(ephemeral=True, thinking=True)

        guild_id = str(interaction.guild_id)
        channel = interaction.channel
        if channel is None:
            await interaction.followup.send(
                "Unable to resolve channel for this command.", ephemeral=True
            )
            return

        try:
            guild_record = await self.supabase.get_guild_by_discord_id(guild_id)
        except SupabaseServiceError as exc:
            logger.exception("Failed to load guild %s: %s", guild_id, exc)
            await interaction.followup.send(
                "Guild configuration is unavailable. Please try again later.",
                ephemeral=True,
            )
            return

        if not guild_record:
            await interaction.followup.send(
                "This guild is not configured for CodeCat tasks yet.", ephemeral=True
            )
            return

        repo = (
            repo_override
            or guild_record.get("github_repo_name")
            or guild_record.get("default_repo")
        )
        if not repo:
            await interaction.followup.send(
                "No GitHub repository is linked for this guild yet. "
                "Connect a repository in the dashboard before running tasks.",
                ephemeral=True,
            )
            return

        default_branch = guild_record.get("default_branch") or "main"
        guild_permissions = guild_record.get("permissions") or {
            "create_roles": [],
            "confirm_roles": [],
        }

        member: discord.Member
        if isinstance(interaction.user, discord.Member):
            member = interaction.user
        else:
            member = await interaction.guild.fetch_member(interaction.user.id)

        role_ids = [str(role.id) for role in getattr(member, "roles", [])]
        has_create = user_has_permission(role_ids, guild_permissions, "create")
        has_confirm = user_has_permission(role_ids, guild_permissions, "confirm")

        if not has_create and not has_confirm:
            await interaction.followup.send(
                "You do not have permission to run CodeCat tasks.", ephemeral=True
            )
            return

        try:
            user_record = await self.supabase.get_user_by_discord_id(
                str(member.id)
            )
        except SupabaseServiceError as exc:
            logger.exception("Failed to load user %s: %s", member.id, exc)
            user_record = None

        user_api_key = (user_record or {}).get("openrouter_api_key")
        guild_api_key = guild_record.get("default_openrouter_api_key")
        openrouter_api_key = user_api_key or guild_api_key

        if not openrouter_api_key:
            await interaction.followup.send(
                "No OpenRouter API key available. Add a personal key or configure a "
                "guild default key in the dashboard.",
                ephemeral=True,
            )
            return

        # Get model from guild (with fallback)
        model = guild_record.get("default_model") or "anthropic/claude-3.5-sonnet"

        # Get GitHub token from user record
        github_access_token = (user_record or {}).get("github_access_token")

        if not github_access_token:
            await interaction.followup.send(
                "No GitHub account connected. Please connect your GitHub account "
                "in the dashboard before running tasks.",
                ephemeral=True,
            )
            return

        prompt = (
            f"Repo: {repo}\nBranch: {branch_name}\nTask: {task_description}"
        )
        status: TaskStatus = "in_progress" if has_confirm else "pending_confirmation"

        try:
            task_record = await self.supabase.create_task(
                discord_user_id=str(member.id),
                guild_id=require(guild_record.get("id"), "guild UUID"),
                prompt=prompt,
                status=status,
                user_id=(user_record or {}).get("id"),
            )
        except SupabaseServiceError as exc:
            logger.exception("Failed to create task: %s", exc)
            await interaction.followup.send(
                "Could not create task. Please try again later.", ephemeral=True
            )
            return

        context = PendingTaskContext(
            bot=self,
            task_id=require(task_record.get("id"), "task id"),
            guild_uuid=require(guild_record.get("id"), "guild UUID"),
            discord_guild_id=interaction.guild_id,
            guild_permissions=guild_permissions,
            repo=repo,
            github_repo_id=guild_record.get("github_repo_id"),
            github_repo_name=guild_record.get("github_repo_name"),
            branch_name=branch_name,
            default_branch=default_branch,
            description=task_description,
            requester=member,
            requester_id=str(member.id),
            requester_display=member.display_name,
            requester_mention=member.mention,
            discord_user_id=str(member.id),
            supabase_user_id=(user_record or {}).get("id"),
            openrouter_api_key=openrouter_api_key,
            model=model,
            status=status,
            channel_id=channel.id,
            github_access_token=github_access_token,
        )

        await self._post_initial_message(
            interaction=interaction,
            channel=channel,
            context=context,
            has_confirm=has_confirm,
        )

    async def handle_current_repo_command(
        self,
        *,
        interaction: discord.Interaction[discord.Client],
    ) -> None:
        """Return the current repository configuration for the guild."""
        if interaction.guild_id is None:
            await interaction.response.send_message(
                "This command is only available inside a Discord guild.", ephemeral=True
            )
            return

        await interaction.response.defer(ephemeral=True, thinking=True)
        guild_id = str(interaction.guild_id)

        try:
            guild_record = await self.supabase.get_guild_by_discord_id(guild_id)
        except SupabaseServiceError as exc:
            logger.exception("Failed to load guild %s: %s", guild_id, exc)
            await interaction.followup.send(
                "Unable to load guild configuration right now. Please try again later.",
                ephemeral=True,
            )
            return

        if not guild_record:
            await interaction.followup.send(
                "This guild is not configured in the dashboard yet.", ephemeral=True
            )
            return

        repo = guild_record.get("github_repo_name") or guild_record.get("default_repo")
        default_branch = guild_record.get("default_branch") or "main"
        has_default_key = bool(guild_record.get("default_openrouter_api_key"))
        default_model = guild_record.get("default_model") or "anthropic/claude-3.5-sonnet"
        repo_id = guild_record.get("github_repo_id")
        github_connected = bool(guild_record.get("github_connected"))
        permissions = guild_record.get("permissions") or {}
        create_roles = permissions.get("create_roles") or []
        confirm_roles = permissions.get("confirm_roles") or []

        if not repo:
            await interaction.followup.send(
                "No GitHub repository is currently linked for this guild.",
                ephemeral=True,
            )
            return

        lines = [f"Repository: `{repo}`"]
        if repo_id:
            lines.append(f"Repository ID: `{repo_id}`")
        lines.extend(
            [
                f"Default branch: `{default_branch}`",
                f"Guild OpenRouter API key configured: {'Yes' if has_default_key else 'No'}",
                f"Default model: `{default_model}`",
                f"GitHub connected via dashboard: {'Yes' if github_connected else 'No'}",
                f"Create roles: {len(create_roles)}",
                f"Confirm roles: {len(confirm_roles)}",
            ]
        )
        details = "\n".join(lines)

        await interaction.followup.send(details, ephemeral=True)

    async def _post_initial_message(
        self,
        *,
        interaction: discord.Interaction[discord.Client],
        channel: discord.abc.MessageableChannel,
        context: PendingTaskContext,
        has_confirm: bool,
    ) -> None:
        """Send the initial Discord message representing the task."""
        if has_confirm:
            payload = messages.build_in_progress_message(
                requester=context.requester,
                repo=context.repo,
                branch=context.branch_name,
                description=context.description,
            )
            channel_message = await channel.send(
                content=payload["content"], embed=payload["embed"]
            )
            self._register_task_message(context.task_id, channel_message, context)
            await interaction.followup.send(
                "Task confirmed automatically. CodeCat is starting now.", ephemeral=True
            )
            try:
                await self.start_confirmed_task(
                    context=context,
                    channel_message=channel_message,
                    view=None,
                )
            except Exception:  # noqa: BLE001
                error_payload = messages.build_error_message(
                    "Failed to start CodeCat session. Please try again."
                )
                try:
                    await self.supabase.update_task_status(context.task_id, "rejected")
                except SupabaseServiceError as exc:
                    logger.exception(
                        "Failed to mark task %s as rejected after error: %s",
                        context.task_id,
                        exc,
                    )
                await channel_message.edit(
                    content=error_payload["content"],
                    embed=error_payload["embed"],
                    view=None,
                )
                await interaction.followup.send(
                    "CodeCat session could not be started. Please retry later.",
                    ephemeral=True,
                )
                self._task_contexts.pop(context.task_id, None)
                self._task_messages.pop(context.task_id, None)
                return
        else:
            from .interactions import ConfirmationView

            view = ConfirmationView(context)
            payload = await view.render_pending_message()
            channel_message = await channel.send(
                content=payload["content"], embed=payload["embed"], view=view
            )
            context.message_id = channel_message.id
            self._register_task_message(context.task_id, channel_message, context)
            await interaction.followup.send(
                "Task created and awaiting confirmation.", ephemeral=True
            )

    def _register_task_message(
        self,
        task_id: str,
        message: discord.Message,
        context: PendingTaskContext,
    ) -> None:
        """Track Discord message + context for later updates."""
        context.message_id = message.id
        self._task_messages[task_id] = message
        self._task_contexts[task_id] = context

    async def start_confirmed_task(
        self,
        *,
        context: PendingTaskContext,
        channel_message: discord.Message | None,
        view: discord.ui.View | None,
    ) -> None:
        """Kick off OpenRouter + GitHub workflow after moderator confirmation."""
        access_token = context.github_access_token
        if not access_token:
            error_msg = "No GitHub access token available. Cannot create PR."
            logger.error(error_msg)
            raise GithubServiceError(error_msg)

        # Update status to in_progress
        try:
            await self.supabase.update_task_status(context.task_id, "in_progress")
        except SupabaseServiceError as exc:
            logger.exception("Failed to update task status: %s", exc)
            raise

        context.status = "in_progress"

        if view:
            view.disable_all_items()

        payload = messages.build_in_progress_message(
            requester=context.requester,
            repo=context.repo,
            branch=context.branch_name,
            description=context.description,
        )

        message = channel_message or self._task_messages.get(context.task_id)
        if message:
            await message.edit(
                content=payload["content"],
                embed=payload["embed"],
                view=view,
            )
            self._task_messages[context.task_id] = message
        else:
            logger.warning("No message tracked for task %s", context.task_id)

        # Generate code changes using OpenRouter
        try:
            logger.info("Generating code changes with OpenRouter for task %s", context.task_id)
            changes = await self.openrouter_service.generate_code_changes(
                openrouter_api_key=context.openrouter_api_key,
                model=context.model,
                task_description=context.description,
                repo=context.repo,
                branch_name=context.branch_name,
            )
            logger.info("Generated %d file changes", len(changes))
        except OpenRouterServiceError as exc:
            logger.exception("Failed to generate code changes: %s", exc)
            await self._handle_task_failed(context=context, error_message=str(exc))
            return

        # Ensure branch exists
        try:
            await self.github_service.ensure_branch_exists(
                access_token=access_token,
                repo_full_name=context.repo,
                branch_name=context.branch_name,
                default_branch=context.default_branch,
            )
        except GithubServiceError as exc:
            logger.exception("Failed to create branch: %s", exc)
            await self._handle_task_failed(context=context, error_message=f"Failed to create branch: {exc}")
            return

        # Commit all file changes to the branch
        try:
            logger.info("Committing %d files to branch %s", len(changes), context.branch_name)
            
            from services.github_service import GithubCommitFile
            commit_files: list[GithubCommitFile] = []
            
            for change in changes:
                if change.action == "delete":
                    # Skip delete actions for now
                    logger.warning("Skipping delete action for file: %s", change.path)
                    continue
                
                # Get existing file SHA if updating
                file_sha = None
                if change.action == "update":
                    try:
                        file_sha = await self.github_service.get_file_sha(
                            access_token=access_token,
                            repo_full_name=context.repo,
                            branch_name=context.branch_name,
                            file_path=change.path,
                        )
                    except GithubServiceError:
                        logger.debug("File %s not found, treating as create", change.path)
                
                commit_files.append({
                    "path": change.path,
                    "content": change.content,
                    "message": f"Update {change.path} via CodeCat Discord Bot",
                    "sha": file_sha,
                })
            
            if commit_files:
                await self.github_service.batch_commit_files(
                    access_token=access_token,
                    repo_full_name=context.repo,
                    branch_name=context.branch_name,
                    files=commit_files,
                    commit_message=f"CodeCat Discord Bot: {context.description}",
                )
            else:
                logger.warning("No files to commit for task %s", context.task_id)
                await self._handle_task_failed(context=context, error_message="No files to commit")
                return
                
        except GithubServiceError as exc:
            logger.exception("Failed to commit files: %s", exc)
            await self._handle_task_failed(context=context, error_message=f"Failed to commit files: {exc}")
            return

        # Create pull request
        try:
            logger.info("Creating pull request")
            pr_response = await self.github_service.create_pull_request(
                access_token=access_token,
                repo_full_name=context.repo,
                head_branch=context.branch_name,
                base_branch=context.default_branch,
                title=f"CodeCat: {context.description}",
                body=f"Automated PR created by CodeCat\n\n**Task:** {context.description}\n\n**Requested by:** {context.requester_display}",
            )
            pr_url = pr_response.get("html_url")
            
            if not pr_url:
                raise GithubServiceError("PR created but no URL returned")
                
            logger.info("PR created successfully: %s", pr_url)
        except GithubServiceError as exc:
            logger.exception("Failed to create PR: %s", exc)
            await self._handle_task_failed(context=context, error_message=f"Failed to create PR: {exc}")
            return

        # Update task as completed
        try:
            await self.supabase.update_task_status(context.task_id, "completed", pr_url=pr_url)
        except SupabaseServiceError as exc:
            logger.exception("Failed to mark task complete: %s", exc)
            # Continue anyway since PR was created

        # Update Discord message with success
        if message:
            payload = messages.build_completed_message(
                pr_url=pr_url,
                requester=context.requester,
            )
            await message.edit(content=payload["content"], embed=payload["embed"], view=None)

        self._task_contexts.pop(context.task_id, None)
        self._task_messages.pop(context.task_id, None)

    async def _handle_task_failed(
        self,
        *,
        context: PendingTaskContext,
        error_message: str,
    ) -> None:
        """Handle failed task by updating status and notifying Discord."""
        try:
            await self.supabase.update_task_status(context.task_id, "rejected")
        except SupabaseServiceError as exc:
            logger.exception("Failed to mark task as rejected: %s", exc)

        message = self._task_messages.get(context.task_id)
        if message:
            payload = messages.build_error_message(
                f"Task failed: {error_message}"
            )
            await message.edit(content=payload["content"], embed=payload["embed"], view=None)

        self._task_contexts.pop(context.task_id, None)
        self._task_messages.pop(context.task_id, None)

    async def reject_task(
        self,
        *,
        context: PendingTaskContext,
        moderator: discord.abc.User,
        channel_message: discord.Message | None,
        view: discord.ui.View | None,
    ) -> None:
        """Handle moderator rejection of a task."""
        try:
            await self.supabase.update_task_status(context.task_id, "rejected")
        except SupabaseServiceError as exc:
            logger.exception("Failed to mark task rejected: %s", exc)
            raise

        if view:
            view.disable_all_items()

        payload = messages.build_rejected_message(moderator=moderator)
        message = channel_message or self._task_messages.get(context.task_id)
        if message:
            await message.edit(
                content=payload["content"], embed=payload["embed"], view=view
            )
        self._task_contexts.pop(context.task_id, None)
        self._task_messages.pop(context.task_id, None)


async def create_bot() -> CodeCatBot:
    """Factory to create bot instance with configured services."""
    supabase_service = await SupabaseService.create()
    openrouter_service = OpenRouterService.create()
    github_service = GithubService.create()
    return CodeCatBot(
        supabase_service=supabase_service,
        openrouter_service=openrouter_service,
        github_service=github_service,
    )
