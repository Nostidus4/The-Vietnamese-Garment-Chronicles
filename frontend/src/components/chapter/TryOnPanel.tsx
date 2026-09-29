"use client";

import { useState } from "react";
import { API_URL, tryOn } from "@/lib/api";
import { saveToDuKy } from "@/lib/duky";
import { sourceOf } from "@/lib/sources";
import type { Bootstrap, CompassState, Selection, TryOnResult } from "@/lib/types";

// same labels as backend/app/models.py LABELS (⛔ has none: the original look is never saved)
const LABEL_OF: Record<CompassState, string | null> = { fit: "Authentic", adapted: "Adapted", review: "Inspired", distorted: null };

/** What the Compass changed between the viewer's look and the one it rendered: "đổi X → Y" or "bỏ X". */
function swaps(data: Bootstrap, from: Selection, to: Selection): string[] {
  const out: string[] = [];
  const acc = (id: string) => data.accessories[id]?.name_vi ?? id;
  const col = (id: string) => data.colors[id]?.name ?? id;
  const diff = (a: string[], b: string[], name: (id: string) => string, what: string) => {
    const gone = a.filter((x) => !b.includes(x));
    const added = b.filter((x) => !a.includes(x));
    gone.forEach((x, i) => out.push(added[i] ? `Đổi ${what}${name(x)} → ${name(added[i])}` : `Bỏ ${what}${name(x)}`));
  };
  diff(from.accessories, to.accessories, acc, "");
  diff(from.colors, to.colors, col, "màu ");
  const zones = to.modifications.map((m) => m.zone);
  from.modifications.filter((m) => !zones.includes(m.zone)).forEach((m) => out.push(`Giữ nguyên ${m.zone} như chuẩn (bỏ thay đổi “${m.change}”)`));
  return out;
}

export function TryOnPanel({
  selection,
  regionId,
  data,
}: {
  selection: Selection;
  regionId: string;
  data: Bootstrap;
}) {
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

  // ⛔ looks are never rendered; their alternative is, and it can be saved with its own verdict
  const saveLabel = result
    ? result.rendered_alternative
      ? result.compass.alternative_state && LABEL_OF[result.compass.alternative_state]
      : result.compass.label
    : null;

  async function run() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      setResult(
        await tryOn(selection, photo ? { photo } : { avatarId: "default" }),
      );
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
        <input
          type="file"
          accept="image/*"
          className="mt-1 block"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
      </label>
      <button
        disabled={busy}
        onClick={run}
        className="rounded-full bg-stone-800 px-5 py-2 text-amber-50 disabled:opacity-50"
      >
        {busy
          ? "Đang dựng ảnh…"
          : photo
            ? "Thử bằng ảnh của tôi"
            : "Thử bằng avatar"}
      </button>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {result?.rendered_alternative && <AlternativeSteps data={data} result={result} chosen={selection} />}
      {result && !image && (
        <p className="text-sm text-stone-500">
          Chưa có ảnh (thiếu API key và ảnh dự phòng).
        </p>
      )}
      {image && (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Kết quả thử đồ"
            className="max-h-[480px] rounded"
          />
          <figcaption className="text-xs text-stone-500">
            {result?.label_note}
          </figcaption>
        </figure>
      )}
      {image && result && saveLabel && (
        <button
          disabled={saved}
          onClick={() => {
            saveToDuKy({
              kind: "ai",
              image,
              garment_id: result.rendered_selection.garment_id,
              occasion_id: result.rendered_selection.occasion_id,
              label: saveLabel, // the alternative is saved with the verdict of what was actually rendered
            });
            setSaved(true);
          }}
          className="rounded-full border border-stone-800 px-4 py-2 text-sm"
        >
          {saved ? "Đã lưu vào Du Ký ✓" : "Lưu vào Du Ký của tôi"}
        </button>
      )}
      {saved && (
         
        <a
          href={`/?region=${regionId}&page=own`}
          className="font-hand self-start text-lg text-[#8a4b2a] underline"
        >
          Dán ảnh vào sổ của Bà →
        </a>
      )}
    </section>
  );
}

/** ⛔ → alternative, told in four steps so nobody thinks the app broke: your look, why not, Tèo's swap, the image. */
function AlternativeSteps({ data, result, chosen }: { data: Bootstrap; result: TryOnResult; chosen: Selection }) {
  const bad = result.compass.triggers.filter((t) => t.state === "distorted");
  const changes = swaps(data, chosen, result.rendered_selection);
  const after = result.compass.alternative_state;
  return (
    <ol className="m-0 list-none space-y-3 rounded-lg border-2 border-red-300 bg-red-50/60 p-4 text-sm">
      <li>
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-stone-500">1 · Lựa chọn của bạn</p>
        <p className="m-0 mt-1">{bad.map((t) => t.target_name).join(", ") || "Một chi tiết trong look"}</p>
      </li>
      <li>
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-stone-500">2 · ⛔ Vì sao không dựng look này</p>
        {bad.map((t) => (
          <div key={t.target} className="mt-1">
            <p className="m-0">
              <b>{t.target_name}:</b> {t.why}
            </p>
            {t.sources.length > 0 && (
              <p className="m-0 mt-0.5 text-xs text-stone-600">
                Nguồn:{" "}
                {t.sources.map((id, i) => {
                  const s = sourceOf(data, id);
                  return (
                    <span key={id}>
                      {i > 0 && " · "}
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                          {s.title}
                        </a>
                      ) : (
                        s.title
                      )}
                    </span>
                  );
                })}
              </p>
            )}
          </div>
        ))}
      </li>
      <li>
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-stone-500">3 · Đề xuất của Tèo</p>
        <ul className="m-0 mt-1 list-disc pl-5">
          {(changes.length ? changes : ["Bỏ chi tiết gây sai lệch"]).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {bad[0] && <p className="m-0 mt-1 italic text-stone-700">Tèo: “{bad[0].teo}”</p>}
        {after && (
          <p className="m-0 mt-1 text-xs text-stone-600">
            Sau khi đổi, Compass đánh giá: <b>{LABEL_OF[after] ?? after}</b>
          </p>
        )}
      </li>
      <li>
        <p className="m-0 text-xs font-semibold uppercase tracking-wider text-stone-500">4 · Ảnh đã dựng theo đề xuất</p>
      </li>
    </ol>
  );
}
