"use client";

import type { Bootstrap, Garment, Selection, Vibe } from "@/lib/types";
import { pickOption, pickedOption, zoneControl } from "@/lib/zones";
import { STATE } from "./CompassPanel";

const VIBES: { id: Vibe; name: string }[] = [
  { id: "traditional", name: "Traditional" },
  { id: "minimal", name: "Minimal" },
  { id: "modern", name: "Modern" },
  { id: "festival", name: "Festival" },
];

// what the Compass says when a zone moves away from "giữ nguyên"
const LEVEL_STATE = { caution: STATE.review, free: STATE.adapted };

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
        <h3 className="mb-2 font-semibold">Các phần của áo</h3>
        <ul className="m-0 list-none space-y-3 p-0">
          {garment.zones.map((z) => {
            const how = zoneControl(z);
            const picked = pickedOption(value, z.part);
            const hint = z.level !== "keep" ? LEVEL_STATE[z.level] : null;
            return (
              <li key={z.part}>
                <p className="m-0 text-sm">
                  <span className="font-medium">{z.part}</span>
                  {how === "locked" && <span className="text-stone-600"> · 🔒 {z.note ?? "phần nhận diện của áo, giữ nguyên"}</span>}
                  {how === "colors" && <span className="text-stone-600"> · chỉnh ở mục Màu</span>}
                  {how === "options" && hint && (
                    <span className="text-stone-600">
                      {" "}
                      · đổi là {hint.icon} {hint.name.toLowerCase()}
                    </span>
                  )}
                </p>
                {how === "options" && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {z.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={picked === o.id}
                        title={o.sources.map((id) => data.sources[id]?.title ?? id).join("\n") || undefined}
                        className={chip(picked === o.id)}
                        onClick={() => onChange(pickOption(value, z.part, o.id))}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
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
