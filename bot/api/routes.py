"""FastAPI routes for Discord interactions and webhooks."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/interactions")
async def interactions(request: Request) -> JSONResponse:
    """Handle Discord HTTP interactions (verification + webhooks)."""
    payload = await request.json()
    interaction_type = payload.get("type")

    if interaction_type == 1:  # PING
        return JSONResponse({"type": 1})

    logger.debug("Received Discord interaction payload: %s", payload)
    # Gateway-based bot handles commands; respond with ACK.
    return JSONResponse({"type": 5})


@router.post("/webhook/codecat")
async def webhook_codecat(request: Request) -> JSONResponse:
    """Placeholder endpoint for CodeCat webhooks."""
    payload = await request.json()
    logger.debug("Received CodeCat webhook payload: %s", payload)
    return JSONResponse({"status": "accepted"})


@router.get("/current-repo")
async def current_repo() -> JSONResponse:
    """Return the repository name inferred from the project root."""
    repo_name = Path(__file__).resolve().parents[3].name
    return JSONResponse({"name": repo_name})


@router.get("/health")
async def health(request: Request) -> JSONResponse:
    """Health check endpoint with bot status."""
    bot_ready = False
    if hasattr(request.app.state, 'bot'):
        bot = request.app.state.bot
        bot_ready = bot.is_ready() if bot else False
    
    return JSONResponse({
        "status": "ok",
        "bot_ready": bot_ready,
    })
