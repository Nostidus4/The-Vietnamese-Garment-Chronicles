import { describe, expect, it } from "vitest";
import { drawOrder, PANELS, placesAt } from "./nguThan";

// how many points of a 0.5 grid fall inside a place
function area(slot: string) {
  let n = 0;
  for (let x = 0; x <= 100; x += 0.5) for (let y = 0; y <= 100; y += 0.5) if (placesAt(x, y).includes(slot)) n++;
  return n;
}

describe("placesAt (#108)", () => {
  it("finds every place under a point, the covered ones too", () => {
    // the middle of the inner panel, under the right front panel
    expect(placesAt(57, 60).sort()).toEqual(["back-right", "front-right", "inner"]);
    expect(placesAt(5, 5)).toEqual([]);
  });
  it("gives every place, the inner panel too, a wide area to click whatever is placed already", () => {
    for (const slot of Object.keys(PANELS)) expect(area(slot), slot).toBeGreaterThan(1500);
  });
});

describe("drawOrder (#108)", () => {
  it("draws the empty places above the filled ones, so their outline stays in sight", () => {
    const order = drawOrder((s) => s === "front-right");
    expect(order.indexOf("inner")).toBeGreaterThan(order.indexOf("front-right"));
  });
  it("draws the finished robe in its own order, the right front panel on top", () => {
    const order = drawOrder(() => true);
    expect(order.at(-1)).toBe("front-right");
    expect(order.indexOf("inner")).toBeLessThan(order.indexOf("front-left"));
  });
});
