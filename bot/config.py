"""
Configuration module for the Discord bot + FastAPI service.

Loads environment variables through `Settings` which is validated eagerly so the
application fails fast when critical configuration is missing.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field, PositiveInt, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration sourced from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Discord
    discord_token: str = Field(..., alias="DISCORD_TOKEN")
    discord_app_id: str = Field(..., alias="DISCORD_APP_ID")
    discord_public_key: str = Field(..., alias="DISCORD_PUBLIC_KEY")

    # Supabase
    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(..., alias="SUPABASE_SERVICE_ROLE_KEY")

    # GitHub
    github_app_id: str | None = Field(default=None, alias="GITHUB_APP_ID")
    github_app_secret: str | None = Field(default=None, alias="GITHUB_APP_SECRET")
    github_client_id: str | None = Field(default=None, alias="GITHUB_CLIENT_ID")
    github_client_secret: str | None = Field(default=None, alias="GITHUB_CLIENT_SECRET")

    # OpenRouter
    openrouter_api_base_url: str = Field(
        default="https://openrouter.ai/api/v1", alias="OPENROUTER_API_BASE_URL"
    )
    openrouter_model: str = Field(
        default="anthropic/claude-3.5-sonnet", alias="OPENROUTER_MODEL"
    )

    # Backend
    port: PositiveInt = Field(default=8000, alias="PORT")
    log_level: str = Field(default="info", alias="LOG_LEVEL")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Retrieve cached settings instance.

    Returns:
        Settings: The validated settings object.

    Raises:
        RuntimeError: If configuration validation fails.
    """
    try:
        return Settings()
    except ValidationError as exc:
        raise RuntimeError("Invalid configuration for Discord bot service") from exc


def require(setting: Any, name: str) -> Any:
    """
    Ensure a configuration value exists.

    Args:
        setting: The value to validate.
        name: Human-readable configuration name for error messages.

    Returns:
        The provided setting if truthy.

    Raises:
        RuntimeError: When the setting evaluates to falsy.
    """
    if setting:
        return setting
    raise RuntimeError(f"Configuration value '{name}' is required but missing.")
