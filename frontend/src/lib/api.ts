import type { CompassResult, GarmentsDoc, OccasionsDoc, Selection, TryOnResult } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const getGarments = () => fetch(`${API_URL}/garments`).then((r) => json<GarmentsDoc>(r));

export const getOccasions = () => fetch(`${API_URL}/occasions`).then((r) => json<OccasionsDoc>(r));

export const runCompass = (sel: Selection) =>
  fetch(`${API_URL}/compass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sel),
  }).then((r) => json<CompassResult>(r));

export function tryOn(sel: Selection, opts: { photo?: File; avatarId?: string }) {
  const form = new FormData();
  form.append("selection", JSON.stringify(sel));
  if (opts.photo) form.append("photo", opts.photo);
  if (opts.avatarId) form.append("avatar_id", opts.avatarId);
  return fetch(`${API_URL}/tryon`, { method: "POST", body: form }).then((r) => json<TryOnResult>(r));
}

export const askTeo = (garment_id: string, question: string) =>
  fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ garment_id, question }),
  }).then((r) => json<{ answer: string; sources: string[] }>(r));
