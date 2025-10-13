"""Discord message templates for the Jules workflow."""

from __future__ import annotations

import discord


def build_pending_message(
    *,
    requester: discord.abc.User,
    repo: str,
    branch: str,
    description: str,
) -> dict[str, object]:
    """Create embed + content for pending confirmation."""
    embed = discord.Embed(
        title="🧠 New Jules Task Requested",
        description=f'"{description}"',
        color=discord.Color.blurple(),
    )
    embed.add_field(name="Requested by", value=requester.mention, inline=True)
    embed.add_field(name="Repository", value=repo, inline=True)
    embed.add_field(name="Branch", value=branch, inline=True)
    embed.set_footer(text="Waiting for admin confirmation…")
    content = (
        f"🧠 {requester.mention} requested a new Jules task\n"
        f'Prompt: "{description}"\nRepo: {repo}\nWaiting for admin confirmation…'
    )
    return {"content": content, "embed": embed}


def build_in_progress_message(
    *,
    requester: discord.abc.User,
    repo: str,
    branch: str,
    description: str,
) -> dict[str, object]:
    """Message when the Jules task starts immediately."""
    embed = discord.Embed(
        title="🛠 Development started…",
        description="Jules is generating the pull request.",
        color=discord.Color.orange(),
    )
    embed.add_field(name="Requested by", value=requester.mention, inline=True)
    embed.add_field(name="Repository", value=repo, inline=True)
    embed.add_field(name="Branch", value=branch, inline=True)
    embed.add_field(name="Prompt", value=description, inline=False)
    content = "🛠 Development started… Jules is generating PR."
    return {"content": content, "embed": embed}


def build_completed_message(
    *,
    pr_url: str,
    requester: discord.abc.User,
) -> dict[str, object]:
    """Message when Jules completes the task."""
    embed = discord.Embed(
        title="✅ PR created",
        description=f"[Open pull request]({pr_url})",
        color=discord.Color.green(),
    )
    embed.set_footer(text=f"Requested by {requester.display_name}")
    content = f"✅ PR created: {pr_url}"
    return {"content": content, "embed": embed}


def build_rejected_message(*, moderator: discord.abc.User) -> dict[str, object]:
    """Message when a moderator rejects the request."""
    content = f"❌ Task rejected by {moderator.mention}."
    embed = discord.Embed(
        title="❌ Task rejected",
        description=f"Rejected by {moderator.display_name}.",
        color=discord.Color.red(),
    )
    return {"content": content, "embed": embed}


def build_error_message(message: str) -> dict[str, object]:
    """Helper for user-friendly error alerts."""
    embed = discord.Embed(
        title="⚠️ Something went wrong",
        description=message,
        color=discord.Color.red(),
    )
    return {"content": message, "embed": embed}
