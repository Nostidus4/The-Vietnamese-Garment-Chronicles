"use client";

// The try-on itself, without any look: wake the server, render (cancellable), the 429 countdown. Moved out of the old
// step-3 panel (#41); saving is the card's job now (ChapterView), so this hook only renders.

import { useEffect, useRef, useState } from "react";
import { API_URL, RateLimited, serverReady, tryOn } from "@/lib/api";
import { track } from "@/lib/track";
import { checkPhoto, sampleNotice } from "@/lib/tryonPhoto";
import { retryLabel, secondsLeft, untilAborted, waitLabel, type WaitStage } from "@/lib/tryonWait";
import type { Selection, TryOnResult } from "@/lib/types";
import { friendlyError } from "@/lib/errors";

export type TryOn = ReturnType<typeof useTryOn>;

export function useTryOn() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [wait, setWait] = useState<{ stage: WaitStage; since: number } | null>(null);
  const [retryAt, setRetryAt] = useState(0); // after a 429: when the limiter lets this visitor in again
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<TryOnResult | null>(null);
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
  // no fresh render, only the pre-made fallback: it must never pass as an AI image of this look, nor become a card (#52)
  const isSample = !!result && !result.image_base64 && !!result.fallback_url;
  // why there is no render, whether or not the garment has a sample picture (ao-com and tho-cam-e-de have none)
  const notice = result && !result.image_base64 ? sampleNotice(result.fallback_reason) : null;
  const stageLabel = wait ? waitLabel(wait.stage, now - wait.since) : null;

  async function run(selection: Selection) {
    const ctl = new AbortController();
    abort.current = ctl;
    setNow(Date.now());
    setWait({ stage: "waking", since: Date.now() });
    setError(null);
    try {
      // a sleeping server must wake before the try-on clock starts, or the first try falls back
      if (!(await untilAborted(serverReady(), ctl.signal))) throw new Error("Máy chủ chưa thức dậy. Con thử lại sau ít phút nhé.");
      setWait({ stage: "rendering", since: Date.now() });
      const r = await tryOn(selection, photo ? { photo, signal: ctl.signal } : { avatarId: "default", signal: ctl.signal });
      setResult(r);
      track("tryon", { garment_id: r.rendered_selection.garment_id, alternative: r.rendered_alternative, sample: !r.image_base64 && !!r.fallback_url });
    } catch (e) {
      if (ctl.signal.aborted) return; // the viewer pressed Hủy (or left the page)
      if (e instanceof RateLimited) setRetryAt(Date.now() + e.retryAfterS * 1000);
      setError(friendlyError(e, "Chưa dựng được ảnh, con thử lại nhé."));
    } finally {
      if (abort.current === ctl) {
        abort.current = null;
        setWait(null);
      }
    }
  }

  /** A new photo, checked before anything is sent; a refused one leaves the photo already chosen in place. */
  async function choosePhoto(file: File) {
    const problem = await checkPhoto(file, async (f) => (await createImageBitmap(f)).close());
    if (problem) return setError(problem);
    setPhoto(file);
    reset(); // the old picture was of the old photo
  }
  function reset() {
    setResult(null);
    setError(null);
  }

  return {
    photo,
    choosePhoto,
    removePhoto: () => {
      setPhoto(null);
      reset();
    },
    busy,
    locked,
    countdown,
    stageLabel,
    result,
    image,
    isSample,
    notice,
    error,
    run,
    cancel: () => abort.current?.abort(),
    /** a new look: the old picture no longer shows it */
    clear: reset,
  };
}
