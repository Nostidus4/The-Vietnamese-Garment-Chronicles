"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Beat } from "@/lib/types";

/** A text block on screen: one narration box / speech bubble built from one or more beats. */
export interface Block {
  key: string;
  beat: Beat; // the beat that opened the block (position, style)
  lines: { key: string; parts: { key: string; text: string; typeMs: number }[] }[];
}

/** Group the beats shown so far into blocks (join = new line, inline = same line, clear = wipe). */
export function buildBlocks(beats: Beat[], shown: number, screenId: string): Block[] {
  let blocks: Block[] = [];
  beats.slice(0, shown).forEach((b, i) => {
    const key = `${screenId}-${i}`;
    if (b.clear) blocks = [];
    if (!b.text) return;
    const last = blocks[blocks.length - 1];
    const part = { key, text: b.text, typeMs: b.type_ms };
    if (last && b.inline) {
      last.lines[last.lines.length - 1].parts.push(part);
    } else if (last && b.join) {
      last.lines.push({ key, parts: [part] });
    } else {
      blocks.push({ key, beat: b, lines: [{ key, parts: [part] }] });
    }
  });
  return blocks;
}

/** Reveals text character by character; `instant` (bumped when the viewer clicks) finishes it. */
function Typed({ text, typeMs, instant, onDone }: { text: string; typeMs: number; instant: number; onDone?: () => void }) {
  const [start] = useState(instant);
  const [n, setN] = useState(typeMs > 0 ? 0 : text.length);
  const done = n >= text.length || instant !== start;

  useEffect(() => {
    if (done) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setN((v) => v + 1), typeMs);
    return () => clearTimeout(t);
  }, [n, done, typeMs, onDone]);

  if (typeMs <= 0) {
    return (
      <motion.span initial={{ opacity: 0, filter: "blur(3px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
        {text}
      </motion.span>
    );
  }
  const shown = done ? text.length : n;
  return (
    <span>
      {text.slice(0, shown)}
      <span className="opacity-0">{text.slice(shown)}</span>
    </span>
  );
}

const BOX_CLASS: Record<string, string> = {
  box: "narration",
  memory: "narration narration--memory",
  caption: "narration narration--caption",
  hand: "hand-note",
  "hand-large": "hand-note hand-note--large",
};

/** Part of the image (in %) that is actually on screen; text is kept inside it. */
export interface Visible {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function BlockView({ block, instant, compact, visible }: { block: Block; instant: number; compact: boolean; visible?: Visible }) {
  const b = block.beat;
  let x = b.x;
  let y = b.y;
  if (visible && (b.kind === "narration" || b.kind === "speech")) {
    x = Math.min(Math.max(x, visible.x0 + 1.2), visible.x1 - b.w - 1.2);
    y = Math.min(Math.max(y, visible.y0 + 2), visible.y1 - 11);
  }
  const pos = compact ? {} : { left: `${x}%`, top: `${y}%`, width: `${b.w}%` };

  if (b.kind === "title") return <TitleInLabel block={block} />;
  if (b.kind === "question") return <HandQuestion block={block} instant={instant} />;
  if (b.kind === "finale") return <Finale block={block} instant={instant} />;

  const content = block.lines.map((l) => (
    <p key={l.key} className="m-0">
      {l.parts.map((p) => (
        <Typed key={p.key} text={p.text} typeMs={p.typeMs} instant={instant} />
      ))}
    </p>
  ));

  if (b.kind === "speech") {
    const memory = b.style === "memory";
    return (
      <motion.div
        className={`${compact ? "relative" : "absolute"} bubble-v2 ${memory ? "bubble-v2--memory" : ""} tail-${compact ? "none" : b.tail}`}
        style={pos}
        initial={{ opacity: 0, scale: 0.86, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
      >
        {b.speaker && <span className="bubble-v2__speaker">{b.speaker}</span>}
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${compact ? "relative" : "absolute"} ${BOX_CLASS[b.style] ?? "narration"}`}
      style={pos}
      initial={{ opacity: 0, y: 8, rotate: b.style.startsWith("hand") ? 0 : -1.4 }}
      animate={{ opacity: 1, y: 0, rotate: b.style.startsWith("hand") ? 0 : -0.6 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
}

/** The book's name set into the embroidered label of the cover (S08). */
function TitleInLabel({ block }: { block: Block }) {
  const b = block.beat;
  return (
    <div className="pointer-events-none absolute flex items-center justify-center" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, transform: `translate(-50%,-50%) rotate(${b.rotate}deg)` }}>
      <motion.span
        className="font-display whitespace-nowrap text-[#2F4A6D]"
        style={{ fontSize: `calc(var(--bw) * ${b.w / 1000 * 0.95})`, textShadow: "0 1px 0 rgba(255,250,235,0.6)" }}
        initial={{ opacity: 0, letterSpacing: "0.22em", filter: "blur(4px)" }}
        animate={{ opacity: 1, letterSpacing: "0.01em", filter: "blur(0px)" }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {block.lines[0].parts[0].text}
      </motion.span>
    </div>
  );
}

/** Bà's question written onto the empty page: strokes are drawn, then ink fills in (S09). */
function HandQuestion({ block, instant }: { block: Block; instant: number }) {
  const b = block.beat;
  const [first] = useState(instant);
  const skip = instant !== first;
  const text = block.lines[0].parts[0].text;
  const lines = splitLines(text, 22);
  return (
    <div className="pointer-events-none absolute" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%` }}>
      <svg viewBox={`0 0 300 ${lines.length * 46 + 10}`} className="w-full overflow-visible">
        {lines.map((line, i) => (
          <motion.text
            key={i}
            x="150"
            y={40 + i * 46}
            textAnchor="middle"
            className="font-hand"
            fontSize="30"
            fill="#2B2118"
            stroke="#2B2118"
            strokeWidth="0.6"
            initial={skip ? false : { strokeDasharray: "0 400", fillOpacity: 0 }}
            animate={{ strokeDasharray: "400 0", fillOpacity: 1 }}
            transition={{ duration: 1.5, delay: skip ? 0 : i * 1.1, ease: "easeInOut", fillOpacity: { delay: skip ? 0 : i * 1.1 + 0.9, duration: 0.8 } }}
          >
            {line}
          </motion.text>
        ))}
      </svg>
    </div>
  );
}

function Finale({ block, instant }: { block: Block; instant: number }) {
  const b = block.beat;
  const large = b.style === "finale-large";
  return (
    <motion.div
      className={`finale ${large ? "finale--large" : ""} pointer-events-none absolute text-center`}
      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, x: "-50%" }}
      initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: large ? 1.8 : 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <Typed text={block.lines[0].parts[0].text} typeMs={0} instant={instant} />
    </motion.div>
  );
}

function splitLines(text: string, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if ((cur + " " + w).trim().length > max && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}
