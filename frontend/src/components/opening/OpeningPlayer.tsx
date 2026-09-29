"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OpeningScreen } from "@/lib/types";
import { BookCover } from "../book/BookCover";
import { IMAGE_SIZES, Scene, type SceneHandle } from "./Scene";
import { crossfade, runTransition, type Overlays } from "./transitions";

interface Props {
  screens: OpeningScreen[];
  flashEl: HTMLDivElement | null; // owned by the page so it survives the hand-over to the desk
  onFinish: () => void; // called at full white; the page swaps in the desk
  pace: number; // 1 normal, 0.6 demo
  debug: boolean;
  noClick?: boolean;
  startId?: string | null;
  hold?: boolean; // the logo is still on screen: keep the story behind the blank page
}

type Phase = "intro" | "play" | "transition";

export function OpeningPlayer({ screens, flashEl, onFinish, pace, debug, noClick = false, startId = null, hold = false }: Props) {
  const reduced = !!useReducedMotion();
  const [viewport, setViewport] = useState({ w: 1440, h: 810 });
  const [idx, setIdx] = useState(() => Math.max(0, screens.findIndex((s) => s.id === startId)));
  const [incoming, setIncoming] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [beatTimes, setBeatTimes] = useState<number[]>([]);
  // Infinity until the first screen is really on stage, so nothing starts behind the paper
  const [enteredAt, setEnteredAt] = useState(Number.POSITIVE_INFINITY);
  const [instant, setInstant] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");

  const scenes = useRef<Record<string, SceneHandle | null>>({});
  const ov = useRef<Partial<Overlays>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const lastWheel = useRef(0);
  const lastAdvance = useRef(0);

  const screen = screens[idx];
  const nextBeat = screen.beats[shown];
  const compact = viewport.w < 720 || viewport.w / viewport.h < 1.05;
  const demo = pace < 1; // pace > 1 (slow) keeps normal clicking behaviour

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ---- beats ---------------------------------------------------------------------------------
  const showBeat = useCallback(
    (n: number) => {
      const beat = screen.beats[n];
      setShown(n + 1);
      setBeatTimes((t) => {
        const copy = t.slice(0, n);
        copy[n] = performance.now();
        return copy;
      });
      const handle = scenes.current[screen.id];
      if (beat.camera) handle?.moveCamera(beat.camera, beat.camera.ms * pace, beat.camera.ease);
      const shake = beat.effects.find((e) => e.type === "shake");
      if (shake) handle?.shake(shake.strength);
    },
    [screen, pace],
  );

  // First screen: wait for its artwork (and for the logo to start leaving), then rise out of a blank cream page
  const [artReady, setArtReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const first = scenes.current[screens[idx].id];
    Promise.race([first?.ready, new Promise((r) => setTimeout(r, 4000))]).then(() => alive && setArtReady(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!artReady || hold || phase !== "intro") return;
    let alive = true;
    const paper = ov.current.paper;
    (async () => {
      if (paper) await animate(paper, { opacity: 0 }, { duration: reduced ? 0.3 : 1.1, ease: [0.4, 0, 0.2, 1] });
      if (!alive) return;
      setEnteredAt(performance.now());
      setPhase("play");
    })();
    return () => {
      alive = false;
    };
  }, [artReady, hold, phase, reduced]);

  // Camera move that starts when a screen becomes active
  useEffect(() => {
    if (phase !== "play" || !screen.camera) return;
    scenes.current[screen.id]?.moveCamera(screen.camera, screen.camera.ms, screen.camera.ease);
  }, [phase, screen]);

  // ---- navigation ------------------------------------------------------------------------------
  const transitionTo = useCallback(
    async (target: number | "finish", instantBack = false) => {
      if (busy.current) return;
      busy.current = true;
      if (timer.current) clearTimeout(timer.current);
      setPhase("transition");
      const out = scenes.current[screen.id];
      const o = { ...ov.current, flash: flashEl } as Overlays;

      if (target === "finish") {
        if (out) await runTransition({ out, inn: null, next: null, t: { ...screen.exit, type: "flash" }, o, reduced, pace });
        onFinish();
        return;
      }

      const nextScreen = screens[target];
      setIncoming(target);
      // wait for the incoming scene to mount and its image to load
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const inn = scenes.current[nextScreen.id];
      await Promise.race([inn?.ready, new Promise((r) => setTimeout(r, 2500))]);
      if (out && inn) {
        const ctx = { out, inn, next: nextScreen, t: screen.exit, o, reduced, pace };
        if (instantBack) await crossfade(ctx, 380);
        else await runTransition(ctx);
      }
      setIdx(target);
      setIncoming(null);
      setShown(instantBack ? nextScreen.beats.length : 0);
      setBeatTimes(instantBack ? nextScreen.beats.map(() => performance.now()) : []);
      setEnteredAt(performance.now());
      setPhase("play");
      busy.current = false;
    },
    [screen, screens, flashEl, onFinish, reduced, pace],
  );

  const goNext = useCallback(() => {
    if (idx === screens.length - 1) transitionTo("finish");
    else transitionTo(idx + 1);
  }, [idx, screens.length, transitionTo]);

  // Schedule the next beat (or the automatic exit) whenever the state changes
  useEffect(() => {
    if (phase !== "play") return;
    if (timer.current) clearTimeout(timer.current);
    const next = screen.beats[shown];
    if (!next) {
      const auto = screen.auto_exit_ms ?? (demo ? 1500 : null);
      if (auto !== null) timer.current = setTimeout(() => goNext(), auto * (screen.auto_exit_ms ? pace : 1));
      return;
    }
    if (next.wait_click && shown > 0 && !demo) return;
    const delay = (next.wait_click ? 1400 : next.delay) * pace;
    timer.current = setTimeout(() => showBeat(shown), reduced ? Math.min(delay, 400) : delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [phase, shown, screen, pace, demo, reduced, showBeat, goNext]);

  const advance = useCallback(() => {
    // ignore double-clicks: one press = one step
    const now = performance.now();
    if (now - lastAdvance.current < 320) return;
    lastAdvance.current = now;
    if (phase !== "play" || busy.current) return;
    const next = screen.beats[shown];
    // a line is still typing → finish it
    setInstant((v) => v + 1);
    if (next) {
      if (timer.current) clearTimeout(timer.current);
      showBeat(shown);
      return;
    }
    if (screen.auto_exit_ms) return; // S10 runs by itself
    goNext();
  }, [phase, screen, shown, showBeat, goNext]);

  const back = useCallback(() => {
    if (phase !== "play" || busy.current || idx === 0) return;
    transitionTo(idx - 1, true);
  }, [phase, idx, transitionTo]);

  const skip = useCallback(() => {
    if (busy.current) return;
    transitionTo("finish");
  }, [transitionTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ([" ", "Enter", "ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
        e.preventDefault();
        advance();
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        back();
      } else if (e.key === "Escape") skip();
    };
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheel.current < 750 || Math.abs(e.deltaY) < 12) return;
      lastWheel.current = now;
      if (e.deltaY > 0) advance();
      else back();
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchY - e.changedTouches[0].clientY;
      if (dy > 40) advance();
      else if (dy < -40) back();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [advance, back, skip]);

  // Expose the state for automated walkthrough tests (read-only, harmless in production)
  useEffect(() => {
    (window as unknown as { __vpdk?: object }).__vpdk = { screen: screen.id, shown, total: screen.beats.length, phase };
  }, [screen, shown, phase]);

  // ---- render ----------------------------------------------------------------------------------
  const mounted = [idx, ...(incoming !== null ? [incoming] : [])];
  const preload = [idx + 1, idx + 2].filter((i) => i < screens.length && i !== incoming);
  // ready for the viewer's next input: all lines shown, or the next line waits for a click
  const waiting = phase === "play" && (!nextBeat || (nextBeat.wait_click && shown > 0 && !demo));
  const totalBeats = screens.reduce((n, s) => n + Math.max(1, s.beats.length), 0);
  const doneBeats = screens.slice(0, idx).reduce((n, s) => n + Math.max(1, s.beats.length), 0) + shown;

  return (
    <div className="opening fixed inset-0 z-40 select-none bg-[#140c07]" onClick={noClick ? undefined : advance} role="region" aria-label="Mở đầu câu chuyện Việt Phục Du Ký">
      {/* incoming scene is rendered under the outgoing one only for transitions that need it on top */}
      {mounted.map((i) => (
        <Scene
          key={screens[i].id}
          ref={(h) => {
            scenes.current[screens[i].id] = h;
          }}
          screen={screens[i]}
          shown={i === idx ? shown : 0}
          beatTimes={i === idx ? beatTimes : []}
          enteredAt={enteredAt}
          instant={instant}
          reduced={reduced}
          compact={compact}
          debug={debug}
          hidden={i === incoming}
          viewport={viewport}
        />
      ))}

      {/* preload the next screens with the same sizes so the browser reuses the optimised files */}
      <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden>
        {preload.map((i) => (
          <Image key={screens[i].id} src={screens[i].image} alt="" width={1672} height={941} sizes={IMAGE_SIZES} quality={88} />
        ))}
      </div>

      {/* ---- overlays used by transitions ---- */}
      <div ref={(el) => void (ov.current.dark = el!)} className="pointer-events-none absolute inset-0 bg-[#120a05] opacity-0" />
      <div ref={(el) => void (ov.current.gold = el!)} className="gold-wash pointer-events-none absolute inset-0 opacity-0" />
      <div ref={(el) => void (ov.current.cloth = el!)} className="silk pointer-events-none absolute -top-[15%] h-[130%] w-[30vw] opacity-0" />
      {/* starts opaque: the story rises out of a blank page; React never changes this style again */}
      <div ref={(el) => void (ov.current.paper = el!)} className="paper pointer-events-none absolute inset-0" style={{ opacity: 1 }} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 562" preserveAspectRatio="none" aria-hidden>
        <path
          ref={(el) => void (ov.current.stitch = el!)}
          d="M120 281 C 330 262, 520 300, 880 279"
          fill="none"
          stroke="#D9A43B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="14 10"
          style={{ opacity: 0, strokeDashoffset: 1000 }}
          className="stitch"
        />
      </svg>
      <div
        ref={(el) => void (ov.current.coverStage = el!)}
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 [perspective:2200px]"
      >
        <div className="relative" style={{ height: "min(78vh, 62vw)", aspectRatio: "1086 / 1448" }}>
          <div ref={(el) => void (ov.current.cover = el!)} className="absolute inset-0 origin-left [transform-style:preserve-3d]">
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <BookCover sizes="62vw" />
            </div>
            <div className="paper absolute inset-0 rounded-l-md [backface-visibility:hidden] [transform:rotateY(180deg)]" />
          </div>
        </div>
      </div>

      {/* ---- chrome ---- */}
      <ThreadProgress value={doneBeats / totalBeats} hidden={screen.hide_progress} />
      <AnimatePresence>
        {waiting && phase === "play" && !screen.auto_exit_ms && (
          <motion.div
            key={`${screen.id}-hint`}
            className="next-hint pointer-events-none absolute bottom-7 right-8"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden
          >
            ›
          </motion.div>
        )}
      </AnimatePresence>
      {screen.skippable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            skip();
          }}
          className="skip-btn absolute right-5 top-4 z-10"
        >
          Bỏ qua ›
        </button>
      )}
      <p className="sr-only" aria-live="polite">
        {screen.beats
          .slice(0, shown)
          .map((b) => (b.speaker ? `${b.speaker}: ${b.text}` : b.text))
          .join(" ")}
      </p>
    </div>
  );
}

/** A golden thread along the bottom edge instead of progress dots. */
function ThreadProgress({ value, hidden }: { value: number; hidden: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 h-6" animate={{ opacity: hidden ? 0 : 1 }} transition={{ duration: 0.8 }}>
      <svg className="h-full w-full" viewBox="0 0 1000 24" preserveAspectRatio="none" aria-hidden>
        <path d="M0 14 Q 250 8 500 14 T 1000 14" fill="none" stroke="rgba(243,234,215,0.18)" strokeWidth="1.2" />
        <motion.path
          d="M0 14 Q 250 8 500 14 T 1000 14"
          fill="none"
          stroke="#D9A43B"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: Math.max(0.002, value) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.div>
  );
}
