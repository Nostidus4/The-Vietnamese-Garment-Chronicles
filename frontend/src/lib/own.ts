import { loadDuKy } from "./duky";
import type { DuKyEntry } from "./types";

// "Trang của con": the blank page Bà left at the end of each region. Stored only on this device.
const KEY = "vpdk-own-pages";

export interface OwnPage {
  text: string;
  sample: string | null; // garment id of the sample figure, when the reader chose not to use a photo
}

function all(): Record<string, OwnPage> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function loadOwn(regionId: string): OwnPage | null {
  return all()[regionId] ?? null;
}

export function saveOwn(regionId: string, page: OwnPage) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...all(), [regionId]: page }));
  } catch {
    // private mode: kept for this visit only
  }
}

/** The newest try-on photo of one of the region's garments, pasted onto its page automatically. */
export function latestPhoto(garmentIds: string[]): DuKyEntry | null {
  return loadDuKy().find((e) => garmentIds.includes(e.garment_id)) ?? null;
}
