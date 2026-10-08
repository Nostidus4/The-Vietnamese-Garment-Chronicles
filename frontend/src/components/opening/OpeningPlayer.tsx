"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OpeningScreen } from "@/lib/types";
import { BookCover } from "../book/BookCover";
import { LOGO_SMALL } from "./BootShell";
import { HandIcon } from "../HandIcon";
import { IMAGE_SIZES, Scene, type SceneHandle } from "./Scene";
import { crossfade, runTransition, type Overlays } from "./transitions";
import { asset } from "@/lib/base";

interface Props {
  screens: OpeningScreen[];
  flashEl: HTMLDivElement | null; // owned by the page so it survives the hand-over to the desk
  onFinish: () => void; // called at full white; the page swaps in the desk
  pace: number; // 1 normal, 0.6 demo
  debug: boolean;
  noClick?: boolean;
  startId?: string | null;
  hold?: boolean; // the logo is still on screen: keep the story behind the blank page
  sound?: boolean | null; // ?sound=1|0 skips the "Nghe kể chuyện / Chỉ đọc" question (tests)
}

/**
 * Voice-over made by backend/scripts/generate_voices.py: one folder per screen (/opening/voice-s01/) with takes.json.
 * A take is one speaker's continuous lines spoken in ONE recording; cues[i] is when its i-th line starts.
 */
type VoiceTake = { id: string; voice: string; beats: number[]; file: string; cues: number[] };
type Manifest = { screen: string; takes: VoiceTake[] };
const takeOf = (m: Manifest | undefined, n: number) => {
  const take = m?.takes.find((t) => t.beats.includes(n));
  return take ? { take, i: take.beats.indexOf(n) } : null;
};

type Phase = "intro" | "play" | "transition";

// Silence the engine adds around the voice, trimmed so a judge with 2–3 minutes reaches the desk sooner (#110): a new
// screen used to wait up to 1.3 s before its first line, and the last voiced line 0.9 s before the screen moved on.
const FIRST_LINE_MS = 500;
const AFTER_LAST_VOICE_MS = 400;
/** "Bỏ qua" steps forward once the viewer has seen what the story is like. */
const SKIP_LOUD_MS = 8000;

export function OpeningPlayer({ screens, flashEl, onFinish, pace, debug, noClick = false, startId = null, hold = false, sound: soundParam = null }: Props) {
  const reduced = !!useReducedMotion();
  // measured before the first paint: a guessed size made the first picture jump once it was measured (CLS, #64)
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [idx, setIdx] = useState(() => Math.max(0, screens.findIndex((s) => s.id === startId)));
  const [incoming, setIncoming] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [beatTimes, setBeatTimes] = useState<number[]>([]);
  // Infinity until the first screen is really on stage, so nothing starts behind the paper
  const [enteredAt, setEnteredAt] = useState(Number.POSITIVE_INFINITY);
  const [instant, setInstant] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");

  // ---- voice-over: asked once on the blank page (that click also unlocks audio in the browser) ----
  const [sound, setSound] = useState<boolean | null>(soundParam);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false); // ⏸: the story waits on its line until the reader goes on (#55)
  const [skipLoud, setSkipLoud] = useState(false);
  const firstChoice = useRef<HTMLButtonElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [artReady, setArtReady] = useState(false);
  const choose = (on: boolean) => {
    setSound(on);
    if (on) {
      // prime the element inside the click so later play() calls are allowed
      audio.current ??= new Audio();
      audio.current.play().catch(() => {});
    }
  };
  const hush = useCallback(() => {
    audio.current?.pause();
    setSpeaking(false);
  }, []);
  // every screen's takes.json, fetched once (a screen without voice-over simply has none)
  const [manifests, setManifests] = useState<Record<string, Manifest>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(
      screens.map((sc) =>
        fetch(asset(`/opening/voice-${sc.id}/takes.json`))
          .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
          .catch(() => null),
      ),
    ).then((ms) => alive && setManifests(Object.fromEntries(ms.filter((m): m is Manifest => !!m).map((m) => [m.screen, m]))));
    return () => {
      alive = false;
    };
  }, [screens]);
  const playing = useRef<string | null>(null); // src of the take on air

  const speak = useCallback(
    (screenId: string, n: number) => {
      // opened with ?sound=1 (no click on the question): make the player on the first voiced line
      if (sound && !audio.current) audio.current = new Audio();
      const el = audio.current;
      const hit = takeOf(manifests[screenId], n);
      if (!el || !sound || !hit) return hit ? undefined : hush(); // an unvoiced line never cuts the take on air
      const src = asset(`/opening/voice-${screenId}/${hit.take.file}`);
      const cue = hit.take.cues[hit.i] ?? 0;
      if (playing.current === src && !el.paused) {
        // same take still speaking: only jump if the viewer clicked ahead of the voice
        if (el.currentTime < cue - 0.25) el.currentTime = cue;
        return;
      }
      el.pause();
      el.src = src;
      playing.current = src;
      el.onended = () => {
        playing.current = null;
        setSpeaking(false);
      };
      el.onerror = () => setSpeaking(false); // never block the story on a missing file
      const start = () => {
        el.currentTime = cue;
        el.play().catch(() => setSpeaking(false));
      };
      if (cue > 0) el.addEventListener("loadedmetadata", start, { once: true });
      else start();
      setSpeaking(true);
    },
    [sound, hush, manifests],
  );
  /** Seconds until the voice reaches line n, if n belongs to the take on air. */
  const cueIn = useCallback(
    (screenId: string, n: number): number | null => {
      const el = audio.current;
      const hit = takeOf(manifests[screenId], n);
      if (!el || !hit || el.paused || playing.current !== asset(`/opening/voice-${screenId}/${hit.take.file}`)) return null;
      return Math.max(0, (hit.take.cues[hit.i] ?? 0) - el.currentTime);
    },
    [manifests],
  );
  useEffect(() => () => audio.current?.pause(), []);
  // tell the background music to step back while a voice speaks (components/AmbientSound)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("vpdk-voice", { detail: speaking }));
  }, [speaking]);
  useEffect(() => () => void window.dispatchEvent(new CustomEvent("vpdk-voice", { detail: false })), []);

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
      speak(screen.id, n);
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
    [screen, pace, speak],
  );

  // First screen: wait for its artwork, the logo to start leaving and the viewer's sound choice, then rise out of a blank cream page.
  // The artwork only starts downloading once the logo has left and the viewer has answered the sound question (see
  // `defer`): a visitor who leaves at the question never pays for three full-screen pictures (#120). The wait counts from then.
  const waitArt = hold || sound === null;
  useEffect(() => {
    if (waitArt) return;
    let alive = true;
    const first = scenes.current[screens[idx].id];
    Promise.race([first?.ready, new Promise((r) => setTimeout(r, 4000))]).then(() => alive && setArtReady(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitArt]);
  useEffect(() => {
    if (!artReady || hold || sound === null || phase !== "intro") return;
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
  }, [artReady, hold, sound, phase, reduced]);

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
      hush();
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
    [screen, screens, flashEl, onFinish, reduced, pace, hush],
  );

  const goNext = useCallback(() => {
    if (idx === screens.length - 1) transitionTo("finish");
    else transitionTo(idx + 1);
  }, [idx, screens.length, transitionTo]);

  // Schedule the next beat (or the automatic exit) whenever the state changes
  useEffect(() => {
    if (phase !== "play") return;
    if (timer.current) clearTimeout(timer.current);
    if (paused) return;
    const next = screen.beats[shown];
    // the next line is further along the take on air: show it exactly when the voice gets there
    const cue = next && !next.wait_click ? cueIn(screen.id, shown) : null;
    if (cue !== null) {
      timer.current = setTimeout(() => showBeat(shown), cue * 1000);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }
    if (speaking) return; // let the take finish; this effect runs again when it does
    const afterVoice = sound && shown > 0 && !!screen.beats[shown - 1]?.voice; // the reading already gave the pause
    // the story plays by itself: after a voiced line a short breath, after a silent one long enough to read it.
    // A click, a key or a swipe still moves on at once.
    // the time to type the line (S06 "Chúng còn để nhớ." types at 115 ms a letter), then to read it at about
    // 58 ms a letter: it used to move on at 42 ms a letter, before the closing lines had finished (#55)
    const last = shown > 0 ? screen.beats[shown - 1] : undefined;
    const lastText = last?.text ?? "";
    const readMs = Math.min(9000, lastText.length * (last?.type_ms ?? 0) + Math.max(1400, 900 + lastText.length * 58));
    if (!next) {
      const auto = screen.auto_exit_ms ?? (afterVoice ? AFTER_LAST_VOICE_MS : demo ? 1500 : readMs);
      timer.current = setTimeout(() => goNext(), auto * (screen.auto_exit_ms ? pace : 1));
      return;
    }
    const delay = afterVoice ? 300 : next.wait_click && shown > 0 ? readMs : (next.wait_click ? 1400 : shown === 0 ? Math.min(next.delay, FIRST_LINE_MS) : next.delay) * pace;
    timer.current = setTimeout(() => showBeat(shown), reduced ? Math.min(delay, 400) : delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [phase, shown, screen, pace, demo, reduced, showBeat, goNext, speaking, sound, cueIn, paused]);

  const advance = useCallback(() => {
    // ignore double-clicks: one press = one step
    const now = performance.now();
    if (now - lastAdvance.current < 320) return;
    lastAdvance.current = now;
    if (phase !== "play" || busy.current) return;
    setPaused(false); // going on by hand is also the way out of a pause
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
    hush();
    transitionTo("finish");
  }, [transitionTo, hush]);

  const keys = useRef({ playing: false, togglePause: () => {} });
  useEffect(() => {
    keys.current = { playing: phase !== "intro" && sound !== null, togglePause: () => setPaused((v) => !v) };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // a focused button or link does its own job with Enter and Space (the first choice, "Bỏ qua", the sound);
      // while the first question is on screen nothing else listens, and Esc does not skip the story unasked (#55)
      if ((e.key === "Enter" || e.key === " ") && e.target instanceof HTMLElement && e.target.closest("button, a, input")) return;
      if (!keys.current.playing) return;
      if (e.key === "p" || e.key === "P") return keys.current.togglePause();
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

  const started = phase !== "intro";
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setSkipLoud(true), SKIP_LOUD_MS);
    return () => clearTimeout(t);
  }, [started]);

  // the first choice takes the focus once it has faded in: autoFocus fired while it was still hidden (#55)
  useEffect(() => {
    if (sound !== null) return;
    const t = setTimeout(() => firstChoice.current?.focus(), 500);
    return () => clearTimeout(t);
  }, [sound, phase]);

  // Expose the state for automated walkthrough tests (read-only, harmless in production)
  useEffect(() => {
    (window as unknown as { __vpdk?: object }).__vpdk = { screen: screen.id, shown, total: screen.beats.length, phase };
  }, [screen, shown, phase]);

  // ---- render ----------------------------------------------------------------------------------
  const mounted = [idx, ...(incoming !== null ? [incoming] : [])];
  const preload = [idx + 1, idx + 2].filter((i) => i < screens.length && i !== incoming);
  // ready for the viewer's next input: all lines shown, or the next line waits for a click
  const waiting = phase === "play" && !speaking && !nextBeat;
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
          defer={waitArt}
          viewport={viewport}
        />
      ))}

      {/* preload the next screens with the same sizes so the browser reuses the optimised files */}
      <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden>
        {!waitArt && preload.map((i) => (
          <Image key={screens[i].id} src={asset(screens[i].image)} alt="" width={1672} height={941} sizes={IMAGE_SIZES} quality={88} />
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
              {!waitArt && <BookCover sizes="62vw" />}
            </div>
            <div className="paper absolute inset-0 rounded-l-md [backface-visibility:hidden] [transform:rotateY(180deg)]" />
          </div>
        </div>
      </div>

      {/* ---- the first question, on the blank page ---- */}
      <AnimatePresence>
        {sound === null && (
          <motion.div
            key="voice-choice"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* the calligraphy logo the viewer has just seen, not the name again in bold type (#81) */}
            <h1 className="m-0 w-[min(22rem,70vw)]">
              <Image src={asset(LOGO_SMALL)} alt="Việt Phục Du Ký" width={560} height={402} loading="eager" unoptimized className="h-auto w-full" />
            </h1>
            <p className="font-hand m-0 -mt-2 text-lg text-[#8a4b2a]">Hiểu để mặc đúng, sáng tạo để mặc theo cách của mình.</p>
            {/* what the app does, in one line, before any choice: a judge has a minute (#148) */}
            <p className="m-0 max-w-[26rem] text-[0.95rem] leading-snug text-stone-800">Đọc sổ của Bà theo vùng · phối áo để Tèo chấm · ghi lại vào Du Ký.</p>
            <p className="font-hand m-0 text-xl text-stone-600">Con muốn nghe kể, hay tự đọc?</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <button type="button" ref={firstChoice} onClick={() => choose(true)} className="choice-btn rounded-full bg-[#2F4A6D] px-6 py-3 text-amber-50 shadow hover:bg-[#243a57]">
                <HandIcon name="speaker" className="mr-1.5" /> Nghe kể chuyện
              </button>
              <button type="button" onClick={() => choose(false)} className="choice-btn rounded-full border border-stone-500 px-6 py-3 text-stone-700 hover:bg-stone-800 hover:text-amber-50">
                Chỉ đọc
              </button>
            </div>
            {/* a way in for someone in a hurry: not "Bỏ qua" (which only shows once the story runs) but straight to Bà's table */}
            <button
              type="button"
              onClick={() => onFinish()}
              className="choice-btn -mt-1 inline-flex min-h-11 items-center rounded-full px-4 py-2 text-[0.95rem] text-[#8a4b2a] underline underline-offset-4 hover:bg-stone-800/10"
            >
              Vào thẳng sổ của Bà ›
            </button>
            <p className="m-0 mt-1 text-sm text-stone-700">Nên đeo tai nghe · Giọng đọc được tạo bằng Gemini TTS</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- chrome ---- */}
      {/* words next to the icons: a bare 🔊 and ⏸ did not say whether they stop the voice or the whole story (#110);
          on a phone the words stay for screen readers only */}
      {sound !== null && started && (
        <div className="absolute left-5 top-4 z-10 flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (sound) hush();
              else audio.current ??= new Audio();
              setSound(!sound);
            }}
            className="skip-btn"
            title={sound ? "Tắt giọng đọc" : "Bật giọng đọc"}
          >
            <span aria-hidden>{sound ? "🔊" : "🔇"}</span>
            <span className="max-sm:sr-only sm:ml-1.5">{sound ? "Tắt tiếng" : "Bật tiếng"}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPaused((v) => !v);
            }}
            // kept in place while a screen changes, so the buttons beside it do not jump
            className={`skip-btn ${phase === "play" ? "" : "invisible"}`}
            aria-pressed={paused}
            title={paused ? "Đọc tiếp (P)" : "Tạm dừng truyện (P)"}
          >
            <span aria-hidden>{paused ? "▶" : "⏸"}</span>
            <span className="max-sm:sr-only sm:ml-1.5">{paused ? "Đọc tiếp" : "Tạm dừng truyện"}</span>
          </button>
        </div>
      )}
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
      {/* every screen can be skipped: the story is a welcome, never a gate. Where the viewer is says how much is left,
          and after a few seconds "Bỏ qua" turns solid, so a judge in a hurry finds the way out (#110) */}
      {started && (
        <div className="absolute right-5 top-4 z-10 flex items-center gap-2">
          <span className="opening-count">
            Cảnh {idx + 1}/{screens.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skip();
            }}
            className={`skip-btn ${skipLoud ? "skip-btn--loud" : ""}`}
          >
            Bỏ qua ›
          </button>
        </div>
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
