import type { DuKyEntry } from "./types";

const KEY = "du-ky-cua-toi";

export function loadDuKy(): DuKyEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as DuKyEntry[];
  } catch {
    return [];
  }
}

export function saveToDuKy(entry: Omit<DuKyEntry, "id" | "created_at">): DuKyEntry {
  const full: DuKyEntry = { ...entry, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify([full, ...loadDuKy()]));
  } catch {
    // Storage full or blocked: the entry still shows for this session
  }
  return full;
}
