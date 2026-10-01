import type { Bootstrap, Selection } from "./types";

/** What the Compass changes between the viewer's look and its alternative: "Đổi X → Y" or "Bỏ X". */
export function swaps(data: Pick<Bootstrap, "accessories" | "colors">, from: Selection, to: Selection): string[] {
  const out: string[] = [];
  const acc = (id: string) => data.accessories[id]?.name_vi ?? id;
  const col = (id: string) => data.colors[id]?.name ?? id;
  const diff = (a: string[], b: string[], name: (id: string) => string, what: string) => {
    const gone = a.filter((x) => !b.includes(x));
    const added = b.filter((x) => !a.includes(x));
    gone.forEach((x, i) => out.push(added[i] ? `Đổi ${what}${name(x)} → ${name(added[i])}` : `Bỏ ${what}${name(x)}`));
  };
  diff(from.accessories, to.accessories, acc, "");
  diff(from.colors, to.colors, col, "màu ");
  const zones = to.modifications.map((m) => m.zone);
  from.modifications.filter((m) => !zones.includes(m.zone)).forEach((m) => out.push(`Giữ nguyên ${m.zone} như chuẩn (bỏ thay đổi “${m.change}”)`));
  return out;
}
