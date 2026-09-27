"use client";

import HTMLFlipBook from "react-pageflip";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Bootstrap } from "@/lib/types";
import { BookCover } from "./BookCover";
import { HandwrittenText } from "./HandwrittenText";
import { Page } from "./Page";
import { VietnamMap } from "./VietnamMap";

/** The open notebook: cover, the map spread (Bà's invitation), back cover. */
export default function Flipbook({ data, width, height, startPage = 1, portrait = false }: { data: Bootstrap; width: number; height: number; startPage?: number; portrait?: boolean }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const regions = new Map(data.regions.map((r) => [r.id, r]));
  const note = hovered ? regions.get(hovered)?.map_note : null;

  return (
    <HTMLFlipBook
      width={width}
      height={height}
      size="fixed"
      minWidth={width}
      maxWidth={width}
      minHeight={height}
      maxHeight={height}
      startPage={startPage}
      drawShadow
      flippingTime={900}
      usePortrait={portrait} // phones: one page at a time
      startZIndex={0}
      autoSize={false}
      maxShadowOpacity={0.35}
      showCover
      mobileScrollSupport
      clickEventForward
      useMouseEvents
      swipeDistance={30}
      showPageCorners
      disableFlipByClick
      className="book-open"
      style={{}}
    >
      <Page bare className="relative">
        <BookCover sizes={`${width}px`} />
      </Page>

      <Page className="p-4">
        <VietnamMap
          active={hovered}
          locked={data.regions.filter((r) => r.status === "locked").map((r) => r.id)}
          onHover={setHovered}
          onSelect={(id) => router.push(`/chapter/${id}`)}
        />
      </Page>

      <Page className="flex flex-col p-[8%]">
        <p className="font-hand text-[1.35rem] leading-snug text-stone-800">
          Muốn viết tiếp một câu chuyện, trước hết phải hiểu câu chuyện đã có.
        </p>
        <p className="font-hand mt-1 text-right text-lg text-stone-500">— Bà</p>
        <div className="mt-6 min-h-[9rem] flex-1">
          {note ? (
            <HandwrittenText title={note.title} lines={note.lines} />
          ) : (
            <p className="font-hand text-2xl text-[#B5452E]">Chọn nơi con muốn bắt đầu.</p>
          )}
        </div>
        <button
          onClick={() => router.push("/chapter/hue?entry=event")}
          className="self-start rounded-full border border-stone-700 px-4 py-2 text-sm hover:bg-stone-800 hover:text-amber-50"
        >
          Tôi sắp tham gia sự kiện
        </button>
      </Page>

      <Page bare className="relative">
        <div className="absolute inset-0 rounded-[6px] bg-[#2F4A6D]" />
      </Page>
    </HTMLFlipBook>
  );
}
