import type { Bootstrap, CompassResult, Selection, Shop, TryOnResult } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  bootstrapPromise ??= serverReady()
    .then(() => fetch(`${API_URL}/content/bootstrap`))
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

// ---- cold start: the free backend sleeps; wake it once and let everyone wait on the same promise ----
let readyPromise: Promise<boolean> | null = null;
/** Resolves true once GET /health answers (polling up to ~2 minutes), false if it never does. */
export function serverReady(): Promise<boolean> {
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
