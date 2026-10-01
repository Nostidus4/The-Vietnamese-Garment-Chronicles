"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL, RateLimited, serverReady, tryOn } from "@/lib/api";
import { addPage, addPhoto, dataUrlToBlob, ensureMigrated, newPage } from "@/lib/dukyBook";
import { track } from "@/lib/track";
import type { Bootstrap, CompassState, Selection, TryOnResult } from "@/lib/types";
import { asset } from "@/lib/base";
import { swaps } from "@/lib/lookSwaps";
import { retryLabel, secondsLeft, untilAborted, waitLabel, type WaitStage } from "@/lib/tryonWait";
import { zoneChanges } from "@/lib/zones";
import { MAIN_BUTTON, SIDE_BUTTON } from "./CompassStep";

// same labels as backend/app/models.py LABELS (⛔ has none: the original look is never saved)
const LABEL_OF: Record<CompassState, string | null> = { fit: "Authentic", adapted: "Adapted", review: "Inspired", distorted: null };

/** Step 3 of the try-on: optional photo, render, then save / render again / change the look. */
export function TryOnPanel({
  selection,
  alternative,
  regionId,
  data,
  onRestyle,
}: {
  selection: Selection;
  alternative: Selection | null; // ⛔ "Thử phương án thay thế": the server renders this swapped look instead
  regionId: string;
  data: Bootstrap;
  onRestyle: () => void;
}) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [wait, setWait] = useState<{ stage: WaitStage; since: number } | null>(null);
  const [retryAt, setRetryAt] = useState(0); // after a 429: when the limiter lets this visitor in again
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const busy = wait !== null;
  const countdown = retryLabel(secondsLeft(retryAt, now));
  const locked = busy || countdown !== null;

  // the clock behind the stage timer and the 429 countdown; idle otherwise
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [locked]);

  useEffect(() => () => abort.current?.abort(), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  const image = result?.image_base64
    ? `data:image/png;base64,${result.image_base64}`
    : result?.fallback_url
      ? `${API_URL}${result.fallback_url}` // e.g. /media/fallback/ao-dai.png
      : null;

  // no fresh render, only the pre-made fallback: it must never pass as an AI image of this look
  const isSample = !!result && !result.image_base64 && !!result.fallback_url;
  // ⛔ looks are never rendered; their alternative is, and it can be saved with its own verdict
  const saveLabel = result
    ? result.rendered_alternative
      ? result.compass.alternative_state && LABEL_OF[result.compass.alternative_state]
      : result.compass.label
    : null;

  async function run() {
    const ctl = new AbortController();
    abort.current = ctl;
    setNow(Date.now());
    setWait({ stage: "waking", since: Date.now() });
    setSaved(false);
    setToast(false);
    setError(null);
    try {
      // a sleeping server must wake before the try-on clock starts, or the first try falls back
      if (!(await untilAborted(serverReady(), ctl.signal))) throw new Error("Máy chủ chưa thức dậy. Bạn thử lại sau ít phút nhé.");
      setWait({ stage: "rendering", since: Date.now() });
      const r = await tryOn(selection, photo ? { photo, signal: ctl.signal } : { avatarId: "default", signal: ctl.signal });
      setResult(r);
      track("tryon", {
        garment_id: r.rendered_selection.garment_id,
        alternative: r.rendered_alternative,
        sample: !r.image_base64 && !!r.fallback_url,
      });
    } catch (e) {
      if (ctl.signal.aborted) return; // the viewer pressed Huỷ (or left the page)
      if (e instanceof RateLimited) setRetryAt(Date.now() + e.retryAfterS * 1000);
      setError(e instanceof Error ? e.message : "Không dựng được ảnh");
    } finally {
      if (abort.current === ctl) {
        abort.current = null;
        setWait(null);
      }
    }
  }

  async function save() {
    if (!result || !image) return;
    // one "lần mặc" in the reader's Du Ký: Sắp đi, with this try-on as its first photo
    const sel = result.rendered_selection;
    setSaved(true);
    await ensureMigrated(data.garments);
    const page = addPage(
      newPage({
        region_id: regionId,
        garment_id: sel.garment_id,
        occasion_id: sel.occasion_id,
        look: sel,
        compass_label: saveLabel, // the alternative is saved with the verdict of what was actually rendered
        compass_state: result.rendered_alternative ? result.compass.alternative_state : result.compass.state,
      }),
    );
    await addPhoto(page.id, await dataUrlToBlob(image), "ai", isSample); // shrunk to JPEG inside addPhoto
    setToast(true);
    track("duky_save", { kind: "ai", garment_id: sel.garment_id });
  }

  const changes = alternative ? swaps(data, selection, alternative) : [];

  return (
    <div className="space-y-3">
      <Outfit data={data} selection={alternative ?? selection} />
      {alternative && (
        <div className="rounded-md border border-red-300 bg-red-50/60 px-3 py-2 text-sm">
          <p className="m-0 font-semibold">Phương án thay thế (look ⛔ không được dựng):</p>
          <ul className="m-0 mt-1 list-disc pl-5">
            {(changes.length ? changes : ["Bỏ chi tiết gây sai lệch"]).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {!result && (
        <>
          <p className="m-0 text-sm text-stone-600">
            Ảnh của bạn: không bắt buộc, không có ảnh thì dùng người mẫu · nửa người, đứng thẳng, nền đơn giản. Ảnh không lưu trên máy chủ.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className={`${SIDE_BUTTON} cursor-pointer ${locked ? "pointer-events-none opacity-50" : ""}`}>
              📷 {photo ? "Đổi ảnh" : "Chọn ảnh của bạn"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={locked}
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            {photo && (
              <>
                <span className="max-w-[12rem] truncate text-stone-600">{photo.name}</span>
                <button type="button" disabled={locked} onClick={() => setPhoto(null)} className="underline disabled:opacity-50">
                  Bỏ ảnh
                </button>
              </>
            )}
          </div>
        </>
      )}

      {(!result || busy) && (
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={locked} onClick={run} className={MAIN_BUTTON}>
            {wait ? waitLabel(wait.stage, now - wait.since) : (countdown ?? (photo ? "Dựng ảnh bằng ảnh của tôi" : "Dựng ảnh với người mẫu"))}
          </button>
          {busy && (
            <button onClick={() => abort.current?.abort()} className="rounded-full border border-stone-800 px-4 py-2 text-sm">
              Huỷ
            </button>
          )}
        </div>
      )}

      {error && <p className="m-0 text-sm text-red-700">{error}</p>}
      {result && !image && <p className="m-0 text-sm text-stone-500">Chưa có ảnh (thiếu API key và ảnh dự phòng).</p>}
      {image && (
        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Kết quả thử đồ" className={`max-h-[480px] max-w-full rounded ${busy ? "opacity-40" : ""}`} />
          <figcaption className="text-xs text-stone-500">
            {isSample ? "Ảnh mẫu tạo sẵn (máy chủ AI đang bận), bấm Dựng lại để thử bằng AI" : result?.label_note}
          </figcaption>
        </figure>
      )}
      {result && !busy && (
        <div className="flex flex-wrap items-center gap-2">
          {image && saveLabel && (
            <button type="button" disabled={saved} onClick={save} className={MAIN_BUTTON}>
              {saved ? "Đã lưu vào Du Ký ✓" : "Lưu vào Du Ký"}
            </button>
          )}
          <button type="button" disabled={locked} onClick={run} className={`${SIDE_BUTTON} disabled:opacity-50`}>
            {countdown ?? "↻ Dựng lại"}
          </button>
          <button type="button" onClick={onRestyle} className={SIDE_BUTTON}>
            ← Đổi đồ
          </button>
        </div>
      )}
      {saved && (
        <a href="#shops" className="block text-sm underline">
          Muốn mặc thật? Xem nơi thuê hoặc may ↓
        </a>
      )}
      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg bg-stone-900 px-4 py-3 text-sm text-amber-50 shadow-lg">
          <span>Đã lưu vào Du Ký ✓</span>
          <a href={asset("/du-ky")} className="ml-auto font-semibold text-amber-200 underline">
            Mở Du Ký
          </a>
          <button type="button" aria-label="Đóng" onClick={() => setToast(false)} className="text-amber-50/70">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/** The look being tried, in one line: garment · occasion · colours · accessories · changed zones. */
function Outfit({ data, selection: s }: { data: Bootstrap; selection: Selection }) {
  const parts = [
    data.garments.find((g) => g.id === s.garment_id)?.name_vi ?? s.garment_id,
    data.occasions.find((o) => o.id === s.occasion_id)?.name ?? s.occasion_id,
    s.colors.map((c) => data.colors[c]?.name ?? c).join(" + ") || "màu mặc định",
    s.accessories.map((a) => data.accessories[a]?.name_vi ?? a).join(", ") || "không phụ kiện",
    ...zoneChanges(data.garments.find((g) => g.id === s.garment_id) ?? { zones: [] }, s),
  ];
  return <p className="m-0 text-sm text-stone-700">Bộ sẽ dựng: {parts.join(" · ")}</p>;
}
