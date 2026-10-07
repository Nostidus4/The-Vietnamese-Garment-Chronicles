import { describe, expect, it } from "vitest";
import { boxOf, currentLayer, DRAW_ORDER, LAYERS, PANELS, placesAt, tryPlace } from "./nguThan";

describe("the layers of the robe (#108)", () => {
  it("cover the five panels once each", () => {
    expect(LAYERS.flat().sort()).toEqual(Object.keys(PANELS).sort());
  });
  it("open one at a time, from the inside out", () => {
    expect(currentLayer([])).toBe(0);
    expect(currentLayer(["back-left"])).toBe(0);
    expect(currentLayer(["back-left", "back-right"])).toBe(1);
    expect(currentLayer(["back-left", "back-right", "inner"])).toBe(2);
    expect(currentLayer(Object.keys(PANELS))).toBe(LAYERS.length);
  });
});

describe("tryPlace (#108)", () => {
  it("puts a panel of the open layer where it belongs", () => {
    expect(tryPlace([], "back-right", placesAt(70, 60))).toEqual({ ok: true });
  });
  it("says a panel of an outer layer comes later, wherever it is put", () => {
    expect(tryPlace([], "front-right", placesAt(60, 60))).toEqual({ ok: false, why: "later" });
    expect(tryPlace(["back-left", "back-right"], "front-left", placesAt(36, 60))).toEqual({ ok: false, why: "later" });
  });
  it("says when the place is wrong", () => {
    expect(tryPlace([], "back-left", placesAt(70, 60))).toEqual({ ok: false, why: "elsewhere" });
  });
  it("lets the inner panel in once the back is done: no other panel covers it yet", () => {
    expect(tryPlace(["back-left", "back-right"], "inner", placesAt(57, 60))).toEqual({ ok: true });
  });
  it("can be won in any order the layers allow", () => {
    const orders = [
      ["back-right", "back-left", "inner", "front-right", "front-left"],
      ["back-left", "back-right", "inner", "front-left", "front-right"],
    ];
    const centre = (slot: string) => {
      const [x, y, w, h] = boxOf(slot);
      for (let dy = 0.5; dy < 1; dy += 0.05) for (let dx = 0.2; dx < 0.8; dx += 0.05) if (placesAt(x + w * dx, y + h * dy).includes(slot)) return placesAt(x + w * dx, y + h * dy);
      return [];
    };
    for (const order of orders) {
      const placed: string[] = [];
      for (const slot of order) {
        expect(tryPlace(placed, slot, centre(slot)), slot).toEqual({ ok: true });
        placed.push(slot);
      }
      expect(currentLayer(placed)).toBe(LAYERS.length);
    }
  });
});

describe("drawing (#108)", () => {
  it("goes back to front, the right front panel last", () => {
    expect(DRAW_ORDER.at(-1)).toBe("front-right");
    expect(DRAW_ORDER.indexOf("inner")).toBeLessThan(DRAW_ORDER.indexOf("front-left"));
  });
  it("has a box for every panel's thumbnail", () => {
    for (const slot of Object.keys(PANELS)) expect(boxOf(slot)[2]).toBeGreaterThan(5);
  });
});
