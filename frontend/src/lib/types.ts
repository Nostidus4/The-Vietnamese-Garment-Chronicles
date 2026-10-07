export type CompassState = "fit" | "adapted" | "review" | "distorted";

export type Vibe = "traditional" | "minimal" | "modern" | "festival";

export interface Selection {
  garment_id: string;
  occasion_id: string;
  vibe: Vibe;
  colors: string[];
  accessories: string[];
  modifications: { zone: string; change: string }[];
}

export interface Trigger {
  type: string;
  state: CompassState;
  target: string;
  target_name: string;
  ti: string;
  teo: string;
  why: string;
  sources: string[];
}

export interface CompassResult {
  state: CompassState;
  label: string | null;
  triggers: Trigger[];
  harmony_notes: string[];
  alternative: Selection | null;
  alternative_state: CompassState | null;
}

export interface Fact {
  text: string;
  sources: string[];
}

export type ZoneLevel = "keep" | "caution" | "free";

export interface ZoneOption {
  id: string; // "giu-nguyen" first: the garment as it is
  label: string;
  prompt: string | null;
  sources: string[];
}

export interface Zone {
  part: string;
  level: ZoneLevel;
  note: string | null; // for keep zones: why it is locked
  control: "colors" | null; // changed with another control, so no options
  options: ZoneOption[]; // caution/free only
}

export interface Garment {
  id: string;
  region: string;
  origin?: string | null; // instead of the region's name, for a garment of the whole country (áo dài: "Cả nước")
  name_vi: string;
  name_en: string;
  group: string;
  period: string;
  summary: string;
  facts: Fact[];
  occasions: string[];
  zones: Zone[];
  colors: string[];
  default_colors: string[];
  accessories: string[];
  hot_weather_tip: string | null;
  reference_image: string | null; // under content/media; the site shows its copy at /garments/<id>.webp
  wearing_steps: { title: string; detail: string; image: string | null }[];
  ask_suggest: string[]; // Hỏi Tèo's chips: questions the data answers
  sources: string[];
  verified: boolean;
}

export interface Region {
  id: string;
  name: string;
  status: "open" | "locked";
  lock_note: string | null;
  garments: string[];
  map_note: { title: string; lines: string[] };
  stamp_image: string | null;
  intro: { verse: string[]; verse_by: string | null; line: string } | null;
  chapters: { province: string; status: "open" | "draft" | "waiting"; title: string | null }[];
  journey: Journey | null;
}

// ---- Part 2: Bà's diary of a region (young Bà's entries, old Bà's margin notes, Tèo's sticky notes, Tí's pencil) ----
export interface Frame {
  image: string | null;
  caption: string;
  alt: string;
  no_people: boolean;
}
export interface TeoNote {
  text: string;
  unesco: number | null;
  sources: string[];
  verified: boolean;
}
export type Keepsake = "stamp" | "photo" | "leaf" | "recipe" | "ticket" | "fabric";
export interface DiaryPage {
  date: string;
  entry: string;
  margin: string | null;
  ti: string | null;
  teo: TeoNote[];
  keepsake: Keepsake | null;
}
/** A real, credited photo on Tí's "Hôm nay" page (never AI). */
/** who took a real photo and under which open licence */
export interface Credit {
  credit: string;
  license: string;
  source_url: string;
}
export interface Photo extends Credit {
  image: string;
  alt: string;
}
/** a "Việt hay không?" question: photo is null for an AI illustration */
export interface QuizItem {
  id: string;
  image: string;
  photo: Credit | null;
}
export interface Festival {
  id: string;
  name: string;
  time: string;
  month: number | null;
  place: string;
  text: string;
  review: string | null;
  photo: Photo | null;
  community_review: boolean;
}
export type GameKind = "dong-ho" | "quan-ho" | "ngu-than" | "mam-com" | "cay-beo" | "xep-do" | "khuy-bac" | "xoe" | "cong-chieng" | "det";
export interface GameRound {
  label: string | null;
  item: string | null;
  prompt: string | null;
  choices: string[];
  answer: number | null;
  explain: string | null;
}
/** A small game on a stop's right page; winning it reveals Tí's "Hôm nay". */
export interface Game {
  kind: GameKind;
  title: string;
  intro: string;
  rounds: GameRound[];
  done: string;
  teo: TeoNote | null;
  community_review: boolean;
}
export type TimeOfDay = "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night";
/** One stop of a chapter walked like a trip: Bà's page on the left, Tí's "Hôm nay" on the right. */
export interface Stop extends DiaryPage {
  id: string;
  place: string;
  time: TimeOfDay;
  point: { lat: number; lon: number } | null;
  frame: Frame | null;
  today: { title: string; text: string; tips: string[]; photo: Photo | null } | null;
  items: { id: string; kind: "custom" | "dish"; title: string; text: string; community_review: boolean }[];
  festivals: Festival[];
  hat: { line: string; hat: string | null; hidden: string | null } | null;
  game: Game | null;
  stamp: string | null;
  community_review: boolean;
}
export interface GlossaryTerm {
  id: string;
  term: string;
  text: string;
  sources: string[];
  verified: boolean;
}
export interface Journey {
  hover_line: string;
  chapter: { province: string; title: string; verse: string[]; verse_by: string; line: string } | null;
  arrive: (DiaryPage & { landmarks: { name: string; lon: number; lat: number; note: string }[] }) | null;
  look: (DiaryPage & { frames: Frame[] }) | null;
  stops: Stop[];
  letter: { text: string; image: string | null; signed?: string | null } | null;
  community_review: boolean;
  life: (DiaryPage & { items: { id: string; kind: "custom" | "dish"; title: string; text: string; community_review: boolean }[] }) | null;
  festivals:
    | (DiaryPage & {
        festivals: Festival[];
        bridge: string;
      })
    | null;
  wear: (DiaryPage & { garment: string })[];
  own: { invite: string };
  check: RegionCheck | null;
}

// "Bà hỏi con" (#23): one question before reading a region, three after. choices[answer] is right; shuffle to show.
export interface CheckQuestion {
  id: string;
  q: string;
  choices: string[];
  answer: number;
  explain: string;
  sources: string[];
  verified: boolean;
}
export interface RegionCheck {
  pre: CheckQuestion;
  post: CheckQuestion[];
}

export interface Camera {
  s: number;
  x: number;
  y: number;
  mode: "anchor" | "center";
  ms: number;
  ease: "linear" | "inOut" | "out" | "in";
}

export type EffectType =
  | "spotlight" | "desaturate" | "vignette" | "glow" | "glow-ring" | "light-sweep" | "dust"
  | "light-shaft" | "thread" | "particles" | "bookmark" | "shake" | "sweat" | "label";

export interface Effect {
  type: EffectType;
  x: number;
  y: number;
  r: number;
  ms: number;
  strength: number;
  text: string | null;
  rotate: number;
  at: number;
}

export interface Beat {
  kind: "narration" | "speech" | "title" | "question" | "finale";
  style: "box" | "memory" | "hand" | "hand-large" | "hand-light-large" | "title" | "finale" | "finale-large" | "caption";
  speaker: string | null;
  text: string;
  x: number;
  y: number;
  w: number;
  space: "image" | "screen";
  tail: "none" | "down" | "down-left" | "down-right" | "up" | "left" | "right";
  rotate: number;
  join: boolean;
  inline: boolean;
  clear: boolean;
  delay: number;
  wait_click: boolean;
  type_ms: number;
  camera: Camera | null;
  effects: Effect[];
  voice?: "narrator" | "co-giao" | "ti" | "teo" | "ti-nho" | "ba" | null; // who reads it (Gemini TTS)
  delivery?: string | null;
  say?: string | null;
}

export interface Transition {
  type: "crossfade" | "zoom-through" | "iris" | "gold-wash" | "cloth" | "paper" | "cover-open" | "fall" | "flash";
  ms: number;
  x: number;
  y: number;
  to_x: number;
  to_y: number;
  s: number;
  mode: "anchor" | "center";
  to_s: number;
}

export interface OpeningScreen {
  id: string;
  title: string;
  image: string;
  mood: "present" | "memory";
  focal: { x: number; y: number };
  camera_start: Camera;
  camera: Camera | null;
  skippable: boolean;
  hide_progress: boolean;
  auto_exit_ms: number | null;
  beats: Beat[];
  effects: Effect[];
  exit: Transition;
  sfx: string[];
}

export interface Bootstrap {
  regions: Region[];
  garments: Garment[];
  occasions: { id: string; name: string }[];
  colors: Record<string, { id: string; name: string; hex: string; restricted: boolean }>;
  accessories: Record<string, { id: string; name_vi: string; kind: string; description?: string | null; occasions?: string[] | null; message?: { ti: string; teo: string; why: string } | null; alternative?: string | null; verified?: boolean }>;
  sources: Record<string, { id: string; title: string; url: string | null; verified?: boolean }>;
  opening: OpeningScreen[];
  glossary: Record<string, GlossaryTerm>;
  /** Bà's wardrobe for the dress-up room (backend/content/wardrobe.json) */
  wardrobe?: WardrobeItem[];
  /** the Compass rules, so the browser can judge a look (lib/compass.ts) */
  rules?: { type: string; state: CompassState; ti: string; teo: string; why: string; sources: string[] }[];
}

export type WardrobeSlot = "set" | "head" | "face" | "neck" | "chest" | "waist" | "hand" | "feet";
export interface WardrobeItem {
  id: string;
  slot: WardrobeSlot;
  garment: string | null;
  accessory: string | null;
  bodies: ("nu" | "nam")[];
  art: string;
  layers: Record<string, string>;
}

/** Why the try-on sent only its sample picture (backend tryon.fallback_reason, #52). */
export type FallbackReason = "no_person" | "busy" | "timeout" | "blocked" | "unavailable";

export interface TryOnResult {
  compass: CompassResult;
  rendered_alternative: boolean;
  rendered_selection: Selection;
  image_base64: string | null;
  fallback_url: string | null;
  fallback_reason?: FallbackReason | null; // absent from a server older than #52
  cached: boolean;
  label_note: string;
}

export interface DuKyEntry {
  id: string;
  kind: "ai" | "real";
  image: string; // data URL or absolute URL
  garment_id: string;
  occasion_id: string;
  label: string | null;
  sample?: boolean; // a pre-made fallback image (the AI server was busy), never shown as a fresh AI render
  created_at: string;
}

export interface Shop {
  id: string;
  name: string;
  city: string;
  address: string | null;
  url: string | null;
  phone: string | null;
  services: ("rent" | "tailor" | "buy")[];
  garments: string[];
  authenticity: "authentic" | "adapted" | "inspired" | "unknown";
  note: string | null;
  verified: boolean;
}
