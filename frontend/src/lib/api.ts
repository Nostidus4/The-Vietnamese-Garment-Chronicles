import { asset } from "./base";
import { retryAfterSeconds } from "./tryonWait";
import type { Bootstrap, CompassResult, Selection, Shop, TryOnResult } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
/** Built without a backend (GitHub Pages with no NEXT_PUBLIC_API_URL): the book reads content bundled at build time. */
export const HAS_API = API_URL !== "";

/** Absolute URL for a file under backend/content/media, e.g. media("comic/page-1.png") */
export const media = (path: string) => `${API_URL}/media/${path}`;
/** What a reader sees if a server-only feature is reached anyway in a build with no server (#48): no technical words. */
export const NO_SERVER = "Bản đọc thử này chưa làm được việc này, con mở bản đầy đủ nhé.";
// every server call goes through here: with no backend it fails at once instead of hitting the Pages host
const call: typeof fetch = (input, init) => (HAS_API ? fetch(input, init) : Promise.reject(new Error(NO_SERVER)));

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
  call(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => json<T>(r));

export const runCompass = (sel: Selection) => post<CompassResult>("/compass", sel);

export const compareLooks = (selections: Selection[]) => post<CompassResult[]>("/compass/compare", { selections });

export const askTeo = (garment_id: string, question: string) =>
  post<{ answer: string; sources: string[]; grounded: boolean }>("/ask", { garment_id, question });

/** The try-on limiter said no; `retryAfterS` comes from its Retry-After header. */
export class RateLimited extends Error {
  constructor(
    message: string,
    readonly retryAfterS: number,
  ) {
    super(message);
  }
}

export function tryOn(sel: Selection, opts: { photo?: File; avatarId?: string; signal?: AbortSignal }) {
  const form = new FormData();
  form.append("selection", JSON.stringify(sel));
  if (opts.photo) form.append("photo", opts.photo);
  if (opts.avatarId) form.append("avatar_id", opts.avatarId);
  // Backend gives up on Gemini after 60 s and returns the fallback; the timeout only catches a hung connection
  const timeout = AbortSignal.timeout(75_000);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
  return call(`${API_URL}/tryon`, { method: "POST", body: form, signal })
    .then(async (r) => {
      if (r.status === 429) {
        const body = await r.json().catch(() => ({}));
        throw new RateLimited(body.detail ?? "Bạn thử đồ nhanh quá, chờ một chút nhé.", retryAfterSeconds(r.headers.get("Retry-After"), Date.now()));
      }
      return json<TryOnResult>(r);
    })
    .catch((e) => {
      if (e instanceof DOMException && e.name === "TimeoutError") throw new Error("Máy chủ phản hồi quá lâu, bạn thử lại nhé.");
      throw e;
    });
}

export const getQuiz = (count = 5) =>
  call(`${API_URL}/quiz?count=${count}`).then((r) =>
    json<{ choices: Record<string, string>; items: { id: string; image: string }[] }>(r),
  );

export const answerQuiz = (id: string, answer: string) =>
  post<{ correct: boolean; answer_name: string; explanation: string; sources: string[] }>("/quiz/answer", { id, answer });

export const getShops = (params: { city?: string; garment_id?: string; service?: string }) =>
  call(`${API_URL}/shops?${new URLSearchParams(params as Record<string, string>)}`).then((r) => json<Shop[]>(r));

export const getWeather = (regionId: string) =>
  call(`${API_URL}/weather/${regionId}`).then((r) =>
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
  call(`${API_URL}/weather/${regionId}?date=${encodeURIComponent(date)}`).then((r) => json<DayWeather>(r));

// ---- public links for one Du Ký page (#27): only month, garment, occasion, note and chosen photos ----
export type ShareMeta = {
  region_id: string;
  garment_id: string;
  occasion_id: string;
  month: string;
  status: "planned" | "worn";
  note: string;
  compass_label: string | null;
  photo_kinds: ("ai" | "real" | "card")[];
  photo_samples: boolean[];
};
export type SharedPage = { id: string; meta: ShareMeta; photo_urls: string[]; created_at: string };

export function createShare(meta: ShareMeta, photos: Blob[]) {
  const form = new FormData();
  form.append("meta", JSON.stringify(meta));
  photos.forEach((b, i) => form.append("photos", b, `${i}.${b.type === "image/png" ? "png" : "jpg"}`));
  return call(`${API_URL}/share`, { method: "POST", body: form }).then((r) => json<{ id: string; delete_key: string }>(r));
}
export const getShare = (id: string) => call(`${API_URL}/share/${encodeURIComponent(id)}`).then((r) => json<SharedPage>(r));
export const deleteShare = (id: string, key: string) =>
  call(`${API_URL}/share/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "X-Delete-Key": key } }).then((r) => {
    if (!r.ok && r.status !== 404) throw new Error(`Lỗi ${r.status}`);
  });

// ---- cold start: the free backend sleeps; wake it once and let everyone wait on the same promise ----
let readyPromise: Promise<boolean> | null = null;
let readyAt = 0;
// Render's free plan sleeps after 15 idle minutes; past this, check again instead of trusting the old answer
const READY_FOR_MS = 5 * 60_000;
/** Resolves true once GET /health answers (polling up to ~2 minutes), false if it never does. */
export function serverReady(): Promise<boolean> {
  if (!HAS_API) return Promise.resolve(false);
  if (readyAt && Date.now() - readyAt > READY_FOR_MS) {
    readyPromise = null;
    readyAt = 0;
  }
  readyPromise ??= (async () => {
    const until = Date.now() + 120_000;
    while (Date.now() < until) {
      try {
        const r = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
        if (r.ok) {
          readyAt = Date.now();
          return true;
        }
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
