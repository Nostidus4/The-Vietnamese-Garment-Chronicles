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


class Camera(Strict):
    """s = zoom; (x, y) = point on the image in %. anchor keeps that point still while zooming,
    center brings it to the middle of the screen."""

    s: float = Field(1.0, ge=1.0, le=4.0)
    x: float = Field(50, ge=0, le=100)
    y: float = Field(50, ge=0, le=100)
    mode: Literal["anchor", "center"] = "anchor"
    ms: int = Field(0, ge=0, description="Duration of the move; 0 = jump")
    ease: Literal["linear", "inOut", "out", "in"] = "inOut"


EffectType = Literal[
    "spotlight", "desaturate", "vignette", "glow", "glow-ring", "light-sweep", "dust",
    "light-shaft", "thread", "particles", "bookmark", "shake", "sweat", "label",
]


class Effect(Strict):
    type: EffectType
    x: float = 50
    y: float = 50
    r: float = Field(12, description="Radius or size in % of image width")
    ms: int = 700
    strength: float = Field(0.5, ge=0, le=1)
    text: str | None = None
    rotate: float = 0
    at: int = Field(0, ge=0, description="Start this many ms after the beat/screen appears")


BeatKind = Literal["narration", "speech", "title", "question", "finale"]
BeatStyle = Literal["box", "memory", "hand", "hand-large", "title", "finale", "finale-large", "caption"]


class Beat(Strict):
    kind: BeatKind = "narration"
    style: BeatStyle = "box"
    speaker: str | None = None
    text: str = ""
    x: float = Field(4, ge=-10, le=100, description="% of image (or screen when space=screen)")
    y: float = Field(5, ge=-10, le=100)
    w: float = Field(32, gt=0, le=100, description="Box width in %")
    space: Literal["image", "screen"] = "image"
    tail: Literal["none", "down", "down-left", "down-right", "up", "left", "right"] = "none"
    rotate: float = 0
    join: bool = Field(False, description="New line inside the previous box/bubble")
    inline: bool = Field(False, description="Continue on the same line of the previous box")
    clear: bool = Field(False, description="Remove earlier text of this screen first")
    delay: int = Field(700, ge=0, description="ms after the previous beat (ignored when wait_click)")
    wait_click: bool = False
    type_ms: int = Field(0, ge=0, description="Per-character reveal; 0 = fade the whole line")
    camera: Camera | None = None
    effects: list[Effect] = []


TransitionType = Literal[
    "crossfade", "zoom-through", "iris", "gold-wash", "cloth", "paper", "cover-open", "fall", "flash",
]


class Transition(Strict):
    type: TransitionType = "crossfade"
    ms: int = 900
    x: float = 50
    y: float = 50
    to_x: float = 50
    to_y: float = 50
    s: float = 1.2
    mode: Literal["anchor", "center"] = "anchor"
    to_s: float = 1.06


class OpeningScreen(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    title: str
    image: str = Field(description="Path under frontend/public, e.g. /opening/s01.png")
    mood: Literal["present", "memory"] = "present"
    focal: dict[str, float] = Field(default_factory=lambda: {"x": 50, "y": 50})
    camera_start: Camera = Camera()
    camera: Camera | None = Field(None, description="Automatic move when the screen enters")
    skippable: bool = True
    hide_progress: bool = False
    auto_exit_ms: int | None = Field(None, description="Leave by itself this long after the last beat")
    beats: list[Beat] = []
    effects: list[Effect] = Field(default_factory=list, description="Ambient effects for the whole screen")
    exit: Transition = Transition()
    sfx: list[str] = []
