"""Compass, compare (F1), try-on (Nano Banana) and Hỏi Tèo (F8)."""

import json

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError

from ..config import settings
from ..models import AskRequest, AskResponse, CompareRequest, CompassResult, Selection, TryOnResponse
from ..services import ask as ask_service
from ..services import compass, ratelimit, tryon
from ..services.compass import SelectionError

router = APIRouter(tags=["styling"])


@router.post("/compass", response_model=CompassResult)
def run_compass(sel: Selection) -> CompassResult:
    try:
        return compass.evaluate(sel)
    except SelectionError as e:
        raise HTTPException(422, str(e))


@router.post("/compass/compare", response_model=list[CompassResult])
def compare(req: CompareRequest) -> list[CompassResult]:
    try:
        return [compass.evaluate(s) for s in req.selections]
    except SelectionError as e:
        raise HTTPException(422, str(e))


@router.post("/tryon", response_model=TryOnResponse)
async def run_tryon(
    request: Request,
    selection: str = Form(..., description="Selection as JSON"),
    avatar_id: str = Form("default"),
    photo: UploadFile | None = File(None),
) -> TryOnResponse:
    try:
        sel = Selection.model_validate(json.loads(selection))
    except (json.JSONDecodeError, ValidationError) as e:
        raise HTTPException(422, f"selection không hợp lệ: {e}")

    client_id = request.client.host if request.client else "unknown"
    if not ratelimit.allow(client_id, settings.tryon_per_minute):
        wait = ratelimit.retry_after(client_id)
        raise HTTPException(429, "Bạn thử đồ nhanh quá, chờ một chút nhé.", headers={"Retry-After": str(wait)})

    person = None
    cache_key = None
    if photo is not None and photo.filename:
        if not (photo.content_type or "").startswith("image/"):
            raise HTTPException(415, "Chỉ nhận file ảnh")
        data = await photo.read(settings.max_upload_mb * 1024 * 1024 + 1)
        if len(data) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(413, f"Ảnh lớn hơn {settings.max_upload_mb} MB")
        person = (data, photo.content_type)  # held in memory for this request only
    else:
        person = tryon.avatar(avatar_id)
        cache_key = f"avatar:{avatar_id}"

    try:
        # Gemini is a blocking call of ~10 s; keep it off the event loop
        return await run_in_threadpool(tryon.run, sel, person, cache_key)
    except SelectionError as e:
        raise HTTPException(422, str(e))


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest) -> AskResponse:
    return ask_service.ask(req.garment_id, req.question)
