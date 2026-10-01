"use client";

// Tèo shows a first-time reader the three things to press: the button that leads on, his red pins, the bookmarks.
// One sticky note at a time, next to the thing it points at, only once per device. It never covers the page with an
// overlay: the reader can ignore it and keep reading, and pressing the thing it points at also puts it away.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const KEY = "vpdk-guide";
const TIPS = [
  { id: "next", target: '[data-guide="next"]', text: "Bấm nút vàng này để đi tiếp. Dùng phím ← → trên bàn phím cũng được." },
  { id: "pin", target: ".teo-pin", text: "Thấy ghim đỏ là có ghi chú của tớ. Bấm vào để đọc thêm nhé." },
  { id: "tabs", target: '[data-guide="tabs"]', text: "Mấy dải màu này là mục lục nhanh của chương: bấm để nhảy tới phần con muốn." },
] as const;
type Tip = (typeof TIPS)[number];

function seen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function remember(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set([...seen(), id])]));
  } catch {
    // private mode: Tèo may say it again next visit
  }
}

/** The first visible element for a selector (page-flip keeps turned pages in the DOM, hidden). */
function visible(sel: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth) {
      // under a turning page or behind another layer: skip
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (hit && (el === hit || el.contains(hit))) return el;
    }
  }
  return null;
}

export function TeoGuide() {
  const reduced = !!useReducedMotion();
  const [tip, setTip] = useState<{ tip: Tip; rect: DOMRect } | null>(null);

  // look for the next tip whose target is on screen; nothing shows while one of Tèo's notes or a dialog is open
  useEffect(() => {
    const t = setInterval(() => {
      if (document.querySelector("[data-anchored], [role=dialog]")) return setTip(null);
      const done = seen();
      const next = TIPS.find((x) => !done.includes(x.id) && visible(x.target));
      if (!next) return setTip(null);
      const el = visible(next.target)!;
      setTip((cur) => (cur?.tip.id === next.id && sameRect(cur.rect, el.getBoundingClientRect()) ? cur : { tip: next, rect: el.getBoundingClientRect() }));
    }, 600);
    return () => clearInterval(t);
  }, []);

  // pressing the thing Tèo points at counts as "got it"
  useEffect(() => {
    if (!tip) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target.closest(tip.tip.target) : null;
      if (el) {
        remember(tip.tip.id);
        setTip(null);
      }
    };
    // turning pages with the arrow keys is the other half of the first tip
    const onKey = (e: KeyboardEvent) => {
      if (tip.tip.id === "next" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        remember("next");
        setTip(null);
      }
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [tip]);

  if (typeof document === "undefined") return null;
  const W = 250;
  const place = tip && bubble(tip.rect, W);
  return createPortal(
    <AnimatePresence>
      {tip && place && (
        <motion.div
          key={tip.tip.id}
          role="note"
          aria-live="polite"
          className="pointer-events-auto fixed z-[70] bg-[#fbe99a] px-4 pb-3 pt-3 text-[0.9rem] leading-snug text-[#1f3a78] shadow-[3px_8px_18px_rgba(40,25,0,0.4)]"
          style={{ left: place.x, ...(place.below ? { top: place.y } : { bottom: place.y }), width: W, rotate: "-1deg" }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: place.below ? -8 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          {/* the little tail pointing at the target */}
          <span
            aria-hidden
            className="absolute h-3 w-3 rotate-45 bg-[#fbe99a]"
            style={{ left: place.tail - 6, ...(place.below ? { top: -6 } : { bottom: -6 }) }}
          />
          <b className="font-hand block text-[1.05rem] text-[#8a4b2a]">Tèo chỉ con</b>
          {tip.tip.text}
          <span className="mt-2 flex items-center justify-between">
            <span className="text-[0.7rem] opacity-70">
              {TIPS.indexOf(tip.tip) + 1}/{TIPS.length}
            </span>
            <button
              type="button"
              className="rounded-full bg-[#1f3a78] px-3 py-0.5 text-[0.8rem] text-[#fbe99a]"
              onClick={() => {
                remember(tip.tip.id);
                setTip(null);
              }}
            >
              Hiểu rồi
            </button>
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function sameRect(a: DOMRect, b: DOMRect) {
  return Math.abs(a.left - b.left) < 2 && Math.abs(a.top - b.top) < 2;
}

/** Where the note goes: above the target if there is room (y = distance from the window's bottom), else below. */
function bubble(r: DOMRect, w: number) {
  const below = r.top < 170;
  const cx = r.left + r.width / 2;
  const x = Math.min(window.innerWidth - w - 8, Math.max(8, cx - w / 2));
  const y = below ? r.bottom + 12 : window.innerHeight - r.top + 12;
  return { x, y, below, tail: Math.min(w - 14, Math.max(14, cx - x)) };
}
