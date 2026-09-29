"""F5 quiz, F7 shop directory, F4 weather."""

import random
from datetime import date as date_type

from fastapi import APIRouter, HTTPException, Query

from ..content import store
from ..models import QuizAnswerRequest
from ..services import weather

router = APIRouter(tags=["extras"])

ANSWER_NAMES = {"viet": "Việt phục", "hanfu": "Hanfu (Trung Quốc)", "hanbok": "Hanbok (Hàn Quốc)", "kimono": "Kimono (Nhật Bản)", "khac": "Khác"}


@router.get("/quiz")
def quiz(count: int = Query(5, ge=1, le=20)) -> dict:
    items = list(store.get().quiz.values())
    picked = random.sample(items, min(count, len(items)))
    return {
        "choices": ANSWER_NAMES,
        "items": [{"id": q.id, "image": f"/media/{q.image}"} for q in picked],  # answers stay on the server
    }


@router.post("/quiz/answer")
def quiz_answer(req: QuizAnswerRequest) -> dict:
    q = store.get().quiz.get(req.id)
    if q is None:
        raise HTTPException(404, f"Không có câu hỏi '{req.id}'")
    return {
        "correct": req.answer == q.answer,
        "answer": q.answer,
        "answer_name": ANSWER_NAMES[q.answer],
        "explanation": q.explanation,
        "garment_id": q.garment_id,
        "sources": q.sources,
    }


@router.get("/shops")
def shops(
    city: str | None = None,
    garment_id: str | None = None,
    service: str | None = Query(None, pattern="^(rent|tailor|buy)$"),
) -> list[dict]:
    out = []
    for s in store.get().shops.values():
        if city and s.city.lower() != city.lower():
            continue
        if garment_id and garment_id not in s.garments:
            continue
        if service and service not in s.services:
            continue
        out.append(s.model_dump(mode="json"))
    # Verified shops first
    return sorted(out, key=lambda s: not s["verified"])


@router.get("/weather/{region_id}")
def region_weather(region_id: str, date: date_type | None = None) -> dict:
    """Today's temperature, or with ?date=YYYY-MM-DD the forecast for that day (up to 16 days ahead)."""
    out = weather.forecast(region_id, date) if date else weather.for_region(region_id)
    if out is None:
        raise HTTPException(404, f"Không có vùng '{region_id}'")
    return out
