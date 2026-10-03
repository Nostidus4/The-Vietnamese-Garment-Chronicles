"use client";

// The try-on itself, without any look: wake the server, render (cancellable), the 429 countdown, save to the Du Ký.
// Moved out of the old step-3 panel (#41) so the fitting room's mirror and action bar can share one state.

import { useEffect, useRef, useState } from "react";
import { API_URL, RateLimited, serverReady, tryOn } from "@/lib/api";
import { addPage, addPhoto, dataUrlToBlob, ensureMigrated, newPage } from "@/lib/dukyBook";
import { track } from "@/lib/track";
import { retryLabel, secondsLeft, untilAborted, waitLabel, type WaitStage } from "@/lib/tryonWait";
import type { Bootstrap, CompassState, Selection, TryOnResult } from "@/lib/types";

// same labels as backend/app/models.py LABELS (⛔ has none: the original look is never saved)
const LABEL_OF: Record<CompassState, string | null> = { fit: "Authentic", adapted: "Adapted", review: "Inspired", distorted: null };

export type TryOn = ReturnType<typeof useTryOn>;

export function useTryOn({ data }: { data: Bootstrap }) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [wait, setWait] = useState<{ stage: WaitStage; since: number } | null>(null);
  const [retryAt, setRetryAt] = useState(0); // after a 429: when the limiter lets this visitor in again
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const busy = wait !== null;
  const countdown = retryLabel(secondsLeft(retryAt, now));
  const locked = busy || countdown !== null;

  // the clock behind the stage timer and the 429 countdown; idle otherwise
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [locked]);
  useEffect(() => () => abort.current?.abort(), []);

  const image = result?.image_base64
    ? `data:image/png;base64,${result.image_base64}`
    : result?.fallback_url
      ? `${API_URL}${result.fallback_url}` // e.g. /media/fallback/ao-dai.png
      : null;
  // no fresh render, only the pre-made fallback: it must never pass as an AI image of this look
  const isSample = !!result && !result.image_base64 && !!result.fallback_url;
  // ⛔ looks are never rendered; their alternative is, and it can be saved with its own verdict
  const saveLabel = result
    ? result.rendered_alternative
      ? result.compass.alternative_state && LABEL_OF[result.compass.alternative_state]
      : result.compass.label
    : null;
  const stageLabel = wait ? waitLabel(wait.stage, now - wait.since) : null;

  async function run(selection: Selection) {
    const ctl = new AbortController();
    abort.current = ctl;
    setNow(Date.now());
    setWait({ stage: "waking", since: Date.now() });
    setSaved(false);
    setError(null);
    try {
      // a sleeping server must wake before the try-on clock starts, or the first try falls back
      if (!(await untilAborted(serverReady(), ctl.signal))) throw new Error("Máy chủ chưa thức dậy. Bạn thử lại sau ít phút nhé.");
      setWait({ stage: "rendering", since: Date.now() });
      const r = await tryOn(selection, photo ? { photo, signal: ctl.signal } : { avatarId: "default", signal: ctl.signal });
      setResult(r);
      track("tryon", { garment_id: r.rendered_selection.garment_id, alternative: r.rendered_alternative, sample: !r.image_base64 && !!r.fallback_url });
    } catch (e) {
      if (ctl.signal.aborted) return; // the viewer pressed Huỷ (or left the page)
      if (e instanceof RateLimited) setRetryAt(Date.now() + e.retryAfterS * 1000);
      setError(e instanceof Error ? e.message : "Không dựng được ảnh");
    } finally {
      if (abort.current === ctl) {
        abort.current = null;
        setWait(null);
      }
    }
  }

  /** One "lần mặc" in the reader's Du Ký (Sắp đi), with this try-on as its first photo. */
  async function save() {
    if (!result || !image || saved) return false;
    const sel = result.rendered_selection;
    setSaved(true);
    await ensureMigrated(data.garments);
    const region = data.garments.find((g) => g.id === sel.garment_id)?.region ?? "";
    const page = addPage(
      newPage({
        region_id: region,
        garment_id: sel.garment_id,
        occasion_id: sel.occasion_id,
        look: sel,
        compass_label: saveLabel, // the alternative is saved with the verdict of what was actually rendered
        compass_state: result.rendered_alternative ? result.compass.alternative_state : result.compass.state,
      }),
    );
    await addPhoto(page.id, await dataUrlToBlob(image), "ai", isSample); // shrunk to JPEG inside addPhoto
    track("duky_save", { kind: "ai", garment_id: sel.garment_id });
    return true;
  }

  return {
    photo,
    setPhoto,
    busy,
    locked,
    countdown,
    stageLabel,
    result,
    image,
    isSample,
    saveLabel,
    saved,
    error,
    run,
    cancel: () => abort.current?.abort(),
    save,
    /** a new look: the old picture no longer shows it */
    clear: () => {
      setResult(null);
      setSaved(false);
      setError(null);
    },
  };
}
