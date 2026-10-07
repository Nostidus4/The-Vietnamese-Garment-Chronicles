"use client";

// The three stamps of a region (ticket #24): đã đến (read the diary's arrival page), đã hiểu (answered "Bà hỏi con"),
// đã mặc (a real photo in the Du Ký; computed from the book, not stored here). Kept on this device.

import { useEffect, useState } from "react";
import type { Region } from "./types";

type Kind = "arrived" | "understood" | "postcard" | "stop" | "game";
const KEYS: Record<Kind, string> = {
  arrived: "vpdk-stamps",
  understood: "vpdk-understood",
  postcard: "vpdk-postcards",
  stop: "vpdk-stop-stamps", // "<region>:<stop>": the reader has turned to that stop
  game: "vpdk-games", // "<region>:<stop>": the stop's game is won
};
const EVENT = "vpdk-stamps";

function read(kind: Kind): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS[kind]) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * The place a region's stamps are named after: its open chapter (Huế), else the region. Every stamp says it the same
 * way, in the chapter, the toast and the Tủ tem, so "đã hiểu Huế" is never "đã hiểu Trung Bộ" elsewhere (#114).
 */
export const stampPlace = (r: Region) => r.chapters?.find((c) => c.status === "open")?.province ?? r.name.split("/")[0].trim();

/** Fired with { kind, id } when a region stamp is earned for the first time; StampToast shows it (#63). */
export const NEW_STAMP = "vpdk-new-stamp";

export function markStamp(kind: Kind, regionId: string) {
  if (typeof window === "undefined") return;
  const s = read(kind);
  if (s.includes(regionId)) return;
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify([...s, regionId]));
  } catch {
    // private mode: not remembered
  }
  window.dispatchEvent(new Event(EVENT));
  if (kind === "arrived" || kind === "understood") window.dispatchEvent(new CustomEvent(NEW_STAMP, { detail: { kind, id: regionId } }));
}

export function unmarkStamp(kind: Kind, regionId: string) {
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify(read(kind).filter((x) => x !== regionId)));
  } catch {
    // private mode
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useStamps() {
  const all = () => ({ arrived: read("arrived"), understood: read("understood"), postcard: read("postcard"), stop: read("stop"), game: read("game") });
  const [state, setState] = useState(all);
  useEffect(() => {
    const on = () => setState(all());
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return state;
}
