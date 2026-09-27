"use client";

import { useState } from "react";
import { media } from "@/lib/api";
import type { ComicPage as ComicPageData } from "@/lib/types";

export function ComicPage({ page }: { page: ComicPageData }) {
  const [missing, setMissing] = useState(false);
  return (
    <div className="relative h-full w-full">
      {missing ? (
        // Placeholder until the Nano Banana page image is added to backend/content/media/comic
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-stone-500">
          Trang {page.n}: {page.scene}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media(page.image)} alt={page.scene} className="h-full w-full object-cover" onError={() => setMissing(true)} />
      )}
      {page.bubbles.map((b, i) => (
        <div
          key={i}
          className="bubble absolute max-w-[70%]"
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-stone-500">{b.speaker}</span>
          {b.text}
        </div>
      ))}
    </div>
  );
}
