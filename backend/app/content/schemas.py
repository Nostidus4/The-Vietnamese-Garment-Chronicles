"""Shapes of every content file in backend/content.

`extra="forbid"` makes a typo in a field name a load error instead of silently ignored data.
Field descriptions double as the data-entry guide (see backend/docs/BACKEND.md).
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Id = str  # kebab-case, e.g. "ao-ngu-than"
ID_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Source(Strict):
    id: Id = Field(pattern=r"^[a-z0-9-]+$")
    title: str = Field(description="Shown to readers (Tèo's notes, Compass, Du Ký, exports): plain words, no team notes")
    url: str | None = None
    note: str | None = Field(None, description="For the team only, never shown")
    verified: bool = Field(True, description="False while the team still has to vet it: the app then does not cite it")


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
    why: str = Field(description="Shown under 'Vì sao?': a sentence a reader understands on its own")
    internal_ref: str | None = Field(None, description="Where the team's research says so (e.g. Research Mục 19.2); never shown")


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


KEEP_OPTION = "giu-nguyen"


class ZoneOption(Strict):
    """One change the viewer may pick for a zone. Only variants found in the sources, the careful way."""

    id: Id = Field(pattern=ID_PATTERN, description=f"'{KEEP_OPTION}' for the first one: the garment as it is")
    label: str = Field(max_length=40, description="Shown on the chip")
    prompt: str | None = Field(None, description="English, sent to Nano Banana; none for 'giu-nguyen'")
    sources: list[Id] = []


class Zone(Strict):
    part: str
    level: ZoneLevel
    note: str | None = Field(None, description="Why it is kept (shown next to 🔒) or what changing it means")
    control: Literal["colors"] | None = Field(None, description="Changed with another control (the colour picker), so no options")
    options: list[ZoneOption] = Field(default_factory=list, description="caution/free only: 2–4, the first is 'giu-nguyen'")


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
    ask_suggest: list[str] = Field(
        default_factory=list, description="Hỏi Tèo's suggestion chips: only questions the data answers (checked by scripts/probe_ask.py)"
    )
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


class Photo(Strict):
    """A real photo for Tí's "Hôm nay" page. Never AI-made, always credited (e.g. Wikimedia Commons, CC licence)."""

    image: str = Field(description="Path under frontend/public, e.g. /regions/hue/photos/ga-hue.jpg")
    alt: str
    credit: str = Field(description="Author as the licence asks to name them")
    license: str = Field(description="e.g. CC BY 4.0, CC BY-SA 2.0, Public domain")
    source_url: str


class Festival(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    time: str = Field(description="As people say it, e.g. 13 tháng Giêng âm lịch")
    month: int | None = Field(None, ge=1, le=12, description="For the calendar strip")
    place: str
    text: str = Field(max_length=350, description="In young Bà's voice")
    review: str | None = Field(None, max_length=300, description="Tí today: what it feels like to be there")
    photo: Photo | None = None
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


WardrobeSlot = Literal["set", "head", "face", "neck", "chest", "waist", "hand", "feet"]


class WardrobeItem(Strict):
    """One piece in Bà's wardrobe (the dress-up room). It points at a garment (slot "set") or an accessory; the
    Compass judges it through that garment / accessory, so the wardrobe adds no cultural rules of its own."""

    id: Id = Field(pattern=ID_PATTERN)
    slot: WardrobeSlot = Field(description="One piece per slot is worn at a time; 'set' is the garment itself")
    garment: Id | None = None
    accessory: Id | None = None
    bodies: list[Literal["nu", "nam"]] = Field(default_factory=lambda: ["nu"], description="Bodies this piece is drawn for")
    art: str = Field(description="Drawing key of the paper doll (frontend PaperDoll.tsx) until painted layers exist")
    layers: dict[str, str] = Field(default_factory=dict, description="Painted layer per body, under frontend/public, e.g. /wardrobe/nu/non-la.webp")


class GlossaryTerm(Strict):
    """Tèo's pop-up note for a hard word. Texts mark a word with [[shown words|term-id]]."""

    id: Id = Field(pattern=ID_PATTERN)
    term: str
    text: str = Field(max_length=240, description="One or two sentences, Tèo's voice")
    sources: list[Id] = []
    verified: bool = False


class Today(Strict):
    """Tí walks to the same place today with Bà's notebook: a short review, tips and a real photo."""

    title: str = Field(max_length=80)
    text: str = Field(max_length=420, description="Tí's voice ('mình'), how it feels to be there")
    tips: list[str] = Field(default_factory=list, max_length=3)
    photo: Photo | None = None


class HatReveal(Strict):
    """Nón bài thơ: hold the hat up to the sun and the hidden picture and line appear."""

    line: str = Field(max_length=120, description="The handwritten line hidden in the hat (shown by the web, not drawn)")
    hat: str | None = Field(None, description="Hat seen against the light, under frontend/public")
    hidden: str | None = Field(None, description="The hidden silhouette layer, under frontend/public")


GameKind = Literal["dong-ho", "quan-ho", "ngu-than", "cay-beo", "xep-do", "khuy-bac", "xoe", "cong-chieng", "det"]


class GameRound(Strict):
    """One step of a mini-game. Each kind reads the fields it needs (see frontend/src/components/book/games)."""

    label: str | None = Field(None, max_length=80, description="What the player sees: a colour, a boat, an item, a button")
    item: str | None = Field(None, max_length=80, description="Colour hex, the object hung on a boat, etc.")
    prompt: str | None = Field(None, max_length=200, description="A line sung, a question")
    choices: list[str] = Field(default_factory=list, max_length=4)
    answer: int | None = Field(None, ge=0, description="Index of the right choice, or 1/0 for keep/leave")
    explain: str | None = Field(None, max_length=240)


class Game(Strict):
    """A small game glued on a stop's right page. Winning it reveals Tí's "Hôm nay" page."""

    kind: GameKind
    title: str = Field(max_length=60)
    intro: str = Field(max_length=220)
    rounds: list[GameRound] = Field(default_factory=list, max_length=10)
    done: str = Field(max_length=220, description="Said when the player wins")
    teo: TeoNote | None = None
    community_review: bool = Field(False, description="Hidden (only in drafts) until the community has reviewed it")


TimeOfDay = Literal["dawn", "morning", "noon", "afternoon", "evening", "night"]


class Stop(DiaryPage):
    """One stop of a chapter walked like a trip: Bà's page (left) and Tí's "Hôm nay" (right)."""

    id: Id = Field(pattern=ID_PATTERN)
    place: str = Field(max_length=40, description="Short name on the route, e.g. Ga Huế")
    time: TimeOfDay = Field(description="Tints the page like the light of that hour")
    point: GeoPoint | None = Field(None, description="Where it is, for the dotted route on the map")
    frame: Frame | None = Field(None, description="Bà's memory, illustrated")
    today: Today | None = None
    items: list[LifeItem] = []
    festivals: list[Festival] = []
    hat: HatReveal | None = None
    game: Game | None = None
    stamp: str | None = Field(None, max_length=24, description="Name on this stop's own stamp, e.g. Ga Huế")
    community_review: bool = False


class ChapterIntro(Strict):
    """The title page of a province chapter."""

    province: str = Field(description="As on the map, e.g. Huế")
    title: str = Field(max_length=60)
    verse: list[str] = Field(min_length=1, max_length=4, description="Ca dao or a poem about the place, one line each")
    verse_by: str = Field(description="e.g. ca dao Huế")
    line: str = Field(max_length=200, description="Old Bà, to the reader")


class Letter(Strict):
    """The envelope glued at the end of a chapter: a postcard from Bà, which the reader can keep in their Du Ký."""

    text: str = Field(max_length=400)
    image: str | None = Field(None, description="Postcard picture under frontend/public")
    signed: str | None = Field(None, description="Who wrote it, when not Bà (e.g. 'Anh Y Blăk'); shown as '— <signed>'")


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
    """A chapter of Bà's diary. Old layout: arrive, look, life, festivals. Trip layout: chapter + stops + letter."""

    hover_line: str = Field(max_length=140, description="One line from the diary, shown when the region is hovered")
    chapter: ChapterIntro | None = None
    arrive: ArrivePage | None = None
    look: LookPage | None = None
    stops: list[Stop] = Field(default_factory=list, max_length=8)
    letter: Letter | None = None
    community_review: bool = Field(False, description="A draft written with a community: shown only in drafts until reviewed")
    life: LifePage | None = None
    festivals: FestivalPage | None = None
    wear: list[WearPage] = Field(default_factory=list, max_length=2)
    own: OwnPage
    check: RegionCheck | None = None
    sources: list[Id] = []

    @model_validator(mode="after")
    def one_layout(self) -> "Journey":
        if self.stops and not self.chapter:
            raise ValueError("a chapter with stops needs 'chapter' (its title page)")
        if not self.stops and not (self.arrive and self.look):
            raise ValueError("needs either 'stops' (trip layout) or both 'arrive' and 'look'")
        return self


class RegionIntro(Strict):
    """The page that opens a region: a verse everyone there knows, and Bà's line."""

    verse: list[str] = Field(default_factory=list, max_length=4)
    verse_by: str | None = None
    line: str = Field(max_length=200)


class ChapterRef(Strict):
    """One province in the region's table of contents; 'open' = its chapter is the region's journey."""

    province: str = Field(description="Exactly as on the map (vietnam-geo FOCUS), e.g. Huế")
    status: Literal["open", "draft", "waiting"] = Field("waiting", description="draft = being written with the community, shown only in drafts")
    title: str | None = None


class Region(Strict):
    id: Id = Field(pattern=ID_PATTERN)
    name: str
    status: Literal["open", "locked"]
    lock_note: str | None = None
    garments: list[Id] = []
    map_note: MapNote
    weather_point: GeoPoint | None = None
    stamp_image: str | None = None
    intro: RegionIntro | None = None
    chapters: list[ChapterRef] = []
    journey: Journey | None = Field(None, description="Filled from content/regions/<id>.json")


RuleType = Literal["fusion", "restricted", "core", "caution", "occasion", "flexible"]
# what was changed: a rule speaks of the thing the reader touched, not only of the kind of rule (#62)
ChangeKind = Literal["accessory", "color", "zone", "garment"]
# the blanks a rule's words may use, for each kind of change
BLANKS: dict[str, set[str]] = {"accessory": {"name"}, "color": {"name"}, "garment": {"name"}, "zone": {"name", "zone", "option"}}
State = Literal["fit", "adapted", "review", "distorted"]


class Rule(Strict):
    type: RuleType
    state: State
    ti: str
    teo: str
    why: str = Field(description="Shown under 'Vì sao?': a sentence a reader understands on its own")
    internal_ref: str | None = Field(None, description="Where the team's research says so (e.g. Research Mục 19.2); never shown")
    sources: list[Id] = []
    by: dict[ChangeKind, Message] = Field(
        default_factory=dict,
        description="Words for one kind of change, with blanks {name} (the thing), {zone} and {option} (a part of the garment)",
    )


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


VoiceId = Literal["narrator", "co-giao", "ti", "teo", "ti-nho", "ba"]


class VoiceCandidate(Strict):
    key: str
    voice_id: str
    sample: str | None = None


class Voice(Strict):
    """One character voice, designed from a description in Google AI Studio (Generate speech → voice design)."""

    id: VoiceId
    name: str
    voice_id: str | None = Field(None, description="The persistent voice_… ID from AI Studio; null until designed")
    fallback: str = Field(description="Prebuilt Gemini voice used when voice_id is empty, e.g. Charon")
    gender: Literal["male", "female"]
    rate: float = Field(gt=1, lt=7, description="Target speaking rate in syllables per second (the character's own pace)")
    base_style: str = Field(description="Who is speaking; sent with every line so the persona never drifts")
    design_prompt: str = Field(description="The description used for voice design")
    test_line: str = Field(description="A line to audition the voice with")
    candidates: list[VoiceCandidate] = Field(default_factory=list, description="Designed options; voice_id is the chosen one")
    same_as: VoiceId | None = Field(None, description="Speak with another character's chosen voice (Tí lúc bé uses Tí's)")


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
    # voice-over (Gemini TTS, pre-generated into frontend/public/opening/voice/<screen>-<nn>.mp3)
    voice: VoiceId | None = Field(None, description="Who reads this line; null = silent")
    delivery: str | None = Field(None, max_length=240, description="How to read it, sent to TTS as the style")
    say: str | None = Field(None, description="What is spoken when it differs from the text on screen")


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
    scene: str | None = Field(None, description="Where, who, mood: sent with every voice-over line of this screen")
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
