"use client";

// The mirror in Bà's fitting room: what the reader will look like. Before any render it shows a preview (the model in
// the reference garment, or the reader's own photo); while Gemini works a thread is sewn round the frame; after, the
// AI picture with a slider to compare it with the "before". The Compass verdict hangs on the frame like a shop tag.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { asset } from "@/lib/base";
import type { CompassResult } from "@/lib/types";
import { STATE } from "../chapter/CompassPanel";
import type { TryOn } from "./useTryOn";

export function Mirror({
  garmentId,
  garmentName,
  verdict,
  scoring,
  offline,
  tryon,
  onTag,
  children,
}: {
  garmentId: string;
  garmentName: string;
  verdict: CompassResult | null;
  scoring: boolean; // the Compass is still looking at this look
  offline: boolean;
  tryon: TryOn;
  onTag: () => void; // the tag on the frame opens the Compass's "why"
  children?: ReactNode; // laid over the glass: the ⛔ fork
}) {
  const photoUrl = useObjectUrl(tryon.photo);
  const [preview, setPreview] = useState(0); // 0 dressed preview → 1 reference garment → 2 nothing
  const [slide, setSlide] = useState(50);
  const before =
    photoUrl ?? [asset(`/garments/${garmentId}-preview.webp`), asset(`/garments/${garmentId}.webp`)][preview] ?? null;
  const after = tryon.image && !tryon.busy ? tryon.image : null;
  // with a picture on the glass, "before" is the plain model in a T-shirt (or the reader's photo), so the slider shows the change
  const plain = photoUrl ?? asset("/garments/avatar.webp");
  const tag = verdict ? STATE[verdict.state] : null;

  return (
    <figure className="mirror m-0 flex h-full min-h-0 flex-col items-center">
      <div className="mirror-frame relative">
        <div className="mirror-glass relative h-full w-full overflow-hidden">
          {/* the "before": preview or the reader's own photo; once a picture is in, the plain model */}
          {after ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export
            <img src={plain} alt="Trước khi mặc" className="absolute inset-0 h-full w-full object-contain" />
          ) : before ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export, and blob: URLs for the reader's photo
            <img
              key={before}
              src={before}
              alt={photoUrl ? "Ảnh của con" : `Người mẫu mặc ${garmentName}`}
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${tryon.busy ? "opacity-40" : ""}`}
              onError={() => !photoUrl && setPreview((n) => n + 1)}
            />
          ) : (
            <p className="absolute inset-0 m-0 grid place-items-center p-6 text-center text-sm text-stone-500">Chưa có ảnh xem trước cho bộ này.</p>
          )}

          {/* the "after": the AI picture, revealed from the left by the slider */}
          {after && (
            // eslint-disable-next-line @next/next/no-img-element -- a data: URL from the server
            <img
              src={after}
              alt={`Ảnh thử ${garmentName}`}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ clipPath: `inset(0 ${100 - slide}% 0 0)` }}
            />
          )}
          {after && (
            <>
              <span aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-amber-50/90 shadow" style={{ left: `${slide}%` }} />
              <span className="mirror-chip left-2 top-2">Sau</span>
              <span className="mirror-chip right-2 top-2">Trước</span>
            </>
          )}

          {/* sewing: a thread runs round the glass while Gemini works */}
          {tryon.busy && (
            <div className="absolute inset-0 grid place-items-center">
              <svg className="sewing absolute inset-0 h-full w-full" viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden>
                <rect x="3" y="3" width="94" height="127" rx="6" fill="none" />
              </svg>
              <div className="rounded-xl bg-[#140c07]/70 px-5 py-3 text-center text-amber-50 shadow-lg backdrop-blur-sm" role="status" aria-live="polite">
                <p className="font-hand m-0 text-[1.35rem]">Bà đang may lên người con…</p>
                <p className="m-0 mt-0.5 text-xs text-amber-100/80">{tryon.stageLabel}</p>
                <button type="button" onClick={tryon.cancel} className="mt-2 rounded-full border border-amber-100/60 px-4 py-1 text-xs hover:bg-amber-50/10">
                  Huỷ
                </button>
              </div>
            </div>
          )}
          {children}
        </div>

        {/* the Compass verdict hangs on the frame like a shop tag */}
        <button type="button" onClick={onTag} className={`mirror-tag ${tag ? "" : "mirror-tag-quiet"}`} aria-label="Compass: vì sao?">
          <span className="mirror-tag-hole" aria-hidden />
          <span className="block text-[0.6rem] uppercase tracking-[0.18em] opacity-70">Compass</span>
          <span className="block text-sm font-semibold leading-tight">
            {offline ? "cần máy chủ" : tag ? `${tag.icon} ${tag.name}` : scoring ? "đang chấm…" : "chưa chấm được"}
          </span>
          {tag && <span className="block text-[0.62rem] underline opacity-70">vì sao?</span>}
        </button>
      </div>

      {after && (
        <label className="mt-2 flex w-full max-w-[22rem] items-center gap-2 text-xs text-amber-50/80">
          <span>Sau</span>
          <input type="range" min={0} max={100} value={slide} onChange={(e) => setSlide(Number(e.target.value))} className="flex-1 accent-[#e3b04b]" aria-label="Kéo để so ảnh trước và sau" />
          <span>Trước</span>
        </label>
      )}
      <figcaption className="mirror-caption">
        {tryon.busy
          ? "Thường mất khoảng 10–20 giây"
          : after
            ? tryon.isSample
              ? "Ảnh mẫu tạo sẵn (máy chủ AI đang bận) · bấm Dựng lại để thử bằng AI"
              : (tryon.result?.label_note ?? "Ảnh minh hoạ AI")
            : photoUrl
              ? "Ảnh của con · bộ đã chọn sẽ được mặc lên ảnh này"
              : "Ảnh xem trước: người mẫu mặc bộ chuẩn · bấm Mặc lên người để thử bộ con chọn"}
      </figcaption>
      {tryon.error && <p className="m-0 mt-1 rounded bg-red-50/90 px-3 py-1 text-sm text-red-800">{tryon.error}</p>}
    </figure>
  );
}

/** A blob: URL for the reader's photo, revoked when it changes or the mirror goes away. */
function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  return url;
}
