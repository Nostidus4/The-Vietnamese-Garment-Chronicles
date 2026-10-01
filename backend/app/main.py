import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .content import store
from .routers import admin, content, events, extras, share, styling
from .services.gemini_client import get_client

# Gemini latency and failures show up as "[gemini] image ok 8.2s" in the server log
logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    rep = store.reload()  # fails fast with a readable list if content is broken
    print(f"[content] loaded with {len(rep.warnings)} warnings (see GET /admin/content-report)")
    yield


app = FastAPI(
    title="Việt Phục Du Ký API",
    description="Cultural Compass, try-on (Nano Banana) và nội dung cho Việt Phục Du Ký.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],  # the try-on countdown after a 429
)
app.mount("/media", StaticFiles(directory=store.CONTENT_DIR / "media"), name="media")

for r in (content.router, styling.router, extras.router, admin.router, events.router, share.router):
    app.include_router(r)

if os.getenv("DEV_TOOLS") == "1":  # /voice-review tools; never enabled on the demo server
    from .routers import dev

    app.include_router(dev.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"ok": True, "gemini": get_client().available, "content_warnings": len(store.report().warnings)}
