import { asset } from "./base";
import type { Bootstrap, CompassResult, Selection, Shop, TryOnResult } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
/** Built without a backend (GitHub Pages with no NEXT_PUBLIC_API_URL): the book reads content bundled at build time. */
export const HAS_API = API_URL !== "";

/** Absolute URL for a file under backend/content/media, e.g. media("comic/page-1.png") */
export const media = (path: string) => `${API_URL}/media/${path}`;

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `Lỗi ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// All content in one request, cached for the session
let bootstrapPromise: Promise<Bootstrap> | null = null;
export function getBootstrap(): Promise<Bootstrap> {
  // wait for a sleeping server to wake instead of failing the first load
  bootstrapPromise ??= (HAS_API ? serverReady().then(() => fetch(`${API_URL}/content/bootstrap`)) : fetch(asset("/bootstrap.json")))
    .then((r) => json<Bootstrap>(r))
    .catch((e) => {
      bootstrapPromise = null;
      throw e;
    });
  return bootstrapPromise;
}

const post = <T>(path: string, body: unknown) =>
  fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => json<T>(r));

export const runCompass = (sel: Selection) => post<CompassResult>("/compass", sel);

export const compareLooks = (selections: Selection[]) => post<CompassResult[]>("/compass/compare", { selections });

export const askTeo = (garment_id: string, question: string) =>
  post<{ answer: string; sources: string[]; grounded: boolean }>("/ask", { garment_id, question });

export function tryOn(sel: Selection, opts: { photo?: File; avatarId?: string }) {
  const form = new FormData();
  form.append("selection", JSON.stringify(sel));
  if (opts.photo) form.append("photo", opts.photo);
  if (opts.avatarId) form.append("avatar_id", opts.avatarId);
  return fetch(`${API_URL}/tryon`, { method: "POST", body: form }).then((r) => json<TryOnResult>(r));
}

export const getQuiz = (count = 5) =>
  fetch(`${API_URL}/quiz?count=${count}`).then((r) =>
    json<{ choices: Record<string, string>; items: { id: string; image: string }[] }>(r),
  );

export const answerQuiz = (id: string, answer: string) =>
  post<{ correct: boolean; answer_name: string; explanation: string; sources: string[] }>("/quiz/answer", { id, answer });

export const getShops = (params: { city?: string; garment_id?: string; service?: string }) =>
  fetch(`${API_URL}/shops?${new URLSearchParams(params as Record<string, string>)}`).then((r) => json<Shop[]>(r));

export const getWeather = (regionId: string) =>
  fetch(`${API_URL}/weather/${regionId}`).then((r) =>
    json<{ available: boolean; temperature_c?: number; is_hot?: boolean; tips?: { garment_id: string; tip: string }[] }>(r),
  );

/** Forecast for a given day (Du Ký "Sắp đi"): only 16 days ahead; before that, how many days until it appears. */
export type DayWeather = {
  available: boolean;
  date?: string;
  max_c?: number;
  rain_chance?: number | null;
  is_hot?: boolean;
  tips?: { garment_id: string; tip: string }[];
  reason?: "no_point" | "past" | "too_far" | "unreachable";
  days_until_forecast?: number;
};
export const getWeatherOn = (regionId: string, date: string) =>
  fetch(`${API_URL}/weather/${regionId}?date=${encodeURIComponent(date)}`).then((r) => json<DayWeather>(r));

// ---- public links for one Du Ký page (#27): only month, garment, occasion, note and chosen photos ----
export type ShareMeta = {
  region_id: string;
  garment_id: string;
  occasion_id: string;
  month: string;
  status: "planned" | "worn";
  note: string;
  compass_label: string | null;
  photo_kinds: ("ai" | "real")[];
  photo_samples: boolean[];
};
export type SharedPage = { id: string; meta: ShareMeta; photo_urls: string[]; created_at: string };

export function createShare(meta: ShareMeta, photos: Blob[]) {
  const form = new FormData();
  form.append("meta", JSON.stringify(meta));
  photos.forEach((b, i) => form.append("photos", b, `${i}.${b.type === "image/png" ? "png" : "jpg"}`));
  return fetch(`${API_URL}/share`, { method: "POST", body: form }).then((r) => json<{ id: string; delete_key: string }>(r));
}
export const getShare = (id: string) => fetch(`${API_URL}/share/${encodeURIComponent(id)}`).then((r) => json<SharedPage>(r));
export const deleteShare = (id: string, key: string) =>
  fetch(`${API_URL}/share/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "X-Delete-Key": key } }).then((r) => {
    if (!r.ok && r.status !== 404) throw new Error(`Lỗi ${r.status}`);
  });

// ---- cold start: the free backend sleeps; wake it once and let everyone wait on the same promise ----
let readyPromise: Promise<boolean> | null = null;
/** Resolves true once GET /health answers (polling up to ~2 minutes), false if it never does. */
export function serverReady(): Promise<boolean> {
  if (!HAS_API) return Promise.resolve(false);
  readyPromise ??= (async () => {
    const until = Date.now() + 120_000;
    while (Date.now() < until) {
      try {
        const r = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
        if (r.ok) return true;
      } catch {
        // still waking up
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    readyPromise = null; // let a later retry start over
    return false;
  })();
  return readyPromise;
}
