"use client";

// Part 2 – Bà's diary of a region. Every page has the same layout so the team only fills data:
//   young Bà's entry ("tôi", season and month only) · old Bà's margin note for Tí · Tèo's sticky notes (the facts,
//   with sources) · at most one pencil thought from Tí · one keepsake glued on the page.
// All words come from backend/content/regions/<id>.json.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { latestPhoto, loadOwn, saveOwn, type OwnPage } from "@/lib/own";
import type {
  Bootstrap,
  DiaryPage,
  Frame,
  Garment,
  Keepsake,
  Region,
  TeoNote,
} from "@/lib/types";
import { FOCUS } from "./vietnam-geo";

const YOUNG = "#27354f"; // young Bà: blue-black fountain-pen ink
const OLD = "#8a4b2a"; // old Bà: sepia, written years later
const PENCIL = "#7b7b7b"; // Tí

/** Unverified facts show while the team works (dev server or ?draft=1) and stay hidden on the real site. */
const DRAFT =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("draft") === "1");

const place = (r: Region) => r.name.split("/")[0].trim();

/* ---------- the voices ---------- */

const DateLine = ({ children }: { children: ReactNode }) => (
  <p
    className="font-hand m-0 border-b border-dashed pb-0.5 text-[0.95rem]"
    style={{ color: YOUNG, borderColor: "rgba(39,53,79,0.25)" }}
  >
    {children}
  </p>
);

const Entry = ({ text, size = "0.98rem" }: { text: string; size?: string }) => (
  <p
    className="font-hand m-0 mt-2 leading-[1.38]"
    style={{ color: YOUNG, fontSize: size }}
  >
    {text}
  </p>
);

const Margin = ({ text }: { text: string }) => (
  <p
    className="font-hand m-0 mt-2 -rotate-[1.5deg] border-l-2 pl-2 text-[0.92rem] leading-snug"
    style={{ color: OLD, borderColor: "rgba(138,75,42,0.35)" }}
  >
    {text} <span className="whitespace-nowrap">— Bà</span>
  </p>
);

const Pencil = ({ text }: { text: string }) => (
  <p
    className="font-hand m-0 mt-1.5 rotate-[0.8deg] text-[0.85rem]"
    style={{ color: PENCIL }}
  >
    ✎ Tí: {text}
  </p>
);

/** Tèo's sticky notes: the only place facts and sources live. */
function TeoNotes({ notes, data }: { notes: TeoNote[]; data: Bootstrap }) {
  const shown = notes.filter((n) => n.verified || DRAFT);
  if (!shown.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-start gap-2">
      {shown.map((n, i) => {
        const src = n.sources.map((id) => data.sources[id]).find(Boolean);
        return (
          <div
            key={n.text}
            className="relative min-w-[7.5rem] flex-1 basis-0 bg-[#fbe99a] px-2 pb-1.5 pt-2 text-[0.66rem] leading-snug text-[#1f3a78] shadow-[1px_3px_6px_rgba(60,40,0,0.22)]"
            style={{
              rotate: `${[-1.6, 1.2, -0.6][i % 3]}deg`,
              maxWidth: shown.length === 1 ? "70%" : undefined,
            }}
          >
            <span
              className="absolute left-1/2 top-[-5px] h-2.5 w-8 -translate-x-1/2 bg-white/50"
              aria-hidden
            />
            {n.unesco && (
              <b className="mr-1 rounded-sm bg-[#1f3a78] px-1 text-[0.55rem] text-[#fbe99a]">
                UNESCO {n.unesco}
              </b>
            )}
            {n.text}
            {/* source on its own line, Tèo's signature under it: nothing gets squeezed on a narrow note */}
            <span className="mt-1 block truncate text-[0.55rem] opacity-80">
              {src?.url ? (
                <a href={src.url} target="_blank" rel="noreferrer" className="underline">
                  nguồn: {src.title}
                </a>
              ) : src ? (
                `nguồn: ${src.title}`
              ) : (
                "chưa có nguồn"
              )}
            </span>
            <span className="block text-right text-[0.55rem] italic opacity-80">– Tèo{n.verified ? "" : ", đang kiểm tra"}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- keepsakes glued on the page ---------- */

function KeepsakeArt({
  kind,
  label,
  color,
}: {
  kind: Keepsake;
  label?: string;
  color?: string;
}) {
  const tilt = {
    stamp: -12,
    photo: 0,
    leaf: 18,
    recipe: 4,
    ticket: -6,
    fabric: 7,
  }[kind];
  return (
    <div
      className="pointer-events-none float-right mb-1 ml-3 mt-1"
      style={{ rotate: `${tilt}deg` }}
      aria-hidden
    >
      {kind === "stamp" && (
        <div className="flex h-[3.9rem] w-[3.9rem] flex-col items-center justify-center rounded-full border-[2.5px] border-[#B5452E]/75 text-center text-[#B5452E]/80">
          <span className="text-[0.48rem] tracking-[0.2em]">ĐÃ ĐẾN</span>
          <span className="font-display px-1 text-[0.62rem] leading-tight">
            {label}
          </span>
        </div>
      )}
      {kind === "leaf" && (
        <svg viewBox="0 0 60 40" className="h-9 w-14 opacity-80">
          <path
            d="M4 34 C 14 6, 44 2, 56 8 C 50 26, 26 38, 4 34z"
            fill="#8fa66a"
          />
          <path
            d="M4 34 C 22 24, 38 14, 56 8"
            fill="none"
            stroke="#5e7f4a"
            strokeWidth="1.2"
          />
        </svg>
      )}
      {kind === "recipe" && (
        <div
          className="w-[4.6rem] bg-[#fffdf6] p-1.5 shadow"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent 0 7px, rgba(90,120,170,0.25) 7px 8px)",
          }}
        >
          <p className="font-hand m-0 text-[0.6rem] leading-[8px] text-stone-600">
            {label}
          </p>
        </div>
      )}
      {kind === "ticket" && (
        <div
          className="bg-[#e9c46a] px-3 py-1 text-center shadow"
          style={{
            clipPath:
              "polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%)",
          }}
        >
          <p className="m-0 text-[0.45rem] tracking-[0.25em] text-[#6b3c12]">
            VÉ ĐI HỘI
          </p>
          <p className="font-display m-0 text-[0.62rem] leading-tight text-[#6b3c12]">
            {label}
          </p>
        </div>
      )}
      {kind === "fabric" && (
        <div
          className="h-10 w-14 shadow"
          style={{
            background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 5px), ${color ?? "#6fb3d8"}`,
            clipPath:
              "polygon(0 6%, 18% 0, 40% 5%, 62% 0, 84% 4%, 100% 0, 97% 100%, 70% 95%, 44% 100%, 20% 96%, 2% 100%)",
          }}
        />
      )}
    </div>
  );
}

/** A keepsake picture: the real image if the team has made it, otherwise a pencil placeholder. */
function Polaroid({ frame, i }: { frame: Frame; i: number }) {
  const reduced = !!useReducedMotion();
  const [broken, setBroken] = useState(false);
  const tilt = [-4, 2.5, -1.2][i] ?? 0;
  return (
    <motion.figure
      className="relative m-0 w-[31%] bg-[#fbf6ea] p-[3%] pb-[2%] shadow-[0_5px_12px_rgba(60,35,10,0.28)]"
      initial={
        reduced ? { opacity: 0 } : { opacity: 0, y: 26, rotate: tilt - 8 }
      }
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{
        type: "spring",
        stiffness: 210,
        damping: 20,
        delay: 0.15 + i * 0.08,
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
            className="h-full w-full object-cover sepia-[.2]"
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
          </svg>
        )}
      </div>
      <figcaption className="font-hand mt-0.5 text-center text-[0.72rem] leading-tight text-stone-700">
        {frame.caption}
      </figcaption>
    </motion.figure>
  );
}

/** Shared frame of every diary page: date, entry, the page's own block, then Bà's margin, Tí and Tèo. */
function Sheet({
  page,
  data,
  keepsake,
  children,
}: {
  page: DiaryPage;
  data: Bootstrap;
  keepsake?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex h-full flex-col">
      {/* the keepsake floats at the top right, so the entry wraps around it like glued paper */}
      <div>
        {keepsake}
        <DateLine>{page.date}</DateLine>
        <Entry text={page.entry} />
      </div>
      {page.ti && <Pencil text={page.ti} />}
      {children}
      <div className="mt-auto">
        {page.margin && <Margin text={page.margin} />}
        <TeoNotes notes={page.teo} data={data} />
      </div>
    </div>
  );
}

/* ---------- the right page before a region is chosen ---------- */

/** Hovering a region on the country map: just one line from Bà's diary. */
export function HoverPage({
  region,
  onGo,
}: {
  region: Region;
  onGo?: () => void;
}) {
  const j = region.journey;
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="m-0 text-[0.66rem] tracking-[0.3em] text-stone-500">
        TRANG NHẬT KÝ
      </p>
      <h2
        className="font-display m-0 mt-1 text-[1.8rem] leading-tight"
        style={{ color: YOUNG }}
      >
        {region.name}
      </h2>
      {j && (
        <p
          className="font-hand m-0 mt-4 text-[1.35rem] leading-snug"
          style={{ color: YOUNG }}
        >
          {j.hover_line}
        </p>
      )}
      {region.status === "locked" && (
        <p className="font-hand m-0 mt-3 text-[1rem]" style={{ color: OLD }}>
          Những trang này chờ người ở đây cùng viết.
        </p>
      )}
      {onGo ? (
        <button
          type="button"
          onClick={onGo}
          className="mt-5 self-start rounded-full bg-[#27354f] px-4 py-2 text-sm text-amber-50"
        >
          Đến vùng này →
        </button>
      ) : (
        <p className="font-hand m-0 mt-6 text-[1.05rem] text-[#B5452E]">
          Chạm vào vùng để lật đến trang ấy.
        </p>
      )}
    </div>
  );
}

/* ---------- 1 · Đến ---------- */

export function ArriveDiary({
  region,
  data,
  hotProvince,
  onProvinceHover,
}: {
  region: Region;
  data: Bootstrap;
  hotProvince: string | null;
  onProvinceHover: (name: string | null) => void;
}) {
  const reduced = !!useReducedMotion();
  const j = region.journey!;
  const sheet = FOCUS[region.id];
  return (
    <Sheet
      page={j.arrive}
      data={data}
      keepsake={
        <motion.div
          className="float-right"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduced
              ? { duration: 0.2 }
              : { type: "spring", stiffness: 420, damping: 16, delay: 1.7 }
          }
        >
          <KeepsakeArt kind="stamp" label={place(region)} />
        </motion.div>
      }
    >
      {sheet && (
        <div className="mt-3">
          <p className="m-0 text-[0.6rem] tracking-[0.2em] text-stone-500">
            TỈNH, THÀNH ({sheet.provinces.length})
          </p>
          <ul className="m-0 mt-0.5 flex list-none flex-wrap gap-x-2.5 gap-y-0.5 p-0">
            {sheet.provinces.map((p) => (
              <li
                key={p.name}
                onMouseEnter={() => onProvinceHover(p.name)}
                onMouseLeave={() => onProvinceHover(null)}
                className={`cursor-default text-[0.74rem] ${hotProvince === p.name ? "text-[#8a5a16] underline decoration-[#D9A43B] decoration-2" : "text-stone-700"}`}
                title={`Gồm ${p.old.join(", ")}`}
              >
                {p.name}
                {p.partial ? "*" : ""}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-1 text-[0.56rem] leading-snug text-stone-400">
            Đơn vị hành chính từ 01/07/2025
            {sheet.provinces.some((p) => p.partial)
              ? " · * một phần thuộc vùng này"
              : ""}
            . Chấm đỏ trên bản đồ là nơi Bà đánh dấu.
          </p>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- 2 · Nhìn quanh ---------- */

export function LookDiary({
  region,
  data,
}: {
  region: Region;
  data: Bootstrap;
}) {
  const j = region.journey!;
  return (
    <Sheet page={j.look} data={data}>
      <div className="mt-4 flex justify-between">
        {j.look.frames.map((f, i) => (
          <Polaroid key={`${region.id}-${i}`} frame={f} i={i} />
        ))}
      </div>
    </Sheet>
  );
}

/* ---------- 3 · Sống ---------- */

export function LifeDiary({
  region,
  data,
}: {
  region: Region;
  data: Bootstrap;
}) {
  const life = region.journey!.life!;
  const items = life.items.filter((i) => !i.community_review);
  const dish = items.find((i) => i.kind === "dish");
  return (
    <Sheet
      page={life}
      data={data}
      keepsake={
        life.keepsake && (
          <KeepsakeArt kind={life.keepsake} label={dish?.title} />
        )
      }
    >
      <ul className="m-0 mt-2.5 list-none space-y-1.5 p-0">
        {items.map((it) => (
          <li
            key={it.id}
            className="font-hand text-[0.88rem] leading-snug"
            style={{ color: YOUNG }}
          >
            <b className="font-semibold">
              {it.kind === "dish" ? "🍲 " : "· "}
              {it.title}.
            </b>{" "}
            {it.text}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function FestivalDiary({
  region,
  data,
}: {
  region: Region;
  data: Bootstrap;
}) {
  const f = region.journey!.festivals!;
  const items = f.festivals.filter((x) => !x.community_review);
  const [hot, setHot] = useState<string | null>(null);
  return (
    <Sheet
      page={f}
      data={data}
      keepsake={
        f.keepsake && <KeepsakeArt kind={f.keepsake} label={items[0]?.name} />
      }
    >
      <ul className="m-0 mt-2.5 list-none space-y-1 p-0">
        {items.map((x) => (
          <li
            key={x.id}
            className={`rounded px-1 text-[0.72rem] leading-snug text-stone-700 transition-colors ${hot === x.id ? "bg-[#D9A43B]/20" : ""}`}
          >
            <b className="font-display text-[0.86rem] text-stone-800">
              {x.name}
            </b>{" "}
            · {x.time}, {x.place}
          </li>
        ))}
      </ul>
      {/* a year of festivals on a golden thread */}
      <div className="relative mx-1 mt-2 h-5">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-[#D9A43B]" />
        {Array.from({ length: 12 }, (_, m) => (
          <span
            key={m}
            className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-[#b99a5a]"
            style={{ left: `${(m / 11) * 100}%` }}
          />
        ))}
        {items
          .filter((x) => x.month)
          .map((x) => (
            <button
              key={x.id}
              type="button"
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fbf6ea] bg-[#B5452E] shadow"
              style={{ left: `${(((x.month ?? 1) - 1) / 11) * 100}%` }}
              onMouseEnter={() => setHot(x.id)}
              onMouseLeave={() => setHot(null)}
              aria-label={`${x.name}: ${x.time}`}
              title={`${x.name} – ${x.time}`}
            />
          ))}
      </div>
      <div className="mx-1 flex justify-between text-[0.5rem] text-stone-400">
        <span>tháng 1</span>
        <span>âm lịch</span>
        <span>tháng 12</span>
      </div>
      <p
        className="font-hand m-0 mt-2 text-[0.95rem] leading-snug"
        style={{ color: OLD }}
      >
        {f.bridge}
      </p>
    </Sheet>
  );
}

/* ---------- 4 · Mặc ---------- */

const LEVEL: Record<string, string> = {
  keep: "Giữ",
  caution: "Cẩn thận",
  free: "Được đổi",
};

export function WearDiary({
  region,
  index,
  data,
  onTry,
}: {
  region: Region;
  index: number;
  data: Bootstrap;
  onTry: (garment: string) => void;
}) {
  const page = region.journey!.wear[index];
  const g: Garment | undefined = data.garments.find(
    (x) => x.id === page.garment,
  );
  const color = g?.default_colors
    .filter((c) => c !== "trang") // a white swatch would vanish on the paper
    .map((c) => data.colors[c]?.hex)
    .find(Boolean);
  // Tèo's first note on every Mặc page: what must stay, what needs care, what is free (from the garment data)
  const zones: TeoNote | null = g
    ? {
        text: (["keep", "caution", "free"] as const)
          .map((lv) => {
            const parts = g.zones
              .filter((z) => z.level === lv)
              .map((z) => z.part);
            return parts.length ? `${LEVEL[lv]}: ${parts.join(", ")}` : null;
          })
          .filter(Boolean)
          .join(" · "),
        unesco: null,
        sources: g.sources.slice(0, 1),
        verified: g.verified,
      }
    : null;
  return (
    <Sheet
      page={{
        ...page,
        teo: [...(zones ? [zones] : []), ...page.teo].slice(0, 3),
      }}
      data={data}
      keepsake={<KeepsakeArt kind="fabric" color={color} />}
    >
      <div className="mt-3 flex items-center gap-3">
        <p className="font-display m-0 text-[1.15rem] leading-tight text-stone-800">
          {g?.name_vi ?? page.garment}
        </p>
        <button
          type="button"
          onClick={() => onTry(page.garment)}
          className="ml-auto shrink-0 rounded-full bg-[#27354f] px-4 py-1.5 text-[0.8rem] text-amber-50 hover:bg-[#1c2740]"
        >
          Mặc thử →
        </button>
      </div>
    </Sheet>
  );
}

/* ---------- 5 · Trang của con ---------- */

export function OwnDiary({
  region,
  data,
  onTry,
}: {
  region: Region;
  data: Bootstrap;
  onTry?: (garment: string) => void;
}) {
  const j = region.journey!;
  const open = region.status === "open";
  const [own, setOwn] = useState<OwnPage>(
    () => loadOwn(region.id) ?? { text: "", sample: null },
  );
  const [photo] = useState(() => (open ? latestPhoto(region.garments) : null));
  const garments = region.garments
    .map((id) => data.garments.find((g) => g.id === id))
    .filter((g) => !!g);
  const update = (next: OwnPage) => {
    setOwn(next);
    saveOwn(region.id, next);
  };
  const sample = own.sample
    ? data.garments.find((g) => g.id === own.sample)
    : undefined;
  const done = !!(photo || sample);

  return (
    <div
      className="relative flex h-full flex-col"
      style={{
        backgroundImage:
          "repeating-linear-gradient(transparent 0 27px, rgba(90,120,170,0.18) 27px 28px)",
      }}
    >
      <p
        className="font-hand m-0 text-[1.1rem] leading-snug"
        style={{ color: OLD }}
      >
        {j.own.invite} <span className="whitespace-nowrap">— Bà</span>
      </p>

      {open && (
        <>
          <div className="mt-4 flex flex-1 items-start justify-center">
            <AnimatePresence mode="wait">
              {photo ? (
                <motion.figure
                  key="photo"
                  className="relative m-0 w-[62%] rotate-[-2.5deg] bg-white p-2 pb-6 shadow-[0_8px_18px_rgba(60,35,10,0.3)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the try-on */}
                  <img
                    src={photo.image}
                    alt="Ảnh con mặc thử"
                    className="block aspect-[3/4] w-full object-cover"
                  />
                  <figcaption className="font-hand absolute bottom-1 left-0 right-0 text-center text-[0.8rem] text-stone-600">
                    {photo.label ?? ""}
                  </figcaption>
                </motion.figure>
              ) : sample ? (
                <motion.div
                  key="sample"
                  className="w-[58%] rotate-[2deg] bg-[#fbf6ea] p-3 text-center shadow-[0_6px_14px_rgba(60,35,10,0.25)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <SampleFigure
                    color={
                      sample.default_colors
                        .map((c) => data.colors[c]?.hex)
                        .find(Boolean) ?? "#6fb3d8"
                    }
                  />
                  <p className="font-hand m-0 mt-1 text-[0.85rem] text-stone-600">
                    Con mặc {sample.name_vi}
                  </p>
                </motion.div>
              ) : (
                <div
                  key="empty"
                  className="flex w-[62%] flex-col items-center gap-2 border-2 border-dashed border-stone-300 p-4 text-center"
                >
                  <p className="m-0 text-[0.72rem] text-stone-500">
                    Chỗ dán ảnh
                  </p>
                  {garments.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onTry?.(g.id)}
                      className="w-full rounded-full bg-[#27354f] px-3 py-1.5 text-[0.75rem] text-amber-50"
                    >
                      Mặc thử {g.name_vi}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      update({ ...own, sample: garments[0]?.id ?? null })
                    }
                    className="text-[0.7rem] text-stone-600 underline"
                  >
                    Không dùng ảnh, dán hình mẫu
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Một dòng của con</span>
            <input
              value={own.text}
              onChange={(e) =>
                update({ ...own, text: e.target.value.slice(0, 90) })
              }
              placeholder="Viết một dòng của con…"
              className="font-hand w-full border-0 border-b border-stone-400 bg-transparent text-[1.05rem] outline-none placeholder:text-stone-400"
              style={{ color: "#1f3a78" }}
            />
          </label>
          <p className="m-0 mt-1 text-[0.55rem] text-stone-400">
            Trang này chỉ lưu trên máy của con.
          </p>
          {done && (
            <div className="pointer-events-none absolute right-[4%] top-[10%] flex h-[3.9rem] w-[3.9rem] rotate-[10deg] flex-col items-center justify-center rounded-full border-[2.5px] border-[#2F4A6D]/70 text-center text-[#2F4A6D]/80">
              <span className="text-[0.48rem] tracking-[0.2em]">ĐÃ MẶC</span>
              <span className="font-display px-1 text-[0.62rem] leading-tight">
                {place(region)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A simple ink figure wearing the garment's colour, for readers who prefer not to use a photo. */
function SampleFigure({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 90" className="mx-auto h-28" aria-hidden>
      <circle cx="30" cy="12" r="7" fill="#3b2a1e" />
      <path
        d="M22 22 L38 22 L44 58 L40 86 L20 86 L16 58z"
        fill={color}
        stroke="#3b2a1e"
        strokeWidth="1"
      />
      <path
        d="M22 24 L10 48 M38 24 L50 48"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M30 22 L30 86" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
    </svg>
  );
}

/** Blank paper, for pages the story has not reached yet. */
export const BlankPage = () => <div className="h-full" />;

/* ---------- bookmarks on the fore-edge ---------- */

export type Tab = { label: string; page: number };

export function Bookmarks({
  tabs,
  current,
  onJump,
  portrait,
}: {
  tabs: Tab[];
  current: number;
  onJump: (page: number) => void;
  portrait: boolean;
}) {
  const colors = ["#B5452E", "#D9A43B", "#5E7F4A", "#2F4A6D", "#8a4b2a"];
  return (
    <div
      className={
        portrait
          ? "absolute bottom-full left-0 right-0 mb-2 flex flex-wrap justify-center gap-1"
          : "absolute left-full top-[8%] flex flex-col gap-1.5"
      }
      role="tablist"
      aria-label="Đánh dấu trang"
    >
      {tabs.map((t, i) => {
        const on = current === t.page || current + 1 === t.page;
        return (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onJump(t.page)}
            className={`font-hand whitespace-nowrap py-1 text-left text-amber-50 shadow-[2px_2px_5px_rgba(0,0,0,0.3)] transition-transform ${portrait ? "rounded-t-md px-2 text-[0.75rem]" : "rounded-r-md pl-2 pr-3 text-[0.85rem]"}`}
            style={{
              background: colors[i % colors.length],
              transform: portrait
                ? `translateY(${on ? 0 : 4}px)`
                : `translateX(${on ? 0 : -6}px)`,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
