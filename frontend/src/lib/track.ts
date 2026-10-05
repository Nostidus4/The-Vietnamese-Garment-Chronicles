import { API_URL, HAS_API } from "./api";
import type { CompassState } from "./types";

// Anonymous usage events (backend/app/services/events.py). Only ids, states and booleans: never a name, a photo or text.
type Payloads = {
  compass_result: { state: CompassState; garment_id: string; occasion_id: string };
  look_fixed: { from_state: "review" | "distorted"; to_state: "fit" | "adapted"; garment_id: string };
  occasion_selected: { garment_id: string; occasion_id: string; fits: boolean };
  quiz_answer: { phase: "pre" | "post"; item_id: string; correct: boolean; region_id: string };
  tryon: { garment_id: string; alternative: boolean; sample: boolean };
  duky_save: { kind: "ai" | "real" | "card"; garment_id: string };
  wardrobe_wear: { item_id: string; body: "nu" | "nam" | "con" };
};

const KEY = "vpdk-session";
let memory: string | null = null;

/** A random id for this browser tab, not tied to any person. */
function sessionId(): string {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return (memory ??= crypto.randomUUID());
  }
}

/** Fire and forget: a network error never reaches the UI. */
export function track<T extends keyof Payloads>(type: T, payload: Payloads[T]) {
  if (!HAS_API) return;
  try {
    fetch(`${API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId(), type, payload, ts: new Date().toISOString() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics must never break the app
  }
}
