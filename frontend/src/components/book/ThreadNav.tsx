"use client";

import type { ReactNode } from "react";
import { HandIcon } from "../HandIcon";

// Under the book while a trip chapter is open: Bà's red thread runs through the chapter's places.
// The reader sees where they are ("Điểm 3/6 · Đại Nội"), can jump to any knot, and the main button says where it goes next.

export type Step = {
  label: string; // shown on the thread and on the buttons, e.g. "Đại Nội"
  page: number; // first page of this part of the chapter
  kind: "title" | "stop" | "wear" | "ask" | "own" | "letter";
  game?: string; // stamp key of the game on this stop's spread, if it has one
};

// "Mặc" is drawn: the kimono emoji (👘) stood for Vietnamese dress here
const ICON: Record<Step["kind"], ReactNode> = { title: "◇", stop: "", wear: <HandIcon name="aodai" className="!align-[-0.25em]" />, ask: "?", own: "✎", letter: "✉" };

export function ThreadNav({
  steps,
  page,
  portrait,
  won,
  atEnd,
  prevLabel,
  onPrev,
  onNext,
  onJump,
}: {
  steps: Step[];
  page: number;
  portrait: boolean;
  won: string[];
  atEnd: boolean;
  prevLabel?: string; // overrides the back button (on the title page it leaves the chapter)
  onPrev: () => void;
  onNext: () => void;
  onJump: (page: number) => void;
}) {
  const left = (p: number) => (portrait ? p : p - (p % 2));
  // the part of the chapter a spread belongs to: the first one that starts on it, else the one still running
  const stepAt = (p: number) => {
    const first = steps.findIndex((s) => left(s.page) === p);
    if (first >= 0) return first;
    let k = 0;
    steps.forEach((s, i) => left(s.page) <= p && (k = i));
    return k;
  };
  const per = portrait ? 1 : 2;
  const cur = stepAt(page);
  const ahead = stepAt(page + per);
  const behind = stepAt(Math.max(0, page - per));
  const stops = steps.filter((s) => s.kind === "stop");
  const stopNo = steps[cur].kind === "stop" ? stops.indexOf(steps[cur]) + 1 : 0;
  // a game on the open spread that is not played yet: going on is allowed, but the button is not the bright one
  // (the game is the page right after the stop's diary: on a phone, where one page shows at a time, that page, #146)
  const pending = steps.some((s) => s.game && (portrait ? s.page + 1 === page : left(s.page) === page) && !won.includes(s.game));
  const nextLabel = ahead > cur ? steps[ahead].label : "Trang sau";

  return (
    <div className="flex w-full items-center justify-center gap-3 sm:gap-5">
      <button type="button" className="page-turn shrink-0" onClick={onPrev} aria-label={`Quay lại: ${prevLabel ?? steps[behind].label}`}>
        <span aria-hidden>‹</span> <span className="hidden sm:inline">{prevLabel ?? (behind < cur ? steps[behind].label : "Trang trước")}</span>
      </button>

      <nav aria-label="Hành trình của chương" className={`thread min-w-0 max-w-full overflow-x-auto ${portrait ? "thread-compact" : ""}`}>
        <ol className="m-0 flex list-none items-center p-0">
          {steps.map((s, i) => {
            const done = i < cur;
            const here = i === cur;
            return (
              <li key={`${s.kind}-${s.page}`} className="flex items-center">
                {i > 0 && <span className={`thread-line ${i <= cur ? "thread-line-done" : ""}`} aria-hidden />}
                <button
                  type="button"
                  onClick={() => onJump(s.page)}
                  className={`thread-knot ${done ? "thread-knot-done" : ""} ${here ? "thread-knot-here" : ""} ${s.kind !== "stop" ? "thread-knot-small" : ""}`}
                  aria-current={here ? "step" : undefined}
                  aria-label={s.kind === "stop" ? `Điểm ${stops.indexOf(s) + 1}: ${s.label}` : s.label}
                  title={s.label}
                >
                  {s.kind === "stop" ? stops.indexOf(s) + 1 : ICON[s.kind]}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="thread-caption" aria-live="polite">
          {stopNo ? `Điểm ${stopNo}/${stops.length} · ${steps[cur].label}` : steps[cur].label}
        </p>
      </nav>

      {!atEnd && (
        <button
          type="button"
          data-guide="next"
          className={`page-turn shrink-0 ${pending ? "" : "page-turn-main"}`}
          onClick={onNext}
          aria-label={pending ? "Bỏ qua trò chơi, đi tiếp" : ahead > cur ? `Đi tiếp: ${nextLabel}` : "Trang sau"}
        >
          {/* a phone says "Bỏ qua" too while the game waits: a bright › alone looked like the way to go on (#146) */}
          <span className={pending ? "" : "hidden sm:inline"}>{pending ? "Bỏ qua" : ahead > cur ? `Đi tiếp: ${nextLabel}` : "Trang sau"}</span>
          <span className={pending ? "hidden sm:inline" : "hidden"}>, đi tiếp</span>{" "}
          <span aria-hidden>›</span>
        </button>
      )}
    </div>
  );
}
