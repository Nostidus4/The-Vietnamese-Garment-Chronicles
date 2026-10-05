"use client";

// One page of the Du Ký (#20): a time the reader wore, or plans to wear, Việt phục.
// "Sắp đi" pages also carry the preparation (#25); every page has Tèo's sourced note (#26) and the region stamp (#24).

import { useEffect, useRef, useState } from "react";
import { getShops, getWeatherOn } from "@/lib/api";
import { addPhoto, takeOutPage, updatePage, usePhotoUrl, type DuKyPage, type PhotoRef } from "@/lib/dukyBook";
import { cited } from "@/lib/sources";
import { track } from "@/lib/track";
import type { Bootstrap, Shop } from "@/lib/types";
import { asset } from "@/lib/base";

const INK = "#27354f";
const ACT = "rounded-full border border-stone-400/80 bg-white/40 px-2.5 py-1 leading-tight hover:bg-white/80";
const VERDICT: Record<string, string> = { Authentic: "✅", Adapted: "✨", Inspired: "⚠️" };

export function formatDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${Number(day)}/${Number(m)}/${y}`;
}

/** Tèo's note for a page: one sourced fact of the garment, chosen from the page id so it stays the same. */
export function teoFact(data: Bootstrap, page: DuKyPage) {
  const g = data.garments.find((x) => x.id === page.garment_id);
  // only facts with a vetted source: Du Ký pages are exported and shared (#50)
  const facts = (g?.facts ?? []).filter((f) => cited(data, f.sources).length > 0);
  if (!facts.length) return null;
  const n = [...page.id].reduce((a, c) => a + c.charCodeAt(0), 0) % facts.length;
  const f = facts[n];
  return { text: f.text, source: cited(data, f.sources)[0] };
}

export function Photo({ photo, className = "", big = false }: { photo: PhotoRef; className?: string; big?: boolean }) {
  const url = usePhotoUrl(photo.id);
  return (
    <figure className={`relative m-0 bg-white p-1.5 pb-2 shadow-[0_4px_10px_rgba(60,35,10,0.25)] ${className}`}>
      <div className={`relative w-full overflow-hidden bg-stone-100 ${big ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- an object URL from IndexedDB
          <img src={url} alt={photo.kind === "real" ? "Ảnh mặc thật" : photo.kind === "card" ? "Thẻ Việt phục" : "Ảnh thử đồ"} className={`h-full w-full ${photo.kind === "card" ? "object-contain" : "object-cover"}`} />
        )}
        {photo.kind === "card" ? (
          <span className="absolute bottom-1 left-1 rounded bg-[#8a4b2a]/85 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">Thẻ búp bê giấy</span>
        ) : photo.kind === "ai" ? (
          <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
            {photo.sample ? "Ảnh mẫu tạo sẵn" : "Ảnh minh họa AI"}
          </span>
        ) : (
          <span className="font-hand absolute right-1 top-1 rotate-[-8deg] rounded border-2 border-[#B5452E] bg-white/80 px-1 text-[0.7rem] text-[#B5452E]">
            Đã mặc thật
          </span>
        )}
      </div>
    </figure>
  );
}

/**
 * The page's stamp says what the page is (#63): bold "ĐÃ MẶC" only with a real photo (the one the Tủ tem counts),
 * "ĐÃ THỬ" for try-on pictures, "SẮP ĐI" for a plan with nothing yet, and a dashed "ĐÃ MẶC" that says what is missing.
 */
function RegionStamp({ page, place }: { page: DuKyPage; place: string }) {
  const real = page.photos.some((p) => p.kind === "real");
  const label = real || page.status === "worn" ? "ĐÃ MẶC" : page.photos.length ? "ĐÃ THỬ" : "SẮP ĐI";
  const hint = real ? `Tem đã mặc ${place}, đã vào Tủ tem` : "Dán ảnh con mặc thật để tem này đậm lên và vào Tủ tem";
  return (
    <div
      className={`pointer-events-none flex h-[3.4rem] w-[3.4rem] shrink-0 rotate-[-10deg] flex-col items-center justify-center rounded-full border-[2.5px] text-center ${
        real ? "border-[#2F4A6D]/80 text-[#2F4A6D]" : "border-dashed border-stone-400/70 text-stone-400"
      }`}
      aria-label={`Tem ${label.toLowerCase()} ${place}. ${hint}`}
      title={hint}
    >
      <span className="text-[0.48rem] tracking-[0.16em]">{label}</span>
      <span className="font-display px-0.5 text-[0.6rem] leading-tight">{place}</span>
    </div>
  );
}

/** Sắp đi: what to keep, the forecast for that day, where to rent (#25). */
function Preparation({ page, data }: { page: DuKyPage; data: Bootstrap }) {
  const g = data.garments.find((x) => x.id === page.garment_id);
  const keep = g?.zones.filter((z) => z.level === "keep") ?? [];
  const [w, setW] = useState<Awaited<ReturnType<typeof getWeatherOn>> | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  useEffect(() => {
    let alive = true;
    if (page.date) getWeatherOn(page.region_id, page.date).then((r) => alive && setW(r)).catch(() => {});
    getShops({ garment_id: page.garment_id }).then((r) => alive && setShops(r.slice(0, 2))).catch(() => {});
    return () => {
      alive = false;
    };
  }, [page.region_id, page.date, page.garment_id]);
  const tip = w?.available && w.is_hot ? w.tips?.find((t) => t.garment_id === page.garment_id)?.tip : null;
  return (
    <div className="mt-2 space-y-1.5 rounded-md bg-white/50 p-2 text-[0.72rem] leading-snug text-stone-700">
      {keep.length > 0 && (
        <p className="m-0">
          <b>Nhớ giữ nguyên:</b> {keep.map((z) => z.part).join(" · ")}
        </p>
      )}
      <p className="m-0">
        <b>Thời tiết:</b>{" "}
        {!page.date
          ? "chọn ngày đi để xem dự báo."
          : w?.available
            ? `cao nhất ${Math.round(w.max_c!)}°C${w.rain_chance != null ? `, khả năng mưa ${w.rain_chance}%` : ""}.`
            : w?.reason === "too_far"
              ? `sẽ có dự báo khi còn 16 ngày (khoảng ${w.days_until_forecast} ngày nữa).`
              : w?.reason === "past"
                ? "ngày này đã qua."
                : "chưa lấy được dự báo."}
        {tip && <span className="block text-[#8a4b2a]">Mặc cho mát: {tip}</span>}
      </p>
      {shops.length > 0 && (
        <p className="m-0">
          <b>Thuê/may:</b>{" "}
          {shops.map((s, i) => (
            <span key={s.id}>
              {i > 0 && " · "}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                  {s.name}
                </a>
              ) : (
                s.name
              )}{" "}
              ({s.city})
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export function DuKyPageView({
  page,
  data,
  compact = false,
  onExport,
  onShare,
}: {
  page: DuKyPage;
  data: Bootstrap;
  compact?: boolean; // inside the flipbook: every line counts
  onExport?: (p: DuKyPage) => void;
  onShare?: (p: DuKyPage) => void;
}) {
  const g = data.garments.find((x) => x.id === page.garment_id);
  const region = data.regions.find((r) => r.id === page.region_id);
  const occasion = data.occasions.find((o) => o.id === page.occasion_id)?.name ?? page.occasion_id;
  const place = region?.name.split("/")[0].trim() ?? "";
  const fact = teoFact(data, page);
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(page.note);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false); // date, occasion and place can be changed after the page is made (#63)
  const [asking, setAsking] = useState(false); // "Xóa trang này?" on the page itself, not the browser's confirm

  async function addReal(f: File) {
    setBusy(true);
    try {
      await addPhoto(page.id, f, "real");
      track("duky_save", { kind: "real", garment_id: page.garment_id });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col" style={{ color: INK }}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 flex items-center gap-2 text-[0.62rem] tracking-[0.25em] text-stone-500">
            {page.status === "planned" ? "SẮP ĐI" : "ĐÃ MẶC"}
            <button type="button" onClick={() => setEditing((v) => !v)} className="tracking-normal text-[#8a4b2a] underline" aria-expanded={editing}>
              {editing ? "xong" : "✎ sửa"}
            </button>
          </p>
          <p className="font-hand m-0 text-[1.05rem] leading-tight">
            {occasion}
            {page.place ? ` · ${page.place}` : ""}
          </p>
          <p className="m-0 text-[0.7rem] text-stone-600">
            {g?.name_vi ?? page.garment_id}
            {page.date ? ` · ${formatDate(page.date)}` : ""}
            {page.compass_label ? ` · ${VERDICT[page.compass_label] ?? ""} ${page.compass_label}` : ""}
          </p>
        </div>
        <RegionStamp page={page} place={place} />
      </div>
      {editing && (
        <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-md bg-white/55 p-2 text-[0.72rem]">
          <label className="flex flex-col gap-0.5">
            Ngày
            <input type="date" lang="vi" value={page.date ?? ""} onChange={(e) => updatePage(page.id, { date: e.target.value || null })} className="rounded border border-stone-300 bg-white/80 px-1.5 py-1" />
          </label>
          <label className="flex flex-col gap-0.5">
            Dịp
            <select value={page.occasion_id} onChange={(e) => updatePage(page.id, { occasion_id: e.target.value })} className="rounded border border-stone-300 bg-white/80 px-1.5 py-1">
              {data.occasions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-0.5">
            Nơi
            <input defaultValue={page.place} maxLength={60} placeholder="Chùa, phố, nhà bạn…" onBlur={(e) => e.target.value.trim() !== page.place && updatePage(page.id, { place: e.target.value.trim() })} className="rounded border border-stone-300 bg-white/80 px-1.5 py-1" />
          </label>
        </div>
      )}

      {page.photos.length > 0 ? (
        <div className={`mt-2 grid gap-2 ${page.photos.length === 1 ? `grid-cols-1 ${compact ? "px-[24%]" : "px-[18%]"}` : page.photos.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {page.photos.map((ph, i) => (
            <Photo key={ph.id} photo={ph} className={i % 2 ? "rotate-[2deg]" : "rotate-[-2deg]"} />
          ))}
        </div>
      ) : (
        <p className="m-0 mt-2 rounded border-2 border-dashed border-stone-300 p-3 text-center text-[0.75rem] text-stone-500">Chưa có ảnh</p>
      )}

      {page.status === "planned" && <Preparation page={page} data={data} />}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 200))}
        onBlur={() => note !== page.note && updatePage(page.id, { note })}
        placeholder="Viết một dòng của con…"
        rows={compact ? 1 : 2}
        className="font-hand mt-2 w-full resize-none border-0 border-b border-stone-400 bg-transparent text-[1rem] leading-snug outline-none placeholder:text-stone-400"
        style={{ color: "#1f3a78" }}
        aria-label="Một dòng của con"
      />

      {fact && (
        <div className="mt-2 rotate-[-0.6deg] bg-[#fbe99a] px-2 py-1.5 text-[0.66rem] leading-snug text-[#1f3a78] shadow-[1px_3px_6px_rgba(60,40,0,0.2)]">
          {fact.text}
          <span className="mt-0.5 block text-[0.55rem] opacity-80">
            nguồn: {fact.source.title} – Tèo
          </span>
        </div>
      )}

      {/* the page's actions as small buttons with room between them, not five underlined words (#63) */}
      <div className="mt-auto flex flex-wrap gap-1.5 pt-2 text-[0.74rem]">
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && addReal(e.target.files[0])} />
        {asking ? (
          <span className="flex w-full flex-wrap items-center gap-2 rounded-md bg-[#f7e4c8] px-2 py-1.5">
            <span className="min-w-0 flex-1">Xóa trang này? Ảnh trên máy cũng xóa theo.</span>
            <button type="button" onClick={() => takeOutPage(page.id)} className="rounded-full bg-[#B5452E] px-2.5 py-1 leading-tight text-amber-50 hover:bg-[#9c3a26]">
              Xóa
            </button>
            <button type="button" onClick={() => setAsking(false)} className={ACT}>
              Thôi
            </button>
          </span>
        ) : (
          <>
            {page.photos.length < 3 && (
              <button type="button" disabled={busy} onClick={() => file.current?.click()} className={`${ACT} disabled:opacity-50`}>
                {page.status === "planned" ? "📷 Mình đã mặc rồi, dán ảnh" : "📷 Thêm ảnh"}
              </button>
            )}
            {onExport && (
              <button type="button" onClick={() => onExport(page)} className={ACT}>
                Xuất ảnh
              </button>
            )}
            {onShare && (
              <button type="button" onClick={() => onShare(page)} className={ACT}>
                {page.share ? "Link chia sẻ" : "Tạo link chia sẻ"}
              </button>
            )}
            <a href={asset(`/chapter/${page.region_id}/?garment=${page.garment_id}`)} className={ACT}>
              Mặc lại look
            </a>
            <button type="button" onClick={() => setAsking(true)} className="ml-auto rounded-full px-2.5 py-1 leading-tight text-stone-500 hover:bg-white/60">
              Xóa trang
            </button>
          </>
        )}
      </div>
    </div>
  );
}
