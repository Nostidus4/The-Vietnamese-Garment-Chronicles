"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { runCompass } from "@/lib/api";
import type { CompassResult, Selection } from "@/lib/types";
import { useBootstrap } from "@/lib/useBootstrap";
import { Builder } from "./Builder";
import { CompassPanel } from "./CompassPanel";
import { StoryCard } from "./StoryCard";
import { TryOnPanel } from "./TryOnPanel";

export function ChapterView({
  regionId,
  garmentId,
}: {
  regionId: string;
  garmentId?: string;
}) {
  const { data, error } = useBootstrap();
  const [sel, setSel] = useState<Selection | null>(null);
  const [compass, setCompass] = useState<CompassResult | null>(null);

  const region = data?.regions.find((r) => r.id === regionId);
  const garments = data?.garments.filter((g) => g.region === regionId) ?? [];
  const first = garments.find((g) => g.id === garmentId) ?? garments[0]; // "Mặc thử" in the diary picks the garment
  // Default selection until the user picks something
  const current: Selection | null =
    sel ??
    (first
      ? {
          garment_id: first.id,
          occasion_id: first.occasions[0],
          vibe: "traditional",
          colors: [],
          accessories: [],
          modifications: [],
        }
      : null);

  // Re-run the Compass on every change
  useEffect(() => {
    if (!current) return;
    let alive = true;
    runCompass(current)
      .then((r) => alive && setCompass(r))
      .catch(() => alive && setCompass(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(current)]);

  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data) return <p className="p-8">Đang lật trang…</p>;
  if (!region)
    return (
      <p className="p-8">
        Không có vùng này.{" "}
        <Link href="/" className="underline">
          Về bản đồ
        </Link>
      </p>
    );
  if (region.status === "locked" || !current) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="font-hand text-4xl">{region.name}</h1>
        <p className="mt-4">🔒 {region.lock_note}</p>
        <Link href="/" className="mt-6 inline-block underline">
          ← Về bản đồ
        </Link>
      </main>
    );
  }

  const garment = garments.find((g) => g.id === current.garment_id) ?? first;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Link href="/" className="text-sm underline">
          ← Về bản đồ
        </Link>
        <h1 className="font-hand text-4xl">{region.name}</h1>
        {garments.length > 1 && (
          <div className="flex gap-2">
            {garments.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  setSel({
                    ...current,
                    garment_id: g.id,
                    colors: [],
                    accessories: [],
                    modifications: [],
                  })
                }
                className={`rounded-full border px-4 py-1 ${g.id === garment.id ? "bg-stone-800 text-amber-50" : ""}`}
              >
                {g.name_vi}
              </button>
            ))}
          </div>
        )}
        <StoryCard garment={garment} sources={data.sources} />
      </div>
      <div className="space-y-4">
        <Builder
          garment={garment}
          data={data}
          value={current}
          onChange={setSel}
        />
        <CompassPanel result={compass} sources={data.sources} />
        <TryOnPanel selection={current} regionId={regionId} data={data} />
      </div>
    </main>
  );
}
