"use client";

// F4: today's weather in the region (Open-Meteo, no key) and, when it is hot, how to wear this garment cooler.

import { useEffect, useState } from "react";
import { getWeather } from "@/lib/api";

type Weather = Awaited<ReturnType<typeof getWeather>>;

export function WeatherNote({ regionId, garmentId, place }: { regionId: string; garmentId: string; place: string }) {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    let alive = true;
    getWeather(regionId)
      .then((r) => alive && setW(r))
      .catch(() => alive && setW(null)); // weather is a nicety: no network, no note
    return () => {
      alive = false;
    };
  }, [regionId]);

  if (!w?.available || w.temperature_c === undefined) return null;
  const tip = w.is_hot ? w.tips?.find((t) => t.garment_id === garmentId)?.tip : null;
  return (
    <p className="font-hand m-0 rotate-[-0.6deg] text-lg leading-snug text-stone-600">
      ✎ Hôm nay ở {place} {Math.round(w.temperature_c)}°C{w.is_hot ? ", trời nóng." : "."}
      {tip && <span className="block text-base text-[#8a4b2a]">Mặc cho mát: {tip}</span>}
    </p>
  );
}
