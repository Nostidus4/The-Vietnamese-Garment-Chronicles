"use client";

// Tèo shows a first-time reader the three things to press: the button that leads on, his red pins, the bookmarks.
// One sticky note at a time, next to the thing it points at, only once per device. It never covers the page with an
// overlay: the reader can ignore it and keep reading, and pressing the thing it points at also puts it away.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const KEY = "vpdk-guide";
const TIPS = [
  { id: "next", target: '[data-guide="next"]', text: "Bấm nút vàng {btn}để đi tiếp. Kéo góc trang, hay dùng phím ← →, cũng lật được." },
  // on a touch screen there are no arrow keys to speak of (#115)
  { id: "next", target: '[data-guide="next"]', text: "Bấm nút vàng {btn}để đi tiếp. Vuốt trang cũng lật được.", touch: true },
  { id: "pin", target: ".teo-pin", text: "Thấy ghim đỏ là có ghi chú của tớ. Bấm vào để đọc thêm nhé." },
  { id: "tabs", target: '[data-guide="tabs"]', text: "Mấy dải màu này là mục lục nhanh của chương: bấm để nhảy tới phần bạn muốn." },
] as const;
// the note sits beside the button, not always right next to it: it says which button by its words ("{btn}")
const nameOf = (el: HTMLElement) => {
  const w = (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").replace(/[→›‹←\s]+$/u, "").trim();
  return w && w.length <= 34 ? `“${w}” ` : "này ";
};
type Tip = { id: string; target: string; text: string; touch?: boolean };
// a touch screen whose browser reports a fine pointer (some phones and test runs) still has no arrow keys (#119)
const touch = () => typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0);
/** The tips for this screen: the touch wording of "next" on a phone or a tablet, the keyboard one elsewhere. */
const tips = (): Tip[] => (TIPS as readonly Tip[]).filter((t) => (t.id === "next" ? !!t.touch === touch() : true));

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
  const [tip, setTip] = useState<{ tip: Tip; rect: DOMRect; name: string } | null>(null);
  const [h, setH] = useState(H); // the note's real height, once drawn: the estimate put it over the buttons below (#115)
  const note = useRef<HTMLDivElement>(null);
  const shownOn = useRef<HTMLElement | null>(null); // the "next" button the first tip was shown beside

  // look for the next tip whose target is on screen; nothing shows while one of Tèo's notes or a dialog is open
  useEffect(() => {
    const t = setInterval(() => {
      if (document.querySelector("[data-anchored], [role=dialog]")) return setTip(null);
      const done = seen();
      const next = tips().find((x) => !done.includes(x.id) && visible(x.target));
      if (!next) return setTip(null);
      const el = visible(next.target)!;
      // the reader turned the page some other way (a drag, a tab, a swipe): they know how, the note stops following
      // them from page to page (#115)
      if (next.id === "next") {
        if (shownOn.current && shownOn.current !== el) {
          remember("next");
          shownOn.current = null;
          return setTip(null);
        }
        shownOn.current = el;
      }
      setTip((cur) => (cur?.tip.id === next.id && sameRect(cur.rect, el.getBoundingClientRect()) ? cur : { tip: next, rect: el.getBoundingClientRect(), name: nameOf(el) }));
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

  // measure the note as drawn; a different height moves it to the side that hides the least for that height
  useEffect(() => {
    const el = note.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH((cur) => (Math.abs(cur - el.offsetHeight) > 4 ? el.offsetHeight : cur)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [tip?.tip.id]);

  if (typeof document === "undefined") return null;
  const place = tip && bubble(tip.rect, h);
  const side = place?.side === "above" || place?.side === "below";
  return createPortal(
    <AnimatePresence>
      {tip && place && (
        <motion.div
          key={tip.tip.id}
          ref={note}
          role="note"
          aria-live="polite"
          className={`pointer-events-auto fixed z-[70] bg-[#fbe99a] text-[#1f3a78] shadow-[3px_8px_18px_rgba(40,25,0,0.4)] ${place.side === "dock" ? "px-3 py-2 text-[0.85rem] leading-snug" : "px-4 pb-3 pt-3 text-[0.9rem] leading-snug"}`}
          style={{ left: place.x, top: place.y, width: place.w, rotate: place.side === "dock" ? "0deg" : "-1deg" }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, ...OFFSET[place.side] }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          {/* the little tail pointing at the target */}
          {place.side !== "dock" && (
            <span
              aria-hidden
              className="absolute h-3 w-3 rotate-45 bg-[#fbe99a]"
              style={
                side
                  ? { left: place.tail - 6, ...(place.side === "below" ? { top: -6 } : { bottom: -6 }) }
                  : { top: place.tail - 6, ...(place.side === "right" ? { left: -6 } : { right: -6 }) }
              }
            />
          )}
          {/* Tèo himself on the note, so a first-time reader sees a character speaking, not a yellow box (#147) */}
          <span className="flex items-start gap-2">
            <TeoFace />
            <span className="min-w-0">
              {place.side !== "dock" && <b className="font-hand block text-[1.05rem] text-[#8a4b2a]">Tèo chỉ bạn</b>}
              {tip.tip.text.replace("{btn}", tip.name)}
            </span>
          </span>
          <span className={`flex items-center justify-between ${place.side === "dock" ? "mt-1" : "mt-2"}`}>
            {/* how many tips this reader has met, this one included: the place in TIPS skipped and repeated (#147) */}
            <span className="text-[0.75rem] opacity-70">
              {Math.min(seen().length + 1, tips().length)}/{tips().length}
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

/** Tèo: a boy of about thirteen with round glasses (docs/VOICE_PROMPTS.md). */
function TeoFace() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <circle cx="20" cy="20" r="19" fill="#f6efe0" stroke="#1f3a78" strokeWidth="1.5" />
      <circle cx="20" cy="22" r="11" fill="#efcfae" stroke="#2b2118" strokeWidth="1.2" />
      <path d="M9 20 Q9 9 20 9 Q31 9 31 20 Q27 14 20 15 Q13 14 9 20 Z" fill="#2b2118" />
      <circle cx="16" cy="22" r="3.2" fill="none" stroke="#2b2118" strokeWidth="1.1" />
      <circle cx="24" cy="22" r="3.2" fill="none" stroke="#2b2118" strokeWidth="1.1" />
      <path d="M19.2 22 h1.6" stroke="#2b2118" strokeWidth="1.1" />
      <path d="M17 28 q3 2 6 0" fill="none" stroke="#9a4a36" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function sameRect(a: DOMRect, b: DOMRect) {
  return Math.abs(a.left - b.left) < 2 && Math.abs(a.top - b.top) < 2;
}

type Side = "above" | "below" | "right" | "left" | "dock";
const OFFSET: Record<Side, { x?: number; y?: number }> = { above: { y: 8 }, below: { y: -8 }, right: { x: -8 }, left: { x: 8 }, dock: { y: 8 } };
const W = 250;
const H = 150; // about the note's height before it is drawn: title, three lines of text, the footer
const TEXT = "p, li, h1, h2, h3, a, button, label, img, figure, text, [role=tab]";
const CONTROL = "a, button, [role=tab], input, select"; // covering one of these is worse than covering words

/**
 * Where the note goes: on the side of the target that hides the least of the page (#56). On a short screen the
 * space above the "next" button is the table of contents, and above the chapter tabs the tabs themselves, so each
 * side is scored by how much text it would cover, and the target itself counts ten times.
 */
function bubble(r: DOMRect, H: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // a phone has no free side: the note lies across the top or the bottom of the screen, whichever hides less (#57)
  const phone = vw < 640;
  const w = phone ? vw - 16 : W;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const clampX = (x: number) => Math.min(vw - w - 8, Math.max(8, x));
  const clampY = (y: number) => Math.min(vh - H - 8, Math.max(8, y));
  const spots: { side: Side; x: number; y: number }[] = phone
    ? [
        { side: "dock", x: 8, y: 8 },
        { side: "dock", x: 8, y: vh - H - 8 },
        // just above the button it points at: at the top it covered the site's links and the letter's heading (#115)
        { side: "dock", x: 8, y: r.top - 12 - H },
      ]
    : [
        { side: "above", x: clampX(cx - w / 2), y: r.top - 12 - H },
        { side: "below", x: clampX(cx - w / 2), y: r.bottom + 12 },
        { side: "right", x: r.right + 12, y: clampY(cy - H / 2) },
        { side: "left", x: r.left - 12 - w, y: clampY(cy - H / 2) },
        // out on the table, by the screen's edge, level with the target: under the book's last row of buttons every
        // side of the "next" button covered another button (#115)
        { side: "right", x: vw - w - 8, y: clampY(r.bottom - H) },
        { side: "left", x: 8, y: clampY(r.bottom - H) },
      ];
  const texts = [...document.querySelectorAll<Element>(TEXT)]
    .filter((el) => !el.closest("[role=note]"))
    .map((el) => Object.assign(el.getBoundingClientRect(), { weight: el.matches(CONTROL) ? 5 : 1 }))
    .filter((b) => b.width > 0 && b.height > 0);
  const overlap = (a: { x: number; y: number }, b: { left: number; top: number; right: number; bottom: number }) =>
    Math.max(0, Math.min(a.x + w, b.right) - Math.max(a.x, b.left)) * Math.max(0, Math.min(a.y + H, b.bottom) - Math.max(a.y, b.top));
  let best: (typeof spots)[number] | null = null;
  let bestScore = Infinity;
  for (const s of spots) {
    if (s.x < 8 || s.y < 8 || s.x + w > vw - 8 || s.y + H > vh - 8) continue; // off the screen
    const score = overlap(s, r) * 10 + texts.reduce((n, b) => n + overlap(s, b) * b.weight, 0);
    if (score < bestScore) [best, bestScore] = [s, score];
  }
  if (!best) return null;
  const tail = best.side === "above" || best.side === "below" ? Math.min(w - 14, Math.max(14, cx - best.x)) : Math.min(H - 14, Math.max(14, cy - best.y));
  return { ...best, tail, w };
}
