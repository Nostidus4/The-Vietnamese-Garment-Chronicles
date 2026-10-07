"use client";

// − / + / "Vừa màn hình" for the notebooks, in the top corner of the sewing table (desktop only): down by the bottom
// bar it ran into the chapter's thread and its "Đi tiếp" button on a 1280×720 screen (#56).
// Ctrl/Cmd + and Ctrl/Cmd − resize the book instead of the page while a book is on the table.

import { useEffect } from "react";
import { SCALE_MAX, SCALE_MIN, SCALE_STEP, useBookScale } from "@/lib/bookScale";

export function BookSizeControl() {
  const [scale, setScale] = useBookScale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setScale((s) => s + SCALE_STEP);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setScale((s) => s - SCALE_STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        setScale(SCALE_MAX);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    // says what it sizes: "− 90% +" alone read as the browser's zoom (#115)
    <div className="book-size fixed left-4 top-4 z-30 hidden items-center gap-1 rounded-full px-2 py-1 text-sm md:flex" role="group" aria-label="Cỡ cuốn sổ">
      <span className="mr-0.5 pl-1 text-[0.8rem] opacity-85" aria-hidden>
        📕 Cỡ sổ
      </span>
      <button type="button" onClick={() => setScale((s) => s - SCALE_STEP)} disabled={scale <= SCALE_MIN} aria-label="Thu nhỏ sổ" title="Thu nhỏ (Ctrl/Cmd −)">
        −
      </button>
      <span className="w-11 text-center tabular-nums" aria-live="polite">
        {Math.round(scale * 100)}%
      </span>
      <button type="button" onClick={() => setScale((s) => s + SCALE_STEP)} disabled={scale >= SCALE_MAX} aria-label="Phóng to sổ" title="Phóng to (Ctrl/Cmd +)">
        +
      </button>
      {/* "Vừa màn hình" read as the size already shown (90%): it is the biggest that fits, so it says so (#65) */}
      <button type="button" onClick={() => setScale(SCALE_MAX)} disabled={scale >= SCALE_MAX} className="ml-1 whitespace-nowrap" title="To nhất vừa màn hình (Ctrl/Cmd 0)">
        To nhất
      </button>
    </div>
  );
}
