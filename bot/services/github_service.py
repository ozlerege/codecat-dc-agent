"""Minimal GitHub REST helpers used by the Discord bot."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Iterable, TypedDict

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

        if response.status_code not in {200, 201, 422}:
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

        await self.create_branch_from_base(
            access_token=access_token,
            repo_full_name=repo_full_name,
            branch_name=branch_name,
            base_sha=default_sha,
        )

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
