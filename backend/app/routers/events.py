"""POST /events: anonymous usage events (see services/events.py for what is and is not collected)."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import TypeAdapter, ValidationError

from ..services import events, ratelimit

router = APIRouter(tags=["events"])
_event = TypeAdapter(events.Event)
MAX_BYTES = 2048  # one event is ~200 bytes; anything bigger is not ours
PER_MINUTE = 120  # per browser session


@router.post("/events", status_code=202)
async def post_event(request: Request) -> dict:
    body = await request.body()
    if len(body) > MAX_BYTES:
        raise HTTPException(413, "Sự kiện quá lớn")
    try:
        e = _event.validate_json(body)
    except ValidationError as err:
        raise HTTPException(422, err.errors(include_url=False, include_context=False)) from None
    if not ratelimit.allow(f"events:{e.session_id}", PER_MINUTE):
        raise HTTPException(429, "Quá nhiều sự kiện")
    return {"stored": events.store(e)}
