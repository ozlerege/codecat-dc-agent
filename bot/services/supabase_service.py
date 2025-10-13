"""Supabase data access layer."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Literal, TypedDict

from supabase._async.client import AsyncClient

from config import get_settings, require

logger = logging.getLogger(__name__)


class SupabaseServiceError(RuntimeError):
    """Raised when Supabase operations fail."""


class GuildPermissions(TypedDict, total=False):
    create_roles: list[str]
    confirm_roles: list[str]


class GuildRecord(TypedDict, total=False):
    id: str
    guild_id: str
    default_repo: str | None
    default_branch: str | None
    permissions: GuildPermissions
    default_openrouter_api_key: str | None
    default_model: str | None
    github_repo_id: int | None
    github_repo_name: str | None
    github_connected: bool | None
    name: str | None


class UserRecord(TypedDict, total=False):
    id: str
    discord_id: str
    discord_username: str | None
    openrouter_api_key: str | None
    github_access_token: str | None
    github_username: str | None


TaskStatus = Literal["pending_confirmation", "in_progress", "rejected", "completed"]


class TaskRecord(TypedDict, total=False):
    id: str
    user_id: str | None
    discord_user_id: str
    guild_id: str
    prompt: str
    status: TaskStatus
    pr_url: str | None
    session_id: str | None


@dataclass(slots=True)
class SupabaseService:
    """Thin wrapper around Supabase client with typed helpers."""

    client: AsyncClient

    @classmethod
    async def create(cls) -> "SupabaseService":
        """Factory that instantiates the Supabase async client from settings."""
        settings = get_settings()
        require(settings.supabase_url, "SUPABASE_URL")
        require(settings.supabase_service_role_key, "SUPABASE_SERVICE_ROLE_KEY")
        client = AsyncClient(settings.supabase_url, settings.supabase_service_role_key)
        return cls(client)

    async def aclose(self) -> None:
        """Close the underlying Supabase client session."""
        try:
            await self.client.aclose()
        except AttributeError:
            pass

    async def get_guild_by_discord_id(self, guild_id: str) -> GuildRecord | None:
        """Fetch guild configuration using the Discord guild ID."""
        try:
            response = await (
                self.client.table("guilds")
                .select("*")
                .eq("guild_id", guild_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to fetch guild") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        data: list[GuildRecord] = getattr(response, "data", []) or []
        return data[0] if data else None

    async def get_user_by_discord_id(self, discord_id: str) -> UserRecord | None:
        """Retrieve Supabase user record by Discord ID."""
        try:
            response = await (
                self.client.table("users")
                .select("*")
                .eq("discord_id", discord_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to fetch user") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        data: list[UserRecord] = getattr(response, "data", []) or []
        return data[0] if data else None

    async def get_user_by_id(self, user_id: str) -> UserRecord | None:
        """Retrieve Supabase user record by UUID."""
        try:
            response = await (
                self.client.table("users")
                .select("*")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to fetch user by id") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        data: list[UserRecord] = getattr(response, "data", []) or []
        return data[0] if data else None

    async def upsert_user_github_connection(
        self,
        *,
        discord_id: str,
        discord_username: str | None,
        github_access_token: str,
        github_username: str,
    ) -> UserRecord:
        """Insert or update a user's GitHub connection details."""

        payload: dict[str, Any] = {
            "github_access_token": github_access_token,
            "github_username": github_username,
        }

        if discord_username:
            payload["discord_username"] = discord_username

        try:
            response = (
                await self.client.table("users")
                .update(payload)
                .eq("discord_id", discord_id)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to upsert GitHub connection") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        record = await self.get_user_by_discord_id(discord_id)
        if not record:
            raise SupabaseServiceError("Failed to load user after GitHub connection upsert")
        return record

    async def get_guild_by_id(self, guild_uuid: str) -> GuildRecord | None:
        """Fetch guild by primary key UUID."""
        try:
            response = await (
                self.client.table("guilds")
                .select("*")
                .eq("id", guild_uuid)
                .limit(1)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to fetch guild by id") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        data: list[GuildRecord] = getattr(response, "data", []) or []
        return data[0] if data else None

    async def create_task(
        self,
        discord_user_id: str,
        guild_id: str,
        prompt: str,
        status: TaskStatus,
        *,
        user_id: str | None = None,
        session_id: str | None = None,
    ) -> TaskRecord:
        """Insert a new task row."""
        payload: dict[str, Any] = {
            "discord_user_id": discord_user_id,
            "guild_id": guild_id,
            "prompt": prompt,
            "status": status,
        }

        if user_id:
            payload["user_id"] = user_id
        if session_id:
            payload["session_id"] = session_id

        try:
            response = await self.client.table("tasks").insert(payload).execute()
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to create task") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        # Supabase inserts return only IDs by default; fetch the created row.
        task_id = response.data[0].get("id") if response.data else None  # type: ignore[index]
        if not task_id:
            raise SupabaseServiceError("Supabase did not return created task id")
        return await self.get_task_by_id(task_id)

    async def update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        *,
        pr_url: str | None = None,
        session_id: str | None = None,
    ) -> None:
        """Update task lifecycle status."""
        payload: dict[str, Any] = {"status": status}
        if pr_url is not None:
            payload["pr_url"] = pr_url
        if session_id is not None:
            payload["session_id"] = session_id

        try:
            response = await (
                self.client.table("tasks")
                .update(payload)
                .eq("id", task_id)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to update task status") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

    async def get_in_progress_tasks(self) -> list[TaskRecord]:
        """Return tasks currently in progress."""
        try:
            response = await (
                self.client.table("tasks")
                .select("*")
                .eq("status", "in_progress")
                .execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to fetch in-progress tasks") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        return getattr(response, "data", []) or []

    async def get_task_by_id(self, task_id: str) -> TaskRecord:
        """Retrieve a task by primary key."""
        try:
            response = await (
                self.client.table("tasks").select("*").eq("id", task_id).limit(1).execute()
            )
        except Exception as exc:  # noqa: BLE001
            raise SupabaseServiceError("Failed to fetch task by id") from exc

        if getattr(response, "error", None):
            raise SupabaseServiceError(response.error)

        data: list[TaskRecord] = getattr(response, "data", []) or []
        if not data:
            raise SupabaseServiceError("Task not found after creation")
        return data[0]
