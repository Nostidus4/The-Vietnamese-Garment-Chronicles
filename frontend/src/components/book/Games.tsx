"use client";

// The small games glued on a chapter's pages. Each one is about how people there make, wear or share something,
// not a trivia quiz: print a Đông Hồ picture, answer a quan họ singer, read the poles at a floating market,
// pack for a day on a boat, fasten silver buttons, step into a xòe circle, play gongs together, weave a band.
// All words come from content (Game.rounds); only the drawings and sounds live here.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Game } from "@/lib/types";
import { YOUNG } from "./Diary";
import { boxOf, currentLayer, DRAW_ORDER, LAYER_NAME, LAYERS, layerOf, PANELS, PLACE, placesAt, tryPlace } from "@/lib/nguThan";
import { createPortal } from "react-dom";

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
            className="flex items-center gap-2 rounded border border-stone-300 bg-white/60 px-2 py-1 text-left text-[0.75rem] text-stone-700 hover:bg-amber-50 disabled:opacity-45"
          >
            <span className="h-4 w-4 shrink-0 rounded-sm border border-black/20" style={{ background: color(i) }} />
            {layers[i].label}
            {on(i) && <span className="ml-auto text-[0.75rem] text-stone-600">#{printed.indexOf(i) + 1}</span>}
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
      <div className="flex items-center gap-1.5 text-[0.75rem] tracking-[0.2em] text-stone-600">
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

/* ---------- 2b · Áo ngũ thân: build the robe from the inside out ---------- */

const PANEL_FILL: Record<string, string> = { "back-left": "#1d3a5c", "back-right": "#1d3a5c", inner: "#a7b8cc", "front-left": "#2F4A6D", "front-right": "#34557d" };

/** A panel's own shape, small, on its button in the tray. */
function PanelThumb({ slot }: { slot: string }) {
  const [x, y, w, h] = boxOf(slot);
  return (
    <svg viewBox={`${x - 2} ${y - 2} ${w + 4} ${h + 4}`} className="h-9 w-7 shrink-0" aria-hidden>
      <path d={PANELS[slot].d} fill={PANEL_FILL[slot]} stroke="#10263f" strokeWidth="1" />
    </svg>
  );
}

/**
 * The robe goes together the way it is worn (#108): the two back panels, the inner panel, then the two front panels
 * that close over it. Only that layer's places are open, so none is ever hidden under another; a panel picked too
 * early says which layer comes first. A panel is dragged onto the robe, or picked and then its place pressed.
 */
function NguThan({ game, onWin }: Props) {
  const reduced = !!useReducedMotion();
  const tray = useMemo(() => shuffle(game.rounds.map((_, i) => i), 4), [game.rounds]);
  const [placed, setPlaced] = useState<string[]>([]); // places filled, in the order they were
  const [sel, setSel] = useState<number | null>(null); // the round (panel) in hand
  const [note, setNote] = useState<{ text: string; good: boolean } | null>(null);
  const [drag, setDrag] = useState<{ i: number; x: number; y: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const start = useRef<{ i: number; x: number; y: number } | null>(null);
  const cur = currentLayer(placed);
  const all = cur === LAYERS.length;
  const slotOf = (i: number) => game.rounds[i].item ?? "";

  /** The panel `i` put down where the places `under` are. */
  const put = (i: number | null, under: string[]) => {
    if (i === null) return setNote({ text: "Chọn một mảnh thân áo ở dưới, hay kéo nó lên áo, trước đã.", good: false });
    const r = game.rounds[i];
    const res = tryPlace(placed, slotOf(i), under);
    if (!res.ok) {
      setNote({
        good: false,
        text:
          res.why === "later"
            ? `“${r.label}” nằm lớp ngoài, ghép sau con ạ. Áo ghép từ trong ra: giờ tới ${LAYER_NAME[cur]}.`
            : `Mảnh “${r.label}” không nằm ở đó đâu con.`,
      });
      return;
    }
    const next = [...placed, slotOf(i)];
    setPlaced(next);
    setSel(null);
    setNote({ text: r.explain ?? "", good: true });
    if (currentLayer(next) === LAYERS.length) setTimeout(onWin, 1800);
  };
  /** Every place under a point of the screen, in the robe's 100×100 box; none when the point is off the robe. */
  const placesUnder = (cx: number, cy: number) => {
    const m = svg.current?.getScreenCTM()?.inverse();
    if (!m) return [];
    const at = new DOMPoint(cx, cy).matrixTransform(m);
    return at.x < 0 || at.y < 0 || at.x > 100 || at.y > 100 ? [] : placesAt(at.x, at.y);
  };

  return (
    <div>
      {/* the three layers, the one being built lit */}
      <ol className="m-0 mb-1.5 flex list-none flex-wrap justify-center gap-1 p-0 text-[0.75rem]">
        {LAYER_NAME.map((name, k) => (
          <li key={name} className={`rounded-full px-2 py-0.5 ${k < cur ? "bg-[#5E7F4A] text-amber-50" : k === cur ? "bg-[#27354f] text-amber-50" : "border border-stone-400 text-stone-600"}`}>
            {k + 1} · {name} {k < cur ? "✓" : ""}
          </li>
        ))}
      </ol>
      <svg
        ref={svg}
        viewBox="0 0 100 100"
        className="mx-auto block w-[58%] touch-none"
        role="group"
        aria-label={`Chiếc áo ngũ thân đang ghép: ${all ? "đã đủ năm thân" : `đang ghép ${LAYER_NAME[cur]}`}`}
        onClick={(e) => {
          const under = placesUnder(e.clientX, e.clientY);
          if (under.some((slot) => layerOf(slot) === cur && !placed.includes(slot))) put(sel, under);
        }}
      >
        <path d="M34 18 L8 40 L14 48 L30 34 Z M66 18 L92 40 L86 48 L70 34 Z" fill={all ? "#2F4A6D" : "#d9ceb6"} stroke="#8a7a5c" strokeWidth=".5" />
        <path d="M42 10 Q50 7 58 10 L58 15 Q50 12 42 15 Z" fill={all ? "#1d3a5c" : "#d9ceb6"} stroke="#8a7a5c" strokeWidth=".5" />
        {/* the layers still to come: a faint outline, not a place to press */}
        {DRAW_ORDER.filter((slot) => layerOf(slot) > cur).map((slot) => (
          <path key={`later-${slot}`} d={PANELS[slot].d} fill="none" stroke="#8a7a5c" strokeWidth=".4" strokeDasharray="1 1.5" opacity=".45" pointerEvents="none" />
        ))}
        {DRAW_ORDER.filter((slot) => layerOf(slot) <= cur).map((slot) =>
          placed.includes(slot) ? (
            <motion.path
              key={slot}
              d={PANELS[slot].d}
              fill={PANEL_FILL[slot]}
              stroke="#10263f"
              strokeWidth=".6"
              pointerEvents="none"
              initial={reduced ? false : { opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ transformOrigin: "50% 50%" }}
            />
          ) : (
            <path
              key={slot}
              d={PANELS[slot].d}
              role="button"
              tabIndex={0}
              aria-label={PLACE[slot]}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                put(sel, [slot]);
              }}
              className={`cursor-pointer focus:outline-none focus-visible:stroke-[#b4462f] ${sel !== null || drag ? "ngu-than-open" : ""}`}
              fill="rgba(255,255,255,0.45)"
              stroke="#8a4b2a"
              strokeWidth=".7"
              strokeDasharray="2 1.5"
            />
          ),
        )}
        {all && [34, 44, 54, 64, 74].map((y) => <circle key={y} cx={y < 40 ? 58 : 62 + (y - 44) * 0.12} cy={y} r="1.4" fill="#e8d9a8" />)}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {tray
          .filter((i) => !placed.includes(slotOf(i)))
          .map((i) => (
            <button
              key={i}
              type="button"
              data-hint
              aria-pressed={sel === i}
              // a press picks the panel; a press that moves drags it onto the robe
              onPointerDown={(e) => {
                start.current = { i, x: e.clientX, y: e.clientY };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const st = start.current;
                if (!st || (!drag && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 6)) return;
                setDrag({ i: st.i, x: e.clientX, y: e.clientY });
              }}
              onPointerUp={(e) => {
                const st = start.current;
                start.current = null;
                if (!st) return;
                if (drag) {
                  setDrag(null);
                  const under = placesUnder(e.clientX, e.clientY);
                  if (under.length) put(st.i, under);
                } else setSel((v) => (v === st.i ? null : st.i));
              }}
              onPointerCancel={() => {
                start.current = null;
                setDrag(null);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setSel((v) => (v === i ? null : i));
              }}
              className={`flex touch-none items-center gap-1.5 rounded-md border px-1.5 py-1 text-left text-[0.75rem] leading-tight ${sel === i ? "border-[#27354f] bg-[#27354f] text-amber-50" : "border-stone-400 bg-white/70 hover:bg-amber-50"}`}
            >
              <PanelThumb slot={slotOf(i)} />
              <span className="max-w-[6.5rem]">{game.rounds[i].label}</span>
            </button>
          ))}
      </div>
      {/* a narrow, centred line: across the whole page its end ran under Tèo's note at the page's lower right (re-review 10-08) */}
      <p className="m-0 mx-auto mt-1 max-w-[22rem] text-center text-[0.75rem] text-stone-600">
        Đã ghép {placed.length}/{game.rounds.length} thân · kéo mảnh lên áo, hay chọn mảnh rồi bấm vào chỗ nét đứt
      </p>
      {note && <Hint tone={note.good ? "good" : "bad"}>{note.text}</Hint>}
      {/* the panel following the pointer; on the page body, as the book's pages are transformed */}
      {drag &&
        createPortal(
          <div className="pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" style={{ left: drag.x, top: drag.y }} aria-hidden>
            <PanelThumb slot={slotOf(drag.i)} />
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ---------- 2c · Bữa cơm ra mắt: a seat at the tray, then a cup falls ---------- */

// where the family sits around the tray (left %, top %), and the dishes on it; Bà sits at the bottom
const SEATS = [
  { x: 50, y: 7 },
  { x: 8, y: 50 },
  { x: 92, y: 50 },
];
const DISHES = [
  { x: 36, y: 36, c: "#9a5a2a" },
  { x: 64, y: 36, c: "#d0724a" },
  { x: 36, y: 62, c: "#6f8f4a" },
  { x: 64, y: 62, c: "#c9a24a" },
];

/**
 * Bà's first meal with his mother, played at the tray instead of answered as a quiz (#108 follow-up): invite the
 * family to eat, eldest first; taste each dish a little; then the cup slips. The rounds give the words: round 0 the
 * people in the order they are invited, round 1 the dishes, round 2 the choice when the cup falls.
 */
function MamCom({ game, onWin }: Props) {
  const reduced = !!useReducedMotion();
  const [moi, tasting, cup] = game.rounds;
  const [step, setStep] = useState(0); // 0 invite · 1 taste · 2 the cup · 3 done
  const [invited, setInvited] = useState(0); // how many, in order
  const [tasted, setTasted] = useState<number[]>([]);
  const [fell, setFell] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState<{ text: string; tone: "good" | "bad" | "neutral" } | null>(null);
  const order = useMemo(() => shuffle(cup.choices.map((_, i) => i), 5), [cup.choices]);

  // the cup slips a moment after the last dish, by itself: the reader only chooses what Bà does next
  useEffect(() => {
    if (step !== 2 || fell) return;
    const t = setTimeout(() => {
      setFell(true);
      setNote(null); // the praise for the dishes makes room for what happens next
    }, reduced ? 0 : 900);
    return () => clearTimeout(t);
  }, [step, fell, reduced]);

  const invite = (k: number) => {
    if (step !== 0 || k < invited) return;
    if (k !== invited) return setNote({ tone: "bad", text: "Mời người lớn nhất trước con ạ." });
    const n = invited + 1;
    setInvited(n);
    if (n === moi.choices.length) {
      setNote({ tone: "good", text: moi.explain ?? "" });
      setStep(1);
    } else setNote({ tone: "neutral", text: `“Mời ${moi.choices[k].split(" ")[0].toLowerCase()} ăn cơm.”` }); // "Mẹ anh" → "Mời mẹ…"
  };
  const taste = (k: number) => {
    if (step !== 1) return;
    if (tasted.includes(k)) return setNote({ tone: "bad", text: "Mỗi món một chút thôi, để phần cả nhà con ạ." });
    const n = [...tasted, k];
    setTasted(n);
    if (n.length === tasting.choices.length) {
      setNote({ tone: "good", text: `${tasting.item ?? ""} ${tasting.explain ?? ""}`.trim() });
      setStep(2);
    } else setNote({ tone: "neutral", text: `Bà nếm một chút ${tasting.choices[k].toLowerCase()}.` });
  };
  const react = (k: number) => {
    setPicked(k);
    if (k !== cup.answer) return setNote({ tone: "bad", text: "Bà mà làm vậy thì cả nhà buồn lắm. Con thử cách khác nhé." });
    setNote({ tone: "good", text: cup.explain ?? "" });
    setStep(3);
    setTimeout(onWin, 2200);
  };

  const phase = [moi.label, tasting.label, cup.label];
  return (
    <div>
      <ol className="m-0 mb-1.5 flex list-none flex-wrap justify-center gap-1 p-0 text-[0.75rem]">
        {phase.map((name, k) => (
          <li key={k} className={`rounded-full px-2 py-0.5 ${k < step ? "bg-[#5E7F4A] text-amber-50" : k === step ? "bg-[#27354f] text-amber-50" : "border border-stone-400 text-stone-600"}`}>
            {k + 1} · {name} {k < step ? "✓" : ""}
          </li>
        ))}
      </ol>
      <p className="font-hand m-0 mb-1 text-center text-[0.95rem] leading-snug" style={{ color: YOUNG }}>
        {[moi, tasting, cup, cup][step].prompt}
      </p>

      {/* the tray seen from above, the family around it */}
      <div className={`relative mx-auto mt-4 aspect-square transition-[width] ${step >= 2 ? "w-[min(11rem,52%)]" : "w-[min(15rem,70%)]"}`}>
        <div className="absolute inset-[16%] rounded-full border-4 border-[#5b3a22] bg-[radial-gradient(circle_at_40%_35%,#b07a45,#7a4a26)] shadow-[0_6px_14px_rgba(40,20,0,0.35)]" aria-hidden />
        {/* the rice pot in the middle */}
        <div className="absolute left-1/2 top-1/2 h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#3b2615] bg-[#f3ead7]" aria-hidden />
        {tasting.choices.map((d, k) => (
          <motion.button
            key={d}
            type="button"
            data-hint={step === 1 || undefined}
            disabled={step !== 1}
            onClick={() => taste(k)}
            aria-label={`${d}${tasted.includes(k) ? ", đã nếm" : ""}`}
            title={d}
            className="absolute grid h-[17%] w-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#2F4A6D] bg-[#f6efe0] disabled:cursor-default"
            style={{ left: `${DISHES[k].x}%`, top: `${DISHES[k].y}%` }}
            animate={tasted.includes(k) && !reduced ? { scale: [1, 0.9, 1] } : undefined}
          >
            <span className="h-[62%] w-[62%] rounded-full" style={{ background: DISHES[k].c, opacity: tasted.includes(k) ? 0.55 : 1 }} aria-hidden />
          </motion.button>
        ))}
        {moi.choices.map((who, k) => (
          <button
            key={who}
            type="button"
            data-hint={(step === 0 && k === 0) || undefined}
            disabled={step !== 0 || k < invited}
            onClick={() => invite(k)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center disabled:cursor-default"
            style={{ left: `${SEATS[k].x}%`, top: `${SEATS[k].y}%` }}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-full border-2 text-[0.95rem] ${k < invited ? "border-[#5E7F4A] bg-[#e7efdc]" : "border-[#8a4b2a] bg-[#f6efe0]"}`} aria-hidden>
              {k === 0 ? "👵" : k === 1 ? "👨" : "👧"}
            </span>
            <span className="mt-0.5 whitespace-nowrap rounded bg-white/75 px-1 text-[0.75rem] leading-tight text-[#27354f]">
              {who}
              {k < invited ? " ✓" : ""}
            </span>
          </button>
        ))}
        {/* Bà's seat and her cup */}
        <div className="absolute bottom-[1%] left-1/2 flex -translate-x-1/2 flex-col items-center" aria-hidden>
          <motion.span
            className="block h-4 w-6 rounded-b-full border-2 border-[#2F4A6D] bg-[#f6efe0]"
            animate={fell && step < 3 && !reduced ? { y: 14, rotate: 70, opacity: 0.8 } : { y: 0, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 12 }}
          />
          <span className="mt-0.5 rounded bg-white/75 px-1 text-[0.75rem] text-[#27354f]">Bà</span>
        </div>
      </div>

      <p className="m-0 mt-1 text-center text-[0.75rem] text-stone-600">
        {step === 0 && `Bấm mời từng người · đã mời ${invited}/${moi.choices.length}`}
        {step === 1 && `Bấm vào từng đĩa để nếm · đã nếm ${tasted.length}/${tasting.choices.length}`}
        {step >= 2 && (fell ? "Bà làm gì đây?" : "…")}
      </p>
      {step >= 2 && fell && (
        <div className="mt-1 flex flex-col gap-0.5">
          {order.map((k) => (
            <button
              key={k}
              type="button"
              disabled={step === 3}
              onClick={() => react(k)}
              className={`rounded border px-2 py-0.5 text-left text-[0.78rem] leading-snug ${picked === k ? (k === cup.answer ? "border-[#5E7F4A] bg-[#e7efdc]" : "border-[#B5452E] bg-[#f7e0d8]") : "border-stone-400 bg-white/70 hover:bg-amber-50"}`}
            >
              {cup.choices[k]}
            </button>
          ))}
        </div>
      )}
      {note && <Hint tone={note.tone}>{note.text}</Hint>}
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
              className="flex min-w-0 flex-col items-center"
              aria-label={`Ghe treo ${rest.join(" ")}`}
            >
              <span className="text-[1.4rem] leading-none">{icon}</span>
              <span className="h-10 w-[2px] bg-[#6b4a2f]" />
              <span className="h-4 w-full rounded-b-[60%] bg-[#6b4a2f]" />
              <span className="mt-0.5 min-h-[1.8em] text-center text-[0.75rem] leading-tight text-amber-50">
                {placed.includes(b) ? game.rounds[b].label : rest.join(" ")}
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="m-0 mt-2 text-[0.75rem] text-stone-600">Chọn một tấm biển, rồi bấm vào chiếc ghe:</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {signs
          .filter((s) => !placed.includes(s))
          .map((s) => (
            <button
              key={s}
              type="button"
              data-hint
              onClick={() => setSel(s)}
              className={`rounded border px-2 py-0.5 text-[0.75rem] ${sel === s ? "border-[#27354f] bg-[#27354f] text-amber-50" : "border-stone-400 bg-white/70 hover:bg-amber-50"}`}
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
            className={`rounded border px-2 py-1 text-left text-[0.75rem] ${bag.includes(i) ? "border-[#27354f] bg-[#27354f]/10" : "border-stone-300 bg-white/60 hover:bg-amber-50"}`}
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
      <p className="m-0 mt-1 text-center text-[0.75rem] text-stone-600">
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
      <p className="m-0 mt-1 text-[0.75rem] text-stone-600">
        {hits}/{need} bước đúng nhịp<span className="[@media(pointer:coarse)]:hidden"> · phím cách cũng được</span>
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
      <p className="m-0 mt-2 text-[0.75rem] text-stone-600">
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
        <p className="m-0 mt-2 text-[0.75rem] text-stone-600">
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
  "mam-com": MamCom,
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
    "Áo ghép từ trong ra như khi mặc: hai thân sau trước, rồi thân con, rồi hai thân trước khép lại.",
    "Kéo một mảnh ở dưới lên đúng chỗ trên áo, hoặc bấm chọn mảnh rồi bấm vào chỗ viền nét đứt.",
    "Ghép đủ năm thân thì hàng khuy bên phải hiện ra.",
  ],
  "mam-com": [
    "Mời cơm: bấm vào từng người quanh mâm, người lớn nhất trước.",
    "Nếm mỗi món: bấm vào từng đĩa một lần, món nào cũng một chút.",
    "Khi chén rơi, chọn điều Bà nên làm.",
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
