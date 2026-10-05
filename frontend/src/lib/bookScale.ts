"use client";

// How big the notebooks are on the table (ticket #22). One setting for both books (Bà's and the Du Ký), kept on
// this device. The scale is a share of the biggest size that still fits: the book never overflows the screen and
// always leaves room for the page-turn buttons under it.

import { useEffect, useState } from "react";

const KEY = "vpdk-book-scale";
export const SCALE_MIN = 0.7;
export const SCALE_MAX = 1;
export const SCALE_STEP = 0.1;
export const SCALE_DEFAULT = 0.9;
const EVENT = "vpdk-book-scale";

const clamp = (s: number) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(s * 100) / 100));

let latest = SCALE_DEFAULT;

function read(): number {
  try {
    const v = Number(localStorage.getItem(KEY));
    latest = v ? clamp(v) : latest;
    return latest;
  } catch {
    return SCALE_DEFAULT;
  }
}

/** The chosen scale, shared live by every book on the page. */
export function useBookScale(): [number, (s: number | ((current: number) => number)) => void] {
  const [scale, setScale] = useState(read);
  useEffect(() => {
    const on = () => setScale(read());
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  const set = (next: number | ((current: number) => number)) => {
    // always step from the latest value, so quick repeated clicks each count
    const s = clamp(typeof next === "function" ? next(latest) : next);
    latest = s;
    try {
      localStorage.setItem(KEY, String(s));
    } catch {
      // private mode: the size lasts for this visit only
    }
    setScale(s);
    window.dispatchEvent(new Event(EVENT));
  };
  return [scale, set];
}

/** Viewport size, updated on resize. */
export function useViewport() {
  const [vp, setVp] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

/**
 * Page size of a notebook for this viewport and scale. Phones and upright tablets show one page at a time, and that
 * page may be taller than 3:4 (down to 0.58): a 3:4 page as wide as a phone used only half its height, and cut the
 * longer pages off at the bottom (#57). Two pages side by side stay 3:4.
 */
export function pageSize(vp: { w: number; h: number }, scale: number) {
  const portrait = vp.w < 760 || (vp.h > vp.w && vp.w < 1100);
  if (portrait) {
    // room for the site links and the chapter's bookmarks above, the page-turn buttons below
    const w = Math.min(vp.w * 0.9, 720, (vp.h - 220) * 0.75);
    const h = Math.min(vp.h - 220, w / 0.58);
    return { w: Math.round(w), h: Math.round(h), portrait };
  }
  // biggest that fits: height minus the top menu and the page-turn buttons, width for two pages side by side
  const maxH = Math.min(vp.h - 116, (vp.w * 0.48) / 0.75);
  const h = maxH * scale;
  return { w: Math.round(h * 0.75), h: Math.round(h), portrait };
}
