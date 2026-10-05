import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compassContent, evaluate } from "./compass";
import type { Garment, WardrobeItem } from "./types";
import { firstLook, keepOffered, lookOf, onBody, pieceState, selectionOf, toggled, type Look } from "./wardrobe";

// the real content, as the room gets it
const C = join(__dirname, "../../../backend/content");
const read = (f: string) => JSON.parse(readFileSync(join(C, f), "utf8"));
const garments: Garment[] = readdirSync(join(C, "garments")).filter((f) => f.endsWith(".json")).map((f) => read(`garments/${f}`));
const items: WardrobeItem[] = read("wardrobe.json").items.map((it: Partial<WardrobeItem>) => ({ bodies: ["nu"], layers: {}, garment: null, accessory: null, ...it }));
const data = {
  garments,
  occasions: read("occasions.json").occasions,
  regions: read("regions.json").regions,
  wardrobe: items,
};
const byId = new Map(items.map((it) => [it.id, it]));
const compass = compassContent({ garments, accessories: Object.fromEntries(read("accessories.json").accessories.map((a: { id: string }) => [a.id, a])), colors: Object.fromEntries(read("colors.json").colors.map((c: { id: string }) => [c.id, c])), occasions: data.occasions, rules: read("rules.json").rules });
const opts = { body: "nu" as const, drawable: () => true, bad: new Set<string>() };
const wearing = (setId: string, more: Record<string, string> = {}): Look => ({ worn: { set: setId, ...more }, colors: [], mods: [], occasion: "tet-chua" });
const state = (look: Look, id: string) => pieceState(byId.get(id)!, look, garments.find((g) => g.id === byId.get(look.worn.set!)?.garment) ?? null, data, opts);

describe("a piece the garment does not offer cannot be worn (review #46, 1)", () => {
  it("áo bà ba + nơ jeogori: off, and toggling does nothing", () => {
    const look = wearing("ao-ba-ba");
    expect(state(look, "no-jeogori")).toBe("off");
    expect(toggled(look, byId.get("no-jeogori")!, "off", data, byId)).toBeNull();
  });
  it("áo dài + mũ cánh chuồn: off", () => {
    expect(state(wearing("ao-dai"), "mu-canh-chuon")).toBe("off");
  });
  it("everything worn reaches the Compass: áo dài + obi is ⛔", () => {
    const look = toggled(wearing("ao-dai"), byId.get("obi")!, "plain", data, byId)!;
    const sel = selectionOf(data, look, byId)!;
    expect(sel.accessories).toContain("obi");
    expect(evaluate(compass, sel).state).toBe("distorted");
  });
  it("changing the garment drops the pieces the new one does not go with", () => {
    const look = toggled(wearing("ao-ngu-than", { head: "mu-canh-chuon", feet: "guoc-moc" }), byId.get("ao-dai")!, "plain", data, byId)!;
    expect(look.worn).toEqual({ set: "ao-dai", feet: "guoc-moc" });
  });
});

describe("a remembered look", () => {
  it("is cleaned of pieces and colours its garment does not offer", () => {
    const old: Look = { worn: { set: "ao-ba-ba", chest: "no-jeogori", head: "khong-con-nua" }, colors: ["tim-hue"], mods: [{ zone: "không có", change: "x" }], occasion: "tet-chua" };
    expect(keepOffered(old, data, byId)).toEqual({ worn: { set: "ao-ba-ba" }, colors: [], mods: [], occasion: "tet-chua" });
  });
  it("from another region does not open on this region's page (review #46, 9)", () => {
    const last = wearing("ao-ba-ba"); // Nam Bộ
    expect(firstLook(data, items, byId, "hue", undefined, last)?.worn.set).not.toBe("ao-ba-ba");
    expect(garments.find((g) => g.id === byId.get(firstLook(data, items, byId, "hue", undefined, last)!.worn.set!)?.garment)?.region).toBe("hue");
  });
  it("of this region is kept, and ?garment= always wins", () => {
    expect(firstLook(data, items, byId, "nam-bo", undefined, wearing("ao-ba-ba", { feet: "guoc-moc" }))?.worn).toEqual({ set: "ao-ba-ba", feet: "guoc-moc" });
    expect(firstLook(data, items, byId, "nam-bo", "ao-dai", wearing("ao-ba-ba"))?.worn.set).toBe("ao-dai");
  });
});

describe("a selection back on the doll (review #46, 6)", () => {
  it("a pinned look of another garment brings its garment, pieces and colours", () => {
    const pinned = { garment_id: "ao-tu-than", occasion_id: "le-hoi", vibe: "traditional" as const, colors: ["hong-dao"], accessories: ["non-quai-thao"], modifications: [] };
    const look = lookOf(pinned, items, data, byId);
    expect(look).toEqual({ worn: { set: "ao-tu-than", head: "non-quai-thao" }, colors: ["hong-dao"], mods: [], occasion: "le-hoi" });
    expect(() => evaluate(compass, selectionOf(data, look, byId)!)).not.toThrow();
  });
  it("the Compass's alternative to a ⛔ look is judged again without ⛔", () => {
    const sel = selectionOf(data, wearing("ao-dai", { waist: "obi", head: "non-la" }), byId)!;
    const alt = evaluate(compass, sel).alternative!;
    const back = lookOf(alt, items, data, byId);
    expect(back.worn.waist).toBeUndefined();
    expect(back.worn.head).toBe("non-la");
    expect(evaluate(compass, selectionOf(data, back, byId)!).state).not.toBe("distorted");
  });
});

describe("the boy's doll (#77)", () => {
  it("keeps what is drawn for him and takes off what is not", () => {
    const look = onBody(wearing("ao-ngu-than", { head: "khan-van", feet: "hai-vai" }), "nam", items, data, byId);
    expect(look.worn).toEqual({ set: "ao-ngu-than", head: "khan-van" });
  });
  it("swaps the áo tứ thân for a garment he can wear, from the same region if there is one", () => {
    const look = onBody(wearing("ao-tu-than", { head: "non-quai-thao" }), "nam", items, data, byId);
    expect(look.worn.set).toBeDefined();
    expect(byId.get(look.worn.set!)!.bodies).toContain("nam");
    expect(look.worn.head).toBeUndefined();
  });
  it("locks the girl's pieces on him", () => {
    const st = pieceState(byId.get("non-quai-thao")!, wearing("ao-dai"), garments.find((g) => g.id === "ao-dai")!, data, { ...opts, body: "nam" });
    expect(st).toBe("lock");
  });
});
