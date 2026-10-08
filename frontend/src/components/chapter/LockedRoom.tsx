// The fitting room of a region still being written with its community (Tây Bắc, Tây Nguyên): the same room as the
// open ones, but the doll stands behind a drawn curtain. Bà says why in the book's voice and points to the chapter
// that can already be read (#112).

import Link from "next/link";
import type { Bootstrap, Region } from "@/lib/types";
import { CONTRIBUTE_URL } from "@/lib/links";
import { PaperDoll } from "../fitting/PaperDoll";
import { stampPlace } from "@/lib/stampPlace";
import { roomStyle } from "./RoomShell";

export function LockedRoom({ region, data }: { region: Region; data: Bootstrap }) {
  const place = stampPlace(region);
  const chapter = region.chapters.find((c) => c.status === "open");
  const garments = region.garments.map((id) => data.garments.find((g) => g.id === id)?.name_vi).filter(Boolean);
  const open = data.regions.filter((r) => r.status === "open");
  // "Đang chờ người Thái đọc lại.": who the room waits for, as the map says it
  const waiting = region.map_note.lines.at(-1);

  return (
    <main
      className="fitting"
      style={roomStyle(true)}
    >
      <header className="fitting-head">
        <Link href="/" className="page-turn shrink-0 !text-[0.95rem]" aria-label="Về bản đồ">
          ‹ <span className="hidden sm:inline">Về bản đồ</span>
        </Link>
        <div className="min-w-0 text-center">
          {/* the place stays whole: on a 390px phone "BỘ" of "TRUNG BỘ" went to a line of its own (#119) */}
          <p className="m-0 text-[0.75rem] uppercase tracking-[0.18em] text-amber-100/80 sm:tracking-[0.3em]">
            Tủ áo của Bà <span className="whitespace-nowrap">· {place}</span>
          </p>
          <h1 className="font-hand m-0 text-[1.7rem] leading-tight text-amber-50">Tủ áo còn khép</h1>
        </div>
        <span className="w-11 shrink-0" aria-hidden />
      </header>

      <div className="locked-room">
        <figure className="m-0 flex flex-col items-center">
          <div className="mirror-frame dress-form">
            <div className="mirror-glass relative h-full w-full overflow-hidden">
              <PaperDoll still dress={{}} colors={{ main: "#e9dcc0", second: "#d9c7a2" }} className="absolute inset-0 h-full w-full p-[6%]" title="Búp bê giấy sau tấm màn" />
              <div className="locked-curtain" aria-hidden />
            </div>
          </div>
          <figcaption className="mirror-caption">
            {garments.length ? `${garments.join(", ")}: ` : ""}chờ người ở đây đọc lại rồi mới mặc thử
          </figcaption>
        </figure>

        <section className="locked-note" aria-labelledby="locked-why">
          <p className="font-hand m-0 text-[1.2rem] leading-snug text-[#7a3b1e]">{region.intro?.line}</p>
          <h2 id="locked-why" className="m-0 mt-4 text-[0.75rem] uppercase tracking-[0.25em] text-stone-600">
            Vì sao tủ áo còn khép
          </h2>
          <p className="m-0 mt-1 text-[0.95rem] leading-snug text-stone-800">
            {region.lock_note} {waiting}
          </p>
          {chapter && (
            <Link href={`/?region=${region.id}&page=read`} className="locked-cta">
              Đọc chương {chapter.province} →
            </Link>
          )}
          <a href={CONTRIBUTE_URL} target="_blank" rel="noreferrer" className="tap mt-3 flex items-center text-[0.85rem] text-[#27354f] underline">
            Con là người ở đây? Góp ý cho Bà
          </a>
          <p className="m-0 mt-4 border-t border-dashed border-stone-400 pt-3 text-[0.85rem] leading-snug text-stone-700">
            Tủ áo đang mở ở{" "}
            {open.map((r, i) => (
              <span key={r.id}>
                {i > 0 && (i === open.length - 1 ? " và " : ", ")}
                <Link href={`/chapter/${r.id}`} className="tap-around text-[#27354f] underline">
                  {r.name}
                </Link>
              </span>
            ))}
            .
          </p>
        </section>
      </div>
    </main>
  );
}
