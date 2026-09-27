"use client";

import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { loadDuKy, saveToDuKy } from "@/lib/duky";
import type { DuKyEntry } from "@/lib/types";

export default function DuKyView() {
  // Rendered client-only (see app/du-ky/page.tsx), so localStorage is safe here
  const [entries, setEntries] = useState<DuKyEntry[]>(loadDuKy);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  async function exportEntry(id: string) {
    const node = refs.current[id];
    if (!node) return;
    const url = await toPng(node, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `du-ky-${id.slice(0, 8)}.png`;
    a.click();
  }

  // "Tôi đã mặc thật": real photo, tagged by the user.
  // TODO(A): let the user pick garment + occasion instead of the defaults below.
  function addReal(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      saveToDuKy({ kind: "real", image: String(reader.result), garment_id: "ao-dai", occasion_id: "tet-chua", label: null });
      setEntries(loadDuKy());
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="font-hand text-4xl">Du Ký của tôi</h1>
      <label className="mt-3 inline-block cursor-pointer text-sm underline">
        + Tôi đã mặc thật (thêm ảnh)
        <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && addReal(e.target.files[0])} />
      </label>

      {entries.length === 0 && <p className="mt-6 text-stone-500">Chưa có trang nào. Hãy phối một look và lưu lại.</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <div key={e.id} className="space-y-2">
            <div ref={(el) => { refs.current[e.id] = el; }} className="paper rounded-lg p-3 shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.image} alt="" className="aspect-[3/4] w-full rounded object-cover" />
              {/* TODO(A): show garment name, period, one-line note and source from the garment data */}
              <p className="mt-2 font-hand text-xl">{e.garment_id}</p>
              <p className="text-xs text-stone-500">
                {e.kind === "real" ? "Tôi đã mặc thật" : "Ảnh minh họa AI"} · {e.label ?? "—"} · Mặc đúng ✓
              </p>
            </div>
            <button onClick={() => exportEntry(e.id)} className="text-sm underline">Xuất ảnh để chia sẻ</button>
          </div>
        ))}
      </div>
    </main>
  );
}
