"use client";

// The small games glued on a chapter's pages. Each one is about how people there make, wear or share something,
// not a trivia quiz: print a Đông Hồ picture, answer a quan họ singer, read the poles at a floating market,
// pack for a day on a boat, fasten silver buttons, step into a xòe circle, play gongs together, weave a band.
// All words come from content (Game.rounds); only the drawings and sounds live here.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Game } from "@/lib/types";
import { YOUNG } from "./Diary";

type Props = { game: Game; onWin: () => void };

/* ---------- sound: tiny WebAudio voices, no files needed ---------- */

let ctx: AudioContext | null = null;
function audio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}
/** A gong: a low sine with a slow decay and a faint shimmer. */
function gong(freq: number) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  [1, 2.76].forEach((mul, i) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * mul, t);
    o.frequency.exponentialRampToValueAtTime(freq * mul * 0.985, t + 1.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(i ? 0.05 : 0.35, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (i ? 0.6 : 1.8));
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 1.9);
  });
}
/** A drum: a short thump. */
function drum(strong = false) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.frequency.setValueAtTime(strong ? 140 : 110, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.18);
  g.gain.setValueAtTime(strong ? 0.6 : 0.4, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.3);
}

const shuffle = <T,>(xs: T[], seed = 7) => {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const k = (seed * (i + 3) + i * 11) % (i + 1);
    [out[i], out[k]] = [out[k], out[i]];
  }
  return out;
};

const Hint = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "bad" | "neutral" }) => (
  <motion.p
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    className={`font-hand m-0 mt-1.5 text-[0.9rem] leading-snug ${tone === "good" ? "text-[#5E7F4A]" : tone === "bad" ? "text-[#B5452E]" : "text-[#8a4b2a]"}`}
  >
    {children}
  </motion.p>
);

/* ---------- 1 · In tranh Đông Hồ: colours in any order, the black key block last ---------- */

/** The black key block of "Đám cưới chuột": four mice, the palanquin, two lanterns. */
function MouseOutlines({ stroke, opacity, dash }: { stroke: string; opacity: number; dash?: string }) {
  return (
    <g opacity={opacity} style={{ transition: "opacity .4s" }} fill="none" stroke={stroke} strokeWidth="1.1" strokeLinecap="round" strokeDasharray={dash}>
      {[18, 38, 84, 102].map((x) => (
        <g key={x}>
          <circle cx={x} cy="49" r="5" />
          <circle cx={x - 3} cy="44.5" r="1.8" />
          <circle cx={x + 3} cy="44.5" r="1.8" />
          <rect x={x - 5} y="54" width="10" height="11" rx="3" />
          <path d={`M${x + 5} 62 q 6 2 7 8`} />
        </g>
      ))}
      <rect x="52" y="40" width="22" height="18" rx="2" />
      <path d="M50 38 h26 l-4 -6 h-18z M46 58 h34" />
      <circle cx="30" cy="30" r="4" />
      <circle cx="96" cy="30" r="4" />
      <path d="M30 26 v-8 M96 26 v-8" />
    </g>
  );
}

function DongHo({ game, onWin }: Props) {
  const layers = game.rounds;
  const black = layers.length - 1; // the content lists the black outline last
  const [printed, setPrinted] = useState<number[]>([]);
  const [pressing, setPressing] = useState<number | null>(null);
  const smudged = printed.includes(black) && printed.length < layers.length;
  const done = printed.length === layers.length && !smudged;
  const color = (i: number) => layers[i].item ?? "#333";
  const on = (i: number) => printed.includes(i);

  const press = (i: number) => {
    if (on(i) || smudged || pressing !== null) return;
    setPressing(i);
    setTimeout(() => {
      setPrinted((p) => {
        const next = [...p, i];
        if (next.length === layers.length && next[next.length - 1] === black) setTimeout(onWin, 2200); // let the finished picture be seen
        return next;
      });
      setPressing(null);
    }, 450);
  };

  return (
    <div>
      <div className="relative mx-auto aspect-[4/3] w-[92%] overflow-hidden shadow-[0_4px_10px_rgba(60,35,10,0.25)]" style={{ background: "#f3ecdc" }}>
        {/* điệp shimmer */}
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 0.6px, transparent 0.8px)", backgroundSize: "7px 7px" }} />
        <svg viewBox="0 0 120 90" className="absolute inset-0 h-full w-full" aria-label="Tờ tranh Đám cưới chuột">
          {/* green: ground and leaves */}
          <g opacity={on(2) ? 0.9 : 0} style={{ transition: "opacity .4s" }} fill={color(2)}>
            <path d="M0 78 C 30 72, 70 82, 120 76 V90 H0z" />
            <path d="M8 70 q 6 -12 12 0z M100 68 q 6 -12 12 0z" />
          </g>
          {/* yellow: the palanquin and the lanterns */}
          <g opacity={on(1) ? 0.9 : 0} style={{ transition: "opacity .4s" }} fill={color(1)}>
            <rect x="52" y="40" width="22" height="18" rx="2" />
            <circle cx="30" cy="30" r="4" />
            <circle cx="96" cy="30" r="4" />
          </g>
          {/* red: jackets of the mice */}
          <g opacity={on(0) ? 0.9 : 0} style={{ transition: "opacity .4s" }} fill={color(0)}>
            {[18, 38, 84, 102].map((x) => (
              <rect key={x} x={x - 5} y="54" width="10" height="11" rx="3" />
            ))}
            <path d="M50 38 h26 l-4 -6 h-18z" />
          </g>
          {/* before the key block: the same lines, faint and dashed, like the sketch on the paper (a blank sheet looked
              like a picture that had not loaded, #61) */}
          <MouseOutlines stroke="#a8977a" opacity={on(black) ? 0 : 0.55} dash="1.5 1.5" />
          {/* black: the key block, all outlines */}
          <MouseOutlines stroke={color(black)} opacity={on(black) ? 1 : 0} />
          {printed.length === 0 && (
            <text x="60" y="14" textAnchor="middle" fontSize="5" fill="#8a6a4a" className="font-hand">
              Tờ giấy điệp chờ bản khắc đầu tiên
            </text>
          )}
          {smudged && <ellipse cx="60" cy="52" rx="34" ry="16" fill="#7a5a40" opacity=".28" />}
        </svg>
        {/* the wooden block coming down */}
        <AnimatePresence>
          {pressing !== null && (
            <motion.div
              key={pressing}
              className="absolute inset-[8%] rounded-sm border-4 border-[#6b4a2f]"
              style={{ background: `repeating-linear-gradient(90deg, #8a6a4a 0 6px, #7a5a3a 6px 12px)`, opacity: 0.85 }}
              initial={{ y: "-110%" }}
              animate={{ y: ["-110%", "0%", "0%", "-110%"] }}
              transition={{ duration: 0.45, times: [0, 0.4, 0.6, 1] }}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {shuffle(layers.map((_, i) => i), layers.length + 3).map((i) => (
          <button
            key={i}
            type="button"
            disabled={on(i) || smudged || done}
            onClick={() => press(i)}
            data-hint
            className="flex items-center gap-2 rounded border border-stone-300 bg-white/60 px-2 py-1 text-left text-[0.74rem] text-stone-700 hover:bg-amber-50 disabled:opacity-45"
          >
            <span className="h-4 w-4 shrink-0 rounded-sm border border-black/20" style={{ background: color(i) }} />
            {layers[i].label}
            {on(i) && <span className="ml-auto text-[0.65rem] text-stone-500">#{printed.indexOf(i) + 1}</span>}
          </button>
        ))}
      </div>
      {printed.length > 0 && !smudged && <Hint>{layers[printed[printed.length - 1]].explain}</Hint>}
      {smudged && (
        <>
          <Hint tone="bad">Nét đen in trước nên màu in sau đè lem mất nét rồi. Ông cụ bảo: màu trước, nét đen sau cùng.</Hint>
          <button type="button" onClick={() => setPrinted([])} className="mt-1 text-[0.75rem] underline">
            Lấy tờ giấy mới
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- 2 · Hát đối quan họ: choose the answer that keeps the custom ---------- */

function QuanHo({ game, onWin }: Props) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const r = game.rounds[round];
  const order = useMemo(() => shuffle(r.choices.map((_, i) => i), round + 5), [r, round]);
  const right = picked !== null && picked === r.answer;
  const next = () => {
    if (round + 1 >= game.rounds.length) return onWin();
    setRound(round + 1);
    setPicked(null);
  };
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[0.62rem] tracking-[0.2em] text-stone-500">
        {game.rounds.map((_, i) => (
          <span key={i} className={`h-1.5 w-6 rounded-full ${i < round || (i === round && right) ? "bg-[#5E7F4A]" : i === round ? "bg-[#D9A43B]" : "bg-stone-300"}`} />
        ))}
        <span className="ml-1">LƯỢT {round + 1}/{game.rounds.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={round} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
          <div className="relative mt-2 rounded-lg bg-[#27354f] px-3 py-2 text-[0.82rem] leading-snug text-amber-50">
            <span className="font-hand block text-[0.85rem] text-amber-200">{r.label ?? "Liền anh"}:</span>
            {r.prompt}
            <span className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 bg-[#27354f]" aria-hidden />
          </div>
          <p className="font-hand m-0 mt-3 text-[0.9rem]" style={{ color: YOUNG }}>
            {r.item ?? "Bà đáp thế nào đây?"}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {order.map((i) => (
              <button
                key={i}
                type="button"
                data-hint
                disabled={right}
                onClick={() => setPicked(i)}
                className={`rounded border px-2 py-1 text-left text-[0.76rem] ${picked === i ? (i === r.answer ? "border-[#5E7F4A] bg-[#5E7F4A]/10" : "border-[#B5452E] bg-[#B5452E]/10") : "border-stone-300 hover:bg-amber-50"}`}
              >
                {r.choices[i]}
              </button>
            ))}
          </div>
          {picked !== null && <Hint tone={right ? "good" : "bad"}>{right ? r.explain : "Chưa đúng lề lối rồi, liền chị lắc đầu. Con thử cách khác nhé."}</Hint>}
          {right && (
            <button type="button" onClick={next} className="mt-2 rounded-full bg-[#27354f] px-3 py-1 text-[0.75rem] text-amber-50">
              {round + 1 >= game.rounds.length ? "Xong →" : "Lượt tiếp →"}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- 2b · Áo ngũ thân: put the five panels where they belong ---------- */

// where each panel sits on the drawn robe (front view; the two back panels peek out behind)
const PANELS: Record<string, { d: string; z: number }> = {
  "back-left": { d: "M30 16 L50 12 L50 92 L22 92 Z", z: 0 },
  "back-right": { d: "M50 12 L70 16 L78 92 L50 92 Z", z: 0 },
  inner: { d: "M50 20 L64 24 L66 90 L50 90 Z", z: 1 },
  "front-left": { d: "M34 18 L50 14 L50 30 L46 90 L26 90 Z", z: 2 },
  "front-right": { d: "M50 14 L66 18 L74 90 L42 90 L46 30 Z", z: 3 },
};
const PANEL_FILL: Record<string, string> = { "back-left": "#1d3a5c", "back-right": "#1d3a5c", inner: "#a7b8cc", "front-left": "#2F4A6D", "front-right": "#34557d" };

function NguThan({ game, onWin }: Props) {
  const tray = useMemo(() => shuffle(game.rounds.map((_, i) => i), 4), [game.rounds]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [note, setNote] = useState<{ text: string; good: boolean } | null>(null);
  const drop = (slot: string) => {
    if (sel === null) return setNote({ text: "Chọn một mảnh thân áo ở dưới trước đã.", good: false });
    const r = game.rounds[sel];
    if (r.item !== slot) return setNote({ text: `Mảnh “${r.label}” không nằm ở đó đâu con.`, good: false });
    const next = [...placed, sel];
    setPlaced(next);
    setSel(null);
    setNote({ text: r.explain ?? "", good: true });
    if (next.length === game.rounds.length) setTimeout(onWin, 1800);
  };
  const filled = (slot: string) => placed.some((i) => game.rounds[i].item === slot);
  const all = placed.length === game.rounds.length;
  return (
    <div>
      <svg viewBox="0 0 100 100" className="mx-auto block w-[62%]" aria-label="Chiếc áo ngũ thân đang ghép">
        {/* sleeves and the standing collar are always there, the panels are what we place */}
        <path d="M34 18 L8 40 L14 48 L30 34 Z M66 18 L92 40 L86 48 L70 34 Z" fill={all ? "#2F4A6D" : "#d9ceb6"} stroke="#8a7a5c" strokeWidth=".5" />
        <path d="M42 10 Q50 7 58 10 L58 15 Q50 12 42 15 Z" fill={all ? "#1d3a5c" : "#d9ceb6"} stroke="#8a7a5c" strokeWidth=".5" />
        {Object.entries(PANELS)
          .sort((a, b) => a[1].z - b[1].z)
          .map(([slot, p]) => (
            <path
              key={slot}
              d={p.d}
              onClick={() => drop(slot)}
              className="cursor-pointer"
              fill={filled(slot) ? PANEL_FILL[slot] : "rgba(255,255,255,0.35)"}
              stroke={filled(slot) ? "#10263f" : "#8a7a5c"}
              strokeWidth=".6"
              strokeDasharray={filled(slot) ? undefined : "2 1.5"}
              opacity={slot === "inner" && filled("front-right") ? 0.35 : 1}
              role="button"
              aria-label={`Chỗ ${slot}`}
            />
          ))}
        {/* the buttons along the right, once the front is closed */}
        {all && [34, 44, 54, 64, 74].map((y) => <circle key={y} cx={y < 40 ? 58 : 62 + (y - 44) * 0.12} cy={y} r="1.4" fill="#e8d9a8" />)}
      </svg>
      <div className="mt-2 flex flex-wrap gap-1">
        {tray
          .filter((i) => !placed.includes(i))
          .map((i) => (
            <button
              key={i}
              type="button"
              data-hint
              onClick={() => setSel(i)}
              className={`rounded border px-2 py-0.5 text-[0.72rem] ${sel === i ? "border-[#27354f] bg-[#27354f] text-amber-50" : "border-stone-400 bg-white/70 hover:bg-amber-50"}`}
            >
              {game.rounds[i].label}
            </button>
          ))}
      </div>
      <p className="m-0 mt-1 text-[0.68rem] text-stone-500">
        Đã ghép {placed.length}/{game.rounds.length} thân · chọn mảnh rồi bấm vào chỗ trên áo
      </p>
      {note && <Hint tone={note.good ? "good" : "bad"}>{note.text}</Hint>}
    </div>
  );
}

/* ---------- 3 · Cây bẹo: pick a sign, then the boat whose pole shows what it sells ---------- */

function CayBeo({ game, onWin }: Props) {
  const boats = useMemo(() => shuffle(game.rounds.map((_, i) => i), 3), [game.rounds]);
  const signs = useMemo(() => shuffle(game.rounds.map((_, i) => i), 9), [game.rounds]);
  const [sel, setSel] = useState<number | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const drop = (boat: number) => {
    if (sel === null || placed.includes(boat)) return;
    if (sel === boat) {
      const next = [...placed, boat];
      setPlaced(next);
      setNote(game.rounds[boat].explain);
      setSel(null);
      if (next.length === game.rounds.length) setTimeout(onWin, 900);
    } else {
      setShake(boat);
      setNote("Ghe này treo thứ khác mà. Con nhìn kỹ cây bẹo nhé.");
      setTimeout(() => setShake(null), 400);
    }
  };
  return (
    <div>
      <div className="relative grid grid-cols-5 gap-1 rounded-md px-1 pb-2 pt-1" style={{ background: "linear-gradient(180deg, #f6e7c9 0%, #f6e7c9 55%, #b9a37a 55%, #8f7a55 100%)" }}>
        {boats.map((b) => {
          const [icon, ...rest] = (game.rounds[b].item ?? "").split(" ");
          return (
            <motion.button
              key={b}
              type="button"
              onClick={() => drop(b)}
              animate={shake === b ? { x: [0, -5, 5, -3, 0] } : { y: [0, -2, 0] }}
              transition={shake === b ? { duration: 0.35 } : { duration: 2.4 + b * 0.3, repeat: Infinity }}
              className="flex flex-col items-center"
              aria-label={`Ghe treo ${rest.join(" ")}`}
            >
              <span className="text-[1.4rem] leading-none">{icon}</span>
              <span className="h-10 w-[2px] bg-[#6b4a2f]" />
              <span className="h-4 w-full rounded-b-[60%] bg-[#6b4a2f]" />
              <span className="mt-0.5 min-h-[1.8em] text-center text-[0.55rem] leading-tight text-amber-50">
                {placed.includes(b) ? game.rounds[b].label : rest.join(" ")}
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="m-0 mt-2 text-[0.68rem] text-stone-500">Chọn một tấm biển, rồi bấm vào chiếc ghe:</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {signs
          .filter((s) => !placed.includes(s))
          .map((s) => (
            <button
              key={s}
              type="button"
              data-hint
              onClick={() => setSel(s)}
              className={`rounded border px-2 py-0.5 text-[0.72rem] ${sel === s ? "border-[#27354f] bg-[#27354f] text-amber-50" : "border-stone-400 bg-white/70 hover:bg-amber-50"}`}
            >
              {game.rounds[s].label}
            </button>
          ))}
      </div>
      {note && <Hint tone={note.startsWith("Ghe này") ? "bad" : "neutral"}>{note}</Hint>}
    </div>
  );
}

/* ---------- 4 · Xếp đồ đi ghe: keep what helps on a boat ---------- */

function XepDo({ game, onWin }: Props) {
  const [bag, setBag] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const keep = game.rounds.map((r, i) => (r.answer === 1 ? i : -1)).filter((i) => i >= 0);
  const wrong = bag.filter((i) => game.rounds[i].answer !== 1);
  const missing = keep.filter((i) => !bag.includes(i));
  const toggle = (i: number) => {
    setChecked(false);
    setBag((b) => (b.includes(i) ? b.filter((x) => x !== i) : [...b, i]));
  };
  const check = () => {
    setChecked(true);
    if (!wrong.length && !missing.length) setTimeout(onWin, 700);
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-1">
        {game.rounds.map((r, i) => (
          <button
            key={i}
            type="button"
            data-hint
            onClick={() => toggle(i)}
            className={`rounded border px-2 py-1 text-left text-[0.74rem] ${bag.includes(i) ? "border-[#27354f] bg-[#27354f]/10" : "border-stone-300 bg-white/60 hover:bg-amber-50"}`}
            aria-pressed={bag.includes(i)}
          >
            {bag.includes(i) ? "🎒 " : ""}
            {r.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={check} disabled={!bag.length} className="mt-2 rounded-full bg-[#27354f] px-3 py-1 text-[0.75rem] text-amber-50 disabled:opacity-50">
        Xong, lên ghe!
      </button>
      {checked &&
        (wrong.length ? (
          <Hint tone="bad">
            ✎ Tí: {game.rounds[wrong[0]].label}? {game.rounds[wrong[0]].explain}
          </Hint>
        ) : missing.length ? (
          <Hint tone="bad">Còn thiếu một món cần cho ngày trên sông đó con.</Hint>
        ) : (
          <Hint tone="good">{keep.map((i) => game.rounds[i].explain).join(" ")}</Hint>
        ))}
    </div>
  );
}

/* ---------- 5 · Khuy bạc: fasten the pairs from the collar down ---------- */

function KhuyBac({ game, onWin }: Props) {
  const n = game.rounds.length;
  const [done, setDone] = useState(0);
  const [miss, setMiss] = useState(false);
  const click = (i: number) => {
    if (i < done) return;
    if (i !== done) {
      setMiss(true);
      return;
    }
    setMiss(false);
    setDone(i + 1);
    if (i + 1 === n) setTimeout(onWin, 800);
  };
  return (
    <div>
      <svg viewBox="0 0 100 90" className="mx-auto block w-[80%]" aria-label="Chiếc áo cần cài khuy">
        <path d="M20 10 L40 4 L50 12 L60 4 L80 10 L96 40 L84 46 L78 32 L78 86 L22 86 L22 32 L16 46 L4 40z" fill="#2b2b3a" stroke="#1a1a24" />
        <path d="M50 12 V86" stroke="#1a1a24" strokeWidth="1" />
        {Array.from({ length: n }, (_, i) => {
          const y = 18 + i * (62 / Math.max(1, n - 1));
          const fastened = i < done;
          return (
            <g key={i} onClick={() => click(i)} data-hint={i === 0 ? true : undefined} className="cursor-pointer" role="button" aria-label={game.rounds[i].label ?? `Khuy ${i + 1}`}>
              <rect x="40" y={y - 4} width="20" height="8" fill="transparent" />
              <circle cx="45" cy={y} r="2.6" fill={fastened ? "#e8ecf2" : "none"} stroke={fastened ? "#fff" : "#9aa2b5"} strokeDasharray={fastened ? undefined : "1 1"} />
              <circle cx="55" cy={y} r="2.6" fill={fastened ? "#e8ecf2" : "none"} stroke={fastened ? "#fff" : "#9aa2b5"} strokeDasharray={fastened ? undefined : "1 1"} />
              {fastened && <path d={`M47.6 ${y} H52.4`} stroke="#e8ecf2" strokeWidth="1.2" />}
              {fastened && <circle cx="50" cy={y} r="5" fill="none" stroke="#fff" opacity=".25" />}
            </g>
          );
        })}
      </svg>
      <p className="m-0 mt-1 text-center text-[0.7rem] text-stone-500">
        Đã cài {done}/{n} đôi · bấm vào đôi khuy tiếp theo
      </p>
      {miss && <Hint tone="bad">Cài từ trên cổ xuống con ạ, đừng bỏ sót đôi nào.</Hint>}
    </div>
  );
}

/* ---------- 6 · Vòng xòe: step on the drum ---------- */

function Xoe({ game, onWin }: Props) {
  const reduced = !!useReducedMotion();
  const need = Number(game.rounds[0]?.label ?? 8);
  const BEAT = 900;
  const [running, setRunning] = useState(false);
  const [hits, setHits] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const last = useRef(0);
  const hitsRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      last.current = performance.now();
      setPulse((p) => p + 1);
      drum();
    }, BEAT);
    return () => clearInterval(id);
  }, [running]);
  const tap = () => {
    if (!running) {
      audio();
      setRunning(true);
      return;
    }
    const d = performance.now() - last.current;
    const near = Math.min(d, BEAT - d);
    if (near < 200) {
      hitsRef.current += 1;
      setHits(hitsRef.current);
      setMsg("Đúng nhịp!");
      drum(true);
      if (hitsRef.current >= need) {
        setRunning(false);
        setTimeout(onWin, 600);
      }
    } else setMsg("Sớm quá hay muộn quá rồi, nghe tiếng trống nhé.");
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  useEffect(() => () => setRunning(false), []);
  const people = 10;
  return (
    <div className="flex flex-col items-center">
      <motion.svg viewBox="0 0 100 100" className="w-[70%]" animate={reduced ? undefined : { rotate: hits * 12 }} transition={{ type: "spring", stiffness: 60, damping: 12 }} aria-hidden>
        <motion.circle cx="50" cy="50" r="10" fill="#f2a24a" key={pulse} initial={{ scale: 1.25, opacity: 1 }} animate={{ scale: 1, opacity: 0.8 }} transition={{ duration: 0.4 }} style={{ transformOrigin: "50px 50px" }} />
        <circle cx="50" cy="50" r="6" fill="#ffd27a" />
        {Array.from({ length: people }, (_, i) => {
          const a = (i / people) * Math.PI * 2;
          const x = 50 + 34 * Math.cos(a);
          const y = 50 + 34 * Math.sin(a);
          const lit = i < Math.round((hits / need) * people);
          return (
            <g key={i}>
              <line x1={x} y1={y} x2={50 + 34 * Math.cos(a + (Math.PI * 2) / people)} y2={50 + 34 * Math.sin(a + (Math.PI * 2) / people)} stroke={lit ? "#B5452E" : "#c9bba0"} strokeWidth="1.2" />
              <circle cx={x} cy={y} r="4" fill={lit ? "#27354f" : "#a89c86"} />
            </g>
          );
        })}
      </motion.svg>
      <button type="button" data-hint onClick={tap} className="mt-2 rounded-full bg-[#27354f] px-5 py-2 text-sm text-amber-50 active:scale-95">
        {running ? "Bước!" : "Bắt đầu nghe trống"}
      </button>
      <p className="m-0 mt-1 text-[0.7rem] text-stone-500">
        {hits}/{need} bước đúng nhịp · phím cách cũng được
      </p>
      {msg && running && <Hint tone={msg === "Đúng nhịp!" ? "good" : "bad"}>{msg}</Hint>}
    </div>
  );
}

/* ---------- 7 · Cồng chiêng: repeat the gongs, one longer each time ---------- */

const GONGS = [196, 220, 262, 294, 330, 392];
function CongChieng({ game, onWin }: Props) {
  const target = Number(game.rounds[0]?.label ?? 5);
  const [seq, setSeq] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "listen" | "play">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const seed = useRef(3);
  const rnd = () => {
    seed.current = (seed.current * 9301 + 49297) % 233280;
    return Math.floor((seed.current / 233280) * GONGS.length);
  };
  const playSeq = (s: number[]) => {
    setState("listen");
    s.forEach((g, i) =>
      setTimeout(() => {
        setLit(g);
        gong(GONGS[g]);
        setTimeout(() => setLit(null), 350);
        if (i === s.length - 1) setTimeout(() => setState("play"), 500);
      }, 300 + i * 650),
    );
  };
  const start = () => {
    audio();
    const s = [rnd(), rnd()];
    setSeq(s);
    setPos(0);
    setMsg(null);
    playSeq(s);
  };
  const hit = (g: number) => {
    setLit(g);
    gong(GONGS[g]);
    setTimeout(() => setLit(null), 250);
    if (state !== "play") return;
    if (g !== seq[pos]) {
      setMsg("Lệch tiếng rồi. Nghe lại nhé, không ai đánh một mình đâu.");
      setPos(0);
      setTimeout(() => playSeq(seq), 700);
      return;
    }
    if (pos + 1 < seq.length) return setPos(pos + 1);
    if (seq.length >= target) {
      setState("idle");
      setMsg(null);
      setTimeout(onWin, 700);
      return;
    }
    const s = [...seq, rnd()];
    setSeq(s);
    setPos(0);
    setMsg(`Đúng rồi! Thêm một tiếng nữa (${s.length}/${target}).`);
    setTimeout(() => playSeq(s), 800);
  };
  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-2">
        {GONGS.map((_, g) => (
          <motion.button
            key={g}
            type="button"
            onClick={() => hit(g)}
            animate={lit === g ? { scale: 0.92, rotate: [0, -3, 3, 0] } : { scale: 1 }}
            className="flex aspect-square w-[4.2rem] items-center justify-center rounded-full border-4 border-[#6b5226] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.35),0_3px_6px_rgba(0,0,0,0.3)]"
            style={{ background: lit === g ? "radial-gradient(circle at 40% 35%, #ffe7a3, #c99a3a 60%, #7a5a20)" : "radial-gradient(circle at 40% 35%, #e0c079, #a47a2c 60%, #5e4418)", width: `${3.4 + (5 - g) * 0.2}rem` }}
            aria-label={`Chiêng ${g + 1}`}
          >
            <span className="h-3 w-3 rounded-full bg-[#5e4418] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
          </motion.button>
        ))}
      </div>
      {state === "idle" && (
        <button type="button" data-hint onClick={start} className="mt-3 rounded-full bg-[#27354f] px-4 py-1.5 text-sm text-amber-50">
          Nghe nghệ nhân đánh
        </button>
      )}
      <p className="m-0 mt-2 text-[0.7rem] text-stone-500">
        {state === "listen" ? "Nghe…" : state === "play" ? `Đến lượt con: ${pos}/${seq.length}` : `Đánh đúng chuỗi ${target} tiếng`}
      </p>
      {msg && <Hint tone={msg.startsWith("Đúng") ? "good" : "bad"}>{msg}</Hint>}
    </div>
  );
}

/* ---------- 8 · Dệt: pick the thread colour of each row ---------- */

function Det({ game, onWin }: Props) {
  const rows = game.rounds;
  const palette = useMemo(() => [...new Set([...rows.map((r) => r.item ?? "#000"), "#2F4A6D", "#D9A43B"])], [rows]);
  const [woven, setWoven] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const cur = woven.length;
  const pick = (c: string) => {
    if (cur >= rows.length) return;
    if (c !== rows[cur].item) return setMsg(`Người dệt lắc đầu: “${rows[cur].label}: ${rows[cur].explain ?? ""}”`);
    setMsg(null);
    const next = [...woven, c];
    setWoven(next);
    if (next.length === rows.length) setTimeout(onWin, 800);
  };
  return (
    <div>
      <svg viewBox="0 0 100 60" className="mx-auto block w-[90%] rounded-sm shadow-[0_3px_8px_rgba(0,0,0,0.25)]" aria-label="Tấm vải đang dệt">
        <rect width="100" height="60" fill="#eadfca" />
        {rows.map((r, i) => {
          const y = i * (60 / rows.length);
          const h = 60 / rows.length;
          const c = woven[i];
          return (
            <g key={i}>
              {c ? (
                <motion.rect x="0" y={y} width="100" height={h} fill={c} initial={{ width: 0 }} animate={{ width: 100 }} transition={{ duration: 0.5 }} />
              ) : (
                <rect x="0" y={y} width="100" height={h} fill="url(#warp)" opacity=".6" />
              )}
              {c && i === Math.floor(rows.length / 2) && (
                <g fill="#b5452e">
                  {Array.from({ length: 8 }, (_, k) => (
                    <path key={k} d={`M${6 + k * 12} ${y + h / 2} l4 -${h / 3} l4 ${h / 3} l-4 ${h / 3}z`} />
                  ))}
                </g>
              )}
              {i === cur && <rect x="0" y={y} width="100" height={h} fill="none" stroke="#D9A43B" strokeWidth="0.8" strokeDasharray="2 1" />}
              {/* the loom before the first thread: say what it waits for, not a striped blank (#61) */}
              {cur === 0 && i === 0 && (
                <text x="50" y={y + h / 2 + 1.6} textAnchor="middle" fontSize="4.2" fill="#6b4a2f" className="font-hand">
                  Khung cửi chờ sợi đầu tiên: chọn màu bên dưới
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <pattern id="warp" width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M1 0 V2" stroke="#b8a888" strokeWidth=".4" />
          </pattern>
        </defs>
      </svg>
      {cur < rows.length && (
        <p className="m-0 mt-2 text-[0.72rem] text-stone-600">
          Hàng {cur + 1}/{rows.length}: <b>{rows[cur].label}</b> · chọn màu sợi
        </p>
      )}
      <div className="mt-1 flex gap-1.5">
        {palette.map((c) => (
          <button key={c} type="button" data-hint onClick={() => pick(c)} className="h-7 w-7 rounded-full border-2 border-white shadow" style={{ background: c }} aria-label={`Sợi màu ${c}`} />
        ))}
      </div>
      {msg && <Hint tone="bad">{msg}</Hint>}
    </div>
  );
}

const KINDS: Record<Game["kind"], (p: Props) => React.ReactElement> = {
  "dong-ho": DongHo,
  "quan-ho": QuanHo,
  "ngu-than": NguThan,
  "cay-beo": CayBeo,
  "xep-do": XepDo,
  "khuy-bac": KhuyBac,
  xoe: Xoe,
  "cong-chieng": CongChieng,
  det: Det,
};

/** How to play each game, shown when the reader presses Tèo's "Cách chơi" pin. */
export const HOW_TO: Record<Game["kind"], string[]> = {
  "dong-ho": [
    "Bấm một ô màu ở dưới tờ giấy để ấn bản khắc màu đó xuống.",
    "In lần lượt các màu đỏ, vàng, xanh (thứ tự nào cũng được).",
    "Bản đen (than lá tre) phải in sau cùng. In đen sớm là tranh lem, bấm “Lấy tờ giấy mới” để in lại.",
  ],
  "quan-ho": [
    "Đọc câu trong khung xanh: đó là lời người đối diện.",
    "Bấm vào một trong ba cách đáp bên dưới.",
    "Đúng thì bấm “Lượt tiếp →”; sai thì đọc lời nhắc rồi chọn lại.",
  ],
  "ngu-than": [
    "Bấm một mảnh thân áo ở hàng nút phía dưới (nút đổi màu xanh là đang chọn).",
    "Bấm vào đúng chỗ của mảnh ấy trên chiếc áo (chỗ viền nét đứt).",
    "Ghép đủ năm thân thì hàng khuy bên phải hiện ra.",
  ],
  "cay-beo": [
    "Nhìn đồ treo trên đầu mỗi cây sào của từng chiếc ghe.",
    "Bấm một tấm biển ở dưới (ví dụ “Ghe bán khóm”).",
    "Bấm vào chiếc ghe khớp với tấm biển. Coi chừng: có ghe treo mà không bán!",
  ],
  "xep-do": [
    "Bấm vào món đồ để cho vào túi (có 🎒 là đã chọn), bấm lần nữa để bỏ ra.",
    "Chọn đủ những món hợp với một ngày trên ghe.",
    "Bấm “Xong, lên ghe!” để kiểm tra.",
  ],
  "khuy-bac": [
    "Bấm vào đôi khuy trên cùng, sát cổ áo.",
    "Cài lần lượt từ trên xuống, không bỏ sót đôi nào.",
    "Cài đủ thì hàng khuy bạc sáng lên.",
  ],
  xoe: [
    "Bấm “Bắt đầu nghe trống”.",
    "Mỗi khi trống vang (vòng tròn giữa sáng lên), bấm “Bước!” hoặc gõ phím cách.",
    "Đủ số bước đúng nhịp là con đã vào vòng xòe.",
  ],
  "cong-chieng": [
    "Bấm “Nghe nghệ nhân đánh” và lắng nghe từng tiếng chiêng.",
    "Khi thấy chữ “Đến lượt con”, bấm lại các chiếc chiêng đúng thứ tự vừa nghe.",
    "Mỗi lượt dài thêm một tiếng. Lệch thì nghệ nhân đánh lại cho con nghe.",
  ],
  det: [
    "Đọc tên hàng đang dệt (khung vàng nét đứt trên tấm vải).",
    "Bấm vào cuộn sợi có màu đúng ý nghĩa của hàng ấy.",
    "Dệt đủ các hàng là tấm vải hiện ra.",
  ],
};

export function GameBody(p: Props) {
  const C = KINDS[p.game.kind];
  const [fresh, setFresh] = useState(true);
  // until the first touch, the first thing to press glows (elements marked data-hint)
  return (
    <div className={fresh ? "game-fresh" : undefined} onPointerDownCapture={() => setFresh(false)} onKeyDownCapture={() => setFresh(false)}>
      <C {...p} />
    </div>
  );
}
