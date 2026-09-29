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

/** Page size (one page, 3:4) of a notebook for this viewport and scale. Phones show one page at a time. */
export function pageSize(vp: { w: number; h: number }, scale: number) {
  const portrait = vp.w < 760;
  if (portrait) {
    const h = Math.min(vp.h * 0.7, (vp.w * 0.86) / 0.75);
    return { w: Math.round(h * 0.75), h: Math.round(h), portrait };
  }
  // biggest that fits: height minus the top menu and the page-turn buttons, width for two pages side by side
  const maxH = Math.min(vp.h - 116, (vp.w * 0.48) / 0.75);
  const h = maxH * scale;
  return { w: Math.round(h * 0.75), h: Math.round(h), portrait };
}
