"use client";

// F1 So sánh: pin up to three looks, see the Compass verdict of each side by side, then pick one to keep working on.

import { useEffect, useState } from "react";
import { compareLooks } from "@/lib/api";
import type { Bootstrap, CompassResult, CompassState, Selection } from "@/lib/types";
import { zoneChanges } from "@/lib/zones";
import { labelVi } from "@/lib/text";

const STATE: Record<CompassState, { icon: string; name: string; tone: string }> = {
  fit: { icon: "✅", name: "Phù hợp", tone: "border-emerald-400" },
  adapted: { icon: "✨", name: "Cách tân có chủ đích", tone: "border-sky-400" },
  review: { icon: "⚠️", name: "Cần xem lại bối cảnh", tone: "border-amber-400" },
  distorted: { icon: "⛔", name: "Sai lệch – không nên", tone: "border-red-400" },
};
const MAX = 3;

function describe(data: Bootstrap, s: Selection): string[] {
  return [
    data.garments.find((g) => g.id === s.garment_id)?.name_vi ?? s.garment_id,
    data.occasions.find((o) => o.id === s.occasion_id)?.name ?? s.occasion_id,
    s.colors.map((c) => data.colors[c]?.name ?? c).join(" + ") || "màu mặc định",
    s.accessories.map((a) => data.accessories[a]?.name_vi ?? a).join(", ") || "không phụ kiện",
    ...zoneChanges(data.garments.find((g) => g.id === s.garment_id) ?? { zones: [] }, s),
  ];
}

export function ComparePanel({ current, data, onUse }: { current: Selection; data: Bootstrap; onUse: (s: Selection) => void }) {
  const [pinned, setPinned] = useState<Selection[]>([]);
  const [results, setResults] = useState<CompassResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = (s: Selection) => JSON.stringify(s);
  const already = pinned.some((p) => key(p) === key(current));

  // re-score whenever the set of pinned looks changes (needs at least two)
  useEffect(() => {
    let alive = true;
    const run = pinned.length >= 2 ? compareLooks(pinned) : Promise.resolve(null);
    run
      .then((r) => {
        if (!alive) return;
        setResults(r);
        setError(null);
      })
      .catch(() => alive && setError("Chưa so sánh được, con thử lại nhé."));
    return () => {
      alive = false;
    };
  }, [pinned]);

  return (
    <section className="paper rounded-lg p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 font-semibold">So sánh các bộ phối</h3>
        <span className="text-sm text-stone-600">
          {pinned.length}/{MAX} bộ đã ghim
        </span>
        <button
          type="button"
          disabled={already || pinned.length >= MAX}
          onClick={() => setPinned((p) => [...p, current])}
          className="ml-auto rounded-full border border-stone-700 px-3 py-1 text-sm hover:bg-stone-800 hover:text-amber-50 disabled:opacity-40"
        >
          {already ? "Bộ này đã ghim" : pinned.length >= MAX ? "Đã đủ 3 bộ" : "📌 Ghim bộ đang phối"}
        </button>
      </div>
      {pinned.length < 2 && (
        <p className="m-0 mt-2 text-sm text-stone-600">Ghim ít nhất 2 bộ (đổi màu, dịp hay phụ kiện giữa các lần ghim) để Tèo chấm cạnh nhau.</p>
      )}
      {error && <p className="m-0 mt-2 text-sm text-[#B5452E]">{error}</p>}
      {pinned.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {pinned.map((s, i) => {
            const r = results?.[i];
            const st = r ? STATE[r.state] : null;
            const [garment, occasion, colors, acc] = describe(data, s);
            return (
              <div key={key(s)} className={`rounded-md border-2 bg-white/60 p-3 text-sm ${st?.tone ?? "border-stone-300"}`}>
                <p className="m-0 text-xs font-semibold uppercase tracking-wider text-stone-600">Bộ {i + 1}</p>
                <p className="m-0 mt-1 font-semibold">{garment}</p>
                <p className="m-0 text-xs text-stone-600">{occasion}</p>
                <p className="m-0 text-xs text-stone-600">{colors}</p>
                <p className="m-0 text-xs text-stone-600">{acc}</p>
                {r && st && (
                  <>
                    <p className="m-0 mt-2 font-semibold">
                      {st.icon} {st.name}
                      {r.label && <span className="ml-1 text-xs font-normal text-stone-600">· {labelVi(r.label)}</span>}
                    </p>
                    {r.triggers[0] && <p className="m-0 mt-1 text-xs text-stone-700">{r.triggers[0].teo}</p>}
                  </>
                )}
                <div className="mt-2 flex gap-3 text-xs">
                  <button type="button" onClick={() => onUse(s)} className="underline">
                    Phối tiếp bộ này
                  </button>
                  <button type="button" onClick={() => setPinned((p) => p.filter((_, j) => j !== i))} className="text-stone-600 underline">
                    Bỏ ghim
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
