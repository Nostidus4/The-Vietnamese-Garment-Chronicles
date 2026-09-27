// Screen-to-screen transitions. Each one animates the outgoing scene (`out`), the incoming scene
// (`inn`, already mounted with opacity 0) and shared overlay layers owned by the player.
// With reduced motion, everything becomes a short crossfade.

import { animate } from "framer-motion";
import type { OpeningScreen, Transition } from "@/lib/types";
import type { SceneHandle } from "./Scene";

export interface Overlays {
  dark: HTMLDivElement;
  gold: HTMLDivElement;
  paper: HTMLDivElement;
  stitch: SVGPathElement;
  cloth: HTMLDivElement;
  coverStage: HTMLDivElement;
  cover: HTMLDivElement;
  flash: HTMLDivElement;
}

export interface Ctx {
  out: SceneHandle;
  inn: SceneHandle | null; // null for the final flash
  next: OpeningScreen | null;
  t: Transition;
  o: Overlays;
  reduced: boolean;
  pace: number; // 1 normal, <1 faster
}

const sec = (ms: number, pace: number) => (ms * pace) / 1000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE_IN: [number, number, number, number] = [0.55, 0, 1, 0.45];
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IO: [number, number, number, number] = [0.65, 0, 0.35, 1];

function layers(c: Ctx) {
  return { out: c.out.layer!, inn: c.inn?.layer ?? null };
}

/** Put the incoming camera at its "arrival" framing before it becomes visible. */
async function enterFrom(c: Ctx, cam: { s: number; x: number; y: number; mode?: "anchor" | "center" }) {
  await c.inn?.moveCamera(cam, 0);
}

async function settleIncoming(c: Ctx, ms: number) {
  if (!c.inn || !c.next) return;
  await c.inn.moveCamera(c.next.camera_start, ms, "out");
}

export async function crossfade(c: Ctx, ms = 500) {
  const { out, inn } = layers(c);
  if (inn) {
    inn.style.opacity = "0";
    await Promise.all([animate(inn, { opacity: 1 }, { duration: sec(ms, c.pace) }), animate(out, { opacity: 0 }, { duration: sec(ms, c.pace) })]);
  } else {
    await animate(out, { opacity: 0 }, { duration: sec(ms, c.pace) });
  }
}

/** T1, T2, T7 – the camera flies into a point; the next screen arrives slightly zoomed, then settles. */
async function zoomThrough(c: Ctx) {
  const { out, inn } = layers(c);
  const { t } = c;
  const blur = t.s >= 2 ? 10 : t.s > 1.22 ? 6 : 1.5;
  await enterFrom(c, { s: t.to_s, x: t.to_x, y: t.to_y, mode: "anchor" });
  if (inn) {
    inn.style.opacity = "0";
    inn.style.filter = `blur(${blur}px)`;
  }
  const d = sec(t.ms, c.pace);
  const outBlur = Math.max(blur, 7);
  // 1. fly in: the outgoing frame speeds toward the point and melts into soft light
  const flyOut = Promise.all([
    c.out.moveCamera({ s: t.s, x: t.x, y: t.y, mode: t.mode }, t.ms * 0.62 * c.pace, EASE_IN),
    animate(out, { filter: [`blur(0px) brightness(1)`, `blur(${outBlur}px) brightness(${t.s > 1.22 ? 1.22 : 1.1})`] }, { duration: d * 0.62, ease: EASE_IN }),
  ]);
  await wait(t.ms * 0.5 * c.pace);
  // 2. the next frame resolves out of that blur while the old one fades underneath it
  const arrive = inn
    ? Promise.all([
        animate(inn, { opacity: 1, filter: "blur(0px)" }, { duration: d * 0.5, ease: EASE_OUT }),
        settleIncoming(c, t.ms * 0.7 * c.pace),
      ])
    : Promise.resolve();
  await flyOut;
  await animate(out, { opacity: 0 }, { duration: d * 0.12 });
  await arrive;
}

/** T3 – an iris closes onto the laptop and reopens from the laptop of the next screen. */
async function iris(c: Ctx) {
  const { out, inn } = layers(c);
  const { t } = c;
  const b = c.out.box();
  const diag = Math.hypot(b.vw, b.vh);
  const p1 = c.out.screenPoint(t.x, t.y);
  await enterFrom(c, c.next!.camera_start);
  const p2 = c.inn!.screenPoint(t.to_x, t.to_y);
  const d = sec(t.ms, c.pace);
  const circle = (el: HTMLElement, p: { x: number; y: number }) => (r: number) => {
    el.style.clipPath = `circle(${Math.max(0, r)}px at ${p.x}px ${p.y}px)`;
  };
  // (the stage behind the scenes is already dark, so the closing circle reveals darkness)
  // close onto the laptop, pausing a breath when only the screen is left
  await animate(diag, 0, { duration: d * 0.5, ease: [0.45, 0, 0.7, 0.4], onUpdate: circle(out, p1) });
  out.style.opacity = "0";
  await wait(t.ms * 0.08 * c.pace);
  if (inn) {
    const setIn = circle(inn, p2);
    setIn(0);
    inn.style.opacity = "1";
    await animate(0, diag, { duration: d * 0.5, ease: [0.16, 1, 0.3, 1], onUpdate: setIn });
    inn.style.clipPath = "";
  }
}

/** T4 – golden light pours in from the edges; the memory begins underneath. */
async function goldWash(c: Ctx) {
  const { out, inn } = layers(c);
  const g = c.o.gold;
  const d = sec(c.t.ms, c.pace);
  g.style.opacity = "1";
  await Promise.all([
    animate(0, 1, { duration: d * 0.58, ease: [0.4, 0, 0.6, 1], onUpdate: (v) => g.style.setProperty("--p", String(v)) }),
    animate(out, { filter: "brightness(1.25) saturate(0.8)" }, { duration: d * 0.58 }),
  ]);
  out.style.opacity = "0";
  if (inn) inn.style.opacity = "1";
  await wait(c.t.ms * 0.06 * c.pace);
  await animate(g, { opacity: 0 }, { duration: d * 0.36, ease: EASE_OUT });
  g.style.setProperty("--p", "0");
}

/** T5 – a sky-blue silk sweeps across; the next memory is revealed behind its trailing edge. */
async function cloth(c: Ctx) {
  const { out, inn } = layers(c);
  const strip = c.o.cloth;
  const b = c.out.box();
  const stripW = b.vw * 0.3;
  if (inn) {
    inn.style.opacity = "1";
    inn.style.maskImage = "linear-gradient(90deg, black -10%, transparent -5%)";
    inn.style.webkitMaskImage = inn.style.maskImage;
  }
  strip.style.opacity = "1";
  await animate(0, 1, {
    duration: sec(c.t.ms, c.pace),
    ease: [0.33, 0.08, 0.3, 1],
    onUpdate: (p) => {
      const x = -stripW + p * (b.vw + stripW * 2); // strip left edge
      strip.style.transform = `translateX(${x}px) rotate(4deg)`;
      if (inn) {
        const edge = ((x + stripW * 0.55) / b.vw) * 100;
        const m = `linear-gradient(90deg, black ${edge - 4}%, transparent ${edge + 2}%)`;
        inn.style.maskImage = m;
        inn.style.webkitMaskImage = m;
      }
    },
  });
  strip.style.opacity = "0";
  out.style.opacity = "0";
  if (inn) {
    inn.style.maskImage = "";
    inn.style.webkitMaskImage = "";
  }
}

/** T6 – the memory fades to a blank page; a golden stitch closes the chapter; the present returns. */
async function paper(c: Ctx) {
  const { out, inn } = layers(c);
  const d = sec(c.t.ms, c.pace);
  await Promise.all([
    animate(out, { filter: "sepia(0.9) brightness(1.15) saturate(0.6)" }, { duration: d * 0.4 }),
    animate(c.o.paper, { opacity: 1 }, { duration: d * 0.4, ease: [0.4, 0, 0.2, 1] }),
  ]);
  out.style.opacity = "0";
  const stitch = c.o.stitch;
  stitch.style.opacity = "1";
  await animate(stitch, { strokeDashoffset: [1000, 0] } as never, { duration: d * 0.3, ease: EASE_IO });
  await wait(c.t.ms * 0.08 * c.pace);
  if (inn) inn.style.opacity = "1";
  await Promise.all([animate(c.o.paper, { opacity: 0 }, { duration: d * 0.28 }), animate(stitch, { opacity: 0 }, { duration: d * 0.2 })]);
}

/** T8 – the camera closes in on the cover, which becomes the real title-page cover and swings open. */
async function coverOpen(c: Ctx) {
  const { out, inn } = layers(c);
  const { t } = c;
  const d = sec(t.ms, c.pace);
  const stage = c.o.coverStage;
  const cover = c.o.cover;
  await enterFrom(c, { s: c.next!.camera_start.s * 1.12, x: c.next!.camera_start.x, y: c.next!.camera_start.y, mode: c.next!.camera_start.mode });

  // 1. close in on the label
  await Promise.all([
    c.out.moveCamera({ s: 1.55, x: t.x, y: t.y, mode: "center" }, t.ms * 0.2 * c.pace, EASE_IN),
    animate(c.o.dark, { opacity: 0.7 }, { duration: d * 0.2 }),
  ]);
  // 2. the notebook is now the real cover, centred and upright
  cover.style.transform = "rotateY(0deg)";
  await Promise.all([
    animate(stage, { opacity: [0, 1], scale: [1.18, 1] }, { duration: d * 0.2, ease: EASE_OUT }),
    animate(out, { opacity: 0 }, { duration: d * 0.18 }),
  ]);
  await wait(t.ms * 0.06 * c.pace);
  // 3. it swings open onto the real notebook of S09, and melts away past the fold
  if (inn) inn.style.opacity = "0";
  await Promise.all([
    animate(cover, { rotateY: [0, -150] }, { duration: d * 0.5, ease: [0.55, 0.02, 0.25, 1] }),
    animate(stage, { opacity: [1, 1, 0] }, { duration: d * 0.5, times: [0, 0.55, 1] }),
    inn ? animate(inn, { opacity: 1 }, { duration: d * 0.34, delay: d * 0.08 }) : Promise.resolve(),
    animate(c.o.dark, { opacity: 0 }, { duration: d * 0.34, delay: d * 0.14 }),
    settleIncoming(c, t.ms * 0.55 * c.pace),
  ]);
}

/** T9 – the bookmark slips off the page; the camera follows it down into the next screen. */
async function fall(c: Ctx) {
  const { out, inn } = layers(c);
  const d = sec(c.t.ms, c.pace);
  const bm = out.querySelector<HTMLElement>("[data-bookmark]");
  if (inn) {
    inn.style.opacity = "0";
    inn.style.transform = "translateY(7%)";
  }
  await Promise.all([
    bm ? animate(bm, { y: ["0%", "260%"], rotate: [0, 12], opacity: [1, 1, 0] }, { duration: d * 0.6, ease: EASE_IN }) : Promise.resolve(),
    animate(out, { y: ["0%", "-7%"], filter: ["blur(0px)", "blur(5px)"], opacity: [1, 1, 0] }, { duration: d * 0.72, delay: d * 0.18, ease: EASE_IN }),
    inn ? animate(inn, { y: ["7%", "0%"], opacity: [0, 1] }, { duration: d * 0.6, delay: d * 0.4, ease: EASE_OUT }) : Promise.resolve(),
  ]);
  if (inn) inn.style.transform = "";
}

/** T10, first half – light floods the vortex. The player hands over to the desk at full white. */
export async function flashIn(c: Ctx) {
  const d = sec(c.t.ms, c.pace);
  await Promise.all([
    c.out.moveCamera({ s: 1.3, x: 57, y: 45, mode: "anchor" }, c.t.ms * 0.22 * c.pace, EASE_IN),
    animate(c.o.flash, { opacity: [0, 1] }, { duration: d * 0.2, ease: [0.5, 0, 0.9, 0.6] }),
  ]);
}

export async function runTransition(c: Ctx) {
  if (c.reduced) return crossfade(c, 400);
  switch (c.t.type) {
    case "zoom-through":
      return zoomThrough(c);
    case "iris":
      return iris(c);
    case "gold-wash":
      return goldWash(c);
    case "cloth":
      return cloth(c);
    case "paper":
      return paper(c);
    case "cover-open":
      return coverOpen(c);
    case "fall":
      return fall(c);
    case "flash":
      return flashIn(c);
    default:
      return crossfade(c, c.t.ms);
  }
}
