"use client";

// Tủ tem (#24): for every region, the three stamps of the two journeys.
//   đã đến  – opened Bà's first entry of the region        đã hiểu – answered "Bà hỏi con"
//   đã mặc  – a real photo in the Du Ký (bold); only try-on pictures give a faded "đã thử"

import type { DuKyBook } from "@/lib/dukyBook";
import { useStamps } from "@/lib/stamps";
import type { Bootstrap } from "@/lib/types";

type Look = "on" | "soft" | "off";

function Stamp({ label, place, look, color }: { label: string; place: string; look: Look; color: string }) {
  return (
    <div
      className={`flex h-[3.1rem] w-[3.1rem] shrink-0 flex-col items-center justify-center rounded-full border-[2.5px] text-center ${
        look === "on" ? "rotate-[-8deg]" : look === "soft" ? "rotate-[6deg] border-dashed opacity-55" : "border-dashed opacity-35"
      }`}
      style={{ borderColor: look === "off" ? "#a8a29e" : color, color: look === "off" ? "#a8a29e" : color }}
      aria-label={`${label} ${place}${look === "off" ? " (chưa có)" : ""}`}
    >
      <span className="text-[0.4rem] tracking-[0.18em]">{label.toUpperCase()}</span>
      <span className="font-display px-0.5 text-[0.55rem] leading-tight">{place}</span>
    </div>
  );
}

export function StampCabinet({ data, book }: { data: Bootstrap; book: DuKyBook }) {
  const { arrived, understood } = useStamps();
  const total = data.regions.filter((r) => r.status === "open").length;
  const worn = new Set(book.pages.filter((p) => p.photos.some((ph) => ph.kind === "real")).map((p) => p.region_id));
  const tried = new Set(book.pages.filter((p) => p.photos.length > 0).map((p) => p.region_id));
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.62rem] tracking-[0.3em] text-stone-500">TỦ TEM</p>
      <p className="font-hand m-0 text-[1.15rem] leading-snug text-[#27354f]">
        Đọc sổ của Bà để hiểu, viết sổ của mình để mặc.
      </p>
      <p className="m-0 mt-0.5 text-[0.66rem] text-stone-500">
        Đã mặc thật ở {worn.size}/{total} vùng
      </p>
      <ul className="m-0 mt-2 flex min-h-0 flex-1 list-none flex-col justify-around gap-1 p-0">
        {data.regions.map((r) => {
          const place = r.name.split("/")[0].trim();
          if (r.status === "locked")
            return (
              <li key={r.id} className="flex items-center gap-2 border-t border-dashed border-stone-300 pt-1 text-stone-400">
                <span className="font-display w-[5.5rem] shrink-0 text-[0.8rem] leading-tight">{place}</span>
                <span className="font-hand text-[0.9rem]">chờ cộng đồng cùng viết</span>
              </li>
            );
          return (
            <li key={r.id} className="flex items-center gap-2 border-t border-dashed border-stone-300 pt-1">
              <a href={`/?region=${r.id}&page=own`} className="font-display w-[5.5rem] shrink-0 text-[0.8rem] leading-tight text-[#27354f] hover:underline">
                {place}
              </a>
              <div className="flex gap-1.5">
                <Stamp label="Đã đến" place={place} look={arrived.includes(r.id) ? "on" : "off"} color="#B5452E" />
                <Stamp label="Đã hiểu" place={place} look={understood.includes(r.id) ? "on" : "off"} color="#5E7F4A" />
                <Stamp
                  label={worn.has(r.id) ? "Đã mặc" : "Đã thử"}
                  place={place}
                  look={worn.has(r.id) ? "on" : tried.has(r.id) ? "soft" : "off"}
                  color="#2F4A6D"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
