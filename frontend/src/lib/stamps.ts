"use client";

// The three stamps of a region (ticket #24): đã đến (read the diary's arrival page), đã hiểu (answered "Bà hỏi con"),
// đã mặc (a real photo in the Du Ký; computed from the book, not stored here). Kept on this device.

import { useEffect, useState } from "react";

type Kind = "arrived" | "understood";
const KEYS: Record<Kind, string> = { arrived: "vpdk-stamps", understood: "vpdk-understood" };
const EVENT = "vpdk-stamps";

function read(kind: Kind): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS[kind]) ?? "[]");
  } catch {
    return [];
  }
}

export function markStamp(kind: Kind, regionId: string) {
  const s = read(kind);
  if (s.includes(regionId)) return;
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify([...s, regionId]));
  } catch {
    // private mode: not remembered
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useStamps() {
  const [state, setState] = useState(() => ({ arrived: read("arrived"), understood: read("understood") }));
  useEffect(() => {
    const on = () => setState({ arrived: read("arrived"), understood: read("understood") });
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return state;
}
