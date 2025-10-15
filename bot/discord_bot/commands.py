"""Slash command definitions for the CodeCat Discord bot."""

from __future__ import annotations

import logging
import discord
from discord import app_commands

from .bot import CodeCatBot

logger = logging.getLogger(__name__)


def register_commands(bot: CodeCatBot) -> None:
    """Register slash commands onto the bot's command tree."""

    @bot.tree.command(
        name="codecat",
        description="Run a CodeCat AI development task in the connected repository.",
    )
    @app_commands.describe(
        branch_name="Branch to create/use for the task",
        task_description="Describe the work you want CodeCat to perform",
    )
    async def codecat_command(
        interaction: discord.Interaction[discord.Client],
        branch_name: str,
        task_description: str,
    ) -> None:
        await bot.handle_codecat_command(
            interaction=interaction,
            branch_name=branch_name,
            task_description=task_description,
        )

    @bot.tree.command(
        name="current_repo",
        description="Show the repository configuration for this guild.",
    )
    async def current_repo_command(
        interaction: discord.Interaction[discord.Client],
    ) -> None:
        await bot.handle_current_repo_command(interaction=interaction)

    @bot.tree.command(
        name="connect-github",
        description="Connect your GitHub account for CodeCat tasks.",
    )
    async def connect_github_command(
        interaction: discord.Interaction[discord.Client],
    ) -> None:
        await bot.handle_connect_github_command(interaction=interaction)

    @bot.tree.command(
        name="update",
        description="Refresh CodeCat role configuration for this guild.",
    )
    async def update_command(
        interaction: discord.Interaction[discord.Client],
    ) -> None:
        await bot.handle_update_command(interaction=interaction)

    @bot.tree.command(
        name="help",
        description="Show CodeCat commands available to you.",
    )
    async def help_command(
        interaction: discord.Interaction[discord.Client],
    ) -> None:
        await bot.handle_help_command(interaction=interaction)

    logger.info("Registered slash commands.")
