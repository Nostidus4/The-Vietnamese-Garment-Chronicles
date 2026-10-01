import { describe, expect, it } from "vitest";
import type { Selection, Zone } from "./types";
import { KEEP_OPTION, pickOption, pickedOption, zoneChanges, zoneControl } from "./zones";

const base: Selection = {
  garment_id: "ao-dai",
  occasion_id: "di-tich",
  vibe: "traditional",
  colors: [],
  accessories: [],
  modifications: [],
};
const zone = (patch: Partial<Zone>): Zone => ({ part: "cổ áo", level: "caution", note: null, control: null, options: [], ...patch });

describe("picking a zone option", () => {
  it("reads 'giữ nguyên' when the zone was never changed", () => {
    expect(pickedOption(base, "cổ áo")).toBe(KEEP_OPTION);
  });

  it("adds the change, then replaces it, keeping other zones", () => {
    const one = pickOption({ ...base, modifications: [{ zone: "chất liệu", change: "voan" }] }, "cổ áo", "co-thuyen");
    expect(one.modifications).toEqual([
      { zone: "chất liệu", change: "voan" },
      { zone: "cổ áo", change: "co-thuyen" },
    ]);
    expect(pickedOption(one, "cổ áo")).toBe("co-thuyen");
    const two = pickOption(one, "cổ áo", "co-khac");
    expect(two.modifications).toEqual([
      { zone: "chất liệu", change: "voan" },
      { zone: "cổ áo", change: "co-khac" },
    ]);
  });

  it("drops the change when 'giữ nguyên' is picked, so the look scores as the plain garment", () => {
    const changed = pickOption(base, "cổ áo", "co-thuyen");
    expect(pickOption(changed, "cổ áo", KEEP_OPTION).modifications).toEqual([]);
  });

  it("keeps the rest of the look and never mutates it", () => {
    const sel = { ...base, colors: ["trang"] };
    const out = pickOption(sel, "cổ áo", "co-thuyen");
    expect(out.colors).toEqual(["trang"]);
    expect(sel.modifications).toEqual([]);
  });
});

describe("what a zone shows in the builder", () => {
  it("locks keep zones", () => {
    expect(zoneControl(zone({ level: "keep", note: "Hai tà" }))).toBe("locked");
  });
  it("points zones set by another control to it", () => {
    expect(zoneControl(zone({ level: "free", control: "colors" }))).toBe("colors");
  });
  it("offers chips when there are options", () => {
    expect(zoneControl(zone({ options: [{ id: KEEP_OPTION, label: "Giữ nguyên", prompt: null, sources: [] }] }))).toBe("options");
  });
  it("shows nothing to pick when a zone has no sourced option yet", () => {
    expect(zoneControl(zone({ level: "free" }))).toBe("none");
  });
});

describe("naming the picks", () => {
  const garment = {
    zones: [
      zone({ part: "cổ áo", options: [{ id: KEEP_OPTION, label: "Giữ nguyên", prompt: null, sources: [] }, { id: "co-thuyen", label: "Cổ thuyền", prompt: "boat neck", sources: [] }] }),
    ],
  };
  it("says which zone changed to what, in the zone's order", () => {
    expect(zoneChanges(garment, pickOption(base, "cổ áo", "co-thuyen"))).toEqual(["cổ áo: Cổ thuyền"]);
  });
  it("is empty for the plain garment", () => {
    expect(zoneChanges(garment, base)).toEqual([]);
  });
});
