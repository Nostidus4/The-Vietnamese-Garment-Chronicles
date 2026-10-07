"use client";

// F7 "Thuê / may ở đâu?": shops that rent, tailor or sell this garment, only the ones the team has checked (#113), with an honest label.

import { useEffect, useState } from "react";
import { getShops } from "@/lib/api";
import type { Shop } from "@/lib/types";

const SERVICE: Record<string, string> = { rent: "Cho thuê", tailor: "May đo", buy: "Bán" };
const AUTH: Record<string, { text: string; tone: string }> = {
  authentic: { text: "Đúng chuẩn truyền thống", tone: "bg-emerald-100 text-emerald-800" },
  adapted: { text: "Có cách tân", tone: "bg-sky-100 text-sky-800" },
  inspired: { text: "Lấy cảm hứng", tone: "bg-amber-100 text-amber-800" },
  unknown: { text: "Chưa đánh giá", tone: "bg-stone-200 text-stone-700" },
};

export function ShopList({ garmentId, garmentName }: { garmentId: string; garmentName: string }) {
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [failed, setFailed] = useState(false); // the server did not answer: not the same as "no shop yet" (#48)
  useEffect(() => {
    let alive = true;
    getShops({ garment_id: garmentId })
      .then((r) => alive && setShops(r))
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        setShops([]);
      });
    return () => {
      alive = false;
    };
  }, [garmentId]);

  if (!shops) return null;
  return (
    <section id="shops" className="paper scroll-mt-16 rounded-lg p-5">
      <h3 className="m-0 font-semibold">Thuê hoặc may {garmentName} ở đâu?</h3>
      {failed ? (
        <p className="m-0 mt-2 text-sm text-stone-600">Chưa lấy được danh sách tiệm lúc này, con mở lại sau chút nhé.</p>
      ) : shops.length === 0 ? (
        <p className="m-0 mt-2 text-sm text-stone-600">Nhóm đang tìm và kiểm tra các tiệm cho trang phục này.</p>
      ) : (
        <ul className="m-0 mt-3 list-none space-y-3 p-0">
          {shops.map((s) => (
            <li key={s.id} className="rounded-md bg-white/60 p-3 text-sm">
              <p className="m-0 font-semibold">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
                <span className="ml-2 font-normal text-stone-600">· {s.city}</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                {s.services.map((x) => (
                  <span key={x} className="rounded-full border border-stone-400 px-2">
                    {SERVICE[x] ?? x}
                  </span>
                ))}
                <span className={`rounded-full px-2 ${AUTH[s.authenticity]?.tone ?? AUTH.unknown.tone}`}>{AUTH[s.authenticity]?.text ?? s.authenticity}</span>
              </div>
              {s.address && <p className="m-0 mt-1 text-xs text-stone-600">{s.address}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 mt-3 text-xs text-stone-600">Danh bạ không có quảng cáo. Nhãn mức độ truyền thống do nhóm đánh giá; chỉ liệt kê tiệm nhóm đã kiểm tra.</p>
    </section>
  );
}
