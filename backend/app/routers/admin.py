"""Content health for the team. Reload is disabled unless ADMIN_TOKEN is set."""

from fastapi import APIRouter, Header, HTTPException

from ..config import settings
from ..content import store
from ..content.store import ContentError

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/content-report")
def content_report() -> dict:
    c = store.get()
    rep = store.report().as_dict()
    rep["counts"] = {
        "sources": len(c.sources),
        "garments": len(c.garments),
        "garments_verified": sum(g.verified for g in c.garments.values()),
        "accessories": len(c.accessories),
        "quiz": len(c.quiz),
        "shops": len(c.shops),
        "opening_screens": len(c.opening),
    }
    return rep


@router.post("/reload")
def reload(x_admin_token: str | None = Header(None)) -> dict:
    if not settings.admin_token or x_admin_token != settings.admin_token:
        raise HTTPException(403, "Reload disabled or wrong token")
    try:
        return store.reload().as_dict()
    except ContentError as e:
        raise HTTPException(422, e.report.as_dict())
