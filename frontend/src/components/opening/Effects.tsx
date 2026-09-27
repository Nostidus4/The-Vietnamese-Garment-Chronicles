"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Effect } from "@/lib/types";

// All sizes use --bw (box width in px, set on the image box) so effects scale with the artwork.
const bw = (pct: number) => `calc(var(--bw) * ${pct / 100})`;

// Only the newest effect of these types stays visible (e.g. a spotlight moving card to card)
const REPLACING = new Set(["spotlight", "glow", "desaturate"]);

export interface TimedEffect extends Effect {
  key: string;
  startAt: number; // ms, performance.now()-based
}

/** Mounts each effect at its start time; replacing types hide the previous one. */
export function EffectsLayer({ effects, reduced }: { effects: TimedEffect[]; reduced: boolean }) {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    const pending = effects.map((e) => e.startAt - performance.now()).filter((d) => d > 0);
    if (!pending.length) return;
    const t = setTimeout(() => setNow(performance.now()), Math.min(...pending) + 5);
    return () => clearTimeout(t);
  }, [effects, now]);

  const started = effects.filter((e) => e.startAt <= now);
  const visible = started.filter((e) => {
    if (!REPLACING.has(e.type)) return true;
    const newer = started.find((o) => o.type === e.type && o.startAt > e.startAt);
    return !newer;
  });

  return (
    <AnimatePresence>
      {visible.map((e) => (
        <EffectView key={e.key} e={e} reduced={reduced} />
      ))}
    </AnimatePresence>
  );
}

function Fade({ ms, children, className, style }: { ms: number; children?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ms / 1000, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function EffectView({ e, reduced }: { e: TimedEffect; reduced: boolean }) {
  const at = `${e.x}% ${e.y}%`;
  switch (e.type) {
    case "spotlight":
      return (
        <Fade
          ms={e.ms}
          style={{
            background: `radial-gradient(circle at ${at}, transparent ${bw(e.r)}, rgba(24,14,6,${e.strength}) ${bw(e.r * 2.4)})`,
          }}
        />
      );
    case "desaturate": {
      const mask = `radial-gradient(circle at ${at}, transparent ${bw(e.r)}, black ${bw(e.r * 1.7)})`;
      return (
        <Fade
          ms={e.ms}
          style={{
            backdropFilter: `grayscale(${e.strength}) brightness(0.9)`,
            WebkitBackdropFilter: `grayscale(${e.strength}) brightness(0.9)`,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      );
    }
    case "vignette":
      return <Fade ms={e.ms} style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(12,7,3,${e.strength}) 100%)` }} />;
    case "glow":
      return (
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{ background: `radial-gradient(circle at ${at}, rgba(255,238,196,${e.strength}) 0, rgba(255,226,160,${e.strength * 0.35}) ${bw(e.r * 0.6)}, transparent ${bw(e.r)})` }}
          initial={{ opacity: 0 }}
          animate={reduced ? { opacity: 0.8 } : { opacity: [0, 1, 0.75] }}
          transition={{ duration: (e.ms * 2) / 1000, times: [0, 0.4, 1] }}
        />
      );
    case "glow-ring":
      return (
        <div className="absolute" style={{ left: `${e.x}%`, top: `${e.y}%`, width: bw(e.r * 2), height: bw(e.r * 2), transform: "translate(-50%,-50%)" }}>
          <span className="glow-ring" />
          <span className="glow-ring glow-ring--late" />
        </div>
      );
    case "light-sweep": {
      const mask = `radial-gradient(ellipse ${bw(e.r)} ${bw(e.r * 0.62)} at ${at}, black 55%, transparent 100%)`;
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-soft-light" style={{ maskImage: mask, WebkitMaskImage: mask }}>
          <motion.div
            className="absolute -inset-y-1/4 w-1/3"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,240,200,0.95) 45%, rgba(255,255,255,1) 50%, rgba(255,240,200,0.95) 55%, transparent)",
              rotate: e.rotate + 20,
            }}
            initial={{ left: "20%" }}
            animate={{ left: "85%" }}
            transition={{ duration: e.ms / 1000, ease: [0.45, 0, 0.25, 1] }}
          />
        </div>
      );
    }
    case "light-shaft":
      return (
        <div
          className="light-shaft pointer-events-none absolute"
          style={{ left: `${e.x}%`, top: `${e.y - 20}%`, width: bw(e.r), height: "150%", rotate: `${e.rotate}deg`, ["--shaft" as string]: e.strength }}
        />
      );
    case "dust":
      return reduced ? null : <Dust x={e.x} y={e.y} r={e.r} />;
    case "thread":
      return <Thread ms={e.ms} reduced={reduced} />;
    case "particles":
      return reduced ? null : <Particles x={e.x} y={e.y} r={e.r} />;
    case "bookmark":
      return <Bookmark x={e.x} y={e.y} reduced={reduced} />;
    case "sweat":
      return (
        <motion.svg
          viewBox="0 0 20 28"
          className="pointer-events-none absolute"
          style={{ left: `${e.x}%`, top: `${e.y}%`, width: bw(1.3) }}
          initial={{ opacity: 0, y: -6, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0.9], y: [-6, 0, 4, 10], scale: 1 }}
          transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1] }}
        >
          <path d="M10 1 C 4 10, 1 15, 1 19 a 9 9 0 0 0 18 0 C 19 15, 16 10, 10 1 Z" fill="#9ED3F0" stroke="#2B2118" strokeWidth="1.6" />
          <path d="M6 18 a 4 4 0 0 0 3 5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </motion.svg>
      );
    case "label":
      return (
        <motion.div
          className="font-display pointer-events-none absolute whitespace-nowrap rounded-[3px] px-[0.9em] py-[0.3em] text-[#2F4A6D] shadow-md"
          style={{
            left: `${e.x}%`,
            top: `${e.y}%`,
            fontSize: bw(1.35),
            background: "#FBF3DF",
            border: "1.5px solid #2B2118",
            x: "-50%",
          }}
          initial={{ opacity: 0, y: -12, rotate: e.rotate - 6 }}
          animate={{ opacity: 1, y: 0, rotate: e.rotate }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <span className="absolute -top-[0.45em] left-1/2 h-[0.9em] w-[2.6em] -translate-x-1/2 rotate-[-3deg] bg-[#E8D9B5]/80" />
          {e.text}
        </motion.div>
      );
    default:
      return null;
  }
}

function Dust({ x, y, r }: { x: number; y: number; r: number }) {
  const motes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: x - r / 2 + ((i * 37) % 100) * (r / 100),
        top: y - r / 2 + ((i * 53) % 100) * (r / 100) * 1.2,
        size: 0.18 + ((i * 7) % 5) * 0.06,
        dur: 7 + ((i * 3) % 6),
        delay: -((i * 1.7) % 7),
      })),
    [x, y, r],
  );
  return (
    <div className="pointer-events-none absolute inset-0">
      {motes.map((m, i) => (
        <span
          key={i}
          className="dust-mote"
          style={{ left: `${m.left}%`, top: `${m.top}%`, width: bw(m.size), height: bw(m.size), animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }}
        />
      ))}
    </div>
  );
}

// Golden thread for S10: from the bookmark in Tí's hands, through the vortex, to the village gate.
// Coordinates are in image % (y scaled by 941/1672 so the viewBox keeps the artwork's aspect).
const K = 941 / 1672;
const SWIRL = `M27 ${66 * K} C33 ${56 * K} 41 ${72 * K} 47 ${60 * K} S59 ${36 * K} 54 ${35 * K} S45 ${48 * K} 53 ${52 * K} S64 ${45 * K} 66 ${33 * K} S70 ${24 * K} 72 ${27 * K}`;

function Thread({ ms, reduced }: { ms: number; reduced: boolean }) {
  return (
    <svg viewBox={`0 0 100 ${100 * K}`} className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <defs>
        <filter id="thread-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.35" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={SWIRL}
        fill="none"
        stroke="#E9B94A"
        strokeWidth={0.32}
        strokeLinecap="round"
        filter="url(#thread-glow)"
        initial={{ pathLength: reduced ? 1 : 0, opacity: 0.2 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: ms / 1000, ease: [0.5, 0, 0.2, 1] }}
      />
      {!reduced && (
        <path d={SWIRL} fill="none" stroke="#FFF6D8" strokeWidth={0.22} strokeLinecap="round" pathLength={100} className="thread-spark" />
      )}
    </svg>
  );
}

const SWATCHES = ["#B5452E", "#2F4A6D", "#D9A43B", "#5E7F4A", "#F3EAD7", "#7EC8E3", "#8B3A3A", "#F3EAD7"];

function Particles({ x, y, r }: { x: number; y: number; r: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        radius: r * (0.35 + ((i * 29) % 60) / 100),
        dur: 5.5 + ((i * 13) % 50) / 10,
        delay: -((i * 0.9) % 6),
        size: 1 + ((i * 17) % 13) / 10,
        color: SWATCHES[i % SWATCHES.length],
        paper: i % 3 === 0,
        tilt: (i * 47) % 360,
      })),
    [r],
  );
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: `${x}%`, top: `${y}%` }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }}>
      {bits.map((b, i) => (
        <div key={i} className="orbit" style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}>
          <span
            className={b.paper ? "orbit-bit orbit-bit--paper" : "orbit-bit"}
            style={{
              transform: `translateX(${bw(b.radius)}) rotate(${b.tilt}deg)`,
              width: bw(b.size),
              height: bw(b.size * (b.paper ? 1.3 : 0.8)),
              background: b.paper ? undefined : b.color,
              animationDelay: `${b.delay}s`,
            }}
          />
        </div>
      ))}
    </motion.div>
  );
}

function Bookmark({ x, y, reduced }: { x: number; y: number; reduced: boolean }) {
  return (
    <motion.div
      data-bookmark
      className="bookmark absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: bw(2.1), height: bw(11) }}
      initial={{ y: reduced ? "0%" : "-70%", opacity: reduced ? 1 : 0 }}
      animate={{ y: "0%", opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="bookmark-tassel" />
    </motion.div>
  );
}
