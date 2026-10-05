import { describe, expect, it } from "vitest";
import { compassContent, evaluate, SelectionError } from "./compass";
import fixtures from "./compass.fixtures.json";

// Looks judged by the Python Compass (backend/scripts/compass_fixtures.py); the browser one must say the same.
const content = compassContent(fixtures.content as Parameters<typeof compassContent>[0]);

describe("browser Compass = Python Compass", () => {
  it("has cases in every state", () => {
    const states = new Set(fixtures.cases.map((c) => c.result.state));
    expect([...states].sort()).toEqual(["adapted", "distorted", "fit", "review"]);
  });

  for (const [i, c] of fixtures.cases.entries()) {
    const s = c.selection;
    it(`#${i} ${s.garment_id} · ${s.occasion_id} · ${[...s.accessories, ...s.colors, ...s.modifications.map((m) => m.change)].join(", ") || "nguyên bộ"}`, () => {
      expect(evaluate(content, s as Parameters<typeof evaluate>[1])).toEqual(c.result);
    });
  }

  it("refuses an accessory the garment does not offer", () => {
    const g = Object.values(content.garments)[0];
    expect(() => evaluate(content, { garment_id: g.id, occasion_id: g.occasions[0], vibe: "traditional", colors: [], accessories: ["khong-co"], modifications: [] })).toThrow(SelectionError);
  });
});
