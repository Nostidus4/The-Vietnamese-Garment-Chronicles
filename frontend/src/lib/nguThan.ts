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
 * The order to draw the places in (#108): the empty ones above the filled ones, so a panel already placed never covers
 * a place still to fill (the inner panel sits almost wholly under the right front panel). Once all are filled the
 * robe is drawn in its own order, the front closed over the inside.
 */
export function drawOrder(filled: (slot: string) => boolean): string[] {
  const rank = (slot: string) => (filled(slot) ? 0 : 10) + PANELS[slot].z;
  return Object.keys(PANELS).sort((a, b) => rank(a) - rank(b));
}

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
