"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HAS_API, runCompass, serverReady } from "@/lib/api";
import { track } from "@/lib/track";
import type { CompassResult, Selection } from "@/lib/types";
import { useBootstrap } from "@/lib/useBootstrap";
import { AskTeo } from "./AskTeo";
import { Builder } from "./Builder";
import { ChapterQuiz } from "./ChapterQuiz";
import { ComparePanel } from "./ComparePanel";
import { CompassPanel } from "./CompassPanel";
import { StoryCard } from "./StoryCard";
import { ShopList } from "./ShopList";
import { TryOnPanel } from "./TryOnPanel";
import { WeatherNote } from "./WeatherNote";

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

  // wake a sleeping server while the viewer is still choosing, not after they press "Thử"
  useEffect(() => {
    void serverReady();
  }, []);

  const region = data?.regions.find((r) => r.id === regionId);
  const garments = data?.garments.filter((g) => g.region === regionId) ?? [];
  // ?garment= is read in the browser: the page itself is prebuilt, one per region
  const wanted = garmentId ?? (typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("garment") ?? undefined) : undefined);
  const first = garments.find((g) => g.id === wanted) ?? garments[0]; // "Mặc thử" in the diary picks the garment
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

  // anonymous Impact events: which occasion was picked, and whether a flagged look got fixed
  const lastPick = useRef("");
  const flagged = useRef<Record<string, "review" | "distorted">>({});
  function report(sel: Selection, r: CompassResult) {
    track("compass_result", { state: r.state, garment_id: sel.garment_id, occasion_id: sel.occasion_id });
    const pick = `${sel.garment_id}/${sel.occasion_id}`;
    if (pick !== lastPick.current) {
      lastPick.current = pick;
      track("occasion_selected", { garment_id: sel.garment_id, occasion_id: sel.occasion_id, fits: !r.triggers.some((t) => t.type === "occasion") });
    }
    const was = flagged.current[sel.garment_id];
    if (r.state === "review" || r.state === "distorted") flagged.current[sel.garment_id] = r.state;
    else if (was) {
      track("look_fixed", { from_state: was, to_state: r.state, garment_id: sel.garment_id });
      delete flagged.current[sel.garment_id];
    }
  }

  // Re-run the Compass on every change
  useEffect(() => {
    if (!current) return;
    let alive = true;
    const sel = current;
    runCompass(sel)
      .then((r) => {
        if (!alive) return;
        setCompass(r);
        report(sel, r);
      })
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
      {!HAS_API && (
        // the static site (GitHub Pages) has no server: reading works, Compass / try-on / Hỏi Tèo do not
        <p className="m-0 rounded-md border border-dashed border-[#8a4b2a]/60 bg-[#f7e4c8]/70 px-4 py-2 text-sm text-[#6b3c12] lg:col-span-2">
          Bản web này chưa nối máy chủ: con đọc được câu chuyện và cách mặc, còn <b>Compass chấm look, thử đồ AI, Hỏi Tèo, thời tiết và
          cửa hàng</b> sẽ chạy khi nhóm bật máy chủ.
        </p>
      )}
      <div className="space-y-4">
        <Link href="/" className="text-sm underline">
          ← Về bản đồ
        </Link>
        <h1 className="font-hand text-4xl">{region.name}</h1>
        <WeatherNote regionId={regionId} garmentId={garment.id} place={region.name.split("/")[0].trim()} />
        <ChapterQuiz regionId={regionId} phase="pre" />
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
        <AskTeo key={garment.id} garment={garment} data={data} />
      </div>
      <div className="space-y-4">
        <Builder
          garment={garment}
          data={data}
          value={current}
          onChange={setSel}
        />
        <CompassPanel result={compass} sources={data.sources} />
        <ComparePanel current={current} data={data} onUse={setSel} />
        <TryOnPanel selection={current} regionId={regionId} data={data} />
        <ShopList garmentId={garment.id} garmentName={garment.name_vi} />
        <ChapterQuiz regionId={regionId} phase="post" />
      </div>
    </main>
  );
}
