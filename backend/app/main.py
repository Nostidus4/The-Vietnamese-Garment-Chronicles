from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .content import store
from .routers import admin, content, events, extras, styling
from .services.gemini_client import get_client


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
)
app.mount("/media", StaticFiles(directory=store.CONTENT_DIR / "media"), name="media")

for r in (content.router, styling.router, extras.router, admin.router, events.router):
    app.include_router(r)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"ok": True, "gemini": get_client().available, "content_warnings": len(store.report().warnings)}
