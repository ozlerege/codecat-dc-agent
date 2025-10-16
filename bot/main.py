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
    bot = None
    bot_task = None
    
    try:
        settings = get_settings()
        logger.info("✅ Settings loaded successfully")
        logger.info("   - Discord App ID: %s", settings.discord_app_id[:10] + "..." if settings.discord_app_id else "NOT SET")
        logger.info("   - Supabase URL: %s", settings.supabase_url[:30] + "..." if settings.supabase_url else "NOT SET")
        
        logger.info("🤖 Creating bot instance...")
        bot = await create_bot()
        app.state.bot = bot
        logger.info("✅ Bot instance created")
        
        token = require(settings.discord_token, "DISCORD_TOKEN")
        logger.info("🚀 Starting Discord bot connection...")
        bot_task = asyncio.create_task(bot.start(token))
        logger.info("✅ Discord bot task started in background")
        logger.info("🌐 FastAPI server is ready to accept requests")
        
        yield
        
    except Exception as exc:
        logger.exception("❌ Failed during bot startup: %s", exc)
        # Don't raise - allow FastAPI to start even if bot fails
        # This way health checks can still respond
        logger.warning("⚠️  FastAPI will start but bot may not be functional")
        yield
        
    finally:
        logger.info("🛑 Shutting down...")
        if bot:
            try:
                await bot.close()
                await bot.openrouter_service.aclose()
                await bot.github_service.aclose()
                await bot.supabase.aclose()
                logger.info("✅ Bot services closed")
            except Exception as exc:
                logger.exception("Error closing bot services: %s", exc)
                
        if bot_task and not bot_task.done():
            bot_task.cancel()
            try:
                await bot_task
            except asyncio.CancelledError:
                logger.info("✅ Bot task cancelled")
            except Exception as exc:
                logger.exception("Error cancelling bot task: %s", exc)


app = FastAPI(lifespan=lifespan)

try:
    settings = get_settings()
    app.add_middleware(
        DiscordSignatureMiddleware, public_key=require(settings.discord_public_key, "DISCORD_PUBLIC_KEY")
    )
except Exception as exc:
    logger.warning("⚠️  Discord signature middleware not configured: %s", exc)
    logger.warning("⚠️  Proceeding without signature verification")

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
