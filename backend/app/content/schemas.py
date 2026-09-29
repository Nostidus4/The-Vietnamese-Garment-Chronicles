"""Shapes of every content file in backend/content.

`extra="forbid"` makes a typo in a field name a load error instead of silently ignored data.
Field descriptions double as the data-entry guide (see backend/docs/BACKEND.md).
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


# ---- Part 2: Bà's diary of a region, one file per region in content/regions/ ----
# Three voices: young Bà writes the entries ("tôi", season and month only, never a year); old Bà adds margin notes
# for Tí ("Bà", "con"); Tèo sticks notes with the facts and their sources. Tí adds at most one pencil thought.


class Frame(Strict):
    """A keepsake picture tucked into the diary. The caption is HTML text, never drawn by the AI."""

    image: str | None = Field(None, description="Path under frontend/public, e.g. /regions/bac-bo/frame-1.png; null = pencil placeholder")
    caption: str
    alt: str
    no_people: bool = Field(False, description="Must be true for locked regions: landscapes only")
    prompt: str | None = Field(None, description="The image prompt used, kept as evidence for Form 7")


class TeoNote(Strict):
    """Tèo's sticky note: the only place where facts live. Hidden until verified unless ?draft=1."""

    text: str = Field(max_length=260)
    unesco: int | None = Field(None, description="Year of UNESCO inscription, only with a source")
    sources: list[Id] = []
    verified: bool = False


class Landmark(Strict):
    name: str
    lon: float
    lat: float
    note: str


Keepsake = Literal["stamp", "photo", "leaf", "recipe", "ticket", "fabric"]


class DiaryPage(Strict):
    """One diary page: young Bà's entry, an optional margin note from old Bà, Tèo's notes, Tí's pencil thought."""

    date: str = Field(description="Where and when, season/month only, e.g. 'Huế, một chiều mưa tháng Ba'")
    entry: str = Field(max_length=700, description="Young Bà, first person 'tôi'")
    margin: str | None = Field(None, max_length=200, description="Old Bà writing to Tí ('Bà', 'con')")
    ti: str | None = Field(None, max_length=120, description="Tí's pencil thought")
    teo: list[TeoNote] = Field(default_factory=list, max_length=3)
    keepsake: Keepsake | None = None


class LifeItem(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    kind: Literal["custom", "dish"]
    title: str
    text: str = Field(max_length=300, description="In young Bà's voice")
    community_review: bool = Field(False, description="About a community that must review it first; hidden until then")


class Festival(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    time: str = Field(description="As people say it, e.g. 13 tháng Giêng âm lịch")
    month: int | None = Field(None, ge=1, le=12, description="For the calendar strip")
    place: str
    text: str = Field(max_length=350, description="In young Bà's voice")
    community_review: bool = False


class ArrivePage(DiaryPage):
    landmarks: list[Landmark] = []


class LookPage(DiaryPage):
    frames: list[Frame] = Field(default_factory=list, max_length=3)


class LifePage(DiaryPage):
    items: list[LifeItem] = []


class FestivalPage(DiaryPage):
    festivals: list[Festival] = []
    bridge: str = Field(description="Bà's line that points to the clothes on the next page")


class WearPage(DiaryPage):
    garment: Id


class OwnPage(Strict):
    """The blank page Bà left at the end of the region."""

    invite: str = Field(description="Old Bà's line on the blank page, e.g. 'Trang này để con viết.'")


class CheckQuestion(Strict):
    """A question from Bà about what the reader just read (ticket #23). The page shuffles the choices."""

    id: Id = Field(pattern=ID_PATTERN)
    q: str = Field(max_length=200)
    choices: list[str] = Field(min_length=2, max_length=4)
    answer: int = Field(ge=0, description="Index of the right choice")
    explain: str = Field(max_length=300, description="Bà's reply once answered")
    sources: list[Id] = []
    verified: bool = False


class RegionCheck(Strict):
    pre: CheckQuestion = Field(description="One quick guess before reading the diary (measures 'before')")
    post: list[CheckQuestion] = Field(min_length=3, max_length=3, description="'Bà hỏi con': climate → garment, festival, what to keep")


class Journey(Strict):
    hover_line: str = Field(max_length=140, description="One line from the diary, shown when the region is hovered")
    arrive: ArrivePage
    look: LookPage
    life: LifePage | None = None
    festivals: FestivalPage | None = None
    wear: list[WearPage] = Field(default_factory=list, max_length=2)
    own: OwnPage
    check: RegionCheck | None = None
    sources: list[Id] = []


class Region(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    status: Literal["open", "locked"]
    lock_note: str | None = None
    garments: list[Id] = []
    map_note: MapNote
    weather_point: GeoPoint | None = None
    stamp_image: str | None = None
    journey: Journey | None = Field(None, description="Filled from content/regions/<id>.json")


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
BeatStyle = Literal["box", "memory", "hand", "hand-large", "hand-light-large", "title", "finale", "finale-large", "caption"]


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
