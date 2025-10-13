"""Discord UI interactions for the CodeCat bot."""

from __future__ import annotations

import logging
from typing import Literal

import discord

from utils import user_has_permission

from .types import PendingTaskContext

logger = logging.getLogger(__name__)


class ConfirmationView(discord.ui.View):
    """Discord UI for moderators to confirm or reject CodeCat tasks."""

    def __init__(self, context: PendingTaskContext):
        super().__init__(timeout=None)
        self.context = context

    async def _ensure_permission(
        self, interaction: discord.Interaction[discord.Client]
    ) -> bool:
        """Check confirm permissions and alert the user when insufficient."""

        if isinstance(interaction.user, discord.Member):
            member: discord.Member | None = interaction.user
        else:
            guild = self.context.bot.get_guild(self.context.discord_guild_id)
            member = None
            if guild is not None:
                member = guild.get_member(interaction.user.id)
                if member is None:
                    try:
                        member = await guild.fetch_member(interaction.user.id)
                    except discord.DiscordException:
                        member = None

        if member is None:
            await interaction.response.send_message(
                "Unable to resolve your guild permissions.", ephemeral=True
            )
            return False

        role_ids = [str(role.id) for role in member.roles]
        if user_has_permission(role_ids, self.context.guild_permissions, "confirm"):
            return True

        await interaction.response.send_message(
            "You need a confirm role to perform this action.", ephemeral=True
        )
        return False

    async def _handle_action(
        self,
        interaction: discord.Interaction[discord.Client],
        action: Literal["confirm", "reject"],
    ) -> None:
        if not await self._ensure_permission(interaction):
            return

        await interaction.response.defer(ephemeral=True, thinking=True)

        channel_message = await self.context.bot._get_task_channel_message(self.context)
        if channel_message is None:
            await interaction.followup.send(
                "Original task message is no longer available. Please create a new task.",
                ephemeral=True,
            )
            return

        try:
            if action == "confirm":
                await self.context.bot.start_confirmed_task(
                    context=self.context,
                    channel_message=channel_message,
                    view=None,
                )
                await self.context.bot._clear_task_dm_views(
                    self.context.task_id, preserve=interaction.message
                )
                await interaction.followup.send(
                    "Task confirmed. CodeCat is starting now.", ephemeral=True
                )
            else:
                await self.context.bot.reject_task(
                    context=self.context,
                    moderator=interaction.user,
                    channel_message=channel_message,
                    view=None,
                )
                await self.context.bot._clear_task_dm_views(
                    self.context.task_id, preserve=interaction.message
                )
                await interaction.followup.send(
                    "Task rejected successfully.", ephemeral=True
                )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Task %s action failed: %s", self.context.task_id, exc)
            await interaction.followup.send(
                "Something went wrong while processing the request.", ephemeral=True
            )

    @discord.ui.button(label="Confirm", style=discord.ButtonStyle.success, emoji="✅")
    async def confirm(  # type: ignore[override]
        self, interaction: discord.Interaction[discord.Client], button: discord.ui.Button
    ) -> None:
        del button  # unused
        await self._handle_action(interaction, "confirm")

    @discord.ui.button(label="Reject", style=discord.ButtonStyle.danger, emoji="❌")
    async def reject(  # type: ignore[override]
        self, interaction: discord.Interaction[discord.Client], button: discord.ui.Button
    ) -> None:
        del button
        await self._handle_action(interaction, "reject")
