// "Ghép chiếc áo ngũ thân" (Huế): where each panel sits on the drawn robe, in a 100×100 box (front view; the two back
// panels peek out behind).

export const PANELS: Record<string, { d: string; z: number }> = {
  "back-left": { d: "M30 16 L50 12 L50 92 L22 92 Z", z: 0 },
  "back-right": { d: "M50 12 L70 16 L78 92 L50 92 Z", z: 0 },
  inner: { d: "M50 20 L64 24 L66 90 L50 90 Z", z: 1 },
  "front-left": { d: "M34 18 L50 14 L50 30 L46 90 L26 90 Z", z: 2 },
  "front-right": { d: "M50 14 L66 18 L74 90 L42 90 L46 30 Z", z: 3 },
};

// what a screen reader hears for each place on the robe: where it is, not which panel goes there
export const PLACE: Record<string, string> = {
  "back-left": "Chỗ phía sau, bên trái",
  "back-right": "Chỗ phía sau, bên phải",
  inner: "Chỗ bên trong, nửa phải",
  "front-left": "Chỗ phía trước, bên trái",
  "front-right": "Chỗ phía trước, bên phải",
};

/**
 * The robe is put together from the inside out, the way it is worn (#108): the two back panels, then the inner panel
 * (thân con), then the two front panels that close over it. Only one layer is open at a time, so a place is never
 * hidden under a panel that is not there yet, and the order itself is the lesson: the fifth panel sits under the
 * right front flap.
 */
export const LAYERS: string[][] = [["back-left", "back-right"], ["inner"], ["front-left", "front-right"]];
export const LAYER_NAME = ["hai thân sau", "thân con", "hai thân trước"];

export const layerOf = (slot: string) => LAYERS.findIndex((l) => l.includes(slot));

/** The layer being built: the first one with a place still empty (LAYERS.length once the robe is whole). */
export function currentLayer(placed: string[]): number {
  const i = LAYERS.findIndex((l) => l.some((slot) => !placed.includes(slot)));
  return i < 0 ? LAYERS.length : i;
}

export type Placing = { ok: true } | { ok: false; why: "later" | "elsewhere" };

/**
 * Putting `piece` where the reader pressed. `under` is every place under the press (several where panels overlap);
 * a piece of a layer not open yet is "later", whatever the place.
 */
export function tryPlace(placed: string[], piece: string, under: string[]): Placing {
  if (layerOf(piece) > currentLayer(placed)) return { ok: false, why: "later" };
  return under.includes(piece) ? { ok: true } : { ok: false, why: "elsewhere" };
}

/** Back to front, the order to draw the panels in. */
export const DRAW_ORDER = Object.keys(PANELS).sort((a, b) => PANELS[a].z - PANELS[b].z);

// the corners of a "M x y L x y … Z" path
const corners = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]);
const SHAPES = Object.fromEntries(Object.entries(PANELS).map(([slot, p]) => [slot, corners(p.d)]));

function inside(x: number, y: number, poly: number[][]) {
  let yes = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) yes = !yes;
  }
  return yes;
}

/**
 * Every place under a point of the robe, not only the one drawn on top (#108): the panels overlap like real cloth, so a
 * click is right when it lands inside the place of the panel in hand, even where another panel covers it.
 */
export function placesAt(x: number, y: number): string[] {
  return Object.keys(SHAPES).filter((slot) => inside(x, y, SHAPES[slot]));
}

/** The box around a place, for a thumbnail of the panel in the tray. */
export function boxOf(slot: string): [number, number, number, number] {
  const xs = SHAPES[slot].map((c) => c[0]);
  const ys = SHAPES[slot].map((c) => c[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}
