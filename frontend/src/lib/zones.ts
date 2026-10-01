// Zones of a garment in step 1 of the try-on (#40): keep zones are locked, the others offer sourced options.
// A pick is a Selection modification { zone, change: option id }; "giữ nguyên" means no modification at all.

import type { Selection, Zone } from "./types";

export const KEEP_OPTION = "giu-nguyen";

/** The option picked for a zone, "giu-nguyen" when it was never changed. */
export function pickedOption(sel: Selection, part: string): string {
  return sel.modifications.find((m) => m.zone === part)?.change ?? KEEP_OPTION;
}

/** The look with this option picked for the zone, in place of any earlier pick. */
export function pickOption(sel: Selection, part: string, option: string): Selection {
  const others = sel.modifications.filter((m) => m.zone !== part);
  return { ...sel, modifications: option === KEEP_OPTION ? others : [...others, { zone: part, change: option }] };
}

/** How the builder shows a zone: 🔒, "chỉnh ở mục Màu", option chips, or nothing to pick yet. */
export function zoneControl(z: Zone): "locked" | "colors" | "options" | "none" {
  if (z.level === "keep") return "locked";
  if (z.control) return z.control;
  return z.options.length ? "options" : "none";
}

/** The picks of a look as "zone: option", for the line that says what will be rendered. */
export function zoneChanges(garment: { zones: Zone[] }, sel: Selection): string[] {
  return garment.zones.flatMap((z) => {
    const o = z.options.find((x) => x.id === pickedOption(sel, z.part));
    return o && o.id !== KEEP_OPTION ? [`${z.part}: ${o.label}`] : [];
  });
}
