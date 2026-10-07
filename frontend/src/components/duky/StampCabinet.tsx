"use client";

// Tủ tem (#24): for every region, the three stamps of the two journeys.
//   đã đến  – opened Bà's first entry of the region        đã hiểu – answered "Bà hỏi con"
//   đã mặc  – a real photo in the Du Ký (bold); only try-on pictures give a faded "đã mặc" that asks for one (#114)

import type { DuKyBook } from "@/lib/dukyBook";
import { stampPlace, useStamps } from "@/lib/stamps";
import { useState } from "react";
import type { Bootstrap, Region } from "@/lib/types";
import { FINAL_LETTER, PostcardViewer } from "./PostcardViewer";
import { asset } from "@/lib/base";

type Look = "on" | "soft" | "off";

// how each stamp is earned, said on the stamp itself while it is still a dashed ring (#63)
const HOW: Record<string, string> = {
  "Đã đến": "Mở chương của vùng này trong sổ của Bà",
  "Đã hiểu": "Trả lời hết “Bà hỏi con” ở cuối chương",
  "Đã mặc": "Dán ảnh một lần con mặc thật vào Du Ký",
};
const TRIED = "Đã có ảnh thử đồ; dán ảnh mặc thật để tem đậm lên";

function Stamp({ label, place, look, color }: { label: string; place: string; look: Look; color: string }) {
  const how = look === "soft" && label === "Đã mặc" ? TRIED : HOW[label];
  return (
    <div
      role="img"
      title={look === "on" ? `${label} ${place}` : how}
      className={`flex h-[3.6rem] w-[3.6rem] shrink-0 flex-col items-center justify-center rounded-full border-[2.5px] text-center ${
        look === "on" ? "rotate-[-8deg]" : look === "soft" ? "rotate-[6deg] border-dashed opacity-55" : "border-dashed opacity-60"
      }`}
      style={{ borderColor: look === "off" ? "#a8a29e" : color, color: look === "off" ? "#a8a29e" : color }}
      aria-label={`${label} ${place}${look === "on" ? "" : `: chưa có. ${how}`}`}
    >
      {/* read at 100% zoom: 11–12px, not 7–9 (#117) */}
      <span className="text-[0.6875rem] font-semibold leading-tight">{label.toUpperCase()}</span>
      <span className="font-display px-1 text-[0.6875rem] leading-[1.1]">{place}</span>
    </div>
  );
}

export function StampCabinet({ data, book }: { data: Bootstrap; book: DuKyBook }) {
  const { arrived, understood, postcard, stop } = useStamps();
  const [reading, setReading] = useState<Region | null>(null);
  const [finalOpen, setFinalOpen] = useState(false);
  // the chapters whose postcard can be kept (open, reviewed); all of them kept = Bà's last letter
  const withLetter = data.regions.filter((r) => r.journey?.letter && r.chapters.some((c) => c.status === "open"));
  const kept = withLetter.filter((r) => postcard.includes(r.id)).length;
  const stopsTotal = (r: Region) => r.journey?.stops.filter((st) => st.stamp).length ?? 0;
  const stopsGot = (r: Region) => r.journey?.stops.filter((st) => st.stamp && stop.includes(`${r.id}:${st.id}`)).length ?? 0;
  const total = data.regions.filter((r) => r.status === "open" || r.chapters.some((c) => c.status === "open")).length;
  const worn = new Set(book.pages.filter((p) => p.photos.some((ph) => ph.kind === "real")).map((p) => p.region_id));
  const tried = new Set(book.pages.filter((p) => p.photos.length > 0).map((p) => p.region_id));
  const readable = data.regions.filter((r) => r.status === "open" || r.chapters.some((c) => c.status === "open"));
  const allStamps = readable.length > 0 && readable.every((r) => arrived.includes(r.id) && understood.includes(r.id) && worn.has(r.id));
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-600">TỦ TEM</p>
      <p className="font-hand m-0 text-[1.15rem] leading-snug text-[#27354f]">
        Đọc sổ của Bà để hiểu, viết sổ của mình để mặc.
      </p>
      <p className="m-0 mt-0.5 text-[0.75rem] text-stone-600">
        Đã mặc thật ở {worn.size}/{total} vùng
      </p>
      {/* the legend: what each ring is for, so an empty cabinet says how to fill it (#63) */}
      <p className="m-0 mt-1 text-[0.75rem] leading-snug text-stone-600">
        <b className="font-semibold text-[#B5452E]">Đến</b>: mở chương của Bà · <b className="font-semibold text-[#5E7F4A]">Hiểu</b>: trả lời “Bà hỏi con” ·{" "}
        <b className="font-semibold text-[#2F4A6D]">Mặc</b>: dán ảnh lần con mặc thật.
      </p>
      {allStamps && (
        <p className="font-hand m-0 mt-1 rounded bg-[#f7e4c8] px-2 py-1 text-[1rem] text-[#8a4b2a]">🎉 Con đã đủ tem ở mọi vùng. Bà mừng lắm!</p>
      )}
      <ul className="m-0 mt-1.5 flex min-h-0 flex-1 list-none flex-col justify-around gap-0.5 p-0">
        {data.regions.map((r) => {
          const place = r.name.split("/")[0].trim();
          const stamped = stampPlace(r); // the row is the region, its stamps are named after the chapter read (Huế)
          if (r.status === "locked" && !r.chapters.some((c) => c.status === "open"))
            return (
              <li key={r.id} className="flex items-center gap-2 border-t border-dashed border-stone-300 pt-1 text-stone-600">
                <span className="font-display w-[5.5rem] shrink-0 text-[0.8rem] leading-tight">{place}</span>
                <span className="font-hand text-[0.9rem]">chờ cộng đồng cùng viết</span>
              </li>
            );
          return (
            <li key={r.id} className="flex items-center gap-2 border-t border-dashed border-stone-300 pt-0.5">
              <div className="w-[5.5rem] shrink-0">
                <a href={asset(`/?region=${r.id}&page=own`)} title={stamped === place ? undefined : `${place} · chương ${stamped}`} className="font-display block text-[0.85rem] leading-tight text-[#27354f] hover:underline">
                  {place}
                  {stopsTotal(r) > 0 && (
                    // "tem điểm": the stops of Bà's road the reader has turned to (said here, the legend has no room)
                    <span className="block font-sans text-[0.75rem] text-stone-600" title="Mỗi chỗ Bà dừng chân con đã ghé qua">
                      tem điểm {stopsGot(r)}/{stopsTotal(r)}
                    </span>
                  )}
                </a>
                {/* with the region's name, as a button, not a lone word at the edge of the row (#117) */}
                {postcard.includes(r.id) && (
                  <button
                    type="button"
                    onClick={() => setReading(r)}
                    className="font-hand rounded bg-[#f7e4c8] px-1.5 text-[0.95rem] leading-snug text-[#8a4b2a] shadow-[1px_2px_4px_rgba(60,35,10,0.25)] hover:bg-[#f3d9b1]"
                    title="Đọc lại thư của Bà"
                  >
                    ✉ đọc thư
                  </button>
                )}
              </div>
              <div className="flex flex-1 justify-around gap-1">
                <Stamp label="Đã đến" place={stamped} look={arrived.includes(r.id) ? "on" : "off"} color="#B5452E" />
                <Stamp label="Đã hiểu" place={stamped} look={understood.includes(r.id) ? "on" : "off"} color="#5E7F4A" />
                {/* one name for the stamp, "ĐÃ MẶC", even before it is earned; what is missing is said under it (#114) */}
                <div className="flex flex-col items-center">
                  <Stamp label="Đã mặc" place={stamped} look={worn.has(r.id) ? "on" : tried.has(r.id) ? "soft" : "off"} color="#2F4A6D" />
                  {!worn.has(r.id) && <span className="mt-0.5 max-w-[5.5rem] text-center text-[0.6875rem] leading-none text-stone-600">cần ảnh mặc thật</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-dashed border-stone-300 pt-1.5 text-[0.75rem] text-stone-600">
        <span>
          Hộp thư của Bà: {kept}/{withLetter.length} bưu thiếp
        </span>
        {kept === withLetter.length && withLetter.length > 0 ? (
          <button type="button" onClick={() => setFinalOpen(true)} className="font-hand rounded bg-[#B5452E] px-2 py-0.5 text-[0.9rem] text-amber-50 shadow">
            ✉ Lá thư cuối của Bà
          </button>
        ) : (
          <span className="font-hand text-[0.85rem] text-stone-600">đủ bưu thiếp sẽ mở lá thư cuối</span>
        )}
      </div>
      {reading && <PostcardViewer region={reading} onClose={() => setReading(null)} />}
      {finalOpen && <PostcardViewer letter={FINAL_LETTER} title="Lá thư cuối" onClose={() => setFinalOpen(false)} />}
    </div>
  );
}
