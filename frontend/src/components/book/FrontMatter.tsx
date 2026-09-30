"use client";

// The first spread under the cover, before the map: Bà's letter and how to read the notebook (left),
// the table of contents of the regions with the stamps collected so far (right).

import { pagesOf, useDuKy } from "@/lib/dukyBook";
import { useStamps } from "@/lib/stamps";
import type { Bootstrap } from "@/lib/types";
import { OLD, PENCIL, YOUNG } from "./Diary";

export function LetterPage() {
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.6rem] tracking-[0.3em] text-stone-500">GỬI CON</p>
      <div className="font-hand mt-2 space-y-2 text-[1.12rem] leading-[1.42]" style={{ color: YOUNG }}>
        <p className="m-0">Con của Bà,</p>
        <p className="m-0">
          Hồi hai mươi tuổi, Bà xếp vào túi hai bộ áo rồi theo một người con trai đi xa. Từ ấy, đi đến đâu Bà cũng ghi lại:
          trời hôm ấy thế nào, người ta ăn gì, mặc gì, cười nói ra sao.
        </p>
        <p className="m-0">
          Cuốn sổ này không dạy con phải mặc gì. Nó chỉ kể người ta đã mặc thế nào, và vì sao. Con cứ đi chậm thôi. Thấy
          thương chỗ nào thì dừng lại ở đó.
        </p>
        <p className="m-0">Còn những trang Bà để trống, là để dành cho con.</p>
        <p className="m-0 text-right">— Bà</p>
      </div>

      <div className="mt-auto border-t border-dashed border-stone-400/60 pt-2">
        <p className="m-0 text-[0.6rem] tracking-[0.3em] text-stone-500">CÁCH ĐỌC SỔ</p>
        <ul className="m-0 mt-1 grid list-none grid-cols-1 gap-1 p-0 text-[0.7rem] leading-snug text-stone-700">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#B5452E]" aria-hidden /> Chấm đỏ trên bản đồ: nơi Bà đã đến.
          </li>
          <li className="flex items-center gap-2">
            <span className="font-hand shrink-0 text-[0.95rem]" style={{ color: YOUNG }}>
              Aa
            </span>
            Mực xanh: Bà năm hai mươi tuổi.
            <span className="font-hand shrink-0 text-[0.95rem]" style={{ color: OLD }}>
              Aa
            </span>
            Mực nâu: Bà bây giờ.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-4 shrink-0 rotate-[-4deg] bg-[#fbe99a] shadow" aria-hidden /> Giấy vàng: Tèo tra lại, có ghi nguồn.
            Chữ <span className="glossary-word cursor-default">gạch chấm</span>: bấm để hỏi Tèo.
          </li>
          <li className="flex items-center gap-2">
            <span className="font-hand shrink-0 text-[0.95rem]" style={{ color: PENCIL }}>
              ✎
            </span>
            Bút chì: Tí nghĩ vẩn vơ. Trang “Hôm nay”: Tí đi lại đúng chỗ ấy, có ảnh thật.
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Regions, their chapters and the stamps the reader has collected. Clicking one opens it on the map. */
export function TocPage({ data, onRegion }: { data: Bootstrap; onRegion: (id: string) => void }) {
  const { arrived, understood } = useStamps();
  const book = useDuKy();
  const stampsOf = (id: string) =>
    [arrived.includes(id), understood.includes(id), pagesOf(book, id).some((p) => p.photos.some((ph) => ph.kind === "real"))].filter(Boolean)
      .length;
  const total = data.regions.filter((r) => r.status === "open" || r.chapters.some((c) => c.status === "open")).length * 3;
  const got = data.regions.reduce((n, r) => n + stampsOf(r.id), 0);
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.6rem] tracking-[0.3em] text-stone-500">MỤC LỤC</p>
      <p className="font-hand m-0 text-[1.2rem] leading-snug" style={{ color: YOUNG }}>
        Những nơi Bà đã đi
      </p>
      <ol className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
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
                <span className="font-display w-4 shrink-0 text-[0.8rem] text-stone-400">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className={`font-display block text-[1rem] ${readable ? "text-[#27354f]" : "text-stone-400"}`}>{r.name}</span>
                  <span className="font-hand block truncate text-[0.85rem]" style={{ color: readable ? OLD : PENCIL }}>
                    {open.length ? open.map((c) => `${c.province}: ${c.title ?? ""}`).join(" · ") : "chờ người ở đó cùng viết"}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[0.62rem] leading-tight text-stone-500">
                  {open.length}/{r.chapters.length} chương
                  {readable && (
                    <span className="mt-0.5 flex justify-end gap-0.5" aria-label={`${n}/3 tem`}>
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
      <p className="font-hand m-0 mt-auto text-[0.95rem]" style={{ color: OLD }}>
        Con đã sưu tầm {got}/{total} con tem. Lật trang để mở bản đồ. — Bà
      </p>
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
 * in the colours of the map (hover lights the region up, click or Enter opens it), what is on this month, and where
 * to begin. → on the keyboard opens the suggested chapter.
 */
export function StartPage({
  data,
  tints,
  hovered,
  onHover,
  onRegion,
  onEvent,
  suggest,
}: {
  data: Bootstrap;
  tints: Record<string, string>;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onRegion: (id: string) => void;
  onEvent: () => void;
  suggest: { id: string; label: string };
}) {
  const { arrived, understood } = useStamps();
  const book = useDuKy();
  const month = new Date().getMonth() + 1;
  const fests = allFestivals(data);
  const now = fests.filter((f) => f.month === month);
  const soon = [...fests].sort((a, b) => ((a.month! - month + 12) % 12) - ((b.month! - month + 12) % 12)).slice(0, 2);
  const shown = now.length ? now.slice(0, 2) : soon;
  const stampsOf = (id: string) =>
    [arrived.includes(id), understood.includes(id), pagesOf(book, id).some((p) => p.photos.some((ph) => ph.kind === "real"))].filter(Boolean).length;
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.6rem] tracking-[0.3em] text-stone-500">BẮT ĐẦU HÀNH TRÌNH</p>
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
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${hovered === r.id ? "bg-amber-50/80" : "hover:bg-amber-50/60"}`}
              >
                <span className="h-7 w-7 shrink-0 rounded-sm border border-[#5b4636]/40 shadow-inner" style={{ background: tints[r.id] }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="font-display block text-[0.98rem] leading-tight text-[#27354f]">
                    {r.name}
                    {ch && <span className="font-hand ml-1.5 text-[0.88rem] font-normal text-[#8a4b2a]">· {ch.province}: {ch.title}</span>}
                  </span>
                  <span className="block truncate text-[0.7rem] text-stone-600">{r.map_note.lines[0]}</span>
                </span>
                <span className="flex shrink-0 gap-0.5" aria-label={`${n}/3 tem`}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} className={`h-1.5 w-1.5 rounded-full ${k < n ? "bg-[#B5452E]" : "bg-stone-300"}`} />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {shown.length > 0 && (
        <div className="mt-3 rounded-md border border-dashed border-stone-400/60 bg-white/35 px-3 py-2">
          <p className="m-0 text-[0.58rem] tracking-[0.28em] text-stone-500">{now.length ? "THÁNG NÀY TRONG SỔ CỦA BÀ" : "SẮP TỚI TRONG SỔ CỦA BÀ"}</p>
          <ul className="m-0 mt-1 list-none space-y-0.5 p-0">
            {shown.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => onRegion(f.region.id)} className="text-left text-[0.76rem] leading-snug text-stone-700 hover:underline">
                  <b className="font-semibold text-[#27354f]">{f.name}</b> · {f.time} · {f.region.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <button type="button" onClick={() => onRegion(suggest.id)} className="rounded-full bg-[#27354f] px-4 py-2 text-sm text-amber-50 hover:bg-[#1c2740]">
          Lần đầu mở sổ? Bắt đầu từ {suggest.label} →
        </button>
        <button type="button" onClick={onEvent} className="rounded-full border border-stone-700 px-3 py-2 text-[0.8rem] hover:bg-stone-800 hover:text-amber-50">
          Tôi sắp tham gia sự kiện
        </button>
      </div>
    </div>
  );
}
