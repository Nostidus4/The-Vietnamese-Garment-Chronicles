"use client";

// Part 2 – Bà's diary of a region. Every page has the same layout so the team only fills data:
//   young Bà's entry ("tôi", season and month only) · old Bà's margin note for Tí · Tèo's sticky notes (the facts,
//   with sources) · at most one pencil thought from Tí · one keepsake glued on the page.
// All words come from backend/content/regions/<id>.json.

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { ensureMigrated, pagesOf, useDuKy } from "@/lib/dukyBook";
import { markStamp } from "@/lib/stamps";
import { track } from "@/lib/track";
import { Photo as DuKyPhoto } from "../duky/DuKyPageView";
import type {
  Bootstrap,
  CheckQuestion,
  DiaryPage,
  Frame,
  Garment,
  Keepsake,
  Region,
  TeoNote,
} from "@/lib/types";
import { WeatherNote } from "../chapter/WeatherNote";
import { RichText } from "./Glossary";
import { TeoPin } from "./TeoPin";
import { FOCUS } from "./vietnam-geo";
import { asset } from "@/lib/base";
import { DRAWN, PaperDoll } from "../fitting/PaperDoll";

export const YOUNG = "#27354f"; // young Bà: blue-black fountain-pen ink
export const OLD = "#8a4b2a"; // old Bà: sepia, written years later
export const PENCIL = "#7b7b7b"; // Tí

/** Unverified facts show while the team works (dev server or ?draft=1) and stay hidden on the real site. */
export const DRAFT =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("draft") === "1");

/** The place a region's stamps are named after: its open chapter (e.g. Huế), else the region. */
/** A region with a chapter anyone can read (it may still be waiting for its community's review). */
export const hasChapter = (r: Region) => r.chapters?.some((c) => c.status === "open") ?? false;

export const place = (r: Region) => r.chapters?.find((c) => c.status === "open")?.province ?? r.name.split("/")[0].trim();

/* ---------- the voices ---------- */

export const DateLine = ({ children }: { children: ReactNode }) => (
  <p
    className="font-hand m-0 border-b border-dashed pb-0.5 text-[0.95rem]"
    style={{ color: YOUNG, borderColor: "rgba(39,53,79,0.25)" }}
  >
    {children}
  </p>
);

export const Entry = ({ text, size = "0.98rem" }: { text: string; size?: string }) => (
  <p
    className="font-hand m-0 mt-2 leading-[1.38]"
    style={{ color: YOUNG, fontSize: size }}
  >
    <RichText text={text} />
  </p>
);

export const Margin = ({ text }: { text: string }) => (
  <p
    className="font-hand m-0 mt-2 -rotate-[1.5deg] border-l-2 pl-2 text-[0.92rem] leading-snug"
    style={{ color: OLD, borderColor: "rgba(138,75,42,0.35)" }}
  >
    <RichText text={text} /> <span className="whitespace-nowrap">— Bà</span>
  </p>
);

export const Pencil = ({ text }: { text: string }) => (
  <p
    className="font-hand m-0 mt-1.5 rotate-[0.8deg] text-[0.85rem]"
    style={{ color: PENCIL }}
  >
    ✎ Tí: {text}
  </p>
);

/**
 * Tèo's notes: the only place facts and sources live. On the page they are just a red pin in the corner;
 * a click opens them in the middle of the screen, like one of Bà's letters (see TeoPin).
 */
export function TeoNotes({ notes, data, corner = true }: { notes: TeoNote[]; data: Bootstrap; corner?: boolean }) {
  const shown = notes.filter((n) => n.verified || DRAFT);
  return <TeoPin notes={shown} data={data} corner={corner} />;
}

/* ---------- keepsakes glued on the page ---------- */

export function KeepsakeArt({
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
          <span className="font-display px-1 text-[0.75rem] leading-tight">
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
          <p className="font-hand m-0 text-[0.75rem] leading-[8px] text-stone-600">
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
          <p className="font-display m-0 text-[0.75rem] leading-tight text-[#6b3c12]">
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
export function Polaroid({ frame, i, className = "w-[31%]" }: { frame: Frame; i: number; className?: string }) {
  const reduced = !!useReducedMotion();
  const [broken, setBroken] = useState(false);
  const tilt = [-4, 2.5, -1.2][i] ?? 0;
  return (
    <motion.figure
      className={`relative m-0 ${className} bg-[#fbf6ea] p-[3%] pb-[2%] shadow-[0_5px_12px_rgba(60,35,10,0.28)]`}
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
            src={asset(frame.image)}
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
      <figcaption className="font-hand mt-0.5 text-center text-[0.75rem] leading-tight text-stone-700">
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
  className = "",
}: {
  page: DiaryPage;
  data: Bootstrap;
  keepsake?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative flex h-full flex-col ${className}`}>
      {/* the keepsake floats at the top right, so the entry wraps around it like glued paper */}
      <div>
        {keepsake}
        <DateLine>{page.date}</DateLine>
        <Entry text={page.entry} />
      </div>
      {page.ti && (
        <div className="wear-extra">
          <Pencil text={page.ti} />
        </div>
      )}
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
      <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-500">
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
      {region.status === "locked" && !hasChapter(region) && (
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
  const arrive = j.arrive!;
  const pre = j.check?.pre;
  const [asking, setAsking] = useState(() => !!pre && (pre.verified || DRAFT) && !preAsked(region.id));
  useEffect(() => {
    if (!asking) markStamp("arrived", region.id); // "đã đến": the reader has opened this region's first entry
  }, [asking, region.id]);
  if (asking) return <PreQuestion region={region} onDone={() => setAsking(false)} />;
  return (
    <Sheet
      page={arrive}
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
      {region.status === "open" && region.journey?.wear[0] && (
        <div className="mt-1.5 text-[0.85rem] [&_p]:text-[0.9rem] [&_span]:text-[0.8rem]">
          {/* Tí's pencil, today: Bà wrote the past, the weather is now */}
          <WeatherNote regionId={region.id} garmentId={region.journey.wear[0].garment} place={place(region)} />
        </div>
      )}
      {sheet && (
        <div className="mt-3">
          <p className="m-0 text-[0.75rem] tracking-[0.2em] text-stone-500">
            TỈNH, THÀNH ({sheet.provinces.length})
          </p>
          <ul className="m-0 mt-0.5 flex list-none flex-wrap gap-x-2.5 gap-y-0.5 p-0">
            {sheet.provinces.map((p) => (
              <li
                key={p.name}
                onMouseEnter={() => onProvinceHover(p.name)}
                onMouseLeave={() => onProvinceHover(null)}
                className={`cursor-default text-[0.75rem] ${hotProvince === p.name ? "text-[#8a5a16] underline decoration-[#D9A43B] decoration-2" : "text-stone-700"}`}
                title={`Gồm ${p.old.join(", ")}`}
              >
                {p.name}
                {p.partial ? "*" : ""}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-1 text-[0.75rem] leading-snug text-stone-500">
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
    <Sheet page={j.look!} data={data}>
      <div className="mt-4 flex justify-between">
        {j.look!.frames.map((f, i) => (
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
            className={`rounded px-1 text-[0.75rem] leading-snug text-stone-700 transition-colors ${hot === x.id ? "bg-[#D9A43B]/20" : ""}`}
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
      <div className="mx-1 flex justify-between text-[0.75rem] text-stone-500">
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
  return (
    <Sheet page={page} data={data} keepsake={<KeepsakeArt kind="fabric" color={color} />} className="wear-page">
      {/* the garment first, pinned at the left; its name, Bà's summary and "Khi mặc" run beside it and on below */}
      <div className="mt-3 flow-root">
      {g?.reference_image ? (
        <GarmentPlate id={g.id} name={g.name_vi} />
      ) : g && DRAWN.has(g.id) ? (
        <DrawnPlate garment={g} data={data} pending={region.status !== "open"} />
      ) : null}
      <div className="flex items-center gap-3">
        <p className="font-display m-0 text-[1.15rem] leading-tight text-stone-800">
          {g?.name_vi ?? page.garment}
        </p>
        {region.status === "open" ? (
          <button
            type="button"
            onClick={() => onTry(page.garment)}
            className="ml-auto shrink-0 rounded-full bg-[#27354f] px-4 py-1.5 text-[0.8rem] text-amber-50 hover:bg-[#1c2740]"
          >
            Mặc thử →
          </button>
        ) : (
          // try-on stays closed until the community has reviewed this garment
          <span className="ml-auto max-w-[45%] text-right text-[0.75rem] leading-snug text-stone-600 [text-wrap:balance]">
            Thử đồ AI: chờ người ở đây đọc lại
          </span>
        )}
      </div>
      {g && (
        <p className="wear-extra m-0 mt-1 text-[0.8rem] leading-snug text-stone-600">
          {g.summary}
        </p>
      )}
      {g && (
        <div className="mt-2 overflow-hidden rounded-md border border-dashed border-stone-400/60 bg-white/35 px-3 py-2">
          <p className="font-hand m-0 text-[1rem]" style={{ color: OLD }}>
            Khi mặc, con nhớ:
          </p>
          <ul className="m-0 mt-1 list-none space-y-1 p-0 text-[0.78rem] leading-snug text-stone-700">
            {(["keep", "caution", "free"] as const).map((lv) => {
              const parts = g.zones.filter((z) => z.level === lv);
              if (!parts.length) return null;
              return (
                <li key={lv} className={`flex gap-2 ${lv === "free" ? "wear-extra" : ""}`}>
                  <span
                    className={`mt-0.5 shrink-0 rounded-sm px-1.5 text-[0.75rem] font-semibold ${lv === "keep" ? "bg-[#27354f] text-amber-50" : lv === "caution" ? "bg-[#D9A43B] text-[#3b2a10]" : "bg-[#5E7F4A] text-white"}`}
                  >
                    {LEVEL[lv]}
                  </span>
                  <span>
                    {parts.map((z, i) => (
                      <span key={z.part}>
                        {i > 0 && " · "}
                        {z.part}
                        {z.note && <span className="wear-extra text-stone-500"> ({z.note})</span>}
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      </div>
      {g && g.wearing_steps.length > 0 && (
        <ol className={`m-0 mt-2 list-none space-y-0.5 p-0 leading-snug text-stone-700 ${g.wearing_steps.length > 4 ? "text-[0.75rem]" : "text-[0.76rem]"}`}>
          {g.wearing_steps.map((st, k) => (
            <li key={st.title} className="flex gap-2">
              <span className="font-display shrink-0 text-[#8a4b2a]">{k + 1}.</span>
              <span>
                <b className="font-semibold">{st.title}:</b> {st.detail}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}

/**
 * A garment with no reference photo yet (Tây Bắc, Tây Nguyên), drawn by Bà on the paper doll instead of an empty
 * swatch (#76). While the people of the region have not read the chapter, the caption says so.
 */
function DrawnPlate({ garment, data, pending }: { garment: Garment; data: Bootstrap; pending: boolean }) {
  const [c1, c2] = garment.default_colors.map((c) => data.colors[c]?.hex ?? "#27354f");
  return (
    <figure className="float-left m-0 mb-1 mr-3 w-[24%] -rotate-[1.5deg] bg-white p-1 pb-0 shadow-[0_4px_10px_rgba(60,35,10,0.25)]">
      <PaperDoll
        dress={{ set: garment.id, ...(garment.accessories.includes("khan-pieu") ? { head: "khan-pieu" } : {}) }}
        colors={{ main: c1, second: c2 ?? c1 }}
        still
        className="block aspect-[1/2] w-full bg-[#fbf6ea]"
        title={`Bà vẽ ${garment.name_vi}`}
      />
      <figcaption className="py-0.5 text-center text-[0.75rem] leading-tight text-stone-500">{pending ? "Bà vẽ lại · chờ người ở đây đọc lại" : "Bà vẽ lại"}</figcaption>
    </figure>
  );
}

/** The garment as a pattern plate pinned beside Bà's notes: the same reference picture the try-on draws from. */
function GarmentPlate({ id, name }: { id: string; name: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    // floated left of the name, summary and "Khi mặc": it fills the space beside them instead of adding height
    <figure className="float-left m-0 mb-1 mr-3 w-[30%] -rotate-[1.5deg] bg-white p-1 pb-0 shadow-[0_4px_10px_rgba(60,35,10,0.25)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain image, sized by its frame */}
      <img src={asset(`/garments/${id}.webp`)} alt={`Ảnh mẫu ${name}`} className="block aspect-[3/4] w-full object-contain" loading="lazy" onError={() => setOk(false)} />
      <figcaption className="py-0.5 text-center text-[0.75rem] leading-tight text-stone-500">ảnh mẫu · AI vẽ</figcaption>
    </figure>
  );
}

/* ---------- 4½ · Bà hỏi con (#23) ---------- */

/** The choices in a stable shuffled order (the content keeps the right answer first). */
function shuffled(q: CheckQuestion) {
  const order = q.choices.map((_, i) => i);
  const seed = [...q.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = order.length - 1; i > 0; i--) {
    const k = (seed * (i + 7)) % (i + 1);
    [order[i], order[k]] = [order[k], order[i]];
  }
  return order;
}

/** One question of Bà: pick, see right or wrong and why. Unverified questions show only while drafting. */
export function Question({
  q,
  regionId,
  phase,
  onAnswer,
}: {
  q: CheckQuestion;
  regionId: string;
  phase: "pre" | "post";
  onAnswer?: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <div className="mt-2">
      <p className="m-0 text-[0.86rem] leading-snug" style={{ color: YOUNG }}>
        {q.q}
      </p>
      <div className="mt-1 flex flex-col gap-1">
        {shuffled(q).map((i) => {
          const right = i === q.answer;
          const tone = !answered
            ? "border-stone-300 hover:bg-amber-50"
            : right
              ? "border-[#5E7F4A] bg-[#5E7F4A]/10"
              : picked === i
                ? "border-[#B5452E] bg-[#B5452E]/10"
                : "border-stone-200 opacity-60";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(i);
                track("quiz_answer", { phase, item_id: q.id, correct: right, region_id: regionId });
                onAnswer?.(right);
              }}
              className={`rounded border px-2 py-1 text-left text-[0.76rem] leading-snug text-stone-800 ${tone}`}
            >
              {answered && right ? "✓ " : answered && picked === i ? "✗ " : ""}
              {q.choices[i]}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="font-hand m-0 mt-1 text-[0.92rem] leading-snug" style={{ color: OLD }}>
          {picked === q.answer ? "Đúng rồi. " : "Chưa đúng. "}
          {q.explain}
        </p>
      )}
    </div>
  );
}

const PRE_KEY = "vpdk-pre-asked";
export function preAsked(regionId: string) {
  try {
    return (JSON.parse(localStorage.getItem(PRE_KEY) ?? "[]") as string[]).includes(regionId);
  } catch {
    return true;
  }
}
function setPreAsked(regionId: string) {
  try {
    const s = JSON.parse(localStorage.getItem(PRE_KEY) ?? "[]") as string[];
    localStorage.setItem(PRE_KEY, JSON.stringify([...new Set([...s, regionId])]));
  } catch {
    // private mode: asked again next time
  }
}

/** Before the "Đến" entry, once per region: Bà asks what the reader already guesses. */
export function PreQuestion({ region, onDone }: { region: Region; onDone: () => void }) {
  const q = region.journey!.check!.pre;
  const [answered, setAnswered] = useState(false);
  const done = () => {
    setPreAsked(region.id);
    onDone();
  };
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-500">TRƯỚC KHI ĐỌC</p>
      <p className="font-hand m-0 mt-1 text-[1.2rem] leading-snug" style={{ color: OLD }}>
        Trước khi đọc, Bà hỏi con một câu. Sai cũng chẳng sao. — Bà
      </p>
      <Question q={q} regionId={region.id} phase="pre" onAnswer={() => setAnswered(true)} />
      <div className="mt-auto flex items-center gap-4 pt-3">
        {answered ? (
          <button type="button" onClick={done} className="rounded-full bg-[#27354f] px-4 py-1.5 text-sm text-amber-50">
            Đọc nhật ký →
          </button>
        ) : (
          <button type="button" onClick={done} className="text-sm text-stone-500 underline">
            Bỏ qua
          </button>
        )}
      </div>
    </div>
  );
}

/** "Bà hỏi con": three questions after reading; answering all of them earns the "đã hiểu" stamp. */
export function AskDiary({ region }: { region: Region }) {
  const qs = region.journey!.check!.post.filter((q) => q.verified || DRAFT);
  const [count, setCount] = useState(0);
  const all = count >= qs.length && qs.length > 0;
  return (
    <div className="relative flex h-full flex-col">
      <p className="font-hand m-0 text-[1.2rem] leading-snug" style={{ color: OLD }}>
        Đọc xong rồi, Bà hỏi con mấy câu nhé.
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {qs.map((q) => (
          <Question
            key={q.id}
            q={q}
            regionId={region.id}
            phase="post"
            onAnswer={() => {
              // count first, stamp outside React's update: the stamp wakes up other components (the contents page)
              if (count + 1 >= qs.length) markStamp("understood", region.id);
              setCount((c) => c + 1);
            }}
          />
        ))}
        {qs.length === 0 && <p className="text-sm text-stone-500">Câu hỏi đang được kiểm tra lại.</p>}
      </div>
      {all && (
        <motion.div
          className="pointer-events-none absolute right-[2%] top-[-2%] flex h-[3.6rem] w-[3.6rem] rotate-[12deg] flex-col items-center justify-center rounded-full border-[2.5px] border-[#5E7F4A]/80 text-center text-[#5E7F4A]"
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 16 }}
        >
          <span className="text-[0.45rem] tracking-[0.2em]">ĐÃ HIỂU</span>
          <span className="font-display px-1 text-[0.75rem] leading-tight">{place(region)}</span>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- 5 · Trang của con ---------- */

/** Bà's blank page now points to the reader's own notebook: the newest Du Ký page of this region. */
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
  const open = region.status === "open" || hasChapter(region);
  const canTry = region.status === "open";
  const book = useDuKy();
  useEffect(() => {
    ensureMigrated(data.garments);
  }, [data.garments]);
  const latest = pagesOf(book, region.id)[0];
  const garments = region.garments
    .map((id) => data.garments.find((g) => g.id === id))
    .filter((g) => !!g);
  const worn = latest?.photos.some((p) => p.kind === "real");

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
          <div className="mt-4 flex flex-1 flex-col items-center justify-start">
            {latest ? (
              <motion.div
                key={latest.id}
                className="w-[62%]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {latest.photos.length > 0 ? (
                  <DuKyPhoto photo={latest.photos[latest.photos.length - 1]} className="rotate-[-2.5deg]" />
                ) : (
                  <p className="m-0 border-2 border-dashed border-stone-300 p-4 text-center text-[0.75rem] text-stone-500">Chưa có ảnh</p>
                )}
                <p className="font-hand m-0 mt-2 text-center text-[0.95rem]" style={{ color: "#1f3a78" }}>
                  {latest.note ||
                    `${data.garments.find((g) => g.id === latest.garment_id)?.name_vi ?? ""} · ${latest.status === "planned" ? "sắp đi" : "đã mặc"}`}
                </p>
              </motion.div>
            ) : (
              <div className="flex w-[62%] flex-col items-center gap-2 border-2 border-dashed border-stone-300 p-4 text-center">
                <p className="m-0 text-[0.75rem] text-stone-500">Chỗ dán ảnh</p>
                {canTry
                  ? garments.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onTry?.(g.id)}
                        className="w-full rounded-full bg-[#27354f] px-3 py-1.5 text-[0.75rem] text-amber-50"
                      >
                        Mặc thử {g.name_vi}
                      </button>
                    ))
                  : (
                    <p className="m-0 text-[0.75rem] text-stone-500">Con mặc {garments[0]?.name_vi} đi hội rồi thì dán ảnh vào Du Ký nhé.</p>
                  )}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <a href={asset(`/du-ky?new=worn&region=${region.id}`)} className="text-[0.78rem] text-stone-700 underline">
              + Trang đã mặc
            </a>
            <a href={asset(`/du-ky?region=${region.id}`)} className="font-hand text-[1.05rem] text-[#8a4b2a] underline">
              Mở Du Ký của con →
            </a>
          </div>
          <p className="m-0 mt-1 text-[0.75rem] text-stone-500">
            Du Ký chỉ lưu trên máy của con.
          </p>
          {worn && (
            <div className="pointer-events-none absolute right-[4%] top-[10%] flex h-[3.9rem] w-[3.9rem] rotate-[10deg] flex-col items-center justify-center rounded-full border-[2.5px] border-[#2F4A6D]/70 text-center text-[#2F4A6D]/80">
              <span className="text-[0.48rem] tracking-[0.2em]">ĐÃ MẶC</span>
              <span className="font-display px-1 text-[0.75rem] leading-tight">
                {place(region)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
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
      data-guide="tabs"
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
            className={`bookmark-tab font-hand whitespace-nowrap py-1 text-left text-amber-50 shadow-[2px_2px_5px_rgba(0,0,0,0.3)] transition-transform ${portrait ? "rounded-t-md px-2 text-[0.8rem]" : "rounded-r-md pl-2 pr-3 text-[0.85rem]"}`}
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
