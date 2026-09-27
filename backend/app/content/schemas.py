"""Shapes of every content file in backend/content.

`extra="forbid"` makes a typo in a field name a load error instead of silently ignored data.
Field descriptions double as the data-entry guide (see docs/BACKEND.md).
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Id = str  # kebab-case, e.g. "ao-ngu-than"
ID_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Source(Strict):
    id: Id = Field(pattern=r"^[a-z0-9-]+$")
    title: str
    url: str | None = None
    note: str | None = None


class Color(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    hex: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    restricted: bool = False
    restricted_note: str | None = Field(None, description="Why this color is restricted, e.g. rank color of court dress")


class Message(Strict):
    """Pre-written lines shown by the Compass. Tí = fashion voice, Tèo = culture voice."""

    ti: str
    teo: str
    why: str


AccessoryKind = Literal["traditional-vn", "modern", "traditional-foreign", "restricted"]


class Accessory(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name_vi: str
    kind: AccessoryKind
    description: str | None = None
    occasions: list[Id] | None = Field(None, description="Only these occasions fit; omit = any occasion")
    message: Message | None = Field(None, description="Overrides the generic rule text for this accessory")
    alternative: Id | None = Field(None, description="Accessory suggested instead when this one is refused")
    image: str | None = None
    sources: list[Id] = []
    verified: bool = False


ZoneLevel = Literal["keep", "caution", "free"]


class Zone(Strict):
    part: str
    level: ZoneLevel
    note: str | None = None


class Fact(Strict):
    text: str
    sources: list[Id] = Field(min_length=1)


class WearingStep(Strict):
    title: str
    detail: str
    image: str | None = None


GarmentGroup = Literal["lich-su", "cung-dinh", "dan-gian", "dan-toc", "phuc-dung", "cach-tan"]


class Garment(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    region: Id
    name_vi: str
    name_en: str
    group: GarmentGroup
    period: str
    summary: str
    facts: list[Fact] = []
    occasions: list[Id] = Field(min_length=1)
    zones: list[Zone] = Field(min_length=1)
    colors: list[Id] = Field(min_length=1)
    default_colors: list[Id] = Field(min_length=1)
    accessories: list[Id] = []
    must_keep: list[str] = Field(min_length=1, description="English, sent to Nano Banana")
    must_avoid: list[str] = Field(default_factory=list, description="English, sent to Nano Banana")
    reference_image: str | None = Field(None, description="Path under content/media, e.g. ref/ao-dai.png")
    hot_weather_tip: str | None = None
    wearing_steps: list[WearingStep] = []
    sources: list[Id] = []
    verified: bool = False


class Occasion(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    background: str = Field(description="English scene description for the try-on background")


class MapNote(Strict):
    title: str
    lines: list[str]


class GeoPoint(Strict):
    lat: float
    lon: float


class Region(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    status: Literal["open", "locked"]
    lock_note: str | None = None
    garments: list[Id] = []
    map_note: MapNote
    weather_point: GeoPoint | None = None
    stamp_image: str | None = None


RuleType = Literal["fusion", "restricted", "core", "caution", "occasion", "flexible"]
State = Literal["fit", "adapted", "review", "distorted"]


class Rule(Strict):
    type: RuleType
    state: State
    ti: str
    teo: str
    why: str
    sources: list[Id] = []


QuizAnswer = Literal["viet", "hanfu", "hanbok", "kimono", "khac"]


class QuizItem(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    image: str
    answer: QuizAnswer
    garment_id: Id | None = None
    explanation: str
    sources: list[Id] = []
    verified: bool = False


class Shop(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    city: str
    address: str | None = None
    url: str | None = None
    phone: str | None = None
    services: list[Literal["rent", "tailor", "buy"]] = Field(min_length=1)
    garments: list[Id] = []
    authenticity: Literal["authentic", "adapted", "inspired", "unknown"] = "unknown"
    note: str | None = None
    verified: bool = False
    last_checked: date | None = None


class Bubble(Strict):
    speaker: str
    text: str
    x: float = Field(ge=0, le=100, description="% from left")
    y: float = Field(ge=0, le=100, description="% from top")


class ComicPage(Strict):
    n: int
    priority: Literal["P0", "P1"]
    image: str
    scene: str
    bubbles: list[Bubble] = []
