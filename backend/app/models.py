from typing import Literal

from pydantic import BaseModel, Field

State = Literal["fit", "adapted", "review", "distorted"]

# Severity order: the heaviest triggered state wins
SEVERITY: dict[str, int] = {"fit": 0, "adapted": 1, "review": 2, "distorted": 3}

LABELS: dict[str, str | None] = {
    "fit": "Authentic",
    "adapted": "Adapted",
    "review": "Inspired",
    "distorted": None,  # never enters Du Ký
}


class Modification(BaseModel):
    zone: str
    change: str


class Selection(BaseModel):
    garment_id: str
    occasion_id: str
    vibe: Literal["traditional", "minimal", "modern", "festival"] = "traditional"
    colors: list[str] = Field(default_factory=list)
    accessories: list[str] = Field(default_factory=list)
    modifications: list[Modification] = Field(default_factory=list)


class Trigger(BaseModel):
    rule_id: str
    type: str
    state: State
    target: str  # accessory id, zone name or color id that triggered it
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


class AskRequest(BaseModel):
    garment_id: str
    question: str
