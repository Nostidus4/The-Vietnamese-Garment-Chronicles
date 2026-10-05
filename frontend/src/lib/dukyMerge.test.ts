import { describe, expect, it } from "vitest";
import type { DuKyBook, DuKyPage } from "./dukyBook";
import { mergeBooks } from "./dukyMerge";

const page = (id: string, extra: Partial<DuKyPage> = {}): DuKyPage => ({
  id,
  status: "worn",
  region_id: "hue",
  garment_id: "ao-dai",
  occasion_id: "tet-chua",
  look: null,
  compass_label: null,
  compass_state: null,
  date: null,
  place: "",
  note: "",
  photos: [],
  share: null,
  created_at: "2026-10-01T00:00:00Z",
  worn_at: null,
  ...extra,
});
const book = (pages: DuKyPage[], name = ""): DuKyBook => ({ cover: { name, color: "#7a2e2e" }, pages });

describe("mergeBooks", () => {
  it("keeps the pages written on this device since the last upload", () => {
    const m = mergeBooks(book([page("a"), page("new")]), book([page("a"), page("old")]));
    expect(m.pages.map((p) => p.id).sort()).toEqual(["a", "new", "old"]);
  });
  it("keeps this device's words and the photos of both for a page in both", () => {
    const here = page("a", { note: "sửa ở máy này", photos: [{ id: "p1", kind: "real" }] as DuKyPage["photos"] });
    const there = page("a", { note: "cũ", photos: [{ id: "p2", kind: "card" }] as DuKyPage["photos"] });
    const m = mergeBooks(book([here]), book([there]));
    expect(m.pages[0].note).toBe("sửa ở máy này");
    expect(m.pages[0].photos.map((p) => p.id)).toEqual(["p1", "p2"]);
  });
  it("takes the cloud's cover name when this device has none", () => {
    expect(mergeBooks(book([]), book([], "Mai")).cover.name).toBe("Mai");
    expect(mergeBooks(book([], "Lan"), book([], "Mai")).cover.name).toBe("Lan");
  });
});
