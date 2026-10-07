"use client";

// "Xuất ảnh" (#21): one Du Ký page as a 4:5 picture (1080×1350) for Instagram or Zalo.
// Built offscreen at 540×675 and rendered at pixel ratio 2, then shown as a preview before it is saved (#53).
// The photos are sized by the height left under the title and above the note, so they never cover the words;
// a page without photos is laid out as words only. The notebook's name is never on it; every AI picture carries
// its "Ảnh minh họa AI" mark on the photo itself, so cropping keeps it.

import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { getPhoto, type DuKyPage } from "@/lib/dukyBook";
import type { Bootstrap } from "@/lib/types";
import { formatDate, teoFact } from "./DuKyPageView";
import { useDialog } from "@/lib/useDialog";
import { labelVi, lowerFirst } from "@/lib/text";

const readAsDataUrl = (b: Blob) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fail(r.error);
    r.readAsDataURL(b);
  });

export function ExportCard({
  page,
  data,
  onDone,
}: {
  page: DuKyPage;
  data: Bootstrap;
  onDone: (error?: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [srcs, setSrcs] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const file = `du-ky-${page.garment_id}-${page.id.slice(0, 6)}.png`;
  const g = data.garments.find((x) => x.id === page.garment_id);
  const occasion =
    data.occasions.find((o) => o.id === page.occasion_id)?.name ?? "";
  const place =
    data.regions
      .find((r) => r.id === page.region_id)
      ?.name.split("/")[0]
      .trim() ?? "";
  const fact = teoFact(data, page);

  useEffect(() => {
    Promise.all(
      page.photos.map(async (p) =>
        (await getPhoto(p.id)) ? readAsDataUrl((await getPhoto(p.id))!) : "",
      ),
    )
      .then(setSrcs)
      .catch(() => setSrcs([]));
  }, [page.photos]);

  useEffect(() => {
    if (!srcs || !ref.current) return;
    const node = ref.current;
    (async () => {
      try {
        await document.fonts.ready;
        setPreview(
          await toPng(node, {
            pixelRatio: 2,
            width: 540,
            height: 675,
            cacheBust: false,
          }),
        );
      } catch {
        onDone("Chưa xuất được ảnh, con thử lại nhé.");
      }
    })();
  }, [srcs, page, onDone]);
  const box = useDialog<HTMLDivElement>(() => onDone(), !!preview);

  const photos = page.photos
    .map((p, i) => ({ ...p, src: srcs?.[i] ?? "" }))
    .filter((p) => p.src);
  const n = photos.length;
  return (
    <>
      {preview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#140c07]/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xem trước ảnh xuất"
          onClick={() => onDone()}
        >
          <div
            ref={box}
            className="flex max-h-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the picture just made */}
            <img
              src={preview}
              alt="Ảnh xuất của trang Du Ký"
              className="max-h-[72vh] w-auto rounded shadow-2xl"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={preview}
                download={file}
                onClick={() => setSaved(true)}
                className="rounded-full bg-[#27354f] px-5 py-2 text-sm text-amber-50"
              >
                Tải ảnh về máy
              </a>
              <button
                type="button"
                onClick={() => onDone()}
                className="rounded-full bg-amber-50 px-5 py-2 text-sm text-[#27354f]"
              >
                Đóng
              </button>
            </div>
            <p
              className="m-0 text-xs text-amber-50/85"
              role="status"
              aria-live="polite"
            >
              {saved
                ? `Đã lưu ảnh ✓ Con đăng lên đâu cũng được${page.photos.some((p) => p.kind === "ai") ? ", dấu AI vẫn nằm trên ảnh" : ""}.`
                : "Ảnh 1080×1350, vừa khung bài đăng Instagram, Zalo."}
            </p>
          </div>
        </div>
      )}
      <div
        className="pointer-events-none fixed left-[-10000px] top-0"
        aria-hidden
      >
        <div
          ref={ref}
          className="paper relative flex flex-col p-7 text-[#27354f]"
          style={{ width: 540, height: 675, backgroundColor: "#efe4c8" }}
        >
          <div className="flex shrink-0 items-start justify-between">
            <div>
              <p className="m-0 text-[11px] tracking-[0.3em] text-stone-600">
                {page.status === "planned" ? "SẮP ĐI" : "ĐÃ MẶC"} ·{" "}
                {place.toUpperCase()}
              </p>
              <p className="font-hand m-0 text-[26px] leading-tight">
                {occasion}
                {page.place ? ` · ${page.place}` : ""}
              </p>
              <p className="m-0 text-[13px] text-stone-600">
                {g?.name_vi}
                {page.date ? ` · ${formatDate(page.date)}` : ""}
                {page.compass_label ? ` · ${labelVi(page.compass_label)}` : ""}
              </p>
            </div>
            <div
              className="flex h-[70px] w-[70px] shrink-0 rotate-[-10deg] flex-col items-center justify-center rounded-full border-[3px] text-center"
              style={{
                borderColor: "#2F4A6D",
                color: "#2F4A6D",
                opacity: page.photos.some((p) => p.kind === "real")
                  ? 0.85
                  : 0.4,
              }}
            >
              <span className="text-[8px] tracking-[0.2em]">
                {page.photos.some((p) => p.kind === "real")
                  ? "ĐÃ MẶC"
                  : "ĐÃ THỬ"}
              </span>
              <span className="font-display text-[11px] leading-tight">
                {place}
              </span>
            </div>
          </div>

          {n > 0 && (
            <div className="mt-4 flex min-h-0 flex-1 items-stretch justify-center gap-3">
              {photos.map((p, i) => (
                // as tall as the space left, never wider than its share of the row: the words around stay clear
                <figure
                  key={p.id}
                  className={`relative m-0 flex h-full min-w-0 flex-col bg-white p-2 pb-3 shadow-[0_6px_14px_rgba(60,35,10,0.3)] ${i % 2 ? "rotate-[2deg]" : "rotate-[-2deg]"}`}
                  // the polaroid: a 3:4 photo plus its paper edge, as tall as the row allows
                  style={{
                    aspectRatio: "0.72",
                    maxWidth: `calc((100% - ${(n - 1) * 12}px) / ${n})`,
                  }}
                >
                  <div className="relative min-h-0 w-full flex-1 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a data URL built for the export */}
                    <img
                      src={p.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {p.kind === "card" ? (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-[#8a4b2a]/85 px-2 py-0.5 text-[12px] font-semibold text-white">
                        Thẻ búp bê giấy
                      </span>
                    ) : p.kind === "ai" ? (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-2 py-0.5 text-[12px] font-semibold text-white">
                        {p.sample ? "Ảnh mẫu tạo sẵn" : "Ảnh minh họa AI"}
                      </span>
                    ) : (
                      <span className="font-hand absolute right-1.5 top-1.5 rotate-[-8deg] rounded border-2 border-[#B5452E] bg-white/80 px-1.5 text-[14px] text-[#B5452E]">
                        Đã mặc thật
                      </span>
                    )}
                  </div>
                </figure>
              ))}
            </div>
          )}

          {/* no photo yet: the page is the words, set large, instead of an empty frame */}
          {n === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col justify-center px-4">
              <p
                className="font-hand m-0 text-[70px] leading-none text-[#B5452E]/40"
                aria-hidden
              >
                “
              </p>
              <p className="font-hand m-0 -mt-4 text-[30px] leading-snug text-[#1f3a78]">
                {page.note ||
                  `Con sắp mặc ${g ? lowerFirst(g.name_vi) : "Việt phục"} ${occasion ? `đi ${lowerFirst(occasion)}` : ""}.`}
              </p>
            </div>
          ) : (
            page.note && (
              <p className="font-hand m-0 mt-4 line-clamp-3 shrink-0 text-[22px] leading-snug text-[#1f3a78]">
                {page.note}
              </p>
            )
          )}
          {fact && (
            <div className="mt-3 shrink-0 rotate-[-0.5deg] bg-[#fbe99a] px-3 py-2 text-[12px] leading-snug text-[#1f3a78] shadow-[1px_3px_6px_rgba(60,40,0,0.2)]">
              {fact.text}
              <span className="mt-0.5 block text-[10px] opacity-80">
                Tèo chép từ: {fact.source.title}
              </span>
            </div>
          )}
          <p className="m-0 mt-3 flex shrink-0 justify-between text-[10px] tracking-[0.2em] text-stone-600">
            <span>VIỆT PHỤC DU KÝ</span>
            <span>Hiểu để mặc đúng</span>
          </p>
        </div>
      </div>
    </>
  );
}
