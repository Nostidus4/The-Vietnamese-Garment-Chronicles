"""Public links for single Du Ký pages (ticket #27).

Only what the reader chose to share, stripped of anything that points to them: no notebook name, no exact date
(month and year only), no place. The creator keeps a secret delete key; the server stores only its hash.

Storage: Supabase (table share_pages + public bucket du-ky-shares, see backend/supabase/share.sql) when
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set; otherwise backend/data/shares/<id>/ for local tries.
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Literal

import httpx
from pydantic import BaseModel, ConfigDict, Field

from ..content.schemas import ID_PATTERN

LOCAL = Path(__file__).resolve().parents[2] / "data" / "shares"
BUCKET = "du-ky-shares"
MAX_PHOTO_BYTES = 2_500_000
PHOTO_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

Slug = Annotated[str, Field(pattern=ID_PATTERN, max_length=60)]


class ShareMeta(BaseModel):
    """Everything a public page may show. Unknown fields are refused, so nothing else can slip in."""

    model_config = ConfigDict(extra="forbid")
    region_id: Slug
    garment_id: Slug
    occasion_id: Slug
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="YYYY-MM only, never the day")
    status: Literal["planned", "worn"]
    note: str = Field("", max_length=200)
    compass_label: Literal["Authentic", "Adapted", "Inspired"] | None = None
    photo_kinds: list[Literal["ai", "real"]] = Field(default_factory=list, max_length=3)
    photo_samples: list[bool] = Field(default_factory=list, max_length=3)


def _supabase() -> tuple[str, str] | None:
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    return (url.rstrip("/"), key) if url and key else None


def _hash(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def create(meta: ShareMeta, photos: list[tuple[bytes, str]]) -> tuple[str, str]:
    """Store a shared page; returns (public id, delete key)."""
    sid = secrets.token_urlsafe(9)
    delete_key = secrets.token_urlsafe(24)
    names = [f"{i}.{PHOTO_TYPES[t]}" for i, (_, t) in enumerate(photos)]
    row = {"id": sid, "delete_key_hash": _hash(delete_key), "meta": meta.model_dump(), "photos": names, "created_at": datetime.now(timezone.utc).isoformat()}
    sb = _supabase()
    if sb:
        url, key = sb
        h = {"apikey": key, "Authorization": f"Bearer {key}"}
        for name, (data, ctype) in zip(names, photos):
            httpx.post(f"{url}/storage/v1/object/{BUCKET}/{sid}/{name}", content=data, headers={**h, "Content-Type": ctype}, timeout=20).raise_for_status()
        httpx.post(f"{url}/rest/v1/share_pages", json=row, headers={**h, "Prefer": "return=minimal"}, timeout=10).raise_for_status()
        return sid, delete_key
    d = LOCAL / sid
    d.mkdir(parents=True)
    for name, (data, _) in zip(names, photos):
        (d / name).write_bytes(data)
    (d / "page.json").write_text(json.dumps(row, ensure_ascii=False))
    return sid, delete_key


def get(sid: str) -> dict | None:
    """The public page: meta and photo URLs (never the delete key hash)."""
    sb = _supabase()
    if sb:
        url, key = sb
        r = httpx.get(f"{url}/rest/v1/share_pages", params={"id": f"eq.{sid}", "select": "id,meta,photos,created_at"}, headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=10)
        r.raise_for_status()
        rows = r.json()
        if not rows:
            return None
        row = rows[0]
        row["photo_urls"] = [f"{url}/storage/v1/object/public/{BUCKET}/{sid}/{n}" for n in row["photos"]]
        return row
    f = LOCAL / sid / "page.json"
    if not f.is_file():
        return None
    row = json.loads(f.read_text())
    row.pop("delete_key_hash", None)
    row["photo_urls"] = [f"/share/{sid}/photo/{n}" for n in row["photos"]]
    return row


def local_photo(sid: str, name: str) -> Path | None:
    p = LOCAL / sid / name
    return p if p.is_file() and p.parent.parent == LOCAL and "/" not in name else None


def delete(sid: str, delete_key: str) -> bool:
    """Remove the page and its photos for good, if the key matches."""
    sb = _supabase()
    if sb:
        url, key = sb
        h = {"apikey": key, "Authorization": f"Bearer {key}"}
        r = httpx.get(f"{url}/rest/v1/share_pages", params={"id": f"eq.{sid}", "select": "delete_key_hash,photos"}, headers=h, timeout=10)
        r.raise_for_status()
        rows = r.json()
        if not rows or not secrets.compare_digest(rows[0]["delete_key_hash"], _hash(delete_key)):
            return False
        httpx.request("DELETE", f"{url}/storage/v1/object/{BUCKET}", json={"prefixes": [f"{sid}/{n}" for n in rows[0]["photos"]]}, headers=h, timeout=10)
        httpx.delete(f"{url}/rest/v1/share_pages", params={"id": f"eq.{sid}"}, headers=h, timeout=10).raise_for_status()
        return True
    f = LOCAL / sid / "page.json"
    if not f.is_file() or not secrets.compare_digest(json.loads(f.read_text())["delete_key_hash"], _hash(delete_key)):
        return False
    shutil.rmtree(LOCAL / sid)
    return True
