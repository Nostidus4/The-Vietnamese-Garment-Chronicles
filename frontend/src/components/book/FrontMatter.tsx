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
      <div className="font-hand mt-1 space-y-1.5 text-[0.98rem] leading-[1.38]" style={{ color: YOUNG }}>
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
  const total = data.regions.filter((r) => r.status === "open").length * 3;
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
                  <span className={`font-display block text-[1rem] ${r.status === "open" ? "text-[#27354f]" : "text-stone-400"}`}>{r.name}</span>
                  <span className="font-hand block truncate text-[0.85rem]" style={{ color: r.status === "open" ? OLD : PENCIL }}>
                    {open.length ? open.map((c) => `${c.province}: ${c.title ?? ""}`).join(" · ") : "chờ người ở đó cùng viết"}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[0.62rem] leading-tight text-stone-500">
                  {open.length}/{r.chapters.length} chương
                  {r.status === "open" && (
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
