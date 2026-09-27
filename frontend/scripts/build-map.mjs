// Turns data/vietnam-provinces.topo.json into ready-to-draw SVG paths grouped by chapter region.
// Run: node scripts/build-map.mjs  →  writes src/components/book/vietnam-geo.ts
// Shared borders stay identical because arcs are simplified once, before provinces use them.
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const topo = JSON.parse(fs.readFileSync(path.join(root, "data/vietnam-provinces.topo.json"), "utf8"));

// The 8 official regions (the "region" field) folded into the book's chapters.
// Tây Bắc and Tây Nguyên stay locked: their clothing must be co-created with the communities first.
const CHAPTER_OF_REGION = { 1: "tay-bac", 2: "bac-bo", 3: "bac-bo", 4: "hue", 5: "hue", 6: "tay-nguyen", 7: "nam-bo", 8: "nam-bo" };

// Projection: equirectangular, scaled by cos(16°) so the country is not stretched sideways.
const LON0 = 101.9, LAT1 = 23.55, K = 24; // viewBox units per degree of latitude
const COS = Math.cos((16 * Math.PI) / 180);
const project = ([lon, lat]) => [(lon - LON0) * COS * K, (LAT1 - lat) * K];
const W = Math.ceil((114.9 - LON0) * COS * K), H = Math.ceil((LAT1 - 7.4) * K);

// Decode delta-encoded arcs into projected points.
const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
let arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => ((x += dx), (y += dy), project([x * sx + tx, y * sy + ty])));
});

// Douglas-Peucker per arc (endpoints kept, so neighbours still meet exactly).
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let best = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      // a closed ring (an island) starts and ends on the same point: measure from that point instead of a zero-length line
      const d = len < 1e-9 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > best) { best = d; idx = i; }
    }
    if (best > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
arcs = arcs.map((a) => simplify(a, 0.22));

const f = (n) => Math.round(n * 10) / 10;
const arcPts = (i) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
function ring(idxs) {
  const pts = [];
  idxs.forEach((i, k) => { const p = arcPts(i); pts.push(...(k ? p.slice(1) : p)); });
  return pts;
}
const bboxSize = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
};
const toD = (pts, close) => "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + (close ? "Z" : "");

// Provinces → fill paths per chapter; count arc use to find chapter outlines.
const fills = {}, arcUse = new Map(); // arc -> Set of chapters (with multiplicity per chapter)
const provinces = [];
const provRings = {}; // old province name -> { chapter, rings: [projected points] }
const arcProv = new Map(); // arc -> old province names using it
const isletChapter = []; // [x, y, chapter]
const islets = []; // tiny islands drawn as dots (merged if they touch)
const globalUse = new Map();
for (const g of topo.objects.states.geometries)
  for (const poly of g.type === "MultiPolygon" ? g.arcs : [g.arcs])
    for (const r of poly) for (const i of r) globalUse.set(i >= 0 ? i : ~i, (globalUse.get(i >= 0 ? i : ~i) || 0) + 1);
for (const g of topo.objects.states.geometries) {
  const chapter = CHAPTER_OF_REGION[g.properties.region];
  const polys = g.type === "MultiPolygon" ? g.arcs : [g.arcs];
  let d = "";
  for (const poly of polys) {
    const outer = ring(poly[0]);
    // an enclave (a piece of one province inside another) shares its border; an island's border belongs to no one else
    const isEnclave = poly[0].some((i) => (globalUse.get(i >= 0 ? i : ~i) || 0) > 1);
    if (bboxSize(outer) < 0.9 && !isEnclave) {
      // a rock or islet smaller than a pen stroke: keep it as a dot so every island stays on the map
      const cx = outer.reduce((t, p) => t + p[0], 0) / outer.length, cy = outer.reduce((t, p) => t + p[1], 0) / outer.length;
      islets.push([f(cx), f(cy)]);
      isletChapter.push([cx, cy, chapter]);
      continue;
    }
    (provRings[g.properties.name] ??= { chapter, rings: [] }).rings.push(outer);
    for (const r of poly) {
      d += toD(ring(r), true);
      for (const i of r) {
        const k = i >= 0 ? i : ~i;
        if (!arcProv.has(k)) arcProv.set(k, []);
        arcProv.get(k).push(g.properties.name);
      }
      for (const i of r) {
        const k = i >= 0 ? i : ~i;
        if (!arcUse.has(k)) arcUse.set(k, []);
        arcUse.get(k).push(chapter);
      }
    }
  }
  if (!d) continue;
  fills[chapter] = (fills[chapter] || "") + d;
  provinces.push(g.properties.name);
}

// Chapter outline = arcs used once inside that chapter (coast, border, or a chapter boundary).
// Province lines = arcs shared by two provinces of the same chapter.
const outlines = {}; let provinceLines = "", chapterLines = "";
for (const [k, users] of arcUse) {
  const pts = arcs[k];
  if (pts.length < 2) continue;
  const d = toD(pts, false);
  const counts = {};
  users.forEach((c) => (counts[c] = (counts[c] || 0) + 1));
  for (const [c, n] of Object.entries(counts)) if (n === 1) outlines[c] = (outlines[c] || "") + d;
  if (users.length === 2 && users[0] === users[1]) provinceLines += d;
  if (users.length === 2 && users[0] !== users[1]) chapterLines += d;
}

// Hoàng Sa and Trường Sa: always drawn (islands too small for the source data).
const P = (lon, lat) => project([lon, lat]).map(f);
const islands = {
  hoangSa: [[112.33, 16.83], [112.73, 16.67], [111.61, 16.53], [111.7, 16.45], [111.5, 16.45], [111.2, 15.78], [112.9, 16.05], [111.95, 16.95]].map(([a, b]) => P(a, b)),
  truongSa: [[111.92, 8.64], [114.33, 11.43], [114.36, 10.18], [114.33, 9.88], [114.48, 10.37], [113.92, 7.89], [113.3, 8.18], [114.36, 10.38], [112.2, 8.85], [114.07, 10.72], [114.7, 11.1], [112.9, 9.3]].map(([a, b]) => P(a, b)),
};

// dedupe islets closer than 1.2 units so Hạ Long bay reads as a scatter, not a smudge
const dots = [];
for (const p of islets) if (!dots.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1.2)) dots.push(p);

const labels = {
  "tay-bac": P(103.55, 21.55),
  "bac-bo": P(106.1, 21.75),
  hue: P(106.2, 17.3),
  "tay-nguyen": P(107.95, 13.55),
  "nam-bo": P(105.9, 10.25),
  hoangSa: P(112.05, 17.45),
  truongSa: P(113.0, 12.1),
  bienDong: P(110.9, 13.6),
  phuQuoc: P(103.2, 10.25),
  conDao: P(106.6, 8.25),
  lySon: P(109.55, 15.6),
  catBa: P(107.55, 20.55),
};

// ---- Part 2: one focus sheet per chapter (zoom box, 2025 provinces, their borders and label spots) ----
const merge = JSON.parse(fs.readFileSync(path.join(root, "data/province-merge-2025.json"), "utf8"));
const newOf = {};
for (const [nu, olds] of Object.entries(merge)) if (!nu.startsWith("_")) for (const o of olds) newOf[o] = nu;

const inside = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const segDist = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const area = (poly) => Math.abs(poly.reduce((t, p, i) => { const q = poly[(i + 1) % poly.length]; return t + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
// the point deepest inside a polygon, so a label never sits on a border or in the sea
function labelSpot(poly) {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const step = Math.max(x1 - x0, y1 - y0) / 40;
  let best = [(x0 + x1) / 2, (y0 + y1) / 2], bestD = -1;
  for (let x = x0; x <= x1; x += step)
    for (let y = y0; y <= y1; y += step) {
      if (!inside([x, y], poly)) continue;
      let d = Infinity;
      for (let i = 0; i < poly.length - 1; i++) d = Math.min(d, segDist([x, y], poly[i], poly[i + 1]));
      if (d > bestD) (bestD = d), (best = [x, y]);
    }
  return best.map(f);
}

const chaptersOfNew = {};
for (const [old, pr] of Object.entries(provRings)) (chaptersOfNew[newOf[old]] ??= new Set()).add(pr.chapter);

const focus = {};
for (const chapter of new Set(Object.values(CHAPTER_OF_REGION))) {
  const olds = Object.entries(provRings).filter(([, pr]) => pr.chapter === chapter);
  const pts = olds.flatMap(([, pr]) => pr.rings.flat()).concat(isletChapter.filter((i) => i[2] === chapter).map((i) => [i[0], i[1]]));
  // Hoàng Sa (Đà Nẵng) and Trường Sa (Khánh Hòa) belong to the central coast: its zoom always keeps them in view
  if (chapter === "hue") pts.push(...islands.hoangSa, ...islands.truongSa, P(113.6, 17.2));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pad = Math.max(x1 - x0, y1 - y0) * 0.08;
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;

  const groups = {};
  for (const [old, pr] of olds) (groups[newOf[old]] ??= { old: [], rings: [] }), groups[newOf[old]].old.push(old), groups[newOf[old]].rings.push(...pr.rings);
  const provs = Object.entries(groups).map(([name, g]) => {
    const biggest = g.rings.reduce((a, b) => (area(b) > area(a) ? b : a));
    return { name, old: g.old, partial: chaptersOfNew[name].size > 1, d: g.rings.map((r) => toD(r, true)).join(""), at: labelSpot(biggest) };
  });

  // borders between two different 2025 provinces inside this chapter (merged old borders disappear)
  let borders = "";
  for (const [k, users] of arcProv) {
    if (users.length !== 2) continue;
    const [a, b] = users;
    if (provRings[a].chapter !== chapter || provRings[b].chapter !== chapter || newOf[a] === newOf[b]) continue;
    if (arcs[k].length > 1) borders += toD(arcs[k], false);
  }
  focus[chapter] = { box: [f(x0), f(y0), f(x1 - x0), f(y1 - y0)], borders, provinces: provs };
}

const out = `// Generated by scripts/build-map.mjs from data/vietnam-provinces.topo.json. Do not edit by hand.
export const MAP_W = ${W};
export const MAP_H = ${H};
export const CHAPTER_FILL: Record<string, string> = ${JSON.stringify(fills)};
export const CHAPTER_OUTLINE: Record<string, string> = ${JSON.stringify(outlines)};
export const PROVINCE_LINES = ${JSON.stringify(provinceLines)};
export const CHAPTER_LINES = ${JSON.stringify(chapterLines)};
export const ISLANDS = ${JSON.stringify(islands)};
export const ISLETS: [number, number][] = ${JSON.stringify(dots)};
export const LABEL_AT: Record<string, [number, number]> = ${JSON.stringify(labels)};
/** lon/lat → map units, same projection as the paths */
export const PROJ = { lon0: ${LON0}, lat1: ${LAT1}, k: ${K}, cos: ${COS} };
export type FocusProvince = { name: string; old: string[]; partial: boolean; d: string; at: [number, number] };
export const FOCUS: Record<string, { box: [number, number, number, number]; borders: string; provinces: FocusProvince[] }> = ${JSON.stringify(focus)};
`;
const dest = path.join(root, "src/components/book/vietnam-geo.ts");
fs.writeFileSync(dest, out);
console.log(`wrote ${path.relative(root, dest)}: ${(out.length / 1024).toFixed(0)} KB, ${provinces.length} provinces, viewBox ${W}x${H}`);
