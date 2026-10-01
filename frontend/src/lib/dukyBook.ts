"use client";

// Du Ký của con (tickets #19, #20): the reader's own notebook. Each page is one time they wore (or plan to wear)
// Việt phục: "planned" (Sắp đi) until a real photo is added, then "worn" (Đã mặc).
//
// Everything stays on this device. Page data lives in localStorage; photos live in IndexedDB, because a single AI
// try-on image can be 1–2 MB and localStorage holds about 5 MB in total. Every photo, real or AI, is shrunk before saving.

import { useEffect, useState } from "react";
import type { CompassState, DuKyEntry, Selection } from "./types";

export type PhotoRef = { id: string; kind: "ai" | "real"; sample?: boolean };
export type DuKyPage = {
  id: string;
  status: "planned" | "worn";
  region_id: string;
  garment_id: string;
  occasion_id: string;
  look: Selection | null;
  compass_label: string | null; // Authentic / Adapted / Inspired, for AI looks
  compass_state: CompassState | null;
  date: string | null; // yyyy-mm-dd
  place: string;
  note: string;
  photos: PhotoRef[];
  share: { id: string; delete_key: string } | null;
  created_at: string;
  worn_at: string | null;
};
export type DuKyCover = { name: string; color: string };
export type DuKyBook = { cover: DuKyCover; pages: DuKyPage[] };

const KEY = "vpdk-duky-v2";
const OLD_ENTRIES = "du-ky-cua-toi";
const OLD_OWN = "vpdk-own-pages";
const EVENT = "vpdk-duky";
export const COVER_COLORS = ["#7a2e2e", "#2F4A6D", "#4f6b3a", "#6b4a2f", "#5b3a6b"];
const EMPTY: DuKyBook = { cover: { name: "", color: COVER_COLORS[0] }, pages: [] };

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/* ---------------- photos in IndexedDB ---------------- */

const DB = "vpdk-duky";
const STORE = "photos";
let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  dbp ??= new Promise((ok, fail) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
  return dbp;
}
async function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((ok, fail) => {
    const r = run(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(r.error);
  });
}
export const putPhoto = (id: string, blob: Blob) => idb("readwrite", (s) => s.put(blob, id));
export const getPhoto = (id: string) => idb<Blob | undefined>("readonly", (s) => s.get(id));
export const deletePhoto = (id: string) => idb("readwrite", (s) => s.delete(id));

/** An object URL for a stored photo (revoke it when done). */
export function usePhotoUrl(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    let made: string | null = null;
    getPhoto(id)
      .then((b) => {
        if (!alive || !b) return;
        made = URL.createObjectURL(b);
        setUrl(made);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);
  return id ? url : null;
}

export async function dataUrlToBlob(src: string): Promise<Blob> {
  return (await fetch(src)).blob();
}

/** Shrink a photo to at most 1280 px on its long side, JPEG ~0.85: a few hundred KB instead of several MB. */
export async function shrinkPhoto(file: Blob, max = 1280): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob((b) => ok(b ?? file), "image/jpeg", 0.85));
}

/* ---------------- the book in localStorage ---------------- */

function readRaw(): DuKyBook | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as DuKyBook) : null;
  } catch {
    return null;
  }
}

let memory: DuKyBook = EMPTY; // used when localStorage is blocked (private mode)

export function loadBook(): DuKyBook {
  return readRaw() ?? memory;
}

export function saveBook(b: DuKyBook) {
  memory = b;
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    // private mode or full: kept for this visit
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The book, live across every component that shows it. */
export function useDuKy(): DuKyBook {
  const [book, setBook] = useState<DuKyBook>(loadBook);
  useEffect(() => {
    const on = () => setBook(loadBook());
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return book;
}

const update = (fn: (b: DuKyBook) => DuKyBook) => saveBook(fn(loadBook()));

export function newPage(p: Partial<DuKyPage> & Pick<DuKyPage, "region_id" | "garment_id" | "occasion_id">): DuKyPage {
  return {
    id: uid(),
    status: "planned",
    look: null,
    compass_label: null,
    compass_state: null,
    date: null,
    place: "",
    note: "",
    photos: [],
    share: null,
    created_at: new Date().toISOString(),
    worn_at: null,
    ...p,
  };
}

export function addPage(page: DuKyPage) {
  update((b) => ({ ...b, pages: [...b.pages, page] }));
  return page;
}

export function updatePage(id: string, patch: Partial<DuKyPage>) {
  update((b) => ({ ...b, pages: b.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
}

export async function removePage(id: string) {
  const page = loadBook().pages.find((p) => p.id === id);
  update((b) => ({ ...b, pages: b.pages.filter((p) => p.id !== id) }));
  await Promise.all((page?.photos ?? []).map((ph) => deletePhoto(ph.id).catch(() => {})));
}

export function setCover(cover: Partial<DuKyCover>) {
  update((b) => ({ ...b, cover: { ...b.cover, ...cover } }));
}

/** Store a photo and attach it to a page; a real photo turns a planned page into a worn one. */
export async function addPhoto(pageId: string, blob: Blob, kind: "ai" | "real", sample = false) {
  const id = uid();
  await putPhoto(id, await shrinkPhoto(blob)); // an AI render arrives as a ~1–2 MB PNG; as JPEG it is a few hundred KB
  update((b) => ({
    ...b,
    pages: b.pages.map((p) =>
      p.id !== pageId
        ? p
        : {
            ...p,
            photos: [...p.photos, { id, kind, sample }].slice(-3),
            ...(kind === "real" ? { status: "worn" as const, worn_at: p.worn_at ?? new Date().toISOString() } : {}),
          },
    ),
  }));
}

/* ---------------- one-time move of the old data ---------------- */

/**
 * The old grid (du-ky-cua-toi: AI and real photos) and the old "Trang của con" lines (vpdk-own-pages) become
 * pages of the new book. The old keys are removed only after the new book was saved.
 */
export async function migrateOld(regionOf: (garmentId: string) => string | undefined) {
  if (readRaw()) return;
  let entries: DuKyEntry[] = [];
  let own: Record<string, { text: string; sample: string | null }> = {};
  try {
    entries = JSON.parse(localStorage.getItem(OLD_ENTRIES) ?? "[]");
    own = JSON.parse(localStorage.getItem(OLD_OWN) ?? "{}");
  } catch {
    return;
  }
  const pages: DuKyPage[] = [];
  for (const e of [...entries].reverse()) {
    const region = regionOf(e.garment_id);
    if (!region) continue;
    const id = uid();
    try {
      await putPhoto(id, await dataUrlToBlob(e.image));
    } catch {
      continue;
    }
    pages.push(
      newPage({
        status: e.kind === "real" ? "worn" : "planned",
        region_id: region,
        garment_id: e.garment_id,
        occasion_id: e.occasion_id,
        compass_label: e.label,
        photos: [{ id, kind: e.kind, sample: e.sample }],
        created_at: e.created_at,
        worn_at: e.kind === "real" ? e.created_at : null,
      }),
    );
  }
  for (const [region, o] of Object.entries(own)) {
    if (!o.text) continue;
    const last = [...pages].reverse().find((p) => p.region_id === region);
    if (last) last.note = last.note || o.text;
  }
  saveBook({ ...EMPTY, pages });
  try {
    localStorage.removeItem(OLD_ENTRIES);
    localStorage.removeItem(OLD_OWN);
  } catch {
    // nothing to clean
  }
}

export const LABEL_OF: Record<CompassState, string | null> = { fit: "Authentic", adapted: "Adapted", review: "Inspired", distorted: null };

let migrating: Promise<void> | null = null;
/** Run the one-time move once per visit, before anything reads or writes the book. */
export function ensureMigrated(garments: { id: string; region: string }[]) {
  migrating ??= migrateOld((id) => garments.find((g) => g.id === id)?.region).catch(() => {});
  return migrating;
}

/** Newest page first, optionally only one region. */
export const pagesOf = (b: DuKyBook, regionId?: string) =>
  [...b.pages].filter((p) => !regionId || p.region_id === regionId).sort((a, c) => c.created_at.localeCompare(a.created_at));
