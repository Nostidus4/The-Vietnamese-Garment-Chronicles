"use client";

import Link from "next/link";
// The public page behind a "Tạo link" (#27): what the reader chose to share, nothing more.

import { useEffect, useState } from "react";
import { API_URL, getShare, HAS_API, type SharedPage } from "@/lib/api";
import { useBootstrap } from "@/lib/useBootstrap";

const MONTH = (m: string) => {
  const [y, mm] = m.split("-");
  return `tháng ${Number(mm)}/${y}`;
};

export function SharedView({ id }: { id: string }) {
  const { data } = useBootstrap();
  const [page, setPage] = useState<SharedPage | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (id) getShare(id).then(setPage).catch(() => setMissing(true));
  }, [id]);

  // a link cut short before "?id=…": not a page that was taken down (#63)
  if (!id)
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="font-hand text-2xl text-stone-600">Link này bị thiếu mã trang. Con nhờ người gửi chép lại cả đường link nhé.</p>
        <Link href="/" className="mt-4 inline-block underline">Mở Việt Phục Du Ký</Link>
      </main>
    );

  if (missing)
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="font-hand text-2xl text-stone-600">
          {/* a build without the server cannot open any shared page: say so, not that the page is gone (#48) */}
          {HAS_API ? "Trang này không còn nữa, hoặc người viết đã gỡ link." : "Bản đọc thử này chưa mở được link chia sẻ. Con mở link trên bản đầy đủ nhé."}
        </p>
        <Link href="/" className="mt-4 inline-block underline">Mở Việt Phục Du Ký</Link>
      </main>
    );
  if (!page || !data)
    return (
      <main className="desk grid min-h-screen place-items-center px-4 py-8">
        {/* the paper the page will be on, while it loads */}
        <div className="paper w-full max-w-md animate-pulse rounded-md p-6 shadow-[0_10px_24px_rgba(20,8,0,0.4)]" aria-busy="true">
          <p className="font-hand m-0 text-center text-xl text-stone-500">Đang mở trang Du Ký…</p>
          <div className="mx-auto mt-4 aspect-[3/4] w-2/3 rounded bg-stone-300/50" />
          <div className="mt-4 h-3 w-3/4 rounded bg-stone-300/50" />
          <div className="mt-2 h-3 w-1/2 rounded bg-stone-300/50" />
        </div>
      </main>
    );

  const m = page.meta;
  const g = data.garments.find((x) => x.id === m.garment_id);
  const occasion = data.occasions.find((o) => o.id === m.occasion_id)?.name ?? m.occasion_id;
  const place = data.regions.find((r) => r.id === m.region_id)?.name.split("/")[0].trim() ?? "";
  return (
    <main className="desk min-h-screen px-4 py-8">
      {/* who sent this, for someone who has never opened the app (#54) */}
      <header className="mx-auto mb-4 max-w-md text-center text-amber-50">
        <p className="font-hand m-0 text-2xl">Việt Phục Du Ký</p>
        <p className="m-0 mt-1 text-sm text-amber-50/85">
          Một người bạn chia sẻ với bạn một lần họ mặc Việt phục, ghi trong cuốn sổ đưa người trẻ đi qua trang phục truyền thống từng vùng.
        </p>
      </header>
      <article className="paper mx-auto max-w-md rounded-md p-6 text-[#27354f] shadow-[0_10px_24px_rgba(20,8,0,0.4)]">
        <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-500">
          TRANG DU KÝ · {m.status === "planned" ? "SẮP ĐI" : "ĐÃ MẶC"} · {place.toUpperCase()}
        </p>
        <h1 className="font-hand m-0 mt-1 text-3xl font-normal">{occasion}</h1>
        <p className="m-0 text-sm text-stone-600">
          {g?.name_vi} · {MONTH(m.month)}
          {m.compass_label ? ` · ${m.compass_label}` : ""}
        </p>
        <div className={`mt-4 grid gap-3 ${page.photo_urls.length > 1 ? "grid-cols-2" : "px-10"}`}>
          {page.photo_urls.map((u, i) => (
            <figure key={u} className="relative m-0 bg-white p-2 pb-3 shadow-[0_6px_14px_rgba(60,35,10,0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- a photo the reader shared */}
              <img
                src={u.startsWith("/") ? `${API_URL}${u}` : u}
                alt={m.photo_kinds[i] === "real" ? `Ảnh mặc ${g?.name_vi ?? "Việt phục"} thật` : `Ảnh ${g?.name_vi ?? "Việt phục"} ${m.photo_kinds[i] === "card" ? "trên thẻ búp bê giấy" : "minh họa AI"}`}
                className="aspect-[3/4] w-full object-cover"
              />
              {m.photo_kinds[i] === "card" ? (
                <span className="absolute bottom-3 left-3 rounded bg-[#8a4b2a]/85 px-2 py-0.5 text-xs font-semibold text-white">Thẻ búp bê giấy</span>
              ) : m.photo_kinds[i] === "ai" ? (
                <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                  {m.photo_samples[i] ? "Ảnh mẫu tạo sẵn" : "Ảnh minh họa AI"}
                </span>
              ) : (
                <span className="font-hand absolute right-3 top-3 rotate-[-8deg] rounded border-2 border-[#B5452E] bg-white/80 px-1.5 text-[#B5452E]">
                  Đã mặc thật
                </span>
              )}
            </figure>
          ))}
        </div>
        {m.note && <p className="font-hand m-0 mt-4 text-2xl leading-snug text-[#1f3a78]">{m.note}</p>}
        {g?.summary && <p className="mt-4 text-sm leading-relaxed text-stone-700">{g.summary}</p>}
        <Link href="/" className="mt-6 inline-block rounded-full bg-[#27354f] px-5 py-2 text-sm text-amber-50">
          Tự mình thử: đọc, phối áo và ghi Du Ký →
        </Link>
      </article>
    </main>
  );
}

/** /du-ky/p/?id=… */
export function SharedFromQuery() {
  const id = new URLSearchParams(window.location.search).get("id") ?? "";
  return <SharedView id={id} />;
}
