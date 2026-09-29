"use client";

import Link from "next/link";
// The public page behind a "Tạo link" (#27): what the reader chose to share, nothing more.

import { useEffect, useState } from "react";
import { API_URL, getShare, type SharedPage } from "@/lib/api";
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
    getShare(id).then(setPage).catch(() => setMissing(true));
  }, [id]);

  if (missing)
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="font-hand text-2xl text-stone-600">Trang này không còn nữa, hoặc người viết đã gỡ link.</p>
        <Link href="/" className="mt-4 inline-block underline">Mở Việt Phục Du Ký</Link>
      </main>
    );
  if (!page || !data) return <p className="font-hand p-6 text-xl text-stone-500">Đang mở trang…</p>;

  const m = page.meta;
  const g = data.garments.find((x) => x.id === m.garment_id);
  const occasion = data.occasions.find((o) => o.id === m.occasion_id)?.name ?? m.occasion_id;
  const place = data.regions.find((r) => r.id === m.region_id)?.name.split("/")[0].trim() ?? "";
  return (
    <main className="desk min-h-screen px-4 py-8">
      <article className="paper mx-auto max-w-md rounded-md p-6 text-[#27354f] shadow-[0_10px_24px_rgba(20,8,0,0.4)]">
        <p className="m-0 text-[0.65rem] tracking-[0.3em] text-stone-500">
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
              <img src={u.startsWith("/") ? `${API_URL}${u}` : u} alt="" className="aspect-[3/4] w-full object-cover" />
              {m.photo_kinds[i] === "ai" ? (
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
          Mở sổ của Bà và viết Du Ký của bạn →
        </Link>
      </article>
    </main>
  );
}
