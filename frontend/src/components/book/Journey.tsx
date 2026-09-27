"use client";

// Part 2 – the journey through one region, told as pages of Bà's notebook: Nghe → Đến → Sống → Mặc.
// Every page carries one line of Bà (and at most one thought of Tí); all words come from content/regions/<id>.json.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Bootstrap, Frame, Region } from "@/lib/types";
import { FOCUS } from "./vietnam-geo";

const STAMP_KEY = "vpdk-stamps";

export function readStamps(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STAMP_KEY) || "[]");
  } catch {
    return [];
  }
}
function addStamp(id: string) {
  try {
    const s = readStamps();
    if (!s.includes(id))
      localStorage.setItem(STAMP_KEY, JSON.stringify([...s, id]));
  } catch {
    /* private mode: the stamp just is not remembered */
  }
}

/* ---------- small hand-drawn pieces ---------- */

function Icon({ kind }: { kind: "people" | "sky" | "land" }) {
  const common = {
    fill: "none",
    stroke: "#8a5a16",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
      {kind === "people" && (
        <>
          <circle cx="8" cy="8" r="3" {...common} />
          <circle cx="16.5" cy="9" r="2.4" {...common} />
          <path
            d="M3 19c.6-3.6 2.7-5.5 5-5.5s4.4 1.9 5 5.5M13.5 18.5c.5-2.6 1.8-4 3.2-4 1.5 0 2.8 1.4 3.3 4"
            {...common}
          />
        </>
      )}
      {kind === "sky" && (
        <>
          <circle cx="8" cy="8" r="3.2" {...common} />
          <path
            d="M8 2.5v1.3M2.5 8h1.3M4.1 4.1l.9.9M11.9 4.1l-.9.9"
            {...common}
          />
          <path
            d="M9 18.5h9.2a3.3 3.3 0 0 0 .2-6.6 4.6 4.6 0 0 0-8.8 1.4A2.6 2.6 0 0 0 9 18.5z"
            {...common}
          />
        </>
      )}
      {kind === "land" && (
        <path
          d="M2.5 19.5 9 9l3.6 5.5L15.5 11l6 8.5zM15.5 5.5a1.8 1.8 0 1 0 0 .1"
          {...common}
        />
      )}
    </svg>
  );
}

const DraftNote = ({ show }: { show: boolean }) =>
  show ? (
    <p className="m-0 mt-2 text-[0.68rem] italic text-stone-500">
      ✎ Bản nháp – nội dung đang được kiểm chứng nguồn.
    </p>
  ) : null;

const Kicker = ({
  children,
  tone = "#2F4A6D",
}: {
  children: React.ReactNode;
  tone?: string;
}) => (
  <p
    className="m-0 text-[0.68rem] tracking-[0.3em]"
    style={{ color: tone, opacity: 0.75 }}
  >
    {children}
  </p>
);

const Underline = () => (
  <svg viewBox="0 0 200 8" className="mt-1 h-2 w-24" aria-hidden>
    <path
      d="M2 5 C 50 1, 110 8, 198 3"
      fill="none"
      stroke="#B5452E"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

/** A keepsake picture: the real image if the team has made it, otherwise Bà's pencil placeholder. */
function Polaroid({
  frame,
  i,
  reduced,
}: {
  frame: Frame;
  i: number;
  reduced: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const tilt = [-4, 2.5, -1.2][i] ?? 0;
  return (
    <motion.figure
      className="relative m-0 w-[31%] bg-[#fbf6ea] p-[3%] pb-[2%] shadow-[0_6px_14px_rgba(60,35,10,0.28)]"
      initial={
        reduced ? { opacity: 0 } : { opacity: 0, y: 36, rotate: tilt - 8 }
      }
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      exit={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, y: 14, transition: { duration: 0.18 } }
      }
      transition={{
        type: "spring",
        stiffness: 210,
        damping: 20,
        delay: 0.12 + i * 0.08,
      }}
    >
      <span
        className="absolute left-1/2 top-[-6px] h-3 w-9 -translate-x-1/2 rotate-[-3deg] bg-[#e8dcb8]/80"
        aria-hidden
      />
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#efe6d2]">
        {frame.image && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element -- content images may not exist yet; plain img lets us fall back
          <img
            src={frame.image}
            alt={frame.alt}
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <svg
            viewBox="0 0 40 30"
            className="h-full w-full"
            role="img"
            aria-label={frame.alt}
          >
            <path
              d="M0 22 C 8 14, 14 20, 20 15 S 32 10, 40 17 V30 H0z"
              fill="#e2d5b9"
            />
            <path
              d="M0 22 C 8 14, 14 20, 20 15 S 32 10, 40 17"
              fill="none"
              stroke="#a89878"
              strokeWidth=".5"
              strokeDasharray="1.2 .8"
            />
            <circle
              cx="30"
              cy="8"
              r="3"
              fill="none"
              stroke="#b9a988"
              strokeWidth=".5"
            />
            <text
              x="20"
              y="27"
              textAnchor="middle"
              fontSize="3.2"
              fill="#9a8a6a"
              className="font-hand"
            >
              Bà chưa kịp vẽ
            </text>
          </svg>
        )}
      </div>
      <figcaption className="font-hand mt-1 text-center text-[0.8rem] leading-tight text-stone-700">
        {frame.caption}
      </figcaption>
    </motion.figure>
  );
}

/* ---------- step 1 · Nghe: hovering a region ---------- */

export function ListenPage({
  region,
  onGo,
  compact = false,
}: {
  region: Region;
  onGo?: () => void;
  compact?: boolean;
}) {
  const reduced = !!useReducedMotion();
  const j = region.journey;
  if (!j) return null;
  const rows: [React.ComponentProps<typeof Icon>["kind"], string, string][] = [
    ["people", "Con người", j.listen.people],
    ["sky", "Trời đất", j.listen.climate],
    ["land", "Cảnh đẹp", j.listen.places],
  ];
  return (
    <div className="flex h-full flex-col">
      <Kicker>BÀ KỂ</Kicker>
      <h2 className="font-display m-0 mt-1 text-[1.7rem] leading-tight text-[#2F4A6D]">
        {region.name}
      </h2>
      <Underline />
      <div className={`mt-3 ${compact ? "space-y-1.5" : "space-y-2.5"}`}>
        {rows.map(([k, label, text], i) => (
          <motion.div
            key={k}
            className="flex gap-2"
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
          >
            <Icon kind={k} />
            <p
              className={`m-0 leading-snug text-stone-800 ${compact ? "text-[0.78rem]" : "text-[0.86rem]"}`}
            >
              <b className="font-semibold text-stone-900">{label}. </b>
              {text}
            </p>
          </motion.div>
        ))}
      </div>
      {!compact && (
        <div className="relative mt-auto flex justify-between pt-4">
          <AnimatePresence>
            {j.listen.frames.map((f, i) => (
              <Polaroid
                key={`${region.id}-${i}`}
                frame={f}
                i={i}
                reduced={reduced}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      {onGo && (
        <button
          type="button"
          onClick={onGo}
          className="mt-3 self-start rounded-full bg-[#2F4A6D] px-4 py-2 text-sm text-amber-50"
        >
          Đến vùng này →
        </button>
      )}
      {!onGo && !compact && (
        <p className="font-hand m-0 mt-3 text-center text-[1rem] text-[#B5452E]">
          Chạm vào vùng để đến đó.
        </p>
      )}
    </div>
  );
}

/* ---------- step 2 · Đến: the region map's journal ---------- */

export function ArrivePage({
  region,
  hotProvince,
  onProvinceHover,
}: {
  region: Region;
  hotProvince: string | null;
  onProvinceHover: (name: string | null) => void;
}) {
  const reduced = !!useReducedMotion();
  const j = region.journey;
  const sheet = FOCUS[region.id];
  useEffect(() => addStamp(region.id), [region.id]);
  if (!j || !sheet) return null;
  return (
    <div className="relative flex h-full flex-col">
      <Kicker>NHẬT KÝ CHUYẾN ĐI</Kicker>
      <h2 className="font-display m-0 mt-1 text-[1.7rem] leading-tight text-[#2F4A6D]">
        {region.name}
      </h2>
      <Underline />
      <p className="font-hand m-0 mt-3 text-[1.15rem] leading-snug text-stone-800">
        “{j.arrive.ba_line}”
      </p>
      {j.arrive.ti_thought && (
        <p className="font-hand m-0 mt-1 -rotate-1 text-[0.95rem] text-stone-500">
          Tí nghĩ: {j.arrive.ti_thought}
        </p>
      )}

      <p className="m-0 mt-4 text-[0.66rem] tracking-[0.2em] text-stone-500">
        TỈNH, THÀNH ({sheet.provinces.length})
      </p>
      <ul className="m-0 mt-1 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
        {sheet.provinces.map((p) => (
          <li
            key={p.name}
            onMouseEnter={() => onProvinceHover(p.name)}
            onMouseLeave={() => onProvinceHover(null)}
            className={`cursor-default text-[0.8rem] ${hotProvince === p.name ? "text-[#8a5a16] underline decoration-[#D9A43B] decoration-2" : "text-stone-700"}`}
            title={`Gồm ${p.old.join(", ")}`}
          >
            {p.name}
            {p.partial ? "*" : ""}
          </li>
        ))}
      </ul>

      <p className="m-0 mt-4 text-[0.66rem] tracking-[0.2em] text-stone-500">
        BÀ ĐÁNH DẤU
      </p>
      <ul className="m-0 mt-1 list-none space-y-1 p-0">
        {j.arrive.landmarks.map((l) => (
          <li
            key={l.name}
            className="text-[0.8rem] leading-snug text-stone-700"
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#B5452E] align-middle" />
            <b className="font-semibold">{l.name}</b> – {l.note}
          </li>
        ))}
      </ul>

      <p className="m-0 mt-auto pt-3 text-[0.64rem] leading-snug text-stone-500">
        Tên tỉnh theo đơn vị hành chính từ 01/07/2025.{" "}
        {sheet.provinces.some((p) => p.partial) &&
          "* chỉ một phần tỉnh thuộc vùng này."}
      </p>
      {region.status === "locked" && (
        <p className="font-hand m-0 mt-2 text-[0.95rem] text-stone-600">
          {region.lock_note}
        </p>
      )}

      {/* the "đã đến" stamp lands once the map has inked in */}
      <motion.div
        className="pointer-events-none absolute right-[-2%] top-[-2%] flex h-[4.6rem] w-[4.6rem] flex-col items-center justify-center rounded-full border-[2.5px] border-[#B5452E]/80 text-center text-[#B5452E]/85"
        style={{ rotate: -12 }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduced
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 420, damping: 16, delay: 1.7 }
        }
        aria-hidden
      >
        <span className="text-[0.55rem] tracking-[0.2em]">ĐÃ ĐẾN</span>
        <span className="font-display text-[0.75rem] leading-tight">
          {region.name.split("/")[0].trim()}
        </span>
      </motion.div>
    </div>
  );
}

/* ---------- step 3 · Sống: customs and festivals ---------- */

export function CustomsPage({ region }: { region: Region }) {
  const live = region.journey?.live;
  if (!live) return null;
  const items = live.customs.filter((c) => !c.community_review);
  return (
    <div className="flex h-full flex-col">
      <Kicker tone="#5E7F4A">NẾP SỐNG</Kicker>
      <h2 className="font-display m-0 mt-1 text-[1.5rem] leading-tight text-stone-800">
        Một ngày ở {region.name.split("/")[0].trim()}
      </h2>
      <Underline />
      <div className="mt-3 space-y-3">
        {items.map((c) => (
          <div key={c.id}>
            <p className="font-display m-0 text-[1.05rem] text-stone-800">
              {c.title}
              {c.unesco && (
                <span className="ml-2 rounded-full border border-[#2F4A6D]/40 px-1.5 text-[0.6rem] text-[#2F4A6D]">
                  UNESCO {c.unesco}
                </span>
              )}
            </p>
            <p className="m-0 mt-0.5 text-[0.82rem] leading-snug text-stone-700">
              {c.story}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <DraftNote show={items.some((c) => !c.verified)} />
      </div>
    </div>
  );
}

export function FestivalsPage({ region }: { region: Region }) {
  const live = region.journey?.live;
  const [hot, setHot] = useState<string | null>(null);
  if (!live) return null;
  const items = live.festivals.filter((f) => !f.community_review);
  return (
    <div className="flex h-full flex-col">
      <Kicker tone="#B5452E">LỄ HỘI</Kicker>
      <h2 className="font-display m-0 mt-1 text-[1.5rem] leading-tight text-stone-800">
        Những ngày hội
      </h2>
      <Underline />
      <div className="mt-3 space-y-3">
        {items.map((f) => (
          <div
            key={f.id}
            className={`rounded-md transition-colors ${hot === f.id ? "bg-[#D9A43B]/15" : ""}`}
          >
            <p className="font-display m-0 text-[1.05rem] text-stone-800">
              {f.name}
              {f.unesco && (
                <span className="ml-2 rounded-full border border-[#2F4A6D]/40 px-1.5 text-[0.6rem] text-[#2F4A6D]">
                  UNESCO {f.unesco}
                </span>
              )}
            </p>
            <p className="m-0 text-[0.7rem] text-stone-500">
              {f.time} · {f.place}
            </p>
            <p className="m-0 mt-0.5 text-[0.8rem] leading-snug text-stone-700">
              {f.story}
            </p>
          </div>
        ))}
      </div>

      {/* a year of festivals: dots on a 12-month thread */}
      <div className="mt-auto pt-3">
        <div className="relative mx-1 h-6">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[#D9A43B]" />
          {Array.from({ length: 12 }, (_, m) => (
            <span
              key={m}
              className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-[#b99a5a]"
              style={{ left: `${(m / 11) * 100}%` }}
            />
          ))}
          {items
            .filter((f) => f.month)
            .map((f) => (
              <button
                key={f.id}
                type="button"
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fbf6ea] bg-[#B5452E] shadow"
                style={{ left: `${(((f.month ?? 1) - 1) / 11) * 100}%` }}
                onMouseEnter={() => setHot(f.id)}
                onMouseLeave={() => setHot(null)}
                aria-label={`${f.name}: ${f.time}`}
                title={`${f.name} – ${f.time}`}
              />
            ))}
        </div>
        <div className="mx-1 flex justify-between text-[0.55rem] text-stone-500">
          <span>Tháng 1</span>
          <span>(âm lịch)</span>
          <span>Tháng 12</span>
        </div>
        <p className="font-hand m-0 mt-2 text-[1rem] leading-snug text-[#B5452E]">
          {live.bridge_line}
        </p>
        <DraftNote show={items.some((f) => !f.verified)} />
      </div>
    </div>
  );
}

/* ---------- step 4 · Mặc: why the clothes look the way they do ---------- */

export function WearPage({
  region,
  data,
  onTry,
}: {
  region: Region;
  data: Bootstrap;
  onTry: () => void;
}) {
  const why = region.journey?.wear?.why ?? [];
  const garments = region.garments
    .map((id) => data.garments.find((g) => g.id === id))
    .filter((g) => !!g);
  return (
    <div className="flex h-full flex-col">
      <Kicker>TRANG PHỤC</Kicker>
      <h2 className="font-display m-0 mt-1 text-[1.5rem] leading-tight text-[#2F4A6D]">
        Vì sao nó như vậy?
      </h2>
      <Underline />
      <ul className="m-0 mt-3 list-none space-y-2.5 p-0">
        {why.map((w) => (
          <li key={w.because} className="text-[0.82rem] leading-snug">
            <span className="text-stone-600">{w.because}</span>
            <span className="mx-1 text-[#B5452E]">→</span>
            <b className="font-semibold text-stone-900">{w.so}</b>
            <span className="ml-1 text-[0.62rem] text-stone-400">
              (trang {w.from_step === "listen" ? "Bà kể" : "Lễ hội"})
            </span>
          </li>
        ))}
      </ul>
      {garments.length > 0 && (
        <div className="mt-4">
          <p className="m-0 text-[0.66rem] tracking-[0.2em] text-stone-500">
            NỔI BẬT CỦA VÙNG
          </p>
          {garments.map((g) => (
            <p
              key={g.id}
              className="m-0 mt-1 border-b border-dashed border-stone-400/60 pb-1"
            >
              <span className="font-display text-[1.05rem] text-stone-800">
                {g.name_vi}
              </span>
              <span className="ml-2 text-[0.7rem] text-stone-500">
                {g.period}
              </span>
            </p>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onTry}
        className="mt-auto self-start rounded-full bg-[#2F4A6D] px-5 py-2 text-sm text-amber-50 hover:bg-[#243a57]"
      >
        Mặc thử →
      </button>
    </div>
  );
}

/* ---------- the last page: stamps collected, and back to the country ---------- */

export function StampsPage({
  data,
  current,
  onCountry,
}: {
  data: Bootstrap;
  current: string;
  onCountry: () => void;
}) {
  const [stamps] = useState<string[]>(readStamps); // read once per mount; the page remounts per region (key)
  return (
    <div className="flex h-full flex-col">
      <Kicker>TEM CỦA CON</Kicker>
      <h2 className="font-display m-0 mt-1 text-[1.5rem] leading-tight text-stone-800">
        Những nơi con đã đến
      </h2>
      <Underline />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {data.regions.map((r, i) => {
          const got = stamps.includes(r.id);
          return (
            <div
              key={r.id}
              className={`flex aspect-square flex-col items-center justify-center rounded-full border-2 text-center ${got ? "border-[#B5452E]/80 text-[#B5452E]" : "border-dashed border-stone-300 text-stone-300"}`}
              style={{ rotate: `${[-8, 5, -3, 7, -6][i % 5]}deg` }}
            >
              <span className="text-[0.5rem] tracking-[0.2em]">
                {got ? "ĐÃ ĐẾN" : "CHƯA ĐẾN"}
              </span>
              <span className="font-display px-1 text-[0.7rem] leading-tight">
                {r.name.split("/")[0].trim()}
              </span>
            </div>
          );
        })}
      </div>
      <p className="font-hand m-0 mt-auto text-[1.05rem] text-stone-600">
        “Còn nhiều nơi lắm. Mình đi tiếp nhé.” – Bà
      </p>
      <button
        type="button"
        onClick={onCountry}
        className="mt-3 self-start rounded-full border border-stone-700 px-4 py-2 text-sm hover:bg-stone-800 hover:text-amber-50"
      >
        ‹ Về bản đồ Việt Nam
      </button>
    </div>
  );
}

/** Blank paper, for pages the story has not reached yet. */
export const BlankPage = ({ note }: { note?: string }) => (
  <div className="flex h-full items-center justify-center">
    {note && (
      <p className="font-hand m-0 text-center text-lg text-stone-400">{note}</p>
    )}
  </div>
);
