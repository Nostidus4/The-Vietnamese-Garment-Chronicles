"use client";

import HTMLFlipBook from "react-pageflip";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Bootstrap } from "@/lib/types";
import { ComicPage } from "./ComicPage";
import { HandwrittenText } from "./HandwrittenText";
import { Page } from "./Page";
import { VietnamMap } from "./VietnamMap";

// Set to "P1" once pages 5–8 are generated
const SHOW_UP_TO: "P0" | "P1" = "P0";

interface FlipApi {
  pageFlip(): { flip(page: number): void };
}

export default function Flipbook({ data }: { data: Bootstrap }) {
  const router = useRouter();
  const book = useRef<FlipApi>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const pages = data.comic.filter((p) => SHOW_UP_TO === "P1" || p.priority === "P0");
  const mapIndex = pages.length + 1; // cover + comic pages
  const regions = new Map(data.regions.map((r) => [r.id, r]));
  const note = (regions.get(hovered ?? "hue") ?? data.regions[0]).map_note;

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-4">
      <HTMLFlipBook
        ref={book}
        width={420}
        height={560}
        size="stretch"
        minWidth={300}
        maxWidth={560}
        minHeight={400}
        maxHeight={760}
        startPage={0}
        drawShadow
        flippingTime={800}
        usePortrait
        startZIndex={0}
        autoSize
        maxShadowOpacity={0.4}
        showCover
        mobileScrollSupport
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
        className="shadow-2xl"
        style={{}}
      >
        <Page className="flex flex-col items-center justify-center gap-4 bg-[#6b4f3a] text-amber-100">
          <p className="text-sm tracking-[0.3em]">SỔ TAY CỦA BÀ</p>
          <h1 className="font-hand text-5xl">Việt Phục Du Ký</h1>
          <p className="text-sm opacity-80">Lật trang để bắt đầu →</p>
        </Page>

        {pages.map((p) => (
          <Page key={p.n}>
            <ComicPage page={p} />
          </Page>
        ))}

        {/* Map spread: left = map, right = handwritten notes */}
        <Page className="p-4">
          <VietnamMap
            active={hovered}
            locked={data.regions.filter((r) => r.status === "locked").map((r) => r.id)}
            onHover={setHovered}
            onSelect={(id) => router.push(`/chapter/${id}`)}
          />
        </Page>
        <Page className="flex flex-col justify-between p-8">
          <HandwrittenText title={note.title} lines={note.lines} />
          <button
            onClick={() => router.push("/chapter/hue?entry=event")}
            className="self-start rounded-full border border-stone-700 px-4 py-2 text-sm hover:bg-stone-800 hover:text-amber-50"
          >
            Tôi sắp tham gia sự kiện
          </button>
        </Page>

        <Page className="flex items-center justify-center bg-[#6b4f3a] text-amber-100">
          <p className="font-hand text-2xl">Trang cuối là câu chuyện bạn viết tiếp.</p>
        </Page>
      </HTMLFlipBook>

      <button onClick={() => book.current?.pageFlip().flip(mapIndex)} className="text-sm text-stone-600 underline">
        Bỏ qua truyện
      </button>
    </div>
  );
}
