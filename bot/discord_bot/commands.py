"""Slash command definitions for the Jules Discord bot."""

from __future__ import annotations

import logging
from typing import Optional

import discord
from discord import app_commands

from .bot import JulesBot

logger = logging.getLogger(__name__)


def register_commands(bot: JulesBot) -> None:
    """Register slash commands onto the bot's command tree."""

    @bot.tree.command(
        name="jules",
        description="Run a Jules AI development task in the connected repository.",
    )
    @app_commands.describe(
        branch_name="Branch to create/use for the task",
        task_description="Describe the work you want Jules to perform",
        repo="Optional override in owner/repo format",
    )
    async def jules_command(
        interaction: discord.Interaction[discord.Client],
        branch_name: str,
        task_description: str,
        repo: Optional[str] = None,
    ) -> None:
        await bot.handle_jules_command(
            interaction=interaction,
            branch_name=branch_name,
            task_description=task_description,
            repo_override=repo,
        )

    logger.info("Registered slash commands.")

    @bot.tree.command(
        name="current_repo",
        description="Show the repository configuration for this guild.",
    )
    async def current_repo_command(
        interaction: discord.Interaction[discord.Client],
    ) -> None:
        await bot.handle_current_repo_command(interaction=interaction)
