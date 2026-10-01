import { describe, expect, it } from "vitest";
import { retryAfterSeconds, retryLabel, secondsLeft, untilAborted, waitLabel } from "./tryonWait";

describe("waitLabel", () => {
  it("says nothing about waking while the health check is still quick", () => {
    expect(waitLabel("waking", 400)).toBe("Đang kết nối máy chủ…");
  });

  it("warns that a sleeping server can take a minute, with a clock", () => {
    expect(waitLabel("waking", 7_900)).toBe("Đang đánh thức máy chủ (có thể ~1 phút)… 7s");
  });

  it("counts the render against the usual 12–20 s", () => {
    expect(waitLabel("rendering", 0)).toBe("Đang dựng ảnh… 0s · thường 12–20s");
    expect(waitLabel("rendering", 20_000)).toBe("Đang dựng ảnh… 20s · thường 12–20s");
  });

  it("shows 0s, not -1s, when the clock last ticked just before the stage began", () => {
    expect(waitLabel("rendering", -200)).toBe("Đang dựng ảnh… 0s · thường 12–20s");
  });

  it("admits when a render runs long", () => {
    expect(waitLabel("rendering", 21_000)).toBe("Đang dựng ảnh… 21s · lâu hơn thường lệ, chờ thêm chút nhé");
  });
});

describe("retryAfterSeconds", () => {
  const now = Date.parse("2026-10-01T10:00:00Z");

  it("reads delta seconds", () => {
    expect(retryAfterSeconds("42", now)).toBe(42);
  });

  it("reads an HTTP date", () => {
    expect(retryAfterSeconds("Thu, 01 Oct 2026 10:00:30 GMT", now)).toBe(30);
  });

  it("falls back to the limiter's one-minute window when missing or unreadable", () => {
    expect(retryAfterSeconds(null, now)).toBe(60);
    expect(retryAfterSeconds("soon", now)).toBe(60);
    expect(retryAfterSeconds("-5", now)).toBe(60);
  });

  it("never asks to wait less than a second", () => {
    expect(retryAfterSeconds("0", now)).toBe(1);
    expect(retryAfterSeconds("Thu, 01 Oct 2026 09:59:00 GMT", now)).toBe(1);
  });
});

describe("countdown", () => {
  it("rounds up so the button never unlocks early", () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_000, 100)).toBe(10);
    expect(secondsLeft(10_000, 9_001)).toBe(1);
  });

  it("stops at zero", () => {
    expect(secondsLeft(10_000, 10_000)).toBe(0);
    expect(secondsLeft(10_000, 99_000)).toBe(0);
  });

  it("labels only while there is time left", () => {
    expect(retryLabel(12)).toBe("Thử lại sau 12s");
    expect(retryLabel(0)).toBeNull();
  });
});

describe("untilAborted", () => {
  it("passes the value through", async () => {
    await expect(untilAborted(Promise.resolve(true), new AbortController().signal)).resolves.toBe(true);
  });

  it("rejects with AbortError as soon as the signal fires", async () => {
    const ctl = new AbortController();
    const waiting = untilAborted(new Promise(() => {}), ctl.signal);
    ctl.abort();
    await expect(waiting).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects at once when already aborted", async () => {
    const ctl = new AbortController();
    ctl.abort();
    await expect(untilAborted(Promise.resolve(1), ctl.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});
