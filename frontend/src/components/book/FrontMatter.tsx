"use client";

// The first spread under the cover, before the map: Bà's letter and how to read the notebook (left),
// the table of contents of the regions with the stamps collected so far (right).

import { pagesOf, useDuKy } from "@/lib/dukyBook";
import { useStamps } from "@/lib/stamps";
import type { Bootstrap } from "@/lib/types";
import { OLD, PENCIL, YOUNG } from "./Diary";
import { useSyncExternalStore } from "react";
import { HandIcon } from "../HandIcon";

/** A screen wider than a phone (the legend under the letter starts open there). */
function useWide() {
  return useSyncExternalStore(
    (on) => {
      const m = window.matchMedia("(min-width: 640px)");
      m.addEventListener("change", on);
      return () => m.removeEventListener("change", on);
    },
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  );
}

export function LetterPage() {
  const wide = useWide();
  return (
    // the letter and the legend as one block in the middle of the page: pushed apart they left a hole on a desktop (#147)
    <div className="flex h-full flex-col justify-center">
      <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-600">GỬI CON</p>
      <div className="font-hand mt-2 space-y-2 text-[1.12rem] leading-[1.42]" style={{ color: YOUNG }}>
        <p className="m-0">Con của Bà,</p>
        <p className="m-0">
          Từ năm mười tám tuổi, Bà đã ghi sổ. Hồi hai mươi, Bà xếp vào túi hai bộ áo rồi theo một người con trai đi xa. Đi đến đâu Bà cũng ghi lại:
          trời hôm ấy thế nào, người ta ăn gì, mặc gì, cười nói ra sao.
        </p>
        <p className="m-0">
          Cuốn sổ này không dạy con phải mặc gì. Nó chỉ kể người ta đã mặc thế nào, và vì sao. Con cứ đi chậm thôi. Thấy
          thương chỗ nào thì dừng lại ở đó.
        </p>
        <p className="m-0">Còn những trang Bà để trống, là để dành cho con.</p>
        <p className="m-0 text-right">— Bà</p>
      </div>

      {/* folded on a phone, where the letter fills the page and Tèo's first note had nowhere to go but over these
          lines; open on a wider screen (#147) */}
      <details open={wide} className="mt-6 border-t border-dashed border-stone-400/60 pt-2">
        <summary className="cursor-pointer text-[0.75rem] tracking-[0.3em] text-stone-600">CÁCH ĐỌC SỔ</summary>
        {/* each line is an icon and one run of text: loose text nodes in a flex row wrap word by word (#56) */}
        <ul className="m-0 mt-1 grid list-none grid-cols-1 gap-1 p-0 text-[0.75rem] leading-snug text-stone-700">
          <li className="flex items-start gap-2">
            <span className="mt-[0.3em] h-2.5 w-2.5 shrink-0 rounded-full bg-[#B5452E]" aria-hidden />
            {/* the dots show once a region is opened on the map, not on the whole country: say so (#115) */}
            <span>Chấm đỏ trên bản đồ một miền: chỗ Bà dừng chân. Bấm vào miền nào trên bản đồ là thấy.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-hand shrink-0 text-[0.95rem] leading-none" style={{ color: YOUNG }}>
              Aa
            </span>
            <span>Mực xanh: Bà hồi còn trẻ.</span>
          </li>
          {/* one ink, one line: the two shared a line and read as one (#115) */}
          <li className="flex items-start gap-2">
            <span className="font-hand shrink-0 text-[0.95rem] leading-none" style={{ color: OLD }}>
              Aa
            </span>
            <span>Mực nâu: Bà bây giờ.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[0.2em] h-3 w-4 shrink-0 rotate-[-4deg] bg-[#fbe99a] shadow" aria-hidden />
            <span>
              Giấy vàng: Tèo tra lại, có ghi nguồn. Chữ có <span className="glossary-word cursor-default whitespace-nowrap">gạch chấm</span> bên dưới: bấm để hỏi Tèo.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-hand shrink-0 text-[0.95rem] leading-none" style={{ color: PENCIL }}>
              ✎
            </span>
            <span>Bút chì: lời Tí, cháu của Bà, viết thêm bên lề. Trang “Hôm nay”: Tí đi lại đúng chỗ Bà từng đến, có ảnh thật.</span>
          </li>
        </ul>
      </details>
    </div>
  );
}

/** Regions, their chapters and the stamps the reader has collected. Clicking one opens it on the map. */
export function TocPage({ data, onRegion, onStart, suggest }: { data: Bootstrap; onRegion: (id: string) => void; onStart: () => void; suggest: string }) {
  const { arrived, understood } = useStamps();
  const book = useDuKy();
  const stampsOf = (id: string) =>
    [arrived.includes(id), understood.includes(id), pagesOf(book, id).some((p) => p.photos.some((ph) => ph.kind === "real"))].filter(Boolean)
      .length;
  const total = data.regions.filter((r) => r.status === "open" || r.chapters.some((c) => c.status === "open")).length * 3;
  const got = data.regions.reduce((n, r) => n + stampsOf(r.id), 0);
  // the suggested chapter, by its own title: the reason to start there (#115)
  const first = data.regions.flatMap((r) => r.chapters).find((c) => c.status === "open" && c.province === suggest && c.title);
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-600">MỤC LỤC</p>
      <p className="font-hand m-0 text-[1.2rem] leading-snug" style={{ color: YOUNG }}>
        Những nơi Bà đã đi và đã nghe kể
      </p>
      <ol className="@container m-0 mt-3 flex list-none flex-col gap-1 p-0">
        {data.regions.map((r, i) => {
          const open = r.chapters.filter((c) => c.status === "open");
          const readable = r.status === "open" || open.length > 0;
          const n = stampsOf(r.id);
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onRegion(r.id)}
                className="group flex w-full items-baseline gap-2 rounded px-1 py-1 text-left hover:bg-amber-50/60"
              >
                <span className="font-display w-4 shrink-0 text-[0.8rem] text-stone-600">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className={`font-display block truncate text-[1rem] ${readable ? "text-[#27354f]" : "text-stone-600"}`}>{r.name}</span>
                  <span className="font-hand block text-[0.85rem] leading-tight" style={{ color: readable ? OLD : PENCIL }}>
                    {open.length ? open.map((c) => `${c.province}: ${c.title ?? ""}`).join(" · ") : "chờ người ở đó cùng viết"}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[0.75rem] leading-tight text-stone-600">
                  {/* what there is to read first, then what is still to be written (#61). On a small page (a phone held
                      sideways) only the stamps: the words wrapped onto the region's name, and the line under the name
                      already says which chapter there is (#119) */}
                  <span className="hidden whitespace-nowrap @min-[15rem]:block">
                    {/* two lines, each with its own noun: "1 chương · 10 chương" read as "1/10" when it wrapped */}
                    <span className="block">{open.length} chương đọc được</span>
                    {r.chapters.length > open.length && <span className="block">{r.chapters.length - open.length} chương sắp viết</span>}
                  </span>
                  {readable && (
                    <span className="mt-0.5 flex justify-end gap-0.5" title={`Tem Đến · Hiểu · Mặc: ${n}/3`} aria-label={`Tem Đến · Hiểu · Mặc: ${n}/3`}>
                      {[0, 1, 2].map((k) => (
                        <span key={k} className={`h-2 w-2 rounded-full border ${k < n ? "border-[#B5452E] bg-[#B5452E]" : "border-stone-400"}`} />
                      ))}
                    </span>
                  )}
                </span>
                <span className="text-stone-400 transition-transform group-hover:translate-x-0.5" aria-hidden>
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {/* the three dots of each row, said once (#114) */}
      <p className="m-0 mt-1 text-right text-[0.75rem] text-stone-600">
        {/* what the stamps are, not only their names (#147) */}
        <span aria-hidden>○○○</span> ba tem của mỗi miền: Đến (mở chương), Hiểu (trả lời Bà hỏi), Mặc (dán ảnh mặc thật)
      </p>
      {/* the one way in for a first-time reader; the list above is for coming back */}
      <div className="mt-auto flex flex-col items-start gap-2">
        <button type="button" data-guide="next" onClick={onStart} className="page-turn page-turn-main font-display !text-[1rem]">
          Bắt đầu hành trình: {suggest} →
        </button>
        {/* why Huế: the one main way in says where it leads and why there (#115) */}
        <p className="font-hand m-0 text-[0.95rem]" style={{ color: OLD }}>
          {got ? `Con đã sưu tầm ${got}/${total} con tem.` : first ? `Chương đầu là “${first.title}” ở ${suggest}, con theo Bà từ đó nhé. Miền khác, con bấm ở trên.` : "Hoặc bấm một miền ở trên, hay lật trang để mở bản đồ."} — Bà
        </p>
      </div>
    </div>
  );
}

/** Festivals of every readable chapter, with the region they belong to. */
function allFestivals(data: Bootstrap) {
  return data.regions.flatMap((r) => {
    const j = r.journey;
    if (!j || !r.chapters.some((c) => c.status === "open")) return [];
    const list = [...j.stops.flatMap((s) => s.festivals), ...(j.festivals?.festivals ?? [])];
    return list.filter((f) => f.month && !f.community_review).map((f) => ({ ...f, region: r }));
  });
}

/**
 * The right page of the map spread, before a region is chosen: Bà's word on how to read the map, the five regions
 * in the colours of the map (hover lights the region up, click or Enter opens it), what is on this month, and the
 * fitting room for someone with an event ahead. Where to begin is the bright button under the book.
 */
export function StartPage({
  data,
  tints,
  hovered,
  onHover,
  onRegion,
  onEvent,
}: {
  data: Bootstrap;
  tints: Record<string, string>;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onRegion: (id: string) => void;
  onEvent: () => void;
}) {
  const { arrived, understood } = useStamps();
  const book = useDuKy();
  const month = new Date().getMonth() + 1;
  const fests = allFestivals(data);
  const now = fests.filter((f) => f.month === month);
  const soon = [...fests].sort((a, b) => ((a.month! - month + 12) % 12) - ((b.month! - month + 12) % 12)).slice(0, 2);
  const shown = now.length ? now.slice(0, 2) : soon;
  const hoveredRegion = hovered ? data.regions.find((r) => r.id === hovered) : undefined;
  const stampsOf = (id: string) =>
    [arrived.includes(id), understood.includes(id), pagesOf(book, id).some((p) => p.photos.some((ph) => ph.kind === "real"))].filter(Boolean).length;
  return (
    <div className="start-page flex h-full flex-col">
      <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-600">BẮT ĐẦU HÀNH TRÌNH</p>
      <p className="font-hand m-0 mt-1 text-[1.12rem] leading-snug" style={{ color: YOUNG }}>
        Muốn viết tiếp một câu chuyện, trước hết phải hiểu câu chuyện đã có.
      </p>
      <p className="font-hand m-0 mt-1.5 text-[0.98rem] leading-snug" style={{ color: OLD }}>
        Bà tô màu từng miền theo trí nhớ. Mỗi miền có một chương: nơi Bà đã đi, món Bà đã ăn, chiếc áo Bà đã mặc. Con chạm vào
        miền nào, Bà kể con nghe miền ấy. — Bà
      </p>

      <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
        {data.regions.map((r) => {
          const ch = r.chapters.find((c) => c.status === "open");
          const n = stampsOf(r.id);
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onRegion(r.id)}
                onMouseEnter={() => onHover(r.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(r.id)}
                onBlur={() => onHover(null)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors ${hovered === r.id ? "bg-amber-50/80" : "hover:bg-amber-50/60"}`}
              >
                <span className="h-7 w-7 shrink-0 rounded-sm border border-[#5b4636]/40 shadow-inner" style={{ background: tints[r.id] }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="font-display block text-[0.98rem] leading-tight text-[#27354f]">
                    {r.name}
                    {ch && <span className="font-hand ml-1.5 text-[0.88rem] font-normal text-[#8a4b2a]">· {ch.province}: {ch.title}</span>}
                  </span>
                  <span className="block truncate text-[0.75rem] text-stone-600">{r.map_note.lines[0]}</span>
                </span>
                {/* the three stamps of the region, said as stamps: three faint dots read as "locked" (#115) */}
                <span className="flex shrink-0 items-center gap-1" title="Tem Đến · Hiểu · Mặc của miền này" aria-label={`${n}/3 tem`}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} className={`h-2 w-2 rounded-full border ${k < n ? "border-[#B5452E] bg-[#B5452E]" : "border-stone-500 bg-transparent"}`} aria-hidden />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* the region under the pointer: one line from Bà's diary, in place of this month's festivals */}
      {hoveredRegion?.journey ? (
        <div className="start-fests mt-3 h-[5.4rem] shrink-0 overflow-hidden rounded-md px-3 py-2" style={{ background: `${tints[hoveredRegion.id]}99` }}>
          <p className="m-0 text-[0.75rem] tracking-[0.28em] text-stone-600">NHẬT KÝ CỦA BÀ · {hoveredRegion.name.toUpperCase()}</p>
          <p className="font-hand m-0 mt-0.5 text-[1rem] leading-snug" style={{ color: YOUNG }}>
            {hoveredRegion.journey.hover_line}
          </p>
        </div>
      ) : shown.length > 0 && (
        <div className="start-fests mt-3 h-[5.4rem] shrink-0 overflow-hidden rounded-md border border-dashed border-stone-400/60 bg-white/35 px-3 py-2">
          <p className="m-0 text-[0.75rem] tracking-[0.28em] text-stone-600">{now.length ? "THÁNG NÀY TRONG SỔ CỦA BÀ" : "SẮP TỚI TRONG SỔ CỦA BÀ"}</p>
          <ul className="m-0 mt-1 list-none space-y-0.5 p-0">
            {shown.map((f) => (
              <li key={f.id}>
                {/* a link to the region, and it looks like one (#115) */}
                <button type="button" onClick={() => onRegion(f.region.id)} className="text-left text-[0.76rem] leading-snug text-stone-700 underline decoration-dotted underline-offset-2 hover:decoration-solid">
                  <b className="font-semibold text-[#27354f]">{f.name}</b> · {f.time} · {f.region.name} <span aria-hidden>›</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* "Bắt đầu từ Huế" is the bright button under the book; here, the shortcut for someone with an event ahead (#65) */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <button type="button" onClick={onEvent} className="rounded-full border border-stone-700 px-3 py-2 text-[0.85rem] hover:bg-stone-800 hover:text-amber-50">
          <HandIcon name="aodai" /> Sắp đi sự kiện? Vào thẳng tủ áo của Bà
        </button>
      </div>
    </div>
  );
}
