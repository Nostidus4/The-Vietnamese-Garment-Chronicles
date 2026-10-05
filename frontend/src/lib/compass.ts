// The Cultural Compass in the browser: the same verdicts as backend/app/services/compass.py, read from the same
// content (rules.json, accessories, garments, colours). The dress-up room judges every change at once with it, and it
// keeps working on the static site where there is no server. compass.test.ts checks it look by look against the
// Python one (scripts/compass_fixtures.py), so the two never disagree.

import type { CompassResult, CompassState, Selection, Trigger } from "./types";

type Message = { ti: string; teo: string; why: string };
type Rule = Message & { type: string; state: CompassState; sources: string[] };
type ZoneOption = { id: string; label: string };
type Zone = { part: string; level: "keep" | "caution" | "free"; options: ZoneOption[] };
type Garment = { id: string; name_vi: string; colors: string[]; default_colors: string[]; accessories: string[]; occasions: string[]; zones: Zone[] };
type Accessory = { id: string; name_vi: string; kind: string; occasions?: string[] | null; message?: Message | null; alternative?: string | null };
type Color = { id: string; name: string; hex: string; restricted?: boolean };

export type CompassContent = {
  garments: Record<string, Garment>;
  accessories: Record<string, Accessory>;
  colors: Record<string, Color>;
  occasions: string[];
  rules: Record<string, Rule>;
};

const KEEP_OPTION = "giu-nguyen";
const SEVERITY: Record<CompassState, number> = { fit: 0, adapted: 1, review: 2, distorted: 3 };
const LABELS: Record<CompassState, string | null> = { fit: "Authentic", adapted: "Adapted", review: "Inspired", distorted: null };

export class SelectionError extends Error {}

/** The Compass's view of the content, from the bootstrap (lists) or the fixtures (maps). */
export function compassContent(src: {
  garments: Garment[] | Record<string, Garment>;
  accessories: Record<string, Accessory>;
  colors: Record<string, Color>;
  occasions: { id: string }[] | string[];
  rules: Rule[];
}): CompassContent {
  const garments = Array.isArray(src.garments) ? Object.fromEntries(src.garments.map((g) => [g.id, g])) : src.garments;
  const occasions = (src.occasions as (string | { id: string })[]).map((o) => (typeof o === "string" ? o : o.id));
  return { garments, accessories: src.accessories, colors: src.colors, occasions, rules: Object.fromEntries(src.rules.map((r) => [r.type, r])) };
}

function validate(c: CompassContent, sel: Selection): Garment {
  const g = c.garments[sel.garment_id];
  if (!g) throw new SelectionError(`Không có trang phục '${sel.garment_id}'`);
  if (!c.occasions.includes(sel.occasion_id)) throw new SelectionError(`Không có dịp '${sel.occasion_id}'`);
  for (const col of sel.colors) if (!g.colors.includes(col)) throw new SelectionError(`Màu '${col}' không có trong lựa chọn của ${g.name_vi}`);
  for (const a of sel.accessories) if (!g.accessories.includes(a)) throw new SelectionError(`Phụ kiện '${a}' không có trong lựa chọn của ${g.name_vi}`);
  for (const m of sel.modifications) {
    const z = g.zones.find((x) => x.part === m.zone);
    if (!z) throw new SelectionError(`'${m.zone}' không phải một phần của ${g.name_vi}`);
    if (!z.options.some((o) => o.id === m.change)) throw new SelectionError(`'${m.change}' không phải lựa chọn của phần '${m.zone}' (${g.name_vi})`);
  }
  return g;
}

function trigger(c: CompassContent, type: string, target: string, targetName: string, override?: Message | null): Trigger {
  const rule = c.rules[type];
  const msg = override ?? rule;
  return { type, state: rule.state, target, target_name: targetName, ti: msg.ti, teo: msg.teo, why: msg.why, sources: rule.sources };
}

const KIND_RULE: Record<string, string> = { "traditional-foreign": "fusion", restricted: "restricted", modern: "flexible" };
const LEVEL_RULE = { keep: "core", caution: "caution", free: "flexible" } as const;

function collect(c: CompassContent, sel: Selection, g: Garment): Trigger[] {
  const out: Trigger[] = [];
  for (const id of sel.accessories) {
    const a = c.accessories[id];
    const rule = KIND_RULE[a.kind];
    if (rule) out.push(trigger(c, rule, id, a.name_vi, a.message));
    if (a.occasions && !a.occasions.includes(sel.occasion_id)) out.push(trigger(c, "occasion", id, a.name_vi));
  }
  for (const id of sel.colors) {
    const col = c.colors[id];
    if (col.restricted) out.push(trigger(c, "restricted", id, col.name));
  }
  const changed = sel.colors.filter((x) => !g.default_colors.includes(x) && !c.colors[x].restricted);
  if (changed.length) out.push(trigger(c, "flexible", changed[0], c.colors[changed[0]].name));
  for (const m of sel.modifications) {
    if (m.change === KEEP_OPTION) continue;
    const z = g.zones.find((x) => x.part === m.zone)!;
    const option = z.options.find((o) => o.id === m.change)!;
    out.push(trigger(c, LEVEL_RULE[z.level], m.zone, `${m.zone}: ${option.label}`));
  }
  if (!g.occasions.includes(sel.occasion_id)) out.push(trigger(c, "occasion", g.id, g.name_vi));
  return out;
}

/** Swap or drop only what made the look ⛔; keep the rest of the reader's choices. */
function alternative(c: CompassContent, sel: Selection, g: Garment, triggers: Trigger[]): Selection {
  const bad = new Set(triggers.filter((t) => t.state === "distorted").map((t) => t.target));
  const accessories: string[] = [];
  for (const a of sel.accessories) {
    if (!bad.has(a)) {
      accessories.push(a);
      continue;
    }
    const alt = c.accessories[a].alternative;
    if (alt && g.accessories.includes(alt) && !accessories.includes(alt)) accessories.push(alt);
  }
  const kept = sel.colors.filter((x) => !bad.has(x));
  return {
    ...sel,
    accessories,
    colors: kept.length ? kept : g.default_colors.slice(0, 1),
    modifications: sel.modifications.filter((m) => !bad.has(m.zone)),
  };
}

function stateOf(triggers: Trigger[]): CompassState {
  let s: CompassState = "fit";
  for (const t of triggers) if (SEVERITY[t.state] > SEVERITY[s]) s = t.state;
  return s;
}

/** Colorsys.rgb_to_hsv, as the Python harmony notes use it. */
function hsv(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const v = maxc;
  if (minc === maxc) return [0, 0, v];
  const s = (maxc - minc) / maxc;
  const rc = (maxc - r) / (maxc - minc);
  const gc = (maxc - g) / (maxc - minc);
  const bc = (maxc - b) / (maxc - minc);
  let h = r === maxc ? bc - gc : g === maxc ? 2 + rc - bc : 4 + gc - rc;
  h = (((h / 6) % 1) + 1) % 1;
  return [h, s, v];
}

function harmonyNotes(c: CompassContent, colorIds: string[]): string[] {
  const list = colorIds.filter((id) => c.colors[id]).map((id) => hsv(c.colors[id].hex));
  if (list.length < 2) return [];
  const notes: string[] = [];
  const [[h1, s1, v1], [h2, s2, v2]] = list;
  const gap = Math.min(Math.abs(h1 - h2), 1 - Math.abs(h1 - h2));
  if (s1 > 0.5 && s2 > 0.5 && gap > 0.08 && gap < 0.3) notes.push("Hai màu đậm, gần nhau trên vòng màu dễ bị 'chỏi'. Thử hạ một màu xuống tông nhạt hơn.");
  if (Math.abs(v1 - v2) < 0.1 && Math.abs(s1 - s2) < 0.1 && gap < 0.05) notes.push("Hai màu gần như trùng nhau – chọn một màu tương phản hơn để có điểm nhấn.");
  if (gap > 0.45 && s1 > 0.3 && s2 > 0.3) notes.push("Cặp màu tương phản mạnh: rất nổi bật khi chụp ảnh, nên để màu nhạt hơn làm màu chính.");
  return notes;
}

/** The verdict on a look. Throws SelectionError when the look asks for something its garment does not offer. */
export function evaluate(c: CompassContent, sel: Selection): CompassResult {
  const g = validate(c, sel);
  const triggers = collect(c, sel, g);
  const state = stateOf(triggers);
  let alt: Selection | null = null;
  let altState: CompassState | null = null;
  if (state === "distorted") {
    alt = alternative(c, sel, g, triggers);
    altState = stateOf(collect(c, alt, g));
  }
  // most severe first, so the UI can show triggers[0] as the headline (a stable sort, like Python's)
  const sorted = triggers.map((t, i) => [t, i] as const).sort((a, b) => SEVERITY[b[0].state] - SEVERITY[a[0].state] || a[1] - b[1]).map(([t]) => t);
  return { state, label: LABELS[state], triggers: sorted, harmony_notes: harmonyNotes(c, sel.colors), alternative: alt, alternative_state: altState };
}
