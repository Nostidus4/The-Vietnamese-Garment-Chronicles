// The try-on in three steps (#39): 1 Chọn đồ → 2 Compass → 3 Thử. Pure, so the rules of moving between steps
// (in order, back to any passed step, never skipping, the ⛔ fork) are tested without a browser.

import type { CompassResult } from "./types";

export type Step = 1 | 2 | 3;

export type StepperState = {
  step: Step;
  reached: Step; // furthest step passed; any step up to it can be opened again
  highlight: string[]; // after "Sửa lại": the ids (accessory, colour, zone) that made the look ⛔
  alternative: boolean; // step 3 renders the Compass's swapped look instead of a ⛔ one
  offline: boolean; // no server: only step 1 works
};

type Verdict = Pick<CompassResult, "state" | "triggers">;

export type StepperAction =
  | { type: "next"; verdict: Verdict | null } // the main button; on step 2 it waits for a verdict that is not ⛔
  | { type: "go"; step: Step } // a tab, the browser's back button or a ?step= link
  | { type: "fix"; verdict: Verdict } // ⛔ "Sửa lại"
  | { type: "alternative" } // ⛔ "Thử phương án thay thế"
  | { type: "edit" }; // the look changed

export const initStepper = ({ offline }: { offline: boolean }): StepperState => ({
  step: 1,
  reached: 1,
  highlight: [],
  alternative: false,
  offline,
});

export const canGo = (s: StepperState, step: Step) => step <= s.reached && (step === 1 || !s.offline);

export function stepper(s: StepperState, a: StepperAction): StepperState {
  switch (a.type) {
    case "next": {
      if (s.offline || s.step === 3) return s;
      if (s.step === 2 && (!a.verdict || a.verdict.state === "distorted")) return s;
      const step = (s.step + 1) as Step;
      return { ...s, step, reached: Math.max(s.reached, step) as Step };
    }
    case "go":
      return canGo(s, a.step) && a.step !== s.step ? { ...s, step: a.step } : s;
    case "fix":
      return {
        ...s,
        step: 1,
        reached: Math.min(s.reached, 2) as Step, // back to the Compass is fine; straight to step 3 is not
        highlight: a.verdict.triggers.filter((t) => t.state === "distorted").map((t) => t.target),
        alternative: false,
      };
    case "alternative":
      return s.step === 2 ? { ...s, step: 3, reached: 3, highlight: [], alternative: true } : s;
    case "edit":
      // a new look has no verdict yet: everything after the current step must be passed again
      return { ...s, reached: s.step, highlight: [], alternative: false };
  }
}

/** The step in a query string, or null when it is missing or not 1–3. */
export function readStep(search: string | URLSearchParams): Step | null {
  const v = (typeof search === "string" ? new URLSearchParams(search) : search).get("step");
  return v === "1" || v === "2" || v === "3" ? (Number(v) as Step) : null;
}

/** The query string with ?step= set, every other parameter (e.g. ?garment=) kept. */
export function withStep(search: string, step: Step): string {
  const q = new URLSearchParams(search);
  q.set("step", String(step));
  return `?${q}`;
}
