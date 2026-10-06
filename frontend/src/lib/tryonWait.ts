// What the try-on says while it waits (#38): pure, so the stages and the 429 countdown are tested without a browser.

export type WaitStage = "waking" | "rendering";

const USUAL_RENDER_S = 20; // bench median ~12 s (backend/docs/NANO_BANANA_BENCH.md)

/** Button text while waiting; `elapsedMs` counts from the start of the stage. */
export function waitLabel(stage: WaitStage, elapsedMs: number): string {
  const s = Math.max(0, Math.floor(elapsedMs / 1000));
  if (stage === "waking") {
    // an awake server answers /health well within a second; don't flash the long warning
    return s < 1 ? "Đang kết nối máy chủ…" : `Đang đánh thức máy chủ (có thể ~1 phút)… ${s}s`;
  }
  return s <= USUAL_RENDER_S ? `Đang dựng ảnh… ${s}s · thường 12–20s` : `Đang dựng ảnh… ${s}s · lâu hơn thường lệ, chờ thêm chút nhé`;
}

/** Retry-After (delta seconds or an HTTP date) as whole seconds, at least 1; 60, the limiter's window, if unreadable. */
export function retryAfterSeconds(header: string | null, nowMs: number): number {
  const v = header?.trim() ?? "";
  if (/^\d+$/.test(v)) return Math.max(1, Number(v));
  const at = Date.parse(v);
  if (/[a-z]/i.test(v) && !Number.isNaN(at)) return Math.max(1, Math.ceil((at - nowMs) / 1000));
  return 60;
}

/** Whole seconds until `untilMs`, rounded up so a countdown never unlocks early. */
export const secondsLeft = (untilMs: number, nowMs: number) => Math.max(0, Math.ceil((untilMs - nowMs) / 1000));

export const retryLabel = (left: number) => (left > 0 ? `Thử lại sau ${left}s` : null);

/** Stop waiting on a shared promise (e.g. serverReady) when the viewer cancels, without cancelling it for others. */
export function untilAborted<T>(p: Promise<T>, signal: AbortSignal): Promise<T> {
  const aborted = () => new DOMException("Đã hủy", "AbortError");
  if (signal.aborted) return Promise.reject(aborted());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(aborted());
    signal.addEventListener("abort", onAbort, { once: true });
    p.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}
