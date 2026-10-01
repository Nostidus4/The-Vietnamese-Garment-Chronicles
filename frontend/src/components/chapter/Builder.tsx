"use client";

import type { Bootstrap, Garment, Selection, Vibe } from "@/lib/types";

const VIBES: { id: Vibe; name: string }[] = [
  { id: "traditional", name: "Traditional" },
  { id: "minimal", name: "Minimal" },
  { id: "modern", name: "Modern" },
  { id: "festival", name: "Festival" },
];

function toggle(list: string[], id: string, max = Infinity) {
  if (list.includes(id)) return list.filter((x) => x !== id);
  return list.length >= max ? list : [...list, id];
}

export function Builder({
  garment,
  data,
  value,
  onChange,
  highlight = [],
}: {
  garment: Garment;
  data: Bootstrap;
  value: Selection;
  onChange: (s: Selection) => void;
  highlight?: string[]; // after ⛔ "Sửa lại": the choices that caused it
}) {
  const chip = (on: boolean, bad = false) =>
    `rounded-full border px-3 py-1 text-sm transition ${on ? "border-stone-800 bg-stone-800 text-amber-50" : "border-stone-300 hover:border-stone-600"} ${bad ? "ring-2 ring-red-500 ring-offset-2" : ""}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-semibold">Dịp</h3>
        <div className="flex flex-wrap gap-2">
          {data.occasions.map((o) => (
            <button key={o.id} className={chip(value.occasion_id === o.id)} onClick={() => onChange({ ...value, occasion_id: o.id })}>
              {o.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Vibe</h3>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <button key={v.id} className={chip(value.vibe === v.id)} onClick={() => onChange({ ...value, vibe: v.id })}>
              {v.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Màu (tối đa 2)</h3>
        <div className="flex flex-wrap gap-3">
          {garment.colors.map((c) => (
            <button
              key={c}
              title={data.colors[c]?.name}
              onClick={() => onChange({ ...value, colors: toggle(value.colors, c, 2) })}
              className={`h-9 w-9 rounded-full border-2 ${value.colors.includes(c) ? "border-stone-900 ring-2 ring-amber-400" : "border-stone-300"} ${highlight.includes(c) ? "outline-2 outline-offset-4 outline-red-500" : ""}`}
              style={{ background: data.colors[c]?.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Phụ kiện</h3>
        <div className="flex flex-wrap gap-2">
          {garment.accessories.map((a) => (
            <button key={a} className={chip(value.accessories.includes(a), highlight.includes(a))} onClick={() => onChange({ ...value, accessories: toggle(value.accessories, a) })}>
              {highlight.includes(a) && "⛔ "}
              {data.accessories[a]?.name_vi ?? a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
