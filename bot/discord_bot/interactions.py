"""Discord UI interactions for the Jules bot."""

from __future__ import annotations

import logging
from typing import Literal

import discord

from utils import user_has_permission

from . import messages
from .types import PendingTaskContext

logger = logging.getLogger(__name__)


class ConfirmationView(discord.ui.View):
    """Discord UI for moderators to confirm or reject Jules tasks."""

    def __init__(self, context: PendingTaskContext):
        super().__init__(timeout=None)
        self.context = context

    async def _ensure_permission(
        self, interaction: discord.Interaction[discord.Client]
    ) -> bool:
        """Check confirm permissions and alert the user when insufficient."""
        if not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message(
                "Unable to resolve your guild permissions.", ephemeral=True
            )
            return False

        member: discord.Member = interaction.user
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
        try:
            if action == "confirm":
                await self.context.bot.start_confirmed_task(
                    context=self.context,
                    channel_message=interaction.message,
                    view=self,
                )
                await interaction.followup.send(
                    "Task confirmed. Jules is starting now.", ephemeral=True
                )
            else:
                await self.context.bot.reject_task(
                    context=self.context,
                    moderator=interaction.user,
                    channel_message=interaction.message,
                    view=self,
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

    async def render_pending_message(self) -> dict[str, object]:
        """Produce message payload for the pending confirmation state."""
        payload = messages.build_pending_message(
            requester=self.context.requester,
            repo=self.context.repo,
            branch=self.context.branch_name,
            description=self.context.description,
        )
        payload["view"] = self
        return payload
