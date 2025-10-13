"""FastAPI + Discord bot entrypoint."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from api.middleware import DiscordSignatureMiddleware
from api.routes import router
from config import get_settings, require
from discord_bot import create_bot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup/shutdown for FastAPI application."""
    settings = get_settings()
    bot = await create_bot()
    app.state.bot = bot
    token = require(settings.discord_token, "DISCORD_TOKEN")
    bot_task = asyncio.create_task(bot.start(token))
    logger.info("Discord bot task started.")
    try:
        yield
    finally:
        await bot.close()
        await bot.openrouter_service.aclose()
        await bot.github_service.aclose()
        await bot.supabase.aclose()
        bot_task.cancel()
        try:
            await bot_task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    DiscordSignatureMiddleware, public_key=require(settings.discord_public_key, "DISCORD_PUBLIC_KEY")
)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
