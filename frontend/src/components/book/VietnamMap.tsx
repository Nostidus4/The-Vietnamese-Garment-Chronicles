"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  CHAPTER_FILL,
  CHAPTER_LINES,
  CHAPTER_OUTLINE,
  FOCUS,
  ISLANDS,
  ISLETS,
  LABEL_AT,
  MAP_H,
  MAP_W,
  PROJ,
  PROVINCE_LINES,
} from "./vietnam-geo";

// Real province geometry, folded into the book's chapters. Regenerate with `node scripts/build-map.mjs`.
// Hoàng Sa, Trường Sa and the islands are always drawn and labelled.
export const CHAPTERS = [
  { id: "tay-bac", label: "Tây Bắc", tint: "#E3D6BC" },
  { id: "bac-bo", label: "Bắc Bộ", tint: "#EFCDB6" }, // soft red of hội xuân
  { id: "hue", label: "Miền Trung", tint: "#DCCFE4" }, // tím Huế
  { id: "tay-nguyen", label: "Tây Nguyên", tint: "#E3D6BC" },
  { id: "nam-bo", label: "Nam Bộ", tint: "#D6E3BD" }, // rice-field green
];

const INK = "#5b4636";
const GOLD = "#D9A43B";
const EASE = [0.65, 0, 0.35, 1] as const;
const FULL: [number, number, number, number] = [0, 0, MAP_W, MAP_H];

export const project = (lon: number, lat: number): [number, number] => [
  (lon - PROJ.lon0) * PROJ.cos * PROJ.k,
  (PROJ.lat1 - lat) * PROJ.k,
];

export function VietnamMap({
  ink = "draw",
  active,
  locked,
  onHover,
  onSelect,
  focus = null,
  landmarks = [],
  hotProvince = null,
  onProvinceHover,
  onBack,
}: {
  ink?: "draw" | "wait" | "static"; // draw: ink outlines in on mount · wait: hidden until switched to draw · static: already inked
  active: string | null;
  locked: string[]; // from regions.json status
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  focus?: string | null; // step 2: zoom into this chapter and show its 2025 provinces
  landmarks?: { name: string; lon: number; lat: number; note: string }[];
  hotProvince?: string | null;
  onProvinceHover?: (name: string | null) => void;
  onBack?: () => void;
}) {
  const reduced = !!useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const box = useRef<[number, number, number, number]>(FULL);
  const sheet = focus ? FOCUS[focus] : null;
  const s = sheet ? sheet.box[2] / MAP_W : 1; // text and dots keep their on-page size at any zoom

  // camera: tween the viewBox, so lines stay crisp at every zoom and nothing is an image
  useEffect(() => {
    const to = sheet ? sheet.box : FULL;
    const from = box.current;
    const set = (b: [number, number, number, number]) => {
      box.current = b;
      svgRef.current?.setAttribute("viewBox", b.join(" "));
    };
    if (reduced) return set(to);
    const c = animate(0, 1, {
      duration: 0.8,
      ease: EASE,
      onUpdate: (t) =>
        set(
          from.map((v, i) => v + (to[i] - v) * t) as [
            number,
            number,
            number,
            number,
          ],
        ),
    });
    return () => c.stop();
  }, [sheet, reduced]);

  const draw = (i: number) => {
    if (reduced || ink === "static") return {};
    const hidden = { pathLength: 0, opacity: 0 };
    return ink === "wait"
      ? { initial: hidden, animate: hidden }
      : {
          initial: hidden,
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 1.0, delay: 0.35 + i * 0.1, ease: EASE },
        };
  };
  const later = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.5, delay },
        };

  return (
    <svg
      ref={svgRef}
      viewBox={FULL.join(" ")}
      className="h-full w-full select-none"
      role="group"
      aria-label={
        focus
          ? `Bản đồ vùng ${CHAPTERS.find((c) => c.id === focus)?.label}`
          : "Bản đồ Việt Nam theo vùng miền"
      }
    >
      <defs>
        <pattern
          id="vm-hatch"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="4" height="4" fill="#ddd6ca" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="#b9ad9a" strokeWidth="1" />
        </pattern>
        <filter id="vm-lift" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.4"
            floodColor="#3b2616"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      {/* the sea, written in by hand */}
      <text
        x={LABEL_AT.bienDong[0]}
        y={LABEL_AT.bienDong[1]}
        className="font-hand"
        fontSize={13 * s}
        fill="#2F4A6D"
        opacity="0.45"
        transform={`rotate(-62 ${LABEL_AT.bienDong[0]} ${LABEL_AT.bienDong[1]})`}
      >
        Biển Đông
      </text>

      {CHAPTERS.map((c, i) => {
        const isLocked = locked.includes(c.id);
        const isActive = !focus && active === c.id;
        const dimmed = !!focus && focus !== c.id;
        return (
          <g
            key={c.id}
            role="button"
            tabIndex={dimmed ? -1 : 0}
            aria-label={
              isLocked
                ? `${c.label} — đang xây dựng cùng cộng đồng`
                : `Đến vùng ${c.label}`
            }
            onMouseEnter={() => !focus && onHover(c.id)}
            onMouseLeave={() => !focus && onHover(null)}
            onFocus={() => !focus && onHover(c.id)}
            onBlur={() => !focus && onHover(null)}
            onClick={() => (dimmed ? onBack?.() : !focus && onSelect(c.id))}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && !focus && onSelect(c.id)
            }
            className={`outline-none ${focus ? (dimmed ? "cursor-zoom-out" : "") : "cursor-pointer"}`}
            filter={isActive ? "url(#vm-lift)" : undefined}
            style={{
              opacity: dimmed ? 0.22 : 1,
              transition: "opacity 600ms ease",
            }}
          >
            <path
              d={CHAPTER_FILL[c.id]}
              fillRule="evenodd"
              fill={isLocked ? "url(#vm-hatch)" : isActive ? GOLD : c.tint}
              // an invisible 10px rim widens the tap target: Miền Trung is a thin strip on a phone
              stroke="transparent"
              strokeWidth={10}
              vectorEffect="non-scaling-stroke"
              style={{ transition: "fill 260ms ease" }}
            />
            <motion.path
              d={CHAPTER_OUTLINE[c.id]}
              fill="none"
              stroke={isActive ? "#8a5a16" : INK}
              strokeWidth={isActive ? 1.8 : 1.25}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              {...draw(i)}
            />
          </g>
        );
      })}

      {/* whole-country view: faint old province lines and firmer region seams */}
      <g
        pointerEvents="none"
        style={{ opacity: focus ? 0 : 1, transition: "opacity 400ms ease" }}
      >
        <path
          d={PROVINCE_LINES}
          fill="none"
          stroke={INK}
          strokeOpacity="0.22"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={CHAPTER_LINES}
          fill="none"
          stroke={INK}
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="3 2.3"
        />
      </g>

      {/* step 2: the region's 2025 provinces ink in, then their names, then the places Bà marked */}
      {sheet && (
        <g key={focus}>
          {sheet.provinces.map((p) => (
            <path
              key={p.name}
              d={p.d}
              fillRule="evenodd"
              fill={GOLD}
              fillOpacity={hotProvince === p.name ? 0.45 : 0}
              style={{ transition: "fill-opacity 200ms ease" }}
              onMouseEnter={() => onProvinceHover?.(p.name)}
              onMouseLeave={() => onProvinceHover?.(null)}
            >
              <title>
                {p.partial
                  ? `${p.name} (một phần) · gồm ${p.old.join(", ")}`
                  : `${p.name}${p.old.length > 1 ? ` · gồm ${p.old.join(", ")}` : ""}`}
              </title>
            </path>
          ))}
          <motion.path
            d={sheet.borders}
            fill="none"
            stroke={INK}
            strokeOpacity="0.7"
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            pointerEvents="none"
            {...(reduced
              ? {}
              : {
                  initial: { pathLength: 0 },
                  animate: { pathLength: 1 },
                  transition: { duration: 0.9, delay: 0.55, ease: EASE },
                })}
          />
          <motion.g
            className="font-hand"
            textAnchor="middle"
            pointerEvents="none"
            {...later(1.0)}
          >
            {sheet.provinces.map((p) => (
              <text
                key={p.name}
                x={p.at[0]}
                y={p.at[1]}
                fontSize={7 * s}
                fill={hotProvince === p.name ? "#5a3408" : INK}
                stroke="#f6efe0"
                strokeWidth={2.2 * s}
                paintOrder="stroke"
              >
                {p.name}
              </text>
            ))}
          </motion.g>
          <motion.g {...later(1.35)}>
            {landmarks.map((l) => {
              const [x, y] = project(l.lon, l.lat);
              return (
                <g key={l.name} pointerEvents="none">
                  <circle
                    cx={x}
                    cy={y}
                    r={2.4 * s}
                    fill="#B5452E"
                    stroke="#f6efe0"
                    strokeWidth={0.9 * s}
                  />
                  <text
                    x={x + 3.6 * s}
                    y={y + 2.3 * s}
                    className="font-hand"
                    fontSize={5.8 * s}
                    fill="#8a2f1c"
                    stroke="#f6efe0"
                    strokeWidth={1.8 * s}
                    paintOrder="stroke"
                  >
                    {l.name}
                  </text>
                </g>
              );
            })}
          </motion.g>
        </g>
      )}

      {/* chapter names (whole-country view only) */}
      <g
        className="font-hand"
        fontSize="11.5"
        textAnchor="middle"
        pointerEvents="none"
        style={{ opacity: focus ? 0 : 1, transition: "opacity 300ms ease" }}
      >
        {CHAPTERS.map((c) => {
          const [x, y] = LABEL_AT[c.id];
          const isLocked = locked.includes(c.id);
          return (
            <text
              key={c.id}
              x={x}
              y={y}
              fill={isLocked ? "#8b8175" : active === c.id ? "#5a3408" : INK}
              stroke="#f6efe0"
              strokeWidth="2.6"
              paintOrder="stroke"
            >
              {c.label}
              {isLocked && (
                <tspan x={x} dy="11" fontSize="8.5">
                  (đang xây dựng)
                </tspan>
              )}
            </text>
          );
        })}
      </g>

      {/* islets too small to draw as shapes (Hạ Long, Côn Đảo, Thổ Chu, Cồn Cỏ…) */}
      <g fill={INK} pointerEvents="none">
        {ISLETS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.55 * Math.max(s, 0.6)} />
        ))}
      </g>
      <g
        className="font-hand"
        fontSize={7 * s}
        fill={INK}
        stroke="#f6efe0"
        strokeWidth={2 * s}
        paintOrder="stroke"
        pointerEvents="none"
        opacity="0.85"
      >
        <text x={LABEL_AT.phuQuoc[0]} y={LABEL_AT.phuQuoc[1]} textAnchor="end">
          Phú Quốc
        </text>
        <text x={LABEL_AT.conDao[0]} y={LABEL_AT.conDao[1]} textAnchor="middle">
          Côn Đảo
        </text>
        <text x={LABEL_AT.lySon[0]} y={LABEL_AT.lySon[1]}>
          Lý Sơn
        </text>
        <text x={LABEL_AT.catBa[0]} y={LABEL_AT.catBa[1]}>
          Cát Bà
        </text>
      </g>

      {/* Hoàng Sa & Trường Sa — part of Việt Nam, always on the map */}
      <g pointerEvents="none">
        {(["hoangSa", "truongSa"] as const).map((k) => (
          <g key={k} fill={INK}>
            {ISLANDS[k].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={(i % 3 === 0 ? 1.5 : 1.05) * Math.max(s, 0.6)}
              />
            ))}
          </g>
        ))}
        <g
          className="font-hand"
          fontSize={9.5 * s}
          fill={INK}
          textAnchor="middle"
          stroke="#f6efe0"
          strokeWidth={2.4 * s}
          paintOrder="stroke"
        >
          <text x={LABEL_AT.hoangSa[0]} y={LABEL_AT.hoangSa[1]}>
            QĐ. Hoàng Sa{focus === "hue" ? " (Đà Nẵng)" : ""}
          </text>
          <text x={LABEL_AT.truongSa[0]} y={LABEL_AT.truongSa[1]}>
            QĐ. Trường Sa{focus === "hue" ? " (Khánh Hòa)" : ""}
          </text>
        </g>
      </g>
    </svg>
  );
}
