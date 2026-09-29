"""Anonymous usage events for the Impact numbers (occasion adoption, quiz before/after, looks fixed).

Privacy by construction: every event type has a fixed payload made of ids, states and booleans only, so there is
no field where a name, an email, a photo or free text could land. The session id is a random UUID made in the
browser. IP addresses are never read.

Storage must survive redeploys (Render's disk is wiped), so events go to Supabase (table `events`, see
backend/supabase/events.sql) with the service key. Without Supabase settings (local dev) they are appended to
backend/data/events.jsonl, which is git-ignored.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Literal, Union
from uuid import UUID

import httpx
from pydantic import BaseModel, ConfigDict, Field

from ..content.schemas import ID_PATTERN, State

Slug = Annotated[str, Field(pattern=ID_PATTERN, max_length=60)]
LOCAL = Path(__file__).resolve().parents[2] / "data" / "events.jsonl"


class _P(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class CompassPayload(_P):
    state: State
    garment_id: Slug
    occasion_id: Slug


class LookFixedPayload(_P):
    from_state: Literal["review", "distorted"]
    to_state: Literal["fit", "adapted"]
    garment_id: Slug


class OccasionPayload(_P):
    garment_id: Slug
    occasion_id: Slug
    fits: bool  # no "occasion" rule fired for this garment and occasion


class QuizPayload(_P):
    phase: Literal["pre", "post"]
    item_id: Slug
    correct: bool
    region_id: Slug


class TryOnPayload(_P):
    garment_id: Slug
    alternative: bool
    sample: bool


class DuKyPayload(_P):
    kind: Literal["ai", "real"]
    garment_id: Slug


class _E(BaseModel):
    model_config = ConfigDict(extra="forbid")
    session_id: UUID
    ts: datetime


class CompassEvent(_E):
    type: Literal["compass_result"]
    payload: CompassPayload


class LookFixedEvent(_E):
    type: Literal["look_fixed"]
    payload: LookFixedPayload


class OccasionEvent(_E):
    type: Literal["occasion_selected"]
    payload: OccasionPayload


class QuizEvent(_E):
    type: Literal["quiz_answer"]
    payload: QuizPayload


class TryOnEvent(_E):
    type: Literal["tryon"]
    payload: TryOnPayload


class DuKyEvent(_E):
    type: Literal["duky_save"]
    payload: DuKyPayload


Event = Annotated[
    Union[CompassEvent, LookFixedEvent, OccasionEvent, QuizEvent, TryOnEvent, DuKyEvent],
    Field(discriminator="type"),
]
TYPES = ["compass_result", "look_fixed", "occasion_selected", "quiz_answer", "tryon", "duky_save"]


def _supabase() -> tuple[str, str] | None:
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    return (url.rstrip("/"), key) if url and key else None


def row(e: _E) -> dict:
    return {
        "session_id": str(e.session_id),
        "type": e.type,  # type: ignore[attr-defined]
        "payload": e.payload.model_dump(),  # type: ignore[attr-defined]
        "ts": e.ts.astimezone(timezone.utc).isoformat(),
    }


def store(e: _E) -> str:
    """Save one event; returns where it went. Never raises: analytics must not break the app."""
    r = row(e)
    sb = _supabase()
    if sb:
        url, key = sb
        try:
            res = httpx.post(
                f"{url}/rest/v1/events",
                json=r,
                headers={"apikey": key, "Authorization": f"Bearer {key}", "Prefer": "return=minimal"},
                timeout=5,
            )
            res.raise_for_status()
            return "supabase"
        except httpx.HTTPError as err:
            print(f"[events] supabase insert failed: {err}")
            return "failed"
    LOCAL.parent.mkdir(parents=True, exist_ok=True)
    with LOCAL.open("a") as f:
        f.write(json.dumps({**r, "received_at": datetime.now(timezone.utc).isoformat()}) + "\n")
    return "local"


def load_all() -> list[dict]:
    """Every stored event (Supabase if configured, else the local file), oldest first."""
    sb = _supabase()
    if sb:
        url, key = sb
        out: list[dict] = []
        step = 1000
        while True:
            res = httpx.get(
                f"{url}/rest/v1/events",
                params={"select": "session_id,type,payload,ts", "order": "id.asc", "offset": len(out), "limit": step},
                headers={"apikey": key, "Authorization": f"Bearer {key}"},
                timeout=30,
            )
            res.raise_for_status()
            batch = res.json()
            out += batch
            if len(batch) < step:
                return out
    if not LOCAL.is_file():
        return []
    return [json.loads(line) for line in LOCAL.read_text().splitlines() if line.strip()]
