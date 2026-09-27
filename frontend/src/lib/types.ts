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
  rule_id: string;
  type: string;
  state: CompassState;
  target: string;
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
}

export interface Garment {
  id: string;
  chapter: string;
  name_vi: string;
  name_en: string;
  period: string;
  story: string[];
  occasions: string[];
  zones: { part: string; level: "keep" | "caution" | "free" }[];
  default_colors: string[];
  colors: string[];
  accessories: string[];
  sources: string[];
}

export interface GarmentsDoc {
  garments: Garment[];
  colors: Record<string, { name: string; hex: string }>;
  accessories: Record<string, { name: string; kind: string }>;
}

export interface OccasionsDoc {
  occasions: { id: string; name: string }[];
  regions: { id: string; name: string; status: "open" | "locked"; note?: string; garments: string[] }[];
}

export interface TryOnResult {
  compass: CompassResult;
  rendered_alternative: boolean;
  image_base64: string | null;
  fallback_url: string | null;
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
