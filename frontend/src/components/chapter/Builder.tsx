"use client";

import type { Garment, GarmentsDoc, OccasionsDoc, Selection, Vibe } from "@/lib/types";

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
  doc,
  occasions,
  value,
  onChange,
}: {
  garment: Garment;
  doc: GarmentsDoc;
  occasions: OccasionsDoc["occasions"];
  value: Selection;
  onChange: (s: Selection) => void;
}) {
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition ${on ? "border-stone-800 bg-stone-800 text-amber-50" : "border-stone-300 hover:border-stone-600"}`;

  return (
    <section className="paper space-y-4 rounded-lg p-5">
      <div>
        <h3 className="mb-2 font-semibold">Dịp</h3>
        <div className="flex flex-wrap gap-2">
          {occasions.map((o) => (
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
              title={doc.colors[c]?.name}
              onClick={() => onChange({ ...value, colors: toggle(value.colors, c, 2) })}
              className={`h-9 w-9 rounded-full border-2 ${value.colors.includes(c) ? "border-stone-900 ring-2 ring-amber-400" : "border-stone-300"}`}
              style={{ background: doc.colors[c]?.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Phụ kiện</h3>
        <div className="flex flex-wrap gap-2">
          {garment.accessories.map((a) => (
            <button key={a} className={chip(value.accessories.includes(a))} onClick={() => onChange({ ...value, accessories: toggle(value.accessories, a) })}>
              {doc.accessories[a]?.name ?? a}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
