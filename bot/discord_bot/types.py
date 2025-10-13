"""Shared type definitions for the Discord bot package."""

from __future__ import annotations

from dataclasses import dataclass

import discord

from services import GuildPermissions, TaskStatus

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .bot import JulesBot


@dataclass(slots=True)
class PendingTaskContext:
    """State container used when awaiting moderator confirmation."""

    bot: "JulesBot"
    task_id: str
    guild_uuid: str
    discord_guild_id: int
    guild_permissions: GuildPermissions
    repo: str
    github_repo_id: int | None
    github_repo_name: str | None
    branch_name: str
    default_branch: str
    description: str
    requester: discord.abc.User
    requester_id: str
    requester_display: str
    requester_mention: str
    discord_user_id: str
    supabase_user_id: str | None
    openrouter_api_key: str
    model: str
    status: TaskStatus
    channel_id: int
    github_access_token: str | None = None
    message_id: int | None = None
