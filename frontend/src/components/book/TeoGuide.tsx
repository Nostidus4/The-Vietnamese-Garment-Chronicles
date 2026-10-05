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
  const side = place?.side === "above" || place?.side === "below";
  return createPortal(
    <AnimatePresence>
      {tip && place && (
        <motion.div
          key={tip.tip.id}
          role="note"
          aria-live="polite"
          className="pointer-events-auto fixed z-[70] bg-[#fbe99a] px-4 pb-3 pt-3 text-[0.9rem] leading-snug text-[#1f3a78] shadow-[3px_8px_18px_rgba(40,25,0,0.4)]"
          style={{ left: place.x, top: place.y, width: W, rotate: "-1deg" }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, ...OFFSET[place.side] }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          {/* the little tail pointing at the target */}
          <span
            aria-hidden
            className="absolute h-3 w-3 rotate-45 bg-[#fbe99a]"
            style={
              side
                ? { left: place.tail - 6, ...(place.side === "below" ? { top: -6 } : { bottom: -6 }) }
                : { top: place.tail - 6, ...(place.side === "right" ? { left: -6 } : { right: -6 }) }
            }
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

type Side = "above" | "below" | "right" | "left";
const OFFSET: Record<Side, { x?: number; y?: number }> = { above: { y: 8 }, below: { y: -8 }, right: { x: -8 }, left: { x: 8 } };
const H = 150; // about the note's height: title, three lines of text, the footer
const TEXT = "p, li, h1, h2, h3, a, button, label, img, figure, text, [role=tab]";

/**
 * Where the note goes: on the side of the target that hides the least of the page (#56). On a short screen the
 * space above the "next" button is the table of contents, and above the chapter tabs the tabs themselves, so each
 * side is scored by how much text it would cover, and the target itself counts ten times.
 */
function bubble(r: DOMRect, w: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const clampX = (x: number) => Math.min(vw - w - 8, Math.max(8, x));
  const clampY = (y: number) => Math.min(vh - H - 8, Math.max(8, y));
  const spots: { side: Side; x: number; y: number }[] = [
    { side: "above", x: clampX(cx - w / 2), y: r.top - 12 - H },
    { side: "below", x: clampX(cx - w / 2), y: r.bottom + 12 },
    { side: "right", x: r.right + 12, y: clampY(cy - H / 2) },
    { side: "left", x: r.left - 12 - w, y: clampY(cy - H / 2) },
  ];
  const texts = [...document.querySelectorAll<Element>(TEXT)]
    .filter((el) => !el.closest("[role=note]"))
    .map((el) => el.getBoundingClientRect())
    .filter((b) => b.width > 0 && b.height > 0);
  const overlap = (a: { x: number; y: number }, b: { left: number; top: number; right: number; bottom: number }) =>
    Math.max(0, Math.min(a.x + w, b.right) - Math.max(a.x, b.left)) * Math.max(0, Math.min(a.y + H, b.bottom) - Math.max(a.y, b.top));
  let best: (typeof spots)[number] | null = null;
  let bestScore = Infinity;
  for (const s of spots) {
    if (s.x < 8 || s.y < 8 || s.x + w > vw - 8 || s.y + H > vh - 8) continue; // off the screen
    const score = overlap(s, r) * 10 + texts.reduce((n, b) => n + overlap(s, b), 0);
    if (score < bestScore) [best, bestScore] = [s, score];
  }
  if (!best) return null;
  const tail = best.side === "above" || best.side === "below" ? Math.min(w - 14, Math.max(14, cx - best.x)) : Math.min(H - 14, Math.max(14, cy - best.y));
  return { ...best, tail };
}
