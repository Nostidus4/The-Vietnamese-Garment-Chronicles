"use client";

import { useState } from "react";
import { API_URL, tryOn } from "@/lib/api";
import { saveToDuKy } from "@/lib/duky";
import type { Selection, TryOnResult } from "@/lib/types";

export function TryOnPanel({ selection }: { selection: Selection }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const image = result?.image_base64
    ? `data:image/png;base64,${result.image_base64}`
    : result?.fallback_url
      ? `${API_URL}${result.fallback_url}` // e.g. /media/fallback/ao-dai.png
      : null;

  async function run() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      setResult(await tryOn(selection, photo ? { photo } : { avatarId: "default" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không dựng được ảnh");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="paper space-y-3 rounded-lg p-5">
      <h3 className="font-semibold">Thử lên người</h3>
      <label className="block text-sm">
        Ảnh của bạn (không bắt buộc, không lưu trên máy chủ):
        <input type="file" accept="image/*" className="mt-1 block" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </label>
      <button disabled={busy} onClick={run} className="rounded-full bg-stone-800 px-5 py-2 text-amber-50 disabled:opacity-50">
        {busy ? "Đang dựng ảnh…" : photo ? "Thử bằng ảnh của tôi" : "Thử bằng avatar"}
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {result && !image && <p className="text-sm text-stone-500">Chưa có ảnh (thiếu API key và ảnh dự phòng).</p>}
      {result?.rendered_alternative && (
        <p className="text-sm text-red-700">⛔ Look gốc không được dựng. Đây là phương án thay thế.</p>
      )}
      {image && (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Kết quả thử đồ" className="max-h-[480px] rounded" />
          <figcaption className="text-xs text-stone-500">{result?.label_note}</figcaption>
        </figure>
      )}
      {image && result?.compass.label && (
        <button
          disabled={saved}
          onClick={() => {
            saveToDuKy({
              kind: "ai",
              image,
              garment_id: selection.garment_id,
              occasion_id: selection.occasion_id,
              label: result.compass.label,
            });
            setSaved(true);
          }}
          className="rounded-full border border-stone-800 px-4 py-2 text-sm"
        >
          {saved ? "Đã lưu vào Du Ký ✓" : "Lưu vào Du Ký của tôi"}
        </button>
      )}
    </section>
  );
}
