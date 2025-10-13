"""Utilities for validating Discord role permissions."""

from __future__ import annotations

from typing import Iterable, Mapping


def user_has_permission(
    user_roles: Iterable[str],
    guild_permissions: Mapping[str, object],
    permission_type: str,
) -> bool:
    """
    Evaluate whether the user owns at least one role with the requested permission.

    Args:
        user_roles: Collection of Discord role IDs assigned to the user.
        guild_permissions: Guild permissions mapping from Supabase. Expected keys are
            "create_roles" and "confirm_roles" containing lists of role IDs.
        permission_type: The permission to check. Accepts "create" or "confirm".

    Returns:
        True if the user has a role granting the permission, otherwise False.
    """
    if permission_type not in {"create", "confirm"}:
        raise ValueError("permission_type must be 'create' or 'confirm'")

    allowed_roles_raw = guild_permissions.get(f"{permission_type}_roles", []) or []
    allowed_roles = {str(role_id) for role_id in allowed_roles_raw}
    normalized_user_roles = {str(role_id) for role_id in user_roles}
    return not allowed_roles.isdisjoint(normalized_user_roles)
