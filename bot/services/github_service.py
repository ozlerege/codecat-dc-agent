"""Minimal GitHub REST helpers used by the Discord bot."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Iterable, TypedDict, cast

import httpx

from config import require


logger = logging.getLogger(__name__)


class GithubServiceError(RuntimeError):
    """Raised when GitHub API requests fail."""


class GithubCommitFile(TypedDict, total=False):
    """Representation of a file change to commit."""

    path: str
    message: str
    content: str
    sha: str | None


class GithubCommitPayload(TypedDict, total=False):
    """Payload for creating or updating a file via GitHub API."""

    path: str
    message: str
    content: str
    branch: str
    sha: str | None
    committer: dict[str, str]


class GithubDeviceCodeResponse(TypedDict, total=False):
    """Response payload returned by GitHub device authorization endpoint."""

    device_code: str
    user_code: str
    verification_uri: str
    verification_uri_complete: str | None
    expires_in: int
    interval: int


class GithubDeviceTokenResponse(TypedDict, total=False):
    """Response payload for polling GitHub device access token."""

    access_token: str
    token_type: str
    scope: str
    error: str
    error_description: str | None
    error_uri: str | None


@dataclass(slots=True)
class GithubService:
    """Thin wrapper around GitHub REST API."""

    client: httpx.AsyncClient

    @classmethod
    def create(cls) -> "GithubService":
        """Create GitHub service with default base URL."""
        client = httpx.AsyncClient(base_url="https://api.github.com", timeout=30.0)
        return cls(client)

    async def aclose(self) -> None:
        """Close HTTP client resources."""
        await self.client.aclose()

    async def batch_commit_files(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        branch_name: str,
        files: Iterable[GithubCommitFile],
        commit_message: str,
    ) -> None:
        """
        Commit multiple file changes to a branch sequentially.

        GitHub REST API does not offer a multi-file commit endpoint directly; therefore we
        create or update each file individually within the same branch using the provided
        commit message. The committer defaults to the CodeCat bot identity but may be
        overridden by GitHub based on the access token permissions.
        """
        import base64

        for file in files:
            file_path = require(file.get("path"), "file path")
            file_content = require(file.get("content"), "file content")
            
            # GitHub API requires base64-encoded content
            encoded_content = base64.b64encode(file_content.encode("utf-8")).decode("utf-8")
            
            payload: GithubCommitPayload = {
                "path": file_path,
                "message": commit_message,
                "content": encoded_content,
                "branch": branch_name,
                "sha": file.get("sha"),
                "committer": {
                    "name": "CodeCat Bot",
                    "email": "bot@codecat.dev",
                },
            }

            await self._put(
                access_token=access_token,
                repo_full_name=repo_full_name,
                endpoint=f"/repos/{repo_full_name}/contents/{payload['path']}",
                json_payload=payload,
            )

    async def start_device_authorization(
        self,
        *,
        client_id: str,
        scope: str,
    ) -> GithubDeviceCodeResponse:
        """Initiate the GitHub device authorization flow."""

        payload = {"client_id": client_id, "scope": scope}
        headers = {"Accept": "application/json"}

        try:
            response = await self.client.post(
                "https://github.com/login/device/code",
                data=payload,
                headers=headers,
            )
        except httpx.HTTPError as exc:  # noqa: BLE001
            raise GithubServiceError("Failed to start GitHub device authorization") from exc

        if response.status_code != 200:
            raise GithubServiceError(
                "GitHub device authorization failed "
                f"({response.status_code}): {response.text}"
            )

        try:
            data = cast(GithubDeviceCodeResponse, response.json())
        except ValueError as exc:  # noqa: BLE001
            raise GithubServiceError("Invalid response from GitHub device authorization") from exc

        required_keys = ("device_code", "user_code", "verification_uri", "expires_in")
        for key in required_keys:
            require(data.get(key), f"github device authorization {key}")

        # GitHub may omit interval; default to 5 seconds per documentation
        data.setdefault("interval", 5)
        return data

    async def poll_device_token(
        self,
        *,
        client_id: str,
        client_secret: str,
        device_code: str,
    ) -> GithubDeviceTokenResponse:
        """Poll GitHub for a device access token."""

        payload = {
            "client_id": client_id,
            "device_code": device_code,
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            "client_secret": client_secret,
        }
        headers = {"Accept": "application/json"}

        try:
            response = await self.client.post(
                "https://github.com/login/oauth/access_token",
                data=payload,
                headers=headers,
            )
        except httpx.HTTPError as exc:  # noqa: BLE001
            raise GithubServiceError("Failed to poll GitHub device token") from exc

        try:
            data = cast(GithubDeviceTokenResponse, response.json())
        except ValueError as exc:  # noqa: BLE001
            raise GithubServiceError("Invalid response from GitHub token endpoint") from exc

        return data

    async def get_authenticated_user(self, *, access_token: str) -> dict[str, Any]:
        """Retrieve the GitHub user associated with an access token."""

        response = await self._get(
            access_token=access_token,
            repo_full_name="",
            endpoint="/user",
        )

        if response.status_code != 200:
            raise GithubServiceError(
                f"Failed to fetch GitHub user ({response.status_code}): {response.text}"
            )

        try:
            return cast(dict[str, Any], response.json())
        except ValueError as exc:  # noqa: BLE001
            raise GithubServiceError("Invalid JSON response from GitHub user API") from exc

    async def create_pull_request(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        head_branch: str,
        base_branch: str,
        title: str,
        body: str,
    ) -> dict[str, object]:
        """Create a pull request between two branches."""

        payload = {
            "title": title,
            "head": head_branch,
            "base": base_branch,
            "body": body,
        }

        response = await self._post(
            access_token=access_token,
            repo_full_name=repo_full_name,
            endpoint=f"/repos/{repo_full_name}/pulls",
            json_payload=payload,
        )

        if response.status_code not in {200, 201}:
            raise GithubServiceError(
                "Failed to create pull request "
                f"({response.status_code}): {response.text}"
            )

        return response.json()

    async def get_file_sha(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        branch_name: str,
        file_path: str,
    ) -> str | None:
        """Retrieve the SHA of a file on a branch if it exists."""

        endpoint = f"/repos/{repo_full_name}/contents/{file_path}?ref={branch_name}"
        response = await self._get(
            access_token=access_token,
            repo_full_name=repo_full_name,
            endpoint=endpoint,
        )

        if response.status_code == 404:
            return None
        if response.status_code != 200:
            raise GithubServiceError(
                f"Failed to fetch file SHA ({response.status_code}): {response.text}"
            )

        data = response.json()
        return data.get("sha")

    async def create_branch_from_base(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        branch_name: str,
        base_sha: str,
    ) -> None:
        """Create a new branch from a specific base SHA."""

        payload = {"ref": f"refs/heads/{branch_name}", "sha": base_sha}
        response = await self.client.post(
            f"/repos/{repo_full_name}/git/refs",
            headers=self._headers(access_token),
            json=payload,
        )

        if response.status_code in {200, 201, 422}:
            return

        if response.status_code == 404:
            raise GithubServiceError(
                "GitHub could not find the repository or default branch while creating"
                f" '{branch_name}'. Check that '{repo_full_name}' exists and that the"
                " connected GitHub account has push access."
            )

        if response.status_code == 403:
            raise GithubServiceError(
                "GitHub rejected the branch creation due to missing permissions."
                " Ensure the connected GitHub account has write access to the repo."
            )

        raise GithubServiceError(
            f"Failed to create branch ({response.status_code}): {response.text}"
        )

    async def ensure_branch_exists(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        branch_name: str,
        default_branch: str,
    ) -> None:
        """Ensure branch exists, creating from default if necessary."""

        headers = self._headers(access_token)
        ref_endpoint = f"/repos/{repo_full_name}/git/ref/heads/{branch_name}"
        response = await self.client.get(ref_endpoint, headers=headers)

        if response.status_code == 200:
            return
        if response.status_code not in {404, 422}:
            raise GithubServiceError(
                f"GitHub API error ({response.status_code}): {response.text}"
            )

        default_ref_endpoint = f"/repos/{repo_full_name}/git/ref/heads/{default_branch}"
        default_ref_response = await self.client.get(
            default_ref_endpoint, headers=headers
        )
        if default_ref_response.status_code != 200:
            raise GithubServiceError(
                "Failed to resolve default branch "
                f"({default_ref_response.status_code}): {default_ref_response.text}"
            )

        default_sha = default_ref_response.json().get("object", {}).get("sha")
        if not default_sha:
            raise GithubServiceError("Unable to determine default branch SHA")

        try:
            await self.create_branch_from_base(
                access_token=access_token,
                repo_full_name=repo_full_name,
                branch_name=branch_name,
                base_sha=default_sha,
            )
        except GithubServiceError as exc:
            raise GithubServiceError(
                "Unable to create branch '{branch}' on '{repo}'. "
                "Verify the repository name, default branch, and token permissions."
                .format(branch=branch_name, repo=repo_full_name)
            ) from exc

    def _headers(self, access_token: str) -> dict[str, str]:
        token_prefixes = ("ghp_", "gho_", "ghu_", "ghs_", "ghr_")
        if any(access_token.startswith(prefix) for prefix in token_prefixes):
            auth_header = f"token {access_token}"
        else:
            auth_header = f"Bearer {access_token}"

        return {
            "Authorization": auth_header,
            "Accept": "application/vnd.github+json",
        }

    async def _get(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        endpoint: str,
    ) -> httpx.Response:
        headers = self._headers(access_token)
        return await self.client.get(endpoint, headers=headers)

    async def _post(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        endpoint: str,
        json_payload: dict[str, object],
    ) -> httpx.Response:
        headers = self._headers(access_token)
        return await self.client.post(endpoint, headers=headers, json=json_payload)

    async def _put(
        self,
        *,
        access_token: str,
        repo_full_name: str,
        endpoint: str,
        json_payload: dict[str, object],
    ) -> httpx.Response:
        headers = self._headers(access_token)
        return await self.client.put(endpoint, headers=headers, json=json_payload)
