"""Request/response shapes of the API (content file shapes live in app/content/schemas.py)."""

from typing import Literal

from pydantic import BaseModel, Field

from .content.schemas import QuizAnswer, State

SEVERITY: dict[str, int] = {"fit": 0, "adapted": 1, "review": 2, "distorted": 3}
FallbackReason = Literal["no_person", "busy", "timeout", "blocked", "unavailable"]
LABELS: dict[str, str | None] = {"fit": "Authentic", "adapted": "Adapted", "review": "Inspired", "distorted": None}


class Modification(BaseModel):
    zone: str
    change: str = ""


class Selection(BaseModel):
    garment_id: str
    occasion_id: str
    vibe: Literal["traditional", "minimal", "modern", "festival"] = "traditional"
    colors: list[str] = Field(default_factory=list, max_length=2)
    accessories: list[str] = Field(default_factory=list, max_length=6)
    modifications: list[Modification] = Field(default_factory=list)


class Trigger(BaseModel):
    type: str
    state: State
    target: str
    target_name: str
    ti: str
    teo: str
    why: str
    sources: list[str]


class CompassResult(BaseModel):
    state: State
    label: str | None
    triggers: list[Trigger]
    harmony_notes: list[str]
    alternative: Selection | None = None
    alternative_state: State | None = None


class CompareRequest(BaseModel):
    selections: list[Selection] = Field(min_length=2, max_length=3)


class AskRequest(BaseModel):
    garment_id: str
    question: str = Field(min_length=2, max_length=300)


# Why Tèo did not answer: Gemini picks one of the first three; "unavailable" is ours (Gemini unreachable or out of shape)
ModelRefusal = Literal["off_topic", "no_source", "unsafe"]
AskRefusal = ModelRefusal | Literal["unavailable"]


class AskResponse(BaseModel):
    answer: str
    sources: list[str]
    grounded: bool
    reason: AskRefusal | None = Field(None, description="Why Tèo did not answer; none when grounded")


class QuizAnswerRequest(BaseModel):
    id: str
    answer: QuizAnswer


class TryOnResponse(BaseModel):
    compass: CompassResult
    rendered_alternative: bool
    rendered_selection: Selection
    image_base64: str | None
    fallback_url: str | None
    # why there is only the sample picture (#52): no one in the photo, AI busy or too slow, the picture refused, or no AI
    # to ask at all (no key, credits used up)
    fallback_reason: FallbackReason | None = None
    cached: bool
    label_note: str = "Tranh minh họa (AI) – cấu trúc chuẩn xem ở “Hiểu bộ áo”"
