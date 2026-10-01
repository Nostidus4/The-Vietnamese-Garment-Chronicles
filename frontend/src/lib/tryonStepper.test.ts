import { describe, expect, it } from "vitest";
import type { CompassResult, Trigger } from "./types";
import { canGo, initStepper, readStep, stepper, withStep, type StepperState } from "./tryonStepper";

const trigger = (state: Trigger["state"], target: string): Trigger => ({
  type: "fusion",
  state,
  target,
  target_name: target,
  ti: "",
  teo: "",
  why: "",
  sources: [],
});
const verdict = (state: CompassResult["state"], triggers: Trigger[] = []) => ({ state, triggers });
const fit = verdict("fit");
const obi = verdict("distorted", [trigger("distorted", "obi"), trigger("adapted", "do-son")]);

const start = initStepper({ offline: false });
const onStep = (s: StepperState["step"], patch: Partial<StepperState> = {}): StepperState => ({ ...start, step: s, reached: s, ...patch });

describe("moving forward", () => {
  it("starts on step 1 with nothing passed", () => {
    expect(start).toEqual({ step: 1, reached: 1, highlight: [], alternative: false, offline: false });
  });

  it("goes 1 → 2 → 3 when the look is not ⛔", () => {
    const two = stepper(start, { type: "next", verdict: null });
    expect(two).toMatchObject({ step: 2, reached: 2 });
    expect(stepper(two, { type: "next", verdict: fit })).toMatchObject({ step: 3, reached: 3 });
  });

  it("lets review and adapted looks through: the note is shown, not a stop", () => {
    expect(stepper(onStep(2), { type: "next", verdict: verdict("review") }).step).toBe(3);
    expect(stepper(onStep(2), { type: "next", verdict: verdict("adapted") }).step).toBe(3);
  });

  it("waits on step 2 until the Compass has answered", () => {
    expect(stepper(onStep(2), { type: "next", verdict: null }).step).toBe(2);
  });

  it("stays on step 3, the last one", () => {
    expect(stepper(onStep(3), { type: "next", verdict: fit }).step).toBe(3);
  });
});

describe("going back and skipping", () => {
  it("goes back to any passed step and forward again without losing what was reached", () => {
    const back = stepper(onStep(3), { type: "go", step: 1 });
    expect(back).toMatchObject({ step: 1, reached: 3 });
    expect(stepper(back, { type: "go", step: 3 })).toMatchObject({ step: 3, reached: 3 });
  });

  it("does not jump ahead of the furthest step reached", () => {
    expect(stepper(start, { type: "go", step: 3 })).toBe(start);
    expect(stepper(start, { type: "go", step: 2 })).toBe(start);
    expect(stepper(onStep(2), { type: "go", step: 3 }).step).toBe(2);
    expect(canGo(onStep(2), 3)).toBe(false);
    expect(canGo(onStep(2), 1)).toBe(true);
  });

  it("changing the look on step 1 means passing the Compass again", () => {
    const back = stepper(onStep(3), { type: "go", step: 1 });
    const edited = stepper(back, { type: "edit" });
    expect(edited).toMatchObject({ step: 1, reached: 1 });
    expect(canGo(edited, 3)).toBe(false);
  });

  it("taking a look from the comparison drawer keeps you on the Compass step", () => {
    expect(stepper(onStep(2), { type: "edit" })).toMatchObject({ step: 2, reached: 2 });
  });
});

describe("⛔ on step 2", () => {
  it("does not go on to step 3 with the plain button", () => {
    expect(stepper(onStep(2), { type: "next", verdict: obi }).step).toBe(2);
  });

  it("'Sửa lại' goes back to step 1 and lights up only what made it ⛔", () => {
    const s = stepper(onStep(2), { type: "fix", verdict: obi });
    expect(s).toMatchObject({ step: 1, highlight: ["obi"], alternative: false });
    expect(canGo(s, 3)).toBe(false);
    expect(canGo(s, 2)).toBe(true);
  });

  it("the light goes out once the look is changed", () => {
    const s = stepper(stepper(onStep(2), { type: "fix", verdict: obi }), { type: "edit" });
    expect(s.highlight).toEqual([]);
  });

  it("'Thử phương án thay thế' goes on to step 3 with the swapped look", () => {
    expect(stepper(onStep(2), { type: "alternative" })).toMatchObject({ step: 3, reached: 3, alternative: true });
  });

  it("only from step 2", () => {
    expect(stepper(start, { type: "alternative" })).toBe(start);
  });

  it("'Đổi đồ' after the alternative keeps it until the look changes", () => {
    const back = stepper(stepper(onStep(2), { type: "alternative" }), { type: "go", step: 1 });
    expect(back).toMatchObject({ step: 1, alternative: true });
    expect(stepper(back, { type: "edit" }).alternative).toBe(false);
  });
});

describe("without a server", () => {
  const offline = initStepper({ offline: true });

  it("stays on step 1: the Compass and the try-on need the server", () => {
    expect(stepper(offline, { type: "next", verdict: null }).step).toBe(1);
    expect(stepper(offline, { type: "go", step: 2 }).step).toBe(1);
    expect(canGo(offline, 2)).toBe(false);
  });
});

describe("?step= in the URL", () => {
  it("reads 1, 2 and 3", () => {
    expect(readStep("?step=2")).toBe(2);
    expect(readStep(new URLSearchParams("garment=ao-dai&step=3"))).toBe(3);
  });

  it("treats a missing or odd value as no step (the diary's ?garment= link lands on step 1)", () => {
    expect(readStep("?garment=ao-dai")).toBeNull();
    expect(readStep("?step=4")).toBeNull();
    expect(readStep("?step=two")).toBeNull();
    expect(readStep("?step=")).toBeNull();
  });

  it("writes the step and keeps the garment", () => {
    expect(withStep("?garment=ao-dai", 2)).toBe("?garment=ao-dai&step=2");
    expect(withStep("?garment=ao-dai&step=2", 1)).toBe("?garment=ao-dai&step=1");
    expect(withStep("", 3)).toBe("?step=3");
  });

  it("a link straight to ?step=3 cannot skip the first two steps", () => {
    const s = stepper(start, { type: "go", step: readStep("?step=3")! });
    expect(s.step).toBe(1);
  });
});
