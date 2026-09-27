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

export interface Garment {
  id: string;
  region: string;
  name_vi: string;
  name_en: string;
  group: string;
  period: string;
  summary: string;
  facts: Fact[];
  occasions: string[];
  zones: { part: string; level: "keep" | "caution" | "free"; note: string | null }[];
  colors: string[];
  default_colors: string[];
  accessories: string[];
  hot_weather_tip: string | null;
  wearing_steps: { title: string; detail: string; image: string | null }[];
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
}

export interface Bubble {
  speaker: string;
  text: string;
  x: number;
  y: number;
}

export interface ComicPage {
  n: number;
  priority: "P0" | "P1";
  image: string;
  scene: string;
  bubbles: Bubble[];
}

export interface Bootstrap {
  regions: Region[];
  garments: Garment[];
  occasions: { id: string; name: string }[];
  colors: Record<string, { id: string; name: string; hex: string; restricted: boolean }>;
  accessories: Record<string, { id: string; name_vi: string; kind: string }>;
  sources: Record<string, { id: string; title: string; url: string | null }>;
  comic: ComicPage[];
}

export interface TryOnResult {
  compass: CompassResult;
  rendered_alternative: boolean;
  rendered_selection: Selection;
  image_base64: string | null;
  fallback_url: string | null;
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
  created_at: string;
}
