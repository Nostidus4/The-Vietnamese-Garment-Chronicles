"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGarments, getOccasions, runCompass } from "@/lib/api";
import type { CompassResult, GarmentsDoc, OccasionsDoc, Selection } from "@/lib/types";
import { Builder } from "./Builder";
import { CompassPanel } from "./CompassPanel";
import { StoryCard } from "./StoryCard";
import { TryOnPanel } from "./TryOnPanel";

export function ChapterView({ regionId }: { regionId: string }) {
  const [doc, setDoc] = useState<GarmentsDoc | null>(null);
  const [occ, setOcc] = useState<OccasionsDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [compass, setCompass] = useState<CompassResult | null>(null);

  useEffect(() => {
    Promise.all([getGarments(), getOccasions()])
      .then(([g, o]) => {
        setDoc(g);
        setOcc(o);
        const first = g.garments.find((x) => x.chapter === regionId);
        if (first) {
          setSel({ garment_id: first.id, occasion_id: first.occasions[0], vibe: "traditional", colors: [], accessories: [], modifications: [] });
        }
      })
      .catch(() => setError("Không kết nối được backend. Hãy chạy FastAPI ở cổng 8000."));
  }, [regionId]);

  // Re-run the Compass on every change
  useEffect(() => {
    if (sel) runCompass(sel).then(setCompass).catch(() => setCompass(null));
  }, [sel]);

  const region = occ?.regions.find((r) => r.id === regionId);
  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!doc || !occ || !region) return <p className="p-8">Đang lật trang…</p>;
  if (region.status === "locked") {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="font-hand text-4xl">{region.name}</h1>
        <p className="mt-4">🔒 {region.note}. Chương này sẽ mở khi nội dung được cộng đồng cùng xây dựng và thẩm định.</p>
        <Link href="/" className="mt-6 inline-block underline">← Về bản đồ</Link>
      </main>
    );
  }

  const garments = doc.garments.filter((g) => g.chapter === regionId);
  const garment = garments.find((g) => g.id === sel?.garment_id) ?? garments[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Link href="/" className="text-sm underline">← Về bản đồ</Link>
        <h1 className="font-hand text-4xl">{region.name}</h1>
        {garments.length > 1 && (
          <div className="flex gap-2">
            {garments.map((g) => (
              <button
                key={g.id}
                onClick={() => sel && setSel({ ...sel, garment_id: g.id, colors: [], accessories: [] })}
                className={`rounded-full border px-4 py-1 ${g.id === garment.id ? "bg-stone-800 text-amber-50" : ""}`}
              >
                {g.name_vi}
              </button>
            ))}
          </div>
        )}
        <StoryCard garment={garment} />
      </div>
      {sel && (
        <div className="space-y-4">
          <Builder garment={garment} doc={doc} occasions={occ.occasions} value={sel} onChange={setSel} />
          <CompassPanel result={compass} />
          <TryOnPanel selection={sel} />
        </div>
      )}
    </main>
  );
}
