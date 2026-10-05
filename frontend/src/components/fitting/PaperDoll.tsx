"use client";

// Bà's paper doll: a girl drawn in ink and a light wash, dressed in layers. Each piece of the wardrobe has an "art"
// key; until painted layers exist (wardrobe.json "layers"), the piece is drawn here, on the same 200×400 frame, so
// every layer lines up by construction and a colour change is instant. Layer order, back to front:
// legs → body → feet → set (bottom, then top with sleeves) → waist → neck → chest → hands → hand item → head → face → head item.

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { forwardRef, useLayoutEffect, useRef, type ReactNode } from "react";
import type { WardrobeSlot } from "@/lib/types";

export type Dress = Partial<Record<WardrobeSlot, string>>; // slot → art key
export type DollColors = { main: string; second: string; yem?: string };

const INK = "#2b2118";
const SKIN = "#efcfae";
const SKIN_SHADE = "#e2b892";
const HAIR = "#2b2118";
const line = { stroke: INK, strokeWidth: 1.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Whole doll, in an <svg> the room can also turn into the picture on the card. */
export const PaperDoll = forwardRef<SVGSVGElement, { dress: Dress; colors: DollColors; className?: string; title?: string; still?: boolean }>(function PaperDoll(
  { dress, colors, className, title, still = false },
  ref,
) {
  const reduced = !!useReducedMotion();
  // still: no animation at all, for the picture on the card (a piece still flying off must not end up on it)
  const layer = (slot: WardrobeSlot, node: ReactNode) =>
    still ? (dress[slot] ? <g>{node}</g> : null) : (
    <AnimatePresence mode="popLayout" initial={false}>
      {dress[slot] && (
        <motion.g
          key={`${slot}-${dress[slot]}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -14, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={reduced ? { duration: 0.12 } : { type: "spring", stiffness: 220, damping: 18 }}
          style={{ transformOrigin: "100px 200px" }}
        >
          {node}
        </motion.g>
      )}
    </AnimatePresence>
    );
  const a = (slot: WardrobeSlot) => ART[dress[slot] ?? ""]?.(colors) ?? null;
  return (
    <svg ref={ref} viewBox="0 0 200 400" className={className} role="img" aria-label={title ?? "Búp bê giấy"} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* a faint paper grain over the colours, like a watercolour wash */}
        <filter id="wash" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.16 0" result="grain" />
          <feComposite in="grain" in2="SourceGraphic" operator="in" result="g" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="g" />
          </feMerge>
        </filter>
        <pattern id="ran" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f3ead7" />
          <rect width="3" height="3" fill={INK} />
          <rect x="3" y="3" width="3" height="3" fill={INK} />
        </pattern>
      </defs>
      {/* the shadow on the floor */}
      <ellipse cx="100" cy="380" rx="44" ry="6" fill="#2b2118" opacity="0.12" />
      <g filter="url(#wash)">
        <Legs />
        <Body />
        {layer("feet", a("feet"))}
        {!dress.feet && <BareFeet />}
        {layer("set", a("set"))}
        {layer("waist", a("waist"))}
        {layer("neck", a("neck"))}
        {layer("chest", a("chest"))}
        <Hands />
        {layer("hand", a("hand"))}
        <Head />
        {layer("face", a("face"))}
        {layer("head", a("head"))}
      </g>
    </svg>
  );
});

/* ---------- the girl ---------- */

function Legs() {
  return (
    <g>
      <path d="M86 230 L88 368 L97 368 L99 232 Z" fill={SKIN} {...line} />
      <path d="M101 232 L103 368 L112 368 L114 230 Z" fill={SKIN} {...line} />
    </g>
  );
}
function Body() {
  return (
    <g>
      {/* arms */}
      <path d="M75 101 Q64 150 59 220 L68 222 Q73 160 84 118 Z" fill={SKIN} {...line} />
      <path d="M125 101 Q136 150 141 220 L132 222 Q127 160 116 118 Z" fill={SKIN} {...line} />
      {/* neck and a plain cream undershirt */}
      <path d="M93 76 L93 90 L107 90 L107 76 Z" fill={SKIN} {...line} />
      <path d="M75 101 Q86 90 93 89 L107 89 Q114 90 125 101 L118 172 Q100 178 82 172 Z" fill="#f6ecd9" {...line} />
      <path d="M82 172 Q100 178 118 172 L120 236 Q100 242 80 236 Z" fill="#f6ecd9" {...line} />
    </g>
  );
}
function BareFeet() {
  return (
    <g>
      <ellipse cx="91" cy="370" rx="8" ry="4" fill={SKIN} {...line} />
      <ellipse cx="109" cy="370" rx="8" ry="4" fill={SKIN} {...line} />
    </g>
  );
}
function Hands() {
  return (
    <g>
      <ellipse cx="63" cy="226" rx="6" ry="7" fill={SKIN} {...line} />
      <ellipse cx="137" cy="226" rx="6" ry="7" fill={SKIN} {...line} />
    </g>
  );
}
function Head() {
  return (
    <g>
      {/* hair behind, with a low bun */}
      <circle cx="100" cy="33" r="9" fill={HAIR} {...line} />
      <path d="M78 58 Q76 30 100 29 Q124 30 122 58 Q118 46 100 44 Q82 46 78 58 Z" fill={HAIR} {...line} />
      <ellipse cx="100" cy="56" rx="20" ry="23" fill={SKIN} {...line} />
      <path d="M80 54 Q82 34 100 33 Q118 34 120 54 Q113 42 101 40 Q92 44 80 54 Z" fill={HAIR} {...line} />
      {/* a quiet face */}
      <path d="M90 58 q3 -2 6 0" fill="none" {...line} strokeWidth={1.2} />
      <path d="M104 58 q3 -2 6 0" fill="none" {...line} strokeWidth={1.2} />
      <path d="M95 68 q5 4 10 0" fill="none" stroke="#b5452e" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="88" cy="64" r="3" fill="#e8a1a1" opacity="0.45" />
      <circle cx="112" cy="64" r="3" fill="#e8a1a1" opacity="0.45" />
      <path d="M86 77 Q100 82 114 77" fill="none" stroke={SKIN_SHADE} strokeWidth={1} />
    </g>
  );
}

/* ---------- the wardrobe, drawn ---------- */

const shade = (hex: string) => mix(hex, "#2b2118", 0.18);
function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** Long sleeves over the arms, to the wrist. */
const Sleeves = ({ fill, wide = 0 }: { fill: string; wide?: number }) => (
  <g>
    <path d={`M75 100 Q${63 - wide} 150 ${57 - wide} 214 L${70 + wide} 216 Q74 160 85 116 Z`} fill={fill} {...line} />
    <path d={`M125 100 Q${137 + wide} 150 ${143 + wide} 214 L${130 - wide} 216 Q126 160 115 116 Z`} fill={fill} {...line} />
  </g>
);
const StandingCollar = ({ fill }: { fill: string }) => <path d="M91 80 L91 91 Q100 94 109 91 L109 80 Q100 83 91 80 Z" fill={fill} {...line} />;
const SideButtons = () => (
  <g fill={INK}>
    {[0, 1, 2, 3].map((i) => (
      <circle key={i} cx={109 + i * 4} cy={92 + i * 4} r="1.2" />
    ))}
  </g>
);

const ART: Record<string, (c: DollColors) => ReactNode> = {
  /* bộ áo */
  "ao-dai": ({ main, second }) => (
    <g>
      {/* wide trousers to the ankle */}
      <path d="M82 170 L118 170 L127 366 L104 366 L100 240 L96 366 L73 366 Z" fill={second} {...line} />
      {/* back flap peeking at the sides, then the fitted top and the front flap */}
      <path d="M80 172 L120 172 L126 344 L74 344 Z" fill={shade(main)} {...line} />
      <path d="M75 100 Q86 89 92 88 L108 88 Q114 89 125 100 L119 172 Q100 177 81 172 Z" fill={main} {...line} />
      <path d="M83 170 Q100 175 117 170 L121 346 L79 346 Z" fill={main} {...line} />
      <path d="M100 176 L100 344" stroke={shade(main)} strokeWidth="0.8" opacity="0.5" />
      <Sleeves fill={main} />
      <StandingCollar fill={main} />
      <SideButtons />
    </g>
  ),
  "ao-ngu-than": ({ main, second }) => (
    <g>
      <path d="M82 230 L118 230 L126 366 L104 366 L100 290 L96 366 L74 366 Z" fill={second} {...line} />
      {/* a looser robe with five panels: a straight cut, wider at the hem */}
      <path d="M75 100 Q86 89 92 88 L108 88 Q114 89 125 100 L131 312 Q100 318 69 312 Z" fill={main} {...line} />
      <path d="M88 100 L84 312 M112 100 L116 312" stroke={shade(main)} strokeWidth="0.9" opacity="0.55" fill="none" />
      <path d="M100 94 L100 314" stroke={shade(main)} strokeWidth="0.9" opacity="0.4" />
      <Sleeves fill={main} wide={3} />
      <StandingCollar fill={main} />
      <SideButtons />
    </g>
  ),
  "ao-tu-than": ({ main, second, yem }) => (
    <g>
      {/* a long dark skirt, the yếm, then the open four-panel coat and the sash */}
      <path d="M83 168 L117 168 L131 370 L69 370 Z" fill={second} {...line} />
      <path d="M90 92 L110 92 L114 158 L86 158 Z" fill={yem ?? "#eed9b5"} {...line} />
      <path d="M90 92 L84 84 M110 92 L116 84" stroke={INK} strokeWidth="1" />
      <path d="M75 100 Q84 90 91 88 L95 168 L90 342 L70 342 L73 170 Z" fill={main} {...line} />
      <path d="M125 100 Q116 90 109 88 L105 168 L110 342 L130 342 L127 170 Z" fill={main} {...line} />
      <Sleeves fill={main} />
      <path d="M83 164 L117 164 L118 175 L82 175 Z" fill="#5e7f4a" {...line} />
      <path d="M96 175 L92 232 L98 230 L100 176 Z M104 175 L108 232 L102 230 L100 176 Z" fill="#5e7f4a" {...line} />
    </g>
  ),
  "ao-ba-ba": ({ main, second }) => (
    <g>
      <path d="M82 196 L118 196 L128 366 L104 366 L100 260 L96 366 L72 366 Z" fill={second} {...line} />
      {/* short to the hip, slit at the sides, a round neck and buttons down the middle */}
      <path d="M75 100 Q88 92 92 92 Q100 99 108 92 Q112 92 125 100 L122 214 L112 214 L113 200 L87 200 L88 214 L78 214 Z" fill={main} {...line} />
      <path d="M100 99 L100 200" stroke={shade(main)} strokeWidth="0.9" />
      <g fill={mix(main, "#ffffff", 0.6)} stroke={INK} strokeWidth="0.6">
        {[110, 128, 146, 164, 182].map((y) => (
          <circle key={y} cx="100" cy={y} r="1.6" />
        ))}
      </g>
      <path d="M84 168 L94 168 L94 180 L84 180 Z M106 168 L116 168 L116 180 L106 180 Z" fill="none" stroke={shade(main)} strokeWidth="0.9" />
      <Sleeves fill={main} wide={2} />
    </g>
  ),

  "ao-com": ({ main, second }) => (
    <g>
      {/* the Thái woman's dress: a long tube skirt (váy ống) to the ankle, a green sash, and the short áo cóm hugging
          the body to the waist, its row of silver butterfly buttons down the front (#76) */}
      <path d="M80 150 L120 150 L126 370 L74 370 Z" fill={second} {...line} />
      <path d="M77 340 L123 340 L124 352 L76 352 Z" fill={mix(second, "#b5452e", 0.55)} opacity="0.85" />
      <path d="M79 146 L121 146 L122 160 L78 160 Z" fill="#5e7f4a" {...line} />
      <path d="M76 100 Q86 89 92 88 L108 88 Q114 89 124 100 L121 150 Q100 154 79 150 Z" fill={main} {...line} />
      <path d="M100 92 L100 150" stroke={shade(main)} strokeWidth="0.9" />
      <g fill="#d9d9d9" stroke={INK} strokeWidth="0.5">
        {[100, 110, 120, 130, 140].map((y) => (
          <path key={y} d={`M96 ${y} l-3 -2.5 l0 5 z M104 ${y} l3 -2.5 l0 5 z`} />
        ))}
      </g>
      <Sleeves fill={main} />
      <path d="M90 84 Q100 92 110 84" fill="none" stroke={shade(main)} strokeWidth="1.2" />
    </g>
  ),
  "tho-cam-e-de": ({ main, second }) => (
    <g>
      {/* Ê Đê thổ cẩm: a black wrap skirt and a black top, both crossed by woven bands of red, yellow and blue (#76) */}
      <path d="M80 190 L120 190 L127 370 L73 370 Z" fill={main} {...line} />
      {[300, 322, 344].map((y, i) => (
        // the skirt widens from 40 at y 190 to 54 at the hem: each band follows its edges
        <rect key={y} x={80 - (y - 190) * 0.039} y={y} width={40 + (y - 190) * 0.078} height="9" fill={[second, "#d9a43b", "#3f6f9a"][i]} opacity="0.9" />
      ))}
      <path d="M76 100 Q86 90 92 89 L108 89 Q114 90 124 100 L121 196 Q100 201 79 196 Z" fill={main} {...line} />
      <rect x="80" y="176" width="40" height="10" fill={second} opacity="0.9" />
      <rect x="81" y="168" width="38" height="4" fill="#d9a43b" opacity="0.9" />
      <Sleeves fill={main} />
      <path d="M58 200 L70 202 L69 208 L57.5 206 Z M142 200 L130 202 L131 208 L142.5 206 Z" fill={second} opacity="0.9" />
      <path d="M90 90 Q100 98 110 90" fill="none" stroke={second} strokeWidth="2" />
    </g>
  ),

  /* khăn và nón */
  "non-la": () => (
    <g>
      <path d="M100 4 L150 42 Q100 50 50 42 Z" fill="#e7cf8f" {...line} />
      {[14, 24, 34].map((y, i) => (
        <path key={y} d={`M${100 - (y - 4) * 1.32} ${y} Q100 ${y + 3} ${100 + (y - 4) * 1.32} ${y}`} fill="none" stroke="#b08a45" strokeWidth="0.9" opacity={0.8 - i * 0.1} />
      ))}
      <path d="M84 44 Q86 72 92 80 M116 44 Q114 72 108 80" fill="none" stroke="#b5452e" strokeWidth="1" />
    </g>
  ),
  "non-quai-thao": () => (
    <g>
      <ellipse cx="100" cy="36" rx="54" ry="10" fill="#d9b977" {...line} />
      <ellipse cx="100" cy="33" rx="26" ry="5" fill="#e7cf8f" {...line} />
      {/* the silk fringes hanging from both sides */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${100 + s * 40} 42 Q${100 + s * 44} 70 ${100 + s * 40} 96`} fill="none" stroke="#b5452e" strokeWidth="2" />
          <path d={`M${100 + s * 44} 42 Q${100 + s * 48} 72 ${100 + s * 45} 100`} fill="none" stroke="#5e7f4a" strokeWidth="2" />
        </g>
      ))}
    </g>
  ),
  "khan-van": () => (
    <g>
      <path d="M78 46 Q78 26 100 24 Q122 26 122 46 Q112 38 100 38 Q88 38 78 46 Z" fill="#3a2a22" {...line} />
      <path d="M80 40 Q100 30 120 40" fill="none" stroke="#6b5040" strokeWidth="1" />
    </g>
  ),
  "khan-mo-qua": () => (
    <g>
      {/* a black headscarf whose two ends meet in a point over the forehead, like a crow's beak */}
      <path d="M76 60 Q72 26 100 22 Q128 26 124 60 Q118 44 108 40 L100 30 L92 40 Q82 44 76 60 Z" fill="#1f1f1f" {...line} />
      <path d="M100 30 L96 18 L104 18 Z" fill="#1f1f1f" {...line} />
    </g>
  ),
  "khan-ran": () => (
    <g>
      <path d="M86 84 Q100 96 114 84 L116 94 Q100 106 84 94 Z" fill="url(#ran)" {...line} />
      <path d="M108 96 L120 130 L112 132 L102 100 Z" fill="url(#ran)" {...line} />
    </g>
  ),
  "khan-pieu": () => (
    <g>
      {/* the black piêu folded over the hair, its two embroidered ends falling at the sides */}
      <path d="M78 48 Q78 26 100 24 Q122 26 122 48 Q112 38 100 38 Q88 38 78 48 Z" fill="#1f1f1f" {...line} />
      <path d="M78 44 L70 66 L78 68 L84 46 Z M122 44 L130 66 L122 68 L116 46 Z" fill="#1f1f1f" {...line} />
      <path d="M71 62 L78 64 M129 62 L122 64" stroke="#b5452e" strokeWidth="2" />
      <path d="M72 58 L79 60 M128 58 L121 60" stroke="#d9a43b" strokeWidth="1.5" />
    </g>
  ),
  "mu-canh-chuon": () => (
    <g>
      <path d="M80 44 Q80 22 100 20 Q120 22 120 44 Z" fill="#1f1f1f" {...line} />
      <ellipse cx="62" cy="36" rx="18" ry="5" fill="#1f1f1f" {...line} />
      <ellipse cx="138" cy="36" rx="18" ry="5" fill="#1f1f1f" {...line} />
    </g>
  ),

  /* phụ kiện */
  "quat-giay": () => (
    <g>
      <path d="M137 226 L120 196 A34 34 0 0 1 158 192 Z" fill="#f3ead7" {...line} />
      {[0.15, 0.35, 0.55, 0.75].map((t) => (
        <path key={t} d={`M137 226 L${120 + 38 * t} ${196 - 8 * Math.sin(t * Math.PI)}`} stroke="#b5452e" strokeWidth="0.8" />
      ))}
    </g>
  ),
  "tui-tote": () => (
    <g>
      <path d="M134 222 L146 222 M134 222 Q140 210 146 222" fill="none" {...line} />
      <path d="M128 226 L152 226 L154 258 L126 258 Z" fill="#e9dcc0" {...line} />
    </g>
  ),
  "kinh-mat": () => (
    <g>
      <circle cx="92" cy="58" r="6" fill="#2b2118" opacity="0.85" />
      <circle cx="108" cy="58" r="6" fill="#2b2118" opacity="0.85" />
      <path d="M98 58 L102 58" stroke={INK} strokeWidth="1.4" />
    </g>
  ),

  /* giày dép */
  "guoc-moc": () => (
    <g>
      <path d="M82 370 L100 370 L99 377 L83 377 Z M100 370 L118 370 L117 377 L101 377 Z" fill="#8b5a2b" {...line} />
      <path d="M85 368 Q91 362 97 368 M103 368 Q109 362 115 368" fill="none" stroke="#b5452e" strokeWidth="2.2" />
    </g>
  ),
  "hai-vai": () => (
    <g>
      <path d="M82 366 Q90 362 98 366 L98 374 L80 374 Q78 368 82 366 Z" fill="#b5452e" {...line} />
      <path d="M102 366 Q110 362 118 366 Q122 368 120 374 L102 374 Z" fill="#b5452e" {...line} />
      <circle cx="89" cy="369" r="1.4" fill="#e3b04b" />
      <circle cx="111" cy="369" r="1.4" fill="#e3b04b" />
    </g>
  ),
  sneakers: () => (
    <g>
      <path d="M80 364 L98 364 L99 376 L79 376 Z M102 364 L120 364 L121 376 L101 376 Z" fill="#fbf6ea" {...line} />
      <path d="M80 373 L99 373 M101 373 L121 373" stroke={INK} strokeWidth="1" />
    </g>
  ),

  /* Compass traps */
  obi: () => (
    <g>
      <path d="M80 158 L120 158 L120 184 L80 184 Z" fill="#b5452e" {...line} />
      <path d="M80 166 L120 166 M80 176 L120 176" stroke="#e3b04b" strokeWidth="1.2" />
    </g>
  ),
  "no-jeogori": () => (
    <g>
      <path d="M100 110 Q88 100 86 112 Q90 120 100 112 Q110 120 114 112 Q112 100 100 110 Z" fill="#e88a9a" {...line} />
      <path d="M100 112 L94 160 M100 112 L106 162" stroke="#e88a9a" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
};

/**
 * One piece as the wardrobe's thumbnail, drawn by the same hand as the doll and cropped to the piece: emoji showed a
 * hijab for the khăn mỏ quạ and a top hat for the mũ cánh chuồn (#62).
 */
export function ArtThumb({ art, className }: { art: string; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const piece = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const b = piece.current?.getBBox();
    if (b && b.width && b.height) svg.current?.setAttribute("viewBox", `${b.x - 4} ${b.y - 4} ${b.width + 8} ${b.height + 8}`);
  }, [art]);
  return (
    <svg ref={svg} viewBox="0 0 200 400" className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="ran" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f3ead7" />
          <rect width="3" height="3" fill={INK} />
          <rect x="3" y="3" width="3" height="3" fill={INK} />
        </pattern>
      </defs>
      <g ref={piece}>{ART[art]?.({ main: "#7ec8e3", second: "#27354f" })}</g>
    </svg>
  );
}

/** Art keys this doll can draw (the room greys out anything else). */
export const DRAWN = new Set(Object.keys(ART));
