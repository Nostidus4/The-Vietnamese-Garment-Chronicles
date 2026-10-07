// The rules of Bà's wardrobe, kept apart from the screen so they can be tested: what a look is, which pieces can be
// worn with which garment, the Compass selection a look stands for, and how a selection (the Compass's alternative,
// a pinned look) goes back on the doll. Everything worn is judged: a piece the garment does not offer cannot be worn
// at all, so no look reaches a card without the Compass having seen every piece of it (review #46, item 1).

import type { Bootstrap, Garment, Selection, WardrobeItem, WardrobeSlot } from "./types";

export type Look = { worn: Partial<Record<WardrobeSlot, string>>; colors: string[]; mods: Selection["modifications"]; occasion: string };
export type Body = "nu" | "nam" | "con";
/** worn · bad (worn, ⛔) · plain · dim (wearable, but not for this occasion) · off (does not go with this garment) · lock */
export type PieceState = "worn" | "bad" | "plain" | "dim" | "off" | "lock";

type Data = Pick<Bootstrap, "garments" | "occasions" | "regions"> & { wardrobe?: WardrobeItem[] };

export const garmentOf = (data: Data, look: Look, byId: Map<string, WardrobeItem>): Garment | null =>
  data.garments.find((g) => g.id === byId.get(look.worn.set ?? "")?.garment) ?? null;

/** The Compass selection this look stands for: the garment, every accessory worn, the colours, the zone changes. */
export function selectionOf(data: Data, look: Look, byId: Map<string, WardrobeItem>): Selection | null {
  const g = garmentOf(data, look, byId);
  if (!g) return null;
  return {
    garment_id: g.id,
    occasion_id: look.occasion,
    vibe: "traditional",
    colors: look.colors,
    accessories: (Object.entries(look.worn) as [WardrobeSlot, string][])
      .filter(([slot]) => slot !== "set")
      .map(([, id]) => byId.get(id)?.accessory)
      .filter((a): a is string => !!a),
    modifications: look.mods,
  };
}

/** Can this piece go on the doll now, and how does it show in the wardrobe? */
export function pieceState(it: WardrobeItem, look: Look, g: Garment | null, data: Data, opts: { body: Body; drawable: (it: WardrobeItem) => boolean; bad: Set<string> }): PieceState {
  if (!opts.drawable(it)) return "lock";
  if (opts.body === "nam" && !it.bodies.includes("nam")) return "lock";
  if (look.worn[it.slot] === it.id) return it.accessory && opts.bad.has(it.accessory) ? "bad" : "worn";
  if (it.accessory && (!g || !g.accessories.includes(it.accessory))) return "off";
  if (it.garment && !data.garments.find((x) => x.id === it.garment)?.occasions.includes(look.occasion)) return "dim";
  return "plain";
}

/** Wear or take off one piece; null when it cannot be worn ("off" and "lock" pieces). */
export function toggled(look: Look, it: WardrobeItem, state: PieceState, data: Data, byId: Map<string, WardrobeItem>): Look | null {
  if (state === "lock" || state === "off") return null;
  const worn = { ...look.worn };
  if (worn[it.slot] === it.id) {
    delete worn[it.slot];
    return { ...look, worn };
  }
  worn[it.slot] = it.id;
  if (it.slot !== "set") return { ...look, worn };
  // a new garment: its own colours and zones, and only the pieces it goes with
  return keepOffered({ worn, colors: [], mods: [], occasion: look.occasion }, data, byId);
}

/** Drops pieces the garment does not offer, and ids no longer in the wardrobe (a look remembered from an older visit). */
export function keepOffered(look: Look, data: Data, byId: Map<string, WardrobeItem>): Look {
  const g = garmentOf(data, look, byId);
  const worn: Look["worn"] = {};
  for (const [slot, id] of Object.entries(look.worn) as [WardrobeSlot, string][]) {
    const it = byId.get(id);
    if (!it || it.slot !== slot) continue;
    if (slot === "set" || (g && it.accessory && g.accessories.includes(it.accessory))) worn[slot] = id;
  }
  const colors = g ? look.colors.filter((c) => g.colors.includes(c)) : [];
  const mods = g ? look.mods.filter((m) => g.zones.some((z) => z.part === m.zone && z.options.some((o) => o.id === m.change))) : [];
  return { ...look, worn, colors, mods };
}

/**
 * The look on another body (#77): pieces not made for it come off; if the garment itself is not (the áo tứ thân on
 * the boy), the first garment of the same region that is, else of any region, goes on with its own colours.
 */
export function onBody(look: Look, body: Body, items: WardrobeItem[], data: Data, byId: Map<string, WardrobeItem>): Look {
  const fits = (it?: WardrobeItem) => !!it && (body === "con" || it.bodies.includes(body));
  const worn: Look["worn"] = {};
  for (const [slot, id] of Object.entries(look.worn) as [WardrobeSlot, string][]) if (fits(byId.get(id))) worn[slot] = id;
  if (worn.set || !look.worn.set) return { ...look, worn };
  const region = data.garments.find((g) => g.id === byId.get(look.worn.set!)?.garment)?.region;
  const sets = items.filter((it) => it.slot === "set" && fits(it));
  const next = sets.find((it) => data.garments.find((g) => g.id === it.garment)?.region === region) ?? sets[0];
  return next ? keepOffered({ ...look, worn: { ...worn, set: next.id }, colors: [], mods: [] }, data, byId) : { ...look, worn };
}

/** A Compass selection (its alternative, a pinned look) back on the doll: garment, pieces, colours, zones, occasion. */
export function lookOf(sel: Selection, items: WardrobeItem[], data: Data, byId: Map<string, WardrobeItem>): Look {
  const worn: Look["worn"] = {};
  const set = items.find((it) => it.slot === "set" && it.garment === sel.garment_id);
  if (set) worn.set = set.id;
  for (const a of sel.accessories) {
    const it = items.find((x) => x.accessory === a);
    if (it) worn[it.slot] = it.id;
  }
  return keepOffered({ worn, colors: sel.colors, mods: sel.modifications, occasion: sel.occasion_id }, data, byId);
}

/**
 * The look the room opens with. The diary's "Mặc thử" (?garment=) wins; else the look from the last visit, but only
 * when its garment belongs to this page's region (opening /chapter/hue must not put on a Nam Bộ garment, #44);
 * else the first garment of this region.
 */
export function firstLook(data: Data, items: WardrobeItem[], byId: Map<string, WardrobeItem>, regionId: string, wanted: string | undefined, last: Look | null): Look | null {
  const sets = items.filter((it) => it.slot === "set");
  const regionOf = (it?: WardrobeItem) => data.garments.find((g) => g.id === it?.garment)?.region;
  const fresh = (it?: WardrobeItem): Look => ({ worn: it ? { set: it.id } : {}, colors: [], mods: [], occasion: data.garments.find((g) => g.id === it?.garment)?.occasions[0] ?? data.occasions[0].id });
  const asked = wanted ? sets.find((it) => it.garment === wanted) : undefined;
  if (asked) return last?.worn.set === asked.id ? keepOffered(last, data, byId) : fresh(asked);
  if (last?.worn.set && regionOf(byId.get(last.worn.set)) === regionId) return keepOffered(last, data, byId);
  // the region's own garment first, in the order its page lists them: Huế opens on áo ngũ thân, not the modern áo dài (#116)
  const own = data.regions.find((r) => r.id === regionId)?.garments ?? [];
  const first = own.map((id) => sets.find((it) => it.garment === id)).find(Boolean);
  return fresh(first ?? sets.find((it) => regionOf(it) === regionId) ?? sets[0]);
}
