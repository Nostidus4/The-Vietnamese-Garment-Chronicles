"use client";

// A region opens on its own page (a verse everyone there knows, Bà's line, the chapters by province).
// A chapter in the trip layout is walked like a trip with Bà: each stop is a spread —
//   left: young Bà's page, tinted by the light of that hour · right: "Hôm nay", Tí at the same place with a real photo.
// It ends with an envelope glued to the page: Bà's postcard.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { markStamp, unmarkStamp, useStamps } from "@/lib/stamps";
import type { Bootstrap, Festival, Photo, Region, Stop, TimeOfDay } from "@/lib/types";
import { WeatherNote } from "../chapter/WeatherNote";
import { PostcardViewer } from "../duky/PostcardViewer";
import { DateLine, DRAFT, Entry, KeepsakeArt, Margin, OLD, Pencil, place, Polaroid, TeoNotes, YOUNG } from "./Diary";
import { GameBody, HOW_TO } from "./Games";
import { TeoPin } from "./TeoPin";
import { RichText } from "./Glossary";
import { asset } from "@/lib/base";

/** Where someone who wants to write a province's chapter starts (README, "Viết một chương cho tỉnh của bạn"). */
export const CONTRIBUTE_URL = "https://github.com/Nostidus4/The-Vietnamese-Garment-Chronicles#viết-một-chương-cho-tỉnh-của-bạn";

/** The way to write a chapter: a guide on GitHub, so the link says it opens another site in a new tab. */
function WriteLink() {
  return (
    <a
      href={CONTRIBUTE_URL}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#8a4b2a] px-3 py-1 text-[0.8rem] text-[#8a4b2a] hover:bg-[#8a4b2a] hover:text-amber-50"
    >
      Viết một chương cho tỉnh của con <span className="text-[0.7rem] opacity-80">(mở GitHub ↗)</span>
    </a>
  );
}

const HOUR: Record<TimeOfDay, string> = {
  dawn: "SÁNG SỚM",
  morning: "BUỔI SÁNG",
  noon: "TRƯA",
  afternoon: "CHIỀU",
  evening: "CHIỀU TỐI",
  night: "ĐÊM",
};
const TODAY_INK = "#3c4a5c";

/* ---------- the region's opening page ---------- */

export function RegionIntro({
  region,
  onOpen,
  onProvinceHover,
}: {
  region: Region;
  onOpen: () => void;
  onProvinceHover: (name: string | null) => void;
}) {
  const intro = region.intro;
  const open = region.chapters.filter((c) => c.status === "open");
  const waiting = region.chapters.filter((c) => c.status === "waiting");
  const drafts = region.chapters.filter((c) => c.status === "draft");
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.62rem] tracking-[0.3em] text-stone-500">{region.status === "open" || open.length ? "MIỀN" : "VÙNG ĐANG CHỜ"}</p>
      <h2 className="font-display m-0 text-[1.9rem] leading-tight" style={{ color: YOUNG }}>
        {region.name}
      </h2>
      {intro && intro.verse.length > 0 && (
        <blockquote className="font-hand m-0 mt-3 border-l-2 border-[#D9A43B] pl-3 text-[1.15rem] italic leading-snug" style={{ color: YOUNG }}>
          {intro.verse.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
          {intro.verse_by && <span className="mt-0.5 block text-[0.75rem] not-italic text-stone-500">— {intro.verse_by}</span>}
        </blockquote>
      )}
      {intro && <Margin text={intro.line} />}

      <p className="m-0 mt-4 text-[0.6rem] tracking-[0.3em] text-stone-500">CÁC CHƯƠNG</p>
      {drafts.map((c) =>
        DRAFT ? (
          <button
            key={c.province}
            type="button"
            onClick={onOpen}
            onMouseEnter={() => onProvinceHover(c.province)}
            onMouseLeave={() => onProvinceHover(null)}
            className="group mt-1 flex items-baseline gap-2 rounded-md border-2 border-dashed border-[#8a4b2a] px-3 py-2 text-left"
          >
            <span className="font-display text-[1.05rem]" style={{ color: YOUNG }}>
              {c.province}
            </span>
            <span className="font-hand min-w-0 flex-1 truncate text-[0.95rem]" style={{ color: OLD }}>
              {c.title} · bản nháp chờ cộng đồng duyệt
            </span>
            <span className="text-sm">Đọc →</span>
          </button>
        ) : (
          <p key={c.province} className="font-hand m-0 mt-1 rounded-md border border-dashed border-stone-400 px-3 py-2 text-[0.95rem]" style={{ color: OLD }}>
            <b className="font-display font-normal">{c.province}</b>: {c.title}. Đang cùng người ở đó viết và đọc lại, sắp mở.
          </p>
        ),
      )}
      {open.map((c) => (
        <button
          key={c.province}
          type="button"
          onClick={onOpen}
          onMouseEnter={() => onProvinceHover(c.province)}
          onMouseLeave={() => onProvinceHover(null)}
          className="group mt-1 flex items-baseline gap-2 rounded-md bg-[#27354f] px-3 py-2 text-left text-amber-50 shadow"
        >
          <span className="font-display text-[1.05rem]">{c.province}</span>
          <span className="font-hand min-w-0 flex-1 truncate text-[0.95rem] text-amber-100/90">{c.title}</span>
          <span className="text-sm transition-transform group-hover:translate-x-1">Đọc →</span>
        </button>
      ))}
      {/* one invitation instead of a faint list that looked unfinished (#61): readable, and it says it leaves the app */}
      {waiting.length > 0 && (
        <div className="mt-auto rounded-md border border-dashed border-[#8a4b2a]/50 bg-white/35 px-3 py-2">
          <p className="m-0 text-[0.68rem] tracking-[0.18em] text-stone-600">MỜI CON VIẾT TIẾP</p>
          <p className="m-0 mt-1 text-[0.8rem] leading-relaxed text-stone-700">
            {waiting.map((c, i) => (
              <span key={c.province} onMouseEnter={() => onProvinceHover(c.province)} onMouseLeave={() => onProvinceHover(null)} className="hover:text-[#8a4b2a]">
                {i > 0 && " · "}
                {c.province}
              </span>
            ))}
          </p>
          <p className="font-hand m-0 mt-1 text-[0.95rem] leading-snug" style={{ color: OLD }}>
            Bà chưa đi tới những nơi này. Ai ở đó viết, Bà dán vào sổ.
          </p>
          <WriteLink />
        </div>
      )}
    </div>
  );
}

/* ---------- the chapter's title page with the hand-drawn route ---------- */

export function ChapterTitle({
  region,
  reached,
  onStop,
  onBack,
}: {
  region: Region;
  reached: number; // how many stops the reader has turned to
  onStop: (i: number) => void;
  onBack: () => void;
}) {
  const j = region.journey!;
  const ch = j.chapter!;
  useEffect(() => markStamp("arrived", region.id), [region.id]);
  return (
    <div className="flex h-full flex-col">
      <button type="button" onClick={onBack} className="self-start text-[0.7rem] text-stone-500 hover:underline">
        ‹ {region.name}
      </button>
      <p className="m-0 mt-1 text-[0.62rem] tracking-[0.3em] text-stone-500">CHƯƠNG · {ch.province.toUpperCase()}</p>
      <h2 className="font-display m-0 text-[1.65rem] leading-tight" style={{ color: YOUNG }}>
        {ch.title}
      </h2>
      <blockquote className="font-hand m-0 mt-2 border-l-2 border-[#D9A43B] pl-3 text-[1.05rem] italic leading-snug" style={{ color: YOUNG }}>
        {ch.verse.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
        <span className="mt-0.5 block text-[0.72rem] not-italic text-stone-500">— {ch.verse_by}</span>
      </blockquote>
      <Margin text={ch.line} />
      {j.community_review && (
        <p className="m-0 mt-2 rounded border border-dashed border-[#8a4b2a]/60 bg-[#f7e4c8]/60 px-2 py-1 text-[0.7rem] leading-snug text-[#6b3c12]">
          Chương này viết từ lời kể, <b>đang chờ người ở {ch.province} đọc lại và góp ý</b>. Tên gọi, ý nghĩa trang phục và nghi lễ có thể chưa chính xác.{" "}
          <a href={CONTRIBUTE_URL} target="_blank" rel="noreferrer" className="underline">
            Góp ý cho Bà (mở GitHub ↗)
          </a>
        </p>
      )}
      <RouteSketch stops={j.stops} reached={reached} onStop={onStop} />
      <ChapterContents region={region} />
      {j.wear[0] && (
        <div className="mt-auto text-[0.85rem] [&_p]:text-[0.9rem] [&_span]:text-[0.8rem]">
          <WeatherNote regionId={region.id} garmentId={j.wear[0].garment} place={ch.province} />
        </div>
      )}
    </div>
  );
}

/** What the chapter holds and the stamps still to collect: a small checklist for the trip. */
function ChapterContents({ region }: { region: Region }) {
  const j = region.journey!;
  const { stop: got, game: won, postcard } = useStamps();
  const stamps = j.stops.filter((s) => s.stamp);
  const games = j.stops.filter((s) => s.game);
  const have = stamps.filter((s) => got.includes(`${region.id}:${s.id}`)).length;
  const played = games.filter((s) => won.includes(`${region.id}:${s.id}`)).length;
  return (
    <div className="mt-1 rounded-md bg-white/35 px-3 py-2">
      <p className="m-0 text-[0.64rem] tracking-[0.22em] text-stone-500">TRONG CHƯƠNG NÀY</p>
      <ul className="m-0 mt-1 grid list-none grid-cols-2 gap-x-3 gap-y-0.5 p-0 text-[0.76rem] text-stone-700">
        <li>🗺 {j.stops.length} điểm dừng</li>
        <li>🎲 {played}/{games.length} trò chơi</li>
        <li>📮 tem {have}/{stamps.length}</li>
        <li>✉ {postcard.includes(region.id) ? "đã có bưu thiếp" : "1 bưu thiếp cuối chương"}</li>
      </ul>
      <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Tem các điểm dừng">
        {stamps.map((s) => {
          const on = got.includes(`${region.id}:${s.id}`);
          return (
            <span
              key={s.id}
              className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 px-0.5 text-center text-[0.38rem] leading-[1.05] [overflow-wrap:anywhere] ${on ? "rotate-[-8deg] border-[#B5452E] text-[#B5452E]" : "border-dashed border-stone-400/60 text-stone-400"}`}
              title={s.stamp ?? ""}
            >
              {s.stamp}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** The day with Bà drawn as a dotted path; the stops the reader has reached are inked in. */
function RouteSketch({ stops, reached, onStop }: { stops: Stop[]; reached: number; onStop: (i: number) => void }) {
  const reduced = !!useReducedMotion();
  const n = stops.length;
  const pts = stops.map((_, i) => ({ x: 8 + (i * 84) / Math.max(1, n - 1), y: i % 2 ? 36 : 20 }));
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const q = pts[i - 1];
    return `${acc} C ${q.x + 6} ${q.y}, ${p.x - 6} ${p.y}, ${p.x} ${p.y}`;
  }, "");
  const done = Math.max(0, Math.min(n - 1, reached - 1));
  return (
    <div className="relative mt-3">
      <svg viewBox="0 0 100 56" className="w-full" aria-hidden>
        {/* the river the day follows */}
        <path d="M0 46 C 18 38, 30 54, 50 46 S 82 38, 100 47" fill="none" stroke="#9fc1d6" strokeWidth="5" strokeLinecap="round" opacity=".45" />
        <path d={d} fill="none" stroke="#a8998a" strokeWidth=".7" strokeDasharray="1.6 1.4" />
        {reached > 0 && (
          <motion.path
            d={d}
            fill="none"
            stroke="#B5452E"
            strokeWidth="1"
            strokeDasharray="1.6 1.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: n > 1 ? done / (n - 1) : 1 }}
            transition={{ duration: reduced ? 0 : 1.2, ease: "easeInOut" }}
          />
        )}
      </svg>
      {stops.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onStop(i)}
          className="absolute flex flex-col items-center text-center"
          style={{ left: `${pts[i].x}%`, top: `${(pts[i].y / 56) * 100}%`, transform: "translate(-50%, -6px)" }}
          title={`Đến ${s.place}`}
        >
          <span className={`block h-3 w-3 rounded-full border-2 ${i < reached ? "border-[#B5452E] bg-[#B5452E]" : "border-stone-400 bg-[#f3ead7]"}`} />
          <span className="font-hand mt-0.5 max-w-[4.5rem] text-[0.72rem] leading-tight" style={{ color: i < reached ? OLD : "#8a8175" }}>
            {s.place}
          </span>
        </button>
      ))}
      <div className="h-6" />
    </div>
  );
}

/* ---------- one stop: Bà's page ---------- */

/** Each stop has its own stamp, pressed on the page the first time the reader turns to it. */
function StopStamp({ label, regionId, stopId }: { label: string; regionId: string; stopId: string }) {
  const reduced = !!useReducedMotion();
  const { stop } = useStamps();
  const on = stop.includes(`${regionId}:${stopId}`);
  return (
    <motion.div
      key={on ? "on" : "off"}
      className={`flex h-[2.6rem] w-[2.6rem] shrink-0 flex-col items-center justify-center rounded-full border-2 text-center ${on ? "border-[#B5452E]/80 text-[#B5452E]" : "border-dashed border-stone-400/60 text-stone-400/70"}`}
      initial={on && !reduced ? { scale: 1.9, opacity: 0, rotate: -30 } : false}
      animate={{ scale: 1, opacity: 1, rotate: -10 }}
      transition={{ type: "spring", stiffness: 380, damping: 15, delay: 0.5 }}
      aria-label={on ? `Tem ${label}` : `Chỗ đóng tem ${label}`}
    >
      <span className="text-[0.34rem] tracking-[0.18em]">{on ? "ĐÃ ĐẾN" : "TEM"}</span>
      <span className="font-display px-0.5 text-[0.48rem] leading-tight">{label}</span>
    </motion.div>
  );
}

export function StopDiary({ stop, index, data, chapterPlace, regionId }: { stop: Stop; index: number; data: Bootstrap; chapterPlace: string; regionId: string }) {
  return (
    <div className="relative flex h-full flex-col">
      <div className={`hour-${stop.time} pointer-events-none absolute -inset-[14%]`} aria-hidden />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="m-0 text-[0.64rem] tracking-[0.22em] text-stone-500">
            ĐIỂM {index + 1} · {stop.place.toUpperCase()} · {HOUR[stop.time]}
          </p>
          {stop.stamp && <StopStamp label={stop.stamp} regionId={regionId} stopId={stop.id} />}
        </div>
        <div>
          {stop.hat ? (
            <HatReveal hat={stop.hat} />
          ) : stop.frame ? (
            // a scrapbook page: the picture glued across the top, Bà's words under it
            <div className="mb-1 mt-2 flex justify-center">
              <Polaroid frame={stop.frame} i={index % 3} className={stop.entry.length > 380 ? "w-[62%]" : "w-[74%]"} />
            </div>
          ) : stop.keepsake ? (
            <KeepsakeArt kind={stop.keepsake} label={chapterPlace} />
          ) : null}
          <DateLine>
            <RichText text={stop.date} />
          </DateLine>
          <Entry text={stop.entry} size={stop.entry.length < 330 ? "1.06rem" : "0.98rem"} />
        </div>
        {stop.ti && <Pencil text={stop.ti} />}
        <div className="mt-auto">
          {stop.margin && <Margin text={stop.margin} />}
          <TeoNotes notes={stop.teo} data={data} />
        </div>
      </div>
    </div>
  );
}

/** Nón bài thơ: hold it up to the sun (hover, press, or focus) and the hidden bridge and line appear. */
function HatReveal({ hat }: { hat: NonNullable<Stop["hat"]> }) {
  const [lit, setLit] = useState(false);
  const [hatOk, setHatOk] = useState(!!hat.hat);
  const [hiddenOk, setHiddenOk] = useState(!!hat.hidden);
  return (
    <figure className="float-right mb-1 ml-3 mt-1 w-[44%] text-center">
      <button
        type="button"
        aria-pressed={lit}
        aria-label="Soi chiếc nón lên nắng"
        className="relative block aspect-square w-full cursor-pointer select-none rounded-full"
        onPointerEnter={() => setLit(true)}
        onPointerLeave={() => setLit(false)}
        onPointerDown={(e) => {
          e.stopPropagation();
          setLit(true);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setLit((v) => !v)}
        onFocus={() => setLit(true)}
        onBlur={() => setLit(false)}
      >
        {/* the sun behind the hat */}
        <motion.span
          className="absolute inset-[-8%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,236,170,0.95), rgba(255,210,120,0.35) 55%, transparent 72%)" }}
          animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.8 }}
          transition={{ duration: 0.5 }}
          aria-hidden
        />
        {hatOk ? (
          // eslint-disable-next-line @next/next/no-img-element -- optional art; falls back to the drawn hat
          <img src={asset(hat.hat!)} alt="" className="absolute inset-0 h-full w-full rounded-full object-cover" onError={() => setHatOk(false)} />
        ) : (
          <HatSvg lit={lit} />
        )}
        <motion.span className="absolute inset-[16%]" animate={{ opacity: lit ? 0.85 : 0 }} transition={{ duration: 0.6 }} aria-hidden>
          {hiddenOk ? (
            // eslint-disable-next-line @next/next/no-img-element -- optional art; falls back to the drawn silhouette
            <img src={asset(hat.hidden!)} alt="" className="h-full w-full object-contain mix-blend-multiply" onError={() => setHiddenOk(false)} />
          ) : (
            <HiddenSvg />
          )}
        </motion.span>
      </button>
      <figcaption className="font-hand mt-1 min-h-[2.4em] text-[0.8rem] leading-tight" style={{ color: lit ? "#1f3a78" : "#8a8175" }}>
        {lit ? `“${hat.line}”` : "Rê chuột hoặc chạm để soi nón lên nắng"}
      </figcaption>
    </figure>
  );
}

function HatSvg({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="47" fill={lit ? "#f3e6b8" : "#d9c894"} stroke="#a58f55" strokeWidth="1" style={{ transition: "fill .5s" }} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <line key={i} x1="50" y1="50" x2={50 + 47 * Math.cos(a)} y2={50 + 47 * Math.sin(a)} stroke="#b9a468" strokeWidth=".5" opacity=".7" />;
      })}
      {[12, 22, 32, 41].map((r) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#a58f55" strokeWidth=".45" opacity=".75" />
      ))}
      <circle cx="50" cy="50" r="2.5" fill="#a58f55" />
    </svg>
  );
}

/** The picture pressed between the leaves: a six-span bridge over the river and two swallows. */
function HiddenSvg() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <g fill="none" stroke="#2F4A6D" strokeWidth="1.6" strokeLinecap="round">
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M${14 + i * 12} 60 Q ${20 + i * 12} 44, ${26 + i * 12} 60`} />
        ))}
        <path d="M12 60 H88" />
        <path d="M10 70 C 30 66, 60 74, 90 68" strokeWidth="1" opacity=".7" />
        <path d="M30 30 q 4 -4 8 0 q 4 -4 8 0" strokeWidth="1.2" />
        <path d="M56 24 q 3 -3 6 0 q 3 -3 6 0" strokeWidth="1" />
      </g>
    </svg>
  );
}

/* ---------- one stop: Tí today ---------- */

function PhotoCredit({ photo }: { photo: Photo }) {
  return (
    <figcaption className="mt-0.5 truncate text-right text-[0.62rem] text-stone-600">
      Ảnh:{" "}
      <a href={photo.source_url} target="_blank" rel="noreferrer" className="underline">
        {photo.credit}
      </a>
      , {photo.license}
    </figcaption>
  );
}

function TodayPhoto({ photo, tilt = 1.5 }: { photo: Photo; tilt?: number }) {
  return (
    <figure className="m-0 bg-white p-1.5 pb-1 shadow-[0_6px_14px_rgba(40,30,20,0.25)]" style={{ rotate: `${tilt}deg` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a real credited photo from content */}
      <img src={asset(photo.image)} alt={photo.alt} className="block aspect-[4/3] w-full object-cover" loading="lazy" />
      <PhotoCredit photo={photo} />
    </figure>
  );
}

/**
 * An empty photo corner left on purpose: where the reader's own picture of this place goes, with the way to put one
 * in the Du Ký. Fills the pages that had nothing on them but a line or two (#61).
 */
function PasteSlot({ regionId, place }: { regionId: string; place: string }) {
  return (
    <a
      href={asset(`/du-ky?new=worn&region=${regionId}`)}
      className="group mt-3 flex w-[62%] rotate-[1.5deg] flex-col items-center self-center bg-white/70 p-2 pb-3 shadow-[0_4px_10px_rgba(60,35,10,0.18)] transition-transform hover:rotate-0"
    >
      <span className="grid aspect-[4/3] w-full place-items-center border-2 border-dashed border-stone-400/70 text-[1.6rem] text-stone-400" aria-hidden>
        📷
      </span>
      <span className="font-hand mt-1.5 text-center text-[0.95rem] leading-snug" style={{ color: OLD }}>
        Chỗ dán ảnh của con. Tới {place} thì chụp một tấm, dán vào Du Ký nhé.
      </span>
      <span className="mt-0.5 text-[0.72rem] text-[#8a4b2a] underline group-hover:no-underline">Mở một trang Du Ký →</span>
    </a>
  );
}

/** The right page of a stop that has no game, no "Hôm nay" and no festival: the reader's corner, not a blank page. */
export function StopPaste({ stop, regionId }: { stop: Stop; regionId: string }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="m-0 text-[0.64rem] tracking-[0.22em] text-stone-500">HÔM NAY · {stop.place.toUpperCase()}</p>
      <p className="font-hand m-0 mt-1 text-[1.12rem] leading-snug" style={{ color: TODAY_INK }}>
        Tí chưa đi lại chỗ này. Trang này để dành cho con.
      </p>
      <PasteSlot regionId={regionId} place={stop.place} />
    </div>
  );
}

export function StopToday({ stop, regionId }: { stop: Stop; regionId: string }) {
  const t = stop.today!;
  const items = stop.items.filter((it) => !it.community_review || DRAFT);
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.64rem] tracking-[0.22em] text-stone-500">HÔM NAY · TÍ ĐI LẠI {stop.place.toUpperCase()}</p>
      {t.photo && (
        <div className="mt-2 w-[88%] self-center">
          <TodayPhoto photo={t.photo} />
        </div>
      )}
      <p className="font-hand m-0 mt-2 text-[1.12rem] leading-snug" style={{ color: TODAY_INK }}>
        {t.title}
      </p>
      <p className="m-0 mt-1 text-[0.78rem] leading-relaxed text-stone-700">
        <RichText text={t.text} />
      </p>
      {t.tips.length > 0 && (
        <ul className="m-0 mt-2 list-none space-y-0.5 p-0 text-[0.72rem] leading-snug text-stone-600">
          {t.tips.map((tip) => (
            <li key={tip} className="flex gap-1.5">
              <span className="text-[#5E7F4A]" aria-hidden>
                ✓
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
      {!t.photo && <PasteSlot regionId={regionId} place={stop.place} />}
      {items.length > 0 && (
        <div className="mt-auto border-t border-dashed border-stone-400/60 pt-1.5">
          <p className="font-hand m-0 text-[0.9rem]" style={{ color: OLD }}>
            Bà ghi thêm:
          </p>
          <ul className="m-0 list-none space-y-0.5 p-0">
            {items.map((it) => (
              <li key={it.id} className="font-hand text-[0.85rem] leading-snug" style={{ color: YOUNG }}>
                <b className="font-normal underline decoration-[#D9A43B] decoration-2">{it.title}</b>: <RichText text={it.text} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- a stop's game; winning it turns the page to Tí's "Hôm nay" ---------- */

export function StopGame({ stop, regionId, data }: { stop: Stop; regionId: string; data: Bootstrap }) {
  const game = stop.game!;
  const { game: won } = useStamps();
  const key = `${regionId}:${stop.id}`;
  const [view, setView] = useState<"game" | "today">("game");
  const [round, setRound] = useState(0); // remounts the game for "Chơi lại"
  const isWon = won.includes(key);
  if (view === "today" && stop.today)
    return (
      <div className="flex h-full flex-col">
        <button type="button" onClick={() => setView("game")} className="self-start text-[0.7rem] text-stone-500 hover:underline">
          ‹ {game.title}
        </button>
        <div className="min-h-0 flex-1">
          <StopToday stop={stop} regionId={regionId} />
        </div>
      </div>
    );
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.64rem] tracking-[0.22em] text-stone-500">TRÒ CHƠI · {stop.place.toUpperCase()}</p>
      <div className="flex items-start gap-2">
        <p className="font-display m-0 flex-1 text-[1.15rem] leading-tight" style={{ color: YOUNG }}>
          {game.title}
        </p>
        {!isWon && (
          <button
            type="button"
            onClick={() => setRound((r) => r + 1)}
            className="mt-0.5 shrink-0 rounded-full border border-stone-400/70 px-2 py-0.5 text-[0.68rem] text-stone-600 hover:bg-stone-200/60"
            title="Bắt đầu lại trò chơi này từ đầu"
          >
            ↺ Làm lại
          </button>
        )}
        <TeoPin
          corner={false}
          label="Cách chơi: Tèo hướng dẫn"
          badge="Cách chơi"
          data={data}
          notes={[{ title: "Cách chơi", text: "", steps: HOW_TO[game.kind], sources: [], verified: true }]}
        />
      </div>
      <p className="m-0 mt-0.5 text-[0.72rem] leading-snug text-stone-600">
        <RichText text={game.intro} /> <span className="whitespace-nowrap text-[#8a4b2a]">📌 Bấm ghim để xem cách chơi.</span>
      </p>
      <div className="mt-2 min-h-0 flex-1">
        {isWon ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full flex-col">
            <p className="font-hand m-0 text-[1.05rem] leading-snug text-[#5E7F4A]">✓ {game.done}</p>
            {game.teo && (
              <div className="mt-2">
                <TeoNotes notes={[game.teo]} data={data} corner={false} />
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
              {stop.today && (
                <button type="button" onClick={() => setView("today")} className="rounded-full bg-[#27354f] px-4 py-1.5 text-sm text-amber-50">
                  Xem “Hôm nay” của Tí →
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  unmarkStamp("game", key);
                  setRound((r) => r + 1);
                }}
                className="rounded-full border border-[#27354f] px-4 py-1.5 text-sm text-[#27354f] hover:bg-[#27354f]/10"
              >
                ↺ Chơi lại
              </button>
            </div>
          </motion.div>
        ) : (
          <GameBody key={round} game={game} onWin={() => markStamp("game", key)} />
        )}
      </div>
    </div>
  );
}

/* ---------- the festivals of the year, with the one of this month first ---------- */

export function FestivalBoard({ stop, chapterPlace }: { stop: Stop; chapterPlace: string }) {
  const fests = stop.festivals.filter((f) => !f.community_review || DRAFT);
  const month = new Date().getMonth() + 1;
  const now = fests.find((f) => f.month === month);
  const next = [...fests].filter((f) => f.month).sort((a, b) => ((a.month! - month + 12) % 12) - ((b.month! - month + 12) % 12))[0];
  // always open on the first festival; the reader taps through the others (the board says how many are left)
  const [sel, setSel] = useState<Festival | undefined>(fests[0]);
  const [seen, setSeen] = useState<string[]>(fests[0] ? [fests[0].id] : []);
  if (!sel) return null;
  const left = fests.length - seen.length;
  return (
    <div className="flex h-full flex-col">
      <p className="m-0 text-[0.64rem] tracking-[0.22em] text-stone-500">LỄ HỘI QUANH NĂM Ở {chapterPlace.toUpperCase()}</p>
      <p className="font-hand m-0 mt-0.5 text-[0.92rem]" style={{ color: OLD }}>
        {now ? `Nếu con đến ${chapterPlace} tháng này: ${now.name}!` : `Tháng này chưa có hội lớn. Gần nhất là ${next?.name ?? fests[0].name}.`}
      </p>
      {/* every festival on one row, like tabs; a tick once the reader has looked at it */}
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${fests.length}, minmax(0, 1fr))` }} role="tablist" aria-label="Các lễ hội">
        {fests.map((f) => {
          const on = f.id === sel.id;
          const done = seen.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              title={f.name}
              onClick={() => {
                setSel(f);
                setSeen((s) => (s.includes(f.id) ? s : [...s, f.id]));
              }}
              className={`relative flex min-h-[2.3rem] items-center justify-center rounded-md border px-1 py-0.5 text-center text-[0.62rem] leading-tight ${on ? "border-[#27354f] bg-[#27354f] text-amber-50" : done ? "border-stone-400 text-stone-600" : "border-[#B5452E] bg-amber-50/70 text-[#7a2e1f] hover:bg-amber-100"}`}
            >
              <span className="line-clamp-2">{f.name.replace(/\s*\(.*\)$/, "")}</span>
              {done && !on && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#5E7F4A] px-1 text-[0.5rem] text-white" aria-label="đã xem">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="m-0 mt-1 text-[0.66rem] text-[#8a4b2a]" aria-live="polite">
        {left > 0 ? `👆 Bấm từng ô để xem lễ hội. Còn ${left} lễ hội con chưa xem.` : "✓ Con đã xem hết các lễ hội ở đây."}
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={sel.id}
          className="mt-2 flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* only the festival's own photo: the stop's drawing is already on the left page, twice looked like a bug (#61) */}
          {sel.photo && (
            <div className="w-[86%] self-center">
              <TodayPhoto photo={sel.photo} tilt={-1.2} />
            </div>
          )}
          <p className="m-0 mt-2 text-[0.68rem] text-stone-500">
            {sel.time} · {sel.place}
          </p>
          <p className="font-hand m-0 text-[0.95rem] leading-snug" style={{ color: YOUNG }}>
            <RichText text={sel.text} />
          </p>
          {sel.review && (
            <p className="m-0 mt-1 text-[0.76rem] leading-relaxed text-stone-700">
              <span className="font-hand text-[0.9rem]" style={{ color: TODAY_INK }}>
                ✎ Tí:{" "}
              </span>
              {sel.review}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------- the end of a chapter: an envelope and where to go next ---------- */

export function EnvelopeLetter({ region }: { region: Region }) {
  const letter = region.journey!.letter!;
  const chapterPlace = place(region);
  const reduced = !!useReducedMotion();
  const { postcard } = useStamps();
  const [open, setOpen] = useState(false);
  const [imgOk, setImgOk] = useState(!!letter.image);
  const kept = postcard.includes(region.id);
  const [reread, setReread] = useState(false);
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="closed"
            type="button"
            onClick={() => setOpen(true)}
            className="relative aspect-[3/2] w-[82%] rotate-[-2deg] bg-[#e9dcc0] shadow-[0_10px_22px_rgba(60,35,10,0.3)]"
            exit={reduced ? { opacity: 0 } : { rotateX: 70, opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
            aria-label="Mở phong thư của Bà"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-[#dccca9]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} aria-hidden />
            <span className="absolute left-1/2 top-[42%] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-[#B5452E] text-[0.7rem] text-amber-50 shadow" aria-hidden>
              Bà
            </span>
            <span className="font-hand absolute bottom-3 right-4 text-[1rem] text-[#27354f]">Gửi con, từ {chapterPlace}</span>
          </motion.button>
        ) : (
          <motion.div
            key="open"
            className="flex w-full flex-col items-center"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-[3/2] w-[86%] rotate-[1.5deg] overflow-hidden bg-white p-1.5 shadow-[0_10px_22px_rgba(60,35,10,0.3)]">
              {imgOk ? (
                // eslint-disable-next-line @next/next/no-img-element -- postcard art may not exist yet
                <img src={asset(letter.image!)} alt={`Bưu thiếp ${chapterPlace}`} className="h-full w-full object-cover" onError={() => setImgOk(false)} />
              ) : (
                <div
                  className="flex h-full w-full items-end justify-center"
                  style={{ background: "linear-gradient(180deg, #f2b27a 0%, #e98f6f 38%, #7c8fb3 70%, #4f6d8f 100%)" }}
                >
                  <span className="font-display mb-2 text-[1.1rem] text-white/90 drop-shadow">{chapterPlace}</span>
                </div>
              )}
            </div>
            <p className="font-hand m-0 mt-3 w-[90%] text-[1rem] leading-snug" style={{ color: OLD }}>
              <RichText text={letter.text} /> <span className="whitespace-nowrap">— Bà</span>
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={kept}
                onClick={() => markStamp("postcard", region.id)}
                className="rounded-full bg-[#27354f] px-4 py-1.5 text-sm text-amber-50 disabled:opacity-60"
              >
                {kept ? "Đã cất vào Hộp thư ✓" : "Cất bưu thiếp vào Du Ký"}
              </button>
              {kept && (
                <button type="button" onClick={() => setReread(true)} className="font-hand text-[1rem] text-[#8a4b2a] underline">
                  Đọc lại thư
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {reread && <PostcardViewer region={region} onClose={() => setReread(false)} />}
    </div>
  );
}

export const LEAVE_CHAPTER = "vpdk-leave-chapter";

export function ChapterEnd({ region }: { region: Region }) {
  const onBack = () => window.dispatchEvent(new Event(LEAVE_CHAPTER));
  const ch = region.journey!.chapter!;
  const waiting = region.chapters.filter((c) => c.status === "waiting").slice(0, 6);
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="m-0 text-[0.62rem] tracking-[0.3em] text-stone-500">HẾT CHƯƠNG</p>
      <h2 className="font-display m-0 text-[1.5rem] leading-tight" style={{ color: YOUNG }}>
        {ch.province}: {ch.title}
      </h2>
      <p className="font-hand m-0 mt-3 text-[1.05rem] leading-snug" style={{ color: OLD }}>
        {region.name} còn nhiều nơi Bà chưa kịp đi. Những chương ấy đang chờ người ở đó viết tiếp. — Bà
      </p>
      <p className="m-0 mt-2 text-[0.78rem] text-stone-500">
        {waiting.map((c) => c.province).join(" · ")}
        {region.chapters.length - 1 > waiting.length ? " …" : ""}
      </p>
      <div className="mt-5 flex flex-col items-start gap-2">
        <button type="button" onClick={onBack} className="rounded-full border border-stone-700 px-4 py-1.5 text-sm hover:bg-stone-800 hover:text-amber-50">
          ‹ Về trang {region.name}
        </button>
        <a href={asset("/du-ky")} className="font-hand text-[1.05rem] text-[#8a4b2a] underline">
          Mở Du Ký của con →
        </a>
        <WriteLink />
      </div>
    </div>
  );
}
