"""FastAPI middleware for Discord signature verification."""

from __future__ import annotations

import logging

from fastapi import HTTPException, Request
from nacl.exceptions import BadSignatureError
from nacl.signing import VerifyKey
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class DiscordSignatureMiddleware(BaseHTTPMiddleware):
    """Validate Discord interaction requests using Ed25519 signatures."""

    def __init__(self, app, *, public_key: str):  # type: ignore[override]
        super().__init__(app)
        try:
            self.verify_key = VerifyKey(bytes.fromhex(public_key))
        except ValueError as exc:  # noqa: BLE001
            raise RuntimeError("Invalid DISCORD_PUBLIC_KEY hex value") from exc

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        if request.url.path != "/interactions":
            return await call_next(request)

        signature = request.headers.get("X-Signature-Ed25519")
        timestamp = request.headers.get("X-Signature-Timestamp")

        if not signature or not timestamp:
            raise HTTPException(status_code=401, detail="Missing Discord signature header")

        body = await request.body()

        try:
            self.verify_key.verify(timestamp.encode() + body, bytes.fromhex(signature))
        except BadSignatureError:
            logger.warning("Invalid Discord signature for request to %s", request.url.path)
            raise HTTPException(status_code=401, detail="Invalid request signature") from None
        except ValueError as exc:  # noqa: BLE001
            logger.warning("Malformed Discord signature header: %s", exc)
            raise HTTPException(status_code=401, detail="Malformed request signature") from exc

        return await call_next(request)
