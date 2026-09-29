"use client";

import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { loadDuKy, saveToDuKy } from "@/lib/duky";
import { track } from "@/lib/track";
import { useBootstrap } from "@/lib/useBootstrap";
import type { DuKyEntry } from "@/lib/types";

// Compass labels saved with AI pages (backend/app/models.py LABELS) and their icons
const VERDICT: Record<string, string> = { Authentic: "✅", Adapted: "✨", Inspired: "⚠️" };

export default function DuKyView() {
  // Rendered client-only (see app/du-ky/page.tsx), so localStorage is safe here
  const [entries, setEntries] = useState<DuKyEntry[]>(loadDuKy);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data } = useBootstrap();
  const [realGarment, setRealGarment] = useState("ao-dai");
  const [realOccasion, setRealOccasion] = useState("tet-chua");
  const garmentById = new Map(data?.garments.map((g) => [g.id, g]));
  const occasionName = new Map(data?.occasions.map((o) => [o.id, o.name]));

  async function exportEntry(id: string) {
    const node = refs.current[id];
    if (!node) return;
    const url = await toPng(node, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `du-ky-${id.slice(0, 8)}.png`;
    a.click();
  }

  // "Tôi đã mặc thật": real photo, tagged by the user with garment + occasion
  function addReal(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      saveToDuKy({ kind: "real", image: String(reader.result), garment_id: realGarment, occasion_id: realOccasion, label: null });
      track("duky_save", { kind: "real", garment_id: realGarment });
      setEntries(loadDuKy());
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="font-hand text-4xl">Du Ký của tôi</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <select value={realGarment} onChange={(e) => setRealGarment(e.target.value)} className="rounded border px-2 py-1">
          {data?.garments.map((g) => <option key={g.id} value={g.id}>{g.name_vi}</option>)}
        </select>
        <select value={realOccasion} onChange={(e) => setRealOccasion(e.target.value)} className="rounded border px-2 py-1">
          {data?.occasions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      <label className="inline-block cursor-pointer underline">
        + Tôi đã mặc thật (thêm ảnh)
        <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && addReal(e.target.files[0])} />
      </label>
      </div>

      {entries.length === 0 && <p className="mt-6 text-stone-500">Chưa có trang nào. Hãy phối một look và lưu lại.</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <div key={e.id} className="space-y-2">
            <div ref={(el) => { refs.current[e.id] = el; }} className="paper rounded-lg p-3 shadow">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.image} alt="" className="aspect-[3/4] w-full rounded object-cover" />
                {e.kind === "ai" ? (
                  // burned into the exported PNG, on the photo itself: cropping the picture keeps the label
                  <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-sm font-semibold text-white">
                    {e.sample ? "Ảnh mẫu tạo sẵn" : "Ảnh minh họa AI"}
                  </span>
                ) : (
                  <span className="font-hand absolute right-2 top-2 rotate-[-8deg] rounded-md border-2 border-[#B5452E] bg-white/80 px-2 py-0.5 text-lg text-[#B5452E]">
                    Đã mặc thật
                  </span>
                )}
              </div>
              <p className="mt-2 font-hand text-xl">{garmentById.get(e.garment_id)?.name_vi ?? e.garment_id}</p>
              <p className="text-xs text-stone-600">{garmentById.get(e.garment_id)?.period}</p>
              <p className="text-xs text-stone-600">{occasionName.get(e.occasion_id)}</p>
              <p className="text-[10px] text-stone-400">Nguồn: {garmentById.get(e.garment_id)?.sources.slice(0, 2).join(", ")}</p>
              {e.kind === "ai" ? (
                <p className="text-xs text-stone-500">
                  {e.sample ? "Ảnh mẫu tạo sẵn" : "Ảnh minh họa AI"} · Compass: {e.label ? `${VERDICT[e.label] ?? ""} ${e.label}` : "—"}
                </p>
              ) : (
                // the app never checks a real photo, so it claims nothing about it
                <p className="text-xs text-stone-500">Ảnh mặc thật · trang phục và dịp do bạn tự ghi</p>
              )}
            </div>
            <button onClick={() => exportEntry(e.id)} className="text-sm underline">Xuất ảnh để chia sẻ</button>
          </div>
        ))}
      </div>
    </main>
  );
}
