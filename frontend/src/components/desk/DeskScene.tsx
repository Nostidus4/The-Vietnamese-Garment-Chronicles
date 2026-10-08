"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Bootstrap } from "@/lib/types";
import { BookCover } from "../book/BookCover";
import Flipbook, { type Resume } from "../book/Flipbook";
import { LetterPage, TocPage } from "../book/FrontMatter";
import { pageSize, useBookScale, useViewport } from "@/lib/bookScale";
import { BookSizeControl } from "./BookSizeControl";
import { DeskBackdrop } from "./DeskBackdrop";
import { useDuKy } from "@/lib/dukyBook";
import { DuKyCover } from "../duky/DuKyCover";
import { asset } from "@/lib/base";
import { HandIcon } from "../HandIcon";

type Landing = "flash" | "soft";
type Phase = "landing" | "closed" | "opening" | "open" | "closing";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Page size that lets the open spread (two pages) fit the screen, scaled by the reader's choice (#22). */
function usePageSize() {
  const vp = useViewport();
  const [scale] = useBookScale();
  return pageSize(vp, scale);
}

/**
 * The closed notebook lands on the table; a tap slides it so the spine sits in the middle and swings the cover open.
 * The pages under the cover already carry the real spread (map + Bà's note, same paper and shading as the flipbook),
 * and the flipbook is mounted invisibly underneath, so the hand-over at the end is pixel-identical — no flash.
 */
export function DeskScene({
  data,
  landing,
}: {
  data: Bootstrap;
  landing: Landing;
}) {
  const reduced = !!useReducedMotion();
  const size = usePageSize();
  const [phase, setPhase] = useState<Phase>("landing");
  // heavy things (the flipbook, the map pages) are built quietly while the book waits on the table,
  // so nothing mounts at the moment of the tap and the cover never stutters
  const [prepared, setPrepared] = useState(false);
  // back from the try-on (/?region=hue&page=own): open the book by itself and turn to that page
  const [resume] = useState<Resume>(() => {
    const q = new URLSearchParams(window.location.search);
    const region = q.get("region");
    if (!region) return null;
    const page = q.get("page");
    if (page && /^\d+$/.test(page)) return { region, page: Number(page) }; // the stop being read when the page was reloaded (#146)
    return { region, page: page === "wear" || page === "read" ? page : "own" };
  });
  const bookRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLDivElement>(null);

  // cover angle drives all the light: the cover darkens as it turns away from the window,
  // its inside brightens as it lands, and the lifted cover casts a shadow on the page beneath
  const rot = useMotionValue(0);
  const frontLight = useTransform(
    rot,
    [0, -90],
    ["brightness(1)", "brightness(0.5)"],
  );
  const backLight = useTransform(
    rot,
    [-90, -180],
    ["brightness(0.55)", "brightness(1)"],
  );
  const castShadow = useTransform(rot, [0, -25, -110], [0, 0.55, 0]);
  const lift = useTransform(rot, [0, -90, -180], [0, 1, 0]);
  const leftShadow = useTransform(rot, [-120, -180], [0, 1]);
  // phones show one page, so the opened cover leaves the stage: fade it as it lands instead of cutting it
  const coverInsideFade = useTransform(rot, [-110, -170], [1, 0]);

  useEffect(() => {
    const t = setTimeout(
      () => setPhase("closed"),
      reduced || resume ? 300 : landing === "flash" ? 1900 : 1000,
    );
    return () => clearTimeout(t);
  }, [landing, reduced, resume]);

  useEffect(() => {
    if (phase !== "closed") return;
    const t = setTimeout(() => setPrepared(true), resume ? 0 : 450);
    return () => clearTimeout(t);
  }, [phase, resume]);

  // `instant`: back from a page of the book, the cover is not shown swinging open again: the slide and the swing started
  // with the paper under the cover growing past it, a cream rectangle behind the cover for a second (#106 re-review)
  async function open(instant = false) {
    if (phase !== "closed") return;
    if (!prepared) {
      setPrepared(true); // tapped very early: build now, start moving on the next frames
      await sleep(120);
    }
    setPhase("opening");
    const shift = size.portrait ? 0 : size.w / 2;
    if (instant) {
      await sleep(250); // the flipbook is laid out behind the cover before it takes over
      rot.set(-180);
    } else if (!reduced && bookRef.current && underRef.current) {
      // slide and swing overlap, like a hand pulling the book closer while lifting the cover
      await Promise.all([
        animate(
          bookRef.current,
          { x: shift },
          { duration: 0.75, ease: [0.65, 0, 0.35, 1] },
        ),
        animate(
          underRef.current,
          { scale: 1 },
          { duration: 0.5, ease: "easeOut" },
        ),
        animate(rot, -180, {
          duration: 1.45,
          delay: 0.3,
          ease: [0.55, 0.02, 0.22, 1],
        }),
      ]);
      await sleep(220); // let the last map outline finish inking before the real book takes over
    } else {
      rot.set(-180);
    }
    setPhase("open");
  }

  // "Gấp sổ": the paper pages hand back to the identical desk copy, then the cover swings shut and the book slides home
  async function close() {
    if (phase !== "open") return;
    setPhase("closing");
    if (!reduced && bookRef.current && underRef.current) {
      await sleep(30); // one frame for the swap to paint
      await Promise.all([
        animate(rot, 0, { duration: 1.3, ease: [0.55, 0.02, 0.22, 1] }),
        animate(
          bookRef.current,
          { x: 0 },
          { duration: 0.7, delay: 0.85, ease: [0.65, 0, 0.35, 1] },
        ),
        animate(
          underRef.current,
          { scale: 0.95 },
          { duration: 0.35, delay: 0.8 }, // tuck the paper back inside the cover before it lands,
        ),
      ]);
    } else {
      rot.set(0);
      if (bookRef.current) bookRef.current.style.transform = "none";
    }
    setPhase("closed");
  }

  useEffect(() => {
    if (resume) window.history.replaceState(null, "", asset("/")); // a reload later starts on the closed book again
  }, [resume]);
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!resume || autoOpened.current || phase !== "closed" || !prepared)
      return;
    autoOpened.current = true;
    const t = setTimeout(() => open(true), 0);
    return () => clearTimeout(t);
  });

  // → (or Enter) opens the book from the keyboard while it lies closed
  useEffect(() => {
    if (phase !== "closed") return;
    const onKey = (e: KeyboardEvent) => e.key === "ArrowRight" && open();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // the first spread under the cover is Bà's letter (left, inside the cover) and the contents (right); phones show one
  // page, so the letter sits right under the cover. Same components as the flipbook, so the hand-over is seamless.
  const underPage = size.portrait ? <LetterPage /> : <TocPage data={data} onRegion={() => {}} onStart={() => {}} suggest="Huế" />;

  return (
    <main className="desk fixed inset-0 overflow-hidden">
      {!size.portrait && <BookSizeControl />}
      <DeskBackdrop />
      <div
        className="desk-light pointer-events-none absolute inset-0"
        aria-hidden
      />
      {!reduced && <SunDust />}
      <DuKyOnDesk open={phase === "open"} />
      {phase === "closed" && <WhatsInside onRead={open} />}

      {/* the real flipbook, mounted as soon as the cover starts moving so it is fully laid out before the hand-over */}
      {(prepared || phase === "open") && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${phase === "open" ? "" : "pointer-events-none opacity-0"}`}
          // ready behind the closed cover, but out of reach of Tab until it opens (#58)
          inert={phase !== "open"}
          aria-hidden={phase !== "open"}
        >
          <div className="relative">
            <div
              className={`absolute inset-y-0 right-0 ${size.portrait ? "w-full" : "w-1/2"}`}
            >
              <div className="book-shadow absolute inset-[1.5%]" />
            </div>
            {!size.portrait && (
              <div className="absolute inset-y-0 left-0 w-1/2">
                <div className="book-shadow absolute inset-[1.5%]" />
              </div>
            )}
            <Flipbook
              // page-flip measures once: a new size builds a new book, which reopens where the reader was
              key={`${size.w}x${size.h}`}
              restore={phase === "open"}
              resume={resume}
              data={data}
              width={size.w}
              height={size.h}
              portrait={size.portrait}
              active={phase === "open"}
              onClose={close}
            />
          </div>
        </div>
      )}

      {
        <div
          className={`absolute inset-0 flex items-center justify-center ${phase === "open" ? "pointer-events-none invisible" : ""}`}
          aria-hidden={phase === "open"}
        >
          <motion.div
            className="relative"
            style={{ width: size.w, height: size.h }}
            initial={
              reduced
                ? { opacity: 0 }
                : landing === "flash"
                  ? { scale: 1.65, filter: "blur(7px)", opacity: 1 }
                  : { y: -40, opacity: 0, scale: 1.02 }
            }
            animate={{ scale: 1, filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{
              duration: landing === "flash" ? 1.55 : 0.95,
              ease: [0.2, 0.8, 0.2, 1],
              delay: landing === "flash" ? 0.12 : 0.1,
            }}
          >
            <div
              ref={bookRef}
              className="book-pages absolute inset-0 [perspective:2600px]"
            >
              {/* contact shadows: right half from the start, left half grows as the cover lands */}
              <div className="book-shadow absolute inset-[1.5%]" />
              {!size.portrait && (
                <motion.div
                  className="absolute inset-y-0 right-full w-full"
                  style={{ opacity: leftShadow }}
                >
                  <div className="book-shadow absolute inset-[1.5%]" />
                </motion.div>
              )}

              {/* the page under the cover (tucked a little inside the cover while closed) */}
              <motion.div
                ref={underRef}
                className="paper --right absolute inset-0 overflow-hidden"
                initial={{ scale: 0.95 }}
              >
                {/* a picture of the page under the cover, not something to press */}
                {prepared ? (
                  <div className="flex h-full w-full flex-col p-[8%]" inert>
                    {underPage}
                  </div>
                ) : null}
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    opacity: castShadow,
                    background:
                      "linear-gradient(90deg, rgba(40,20,5,0.55), rgba(40,20,5,0.12) 45%, transparent 75%)",
                  }}
                />
              </motion.div>

              <motion.div
                className={`absolute inset-0 origin-left [transform-style:preserve-3d] ${phase === "closed" ? "cursor-pointer" : ""}`}
                style={{ rotateY: rot }}
                whileHover={
                  phase === "closed" && !reduced ? { y: -5 } : undefined
                }
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                onClick={() => open()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && open()
                }
              >
                {/* outside of the cover */}
                <motion.div
                  className="absolute inset-0 [backface-visibility:hidden]"
                  style={{ filter: frontLight }}
                >
                  <motion.div
                    className="pointer-events-none absolute inset-[2%] rounded-[6px]"
                    style={{
                      opacity: lift,
                      boxShadow: "0 22px 44px rgba(20,8,0,0.5)",
                    }}
                  />
                  <BookCover sizes={`${size.w}px`} heading />
                  {phase === "closed" && !reduced && (
                    <span className="cover-sheen" />
                  )}
                </motion.div>
                {/* inside of the cover = the left page of the spread */}
                <motion.div
                  className="paper --left absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  style={{
                    filter: backLight,
                    opacity: size.portrait ? coverInsideFade : 1,
                  }}
                >
                  {prepared && !size.portrait && (
                    <div className="flex h-full w-full flex-col p-[8%]">
                      <LetterPage />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* golden thread stitching itself along the bottom edge once the book has landed */}
            <AnimatePresence>
              {phase === "closed" && (
                <motion.svg
                  key="thread"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pointer-events-none absolute -bottom-7 left-[-4%] h-6 w-[108%] overflow-visible"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <motion.path
                    d="M0 6 C 40 2, 80 10, 120 5 S 180 4, 200 7"
                    fill="none"
                    stroke="#D9A43B"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeDasharray="5 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
                  />
                </motion.svg>
              )}
              {phase === "closed" && (
                <motion.p
                  key="hint"
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.3 } }}
                  className="font-hand absolute -bottom-14 left-0 right-0 text-center text-2xl text-[#F3EAD7]"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: [0, 1, 0.65, 1] }}
                  transition={{
                    duration: 3.2,
                    delay: 0.3, // straight away: a first visitor should not wait to learn the book opens (#65)
                    times: [0, 0.3, 0.65, 1],
                    repeat: Infinity,
                    repeatType: "mirror",
                  }}
                >
                  Bấm để mở sổ
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      }

      {landing === "flash" && !reduced && <SettlingBits />}
    </main>
  );
}

/** A few paper and fabric bits from the vortex drift down and settle on the table. */
function SettlingBits() {
  const bits = useMemo(
    () => [
      { x: 12, y: 70, c: "#B5452E", r: 38 },
      { x: 22, y: 26, c: "paper", r: -22 },
      { x: 80, y: 18, c: "#2F4A6D", r: 16 },
      { x: 88, y: 64, c: "#D9A43B", r: -40 },
      { x: 70, y: 86, c: "paper", r: 8 },
      { x: 30, y: 88, c: "#7EC8E3", r: 52 },
    ],
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className={
            b.c === "paper" ? "settle-bit settle-bit--paper" : "settle-bit"
          }
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            background: b.c === "paper" ? undefined : b.c,
          }}
          initial={{
            y: -260 - i * 40,
            rotate: b.r - 160,
            opacity: 0,
            scale: 1.4,
          }}
          animate={{ y: 0, rotate: b.r, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{
            duration: 3.6,
            delay: 0.35 + i * 0.12,
            ease: [0.2, 0.7, 0.3, 1],
            opacity: {
              duration: 4.6,
              times: [0, 0.1, 0.72, 1],
              delay: 0.35 + i * 0.12,
            },
          }}
        />
      ))}
    </div>
  );
}

/**
 * Bà's old photo, tucked under the card while the book is closed (#115): in the card's column, so the two never
 * overlap, gone when the book opens (its pages reach the photo's corner of the table) and on a screen too low for
 * both. A way back to the opening it comes from.
 */
function DeskPhoto() {
  return (
    <a href={asset("/?opening=1")} className="desk-photo group relative mt-6 block w-[11.5rem] rotate-[-6deg] transition-transform hover:rotate-[-3deg] [@media(max-height:799px)]:hidden" title="Xem lại mở đầu">
      {/* a small copy of the opening's s06 picture (scripts/optimize-images.mjs), toned like the photo while it loads.
          Eager: on a wide screen Chrome counts it as the page's largest picture */}
      <Image src={asset("/page/desk-photo.webp")} alt="" width={400} height={225} loading="eager" unoptimized className="block h-auto w-full bg-[#b39c78] sepia-[.55]" />
      {/* written in the polaroid's wide bottom margin */}
      <span className="font-hand absolute inset-x-0 bottom-1 text-center text-[0.95rem] leading-tight text-[#5b3a22]">Bà với con, ngày xưa</span>
    </a>
  );
}

/**
 * What this is for, before anything is opened (#65): the line Bà's book stands for and the ways in, so a first visitor
 * can say what the app does without reading the whole opening, and reach the fitting room in one tap.
 */
function WhatsInside({ onRead }: { onRead: () => void }) {
  // each way in looks like something to press: a frame and an arrow, not a line of text that lights up on hover (#115)
  const entry = "flex items-center gap-2 rounded-md border border-[#27354f]/25 bg-white/40 px-2 py-1.5 text-left text-[0.92rem] text-[#27354f] hover:border-[#27354f]/60 hover:bg-[#27354f]/10";
  const arrow = <span className="ml-auto pl-1 text-[#8a4b2a]" aria-hidden>›</span>;
  return (
    <>
      {/* a column on the left of the table: the card, then Bà's photo under it. From 1024px: on an iPad held upright the
          card sat on the book's corner, the buttons at the bottom are enough there (#115) */}
      <div className="absolute left-4 top-16 z-20 hidden lg:block">
        <nav aria-label="Trong sổ có gì" className="paper w-[15.5rem] rotate-[-1.2deg] rounded-md p-3 shadow-[0_10px_24px_rgba(20,8,0,0.45)]">
          <p className="font-hand m-0 text-[1.05rem] leading-snug text-[#8a4b2a]">Hiểu để mặc đúng, sáng tạo để mặc theo cách của mình.</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <button type="button" onClick={onRead} className={entry}>
              <HandIcon name="book" /> Đọc sổ của Bà theo vùng{arrow}
            </button>
            <a href={asset("/chapter/hue?entry=event")} className={entry}>
              <HandIcon name="dress" /> Vào thẳng tủ áo của Bà{arrow}
            </a>
            <a href={asset("/du-ky")} className={entry}>
              <HandIcon name="notebook" /> Ghi Du Ký những lần con mặc{arrow}
            </a>
          </div>
          <p className="m-0 mt-1.5 px-2 text-[0.75rem] leading-snug text-stone-600">Phối áo cùng Bà, Tèo chấm bộ nào đúng và nói vì sao.</p>
        </nav>
        <DeskPhoto />
      </div>
      {/* a phone held sideways: a column at the left of the book, where the table is empty; along the bottom the two
          sat on "Bấm để mở sổ" and next to the page-turn buttons (#119) */}
      <nav
        aria-label="Trong sổ có gì"
        // light paper buttons with room above them: dark ones with small words sat on "Bấm để mở sổ" (#147)
        className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2 px-3 lg:hidden [@media(max-height:500px)]:inset-x-auto [@media(max-height:500px)]:bottom-auto [@media(max-height:500px)]:left-3 [@media(max-height:500px)]:top-1/2 [@media(max-height:500px)]:-translate-y-1/2 [@media(max-height:500px)]:flex-col [@media(max-height:500px)]:items-start"
      >
        <a href={asset("/chapter/hue?entry=event")} className="desk-way">
          <HandIcon name="dress" /> Tủ áo của Bà
        </a>
        <a href={asset("/du-ky")} className="desk-way">
          <HandIcon name="notebook" /> Du Ký
        </a>
      </nav>
    </>
  );
}

/**
 * The reader's own notebook lies on the table too, in the colour they chose: a way to /du-ky. Below 1280px an open
 * book's pages reach its corner (an iPad held sideways), so it leaves while Bà's book is open (#115).
 */
function DuKyOnDesk({ open }: { open: boolean }) {
  const { cover, pages } = useDuKy();
  return (
    <a
      href={asset("/du-ky")}
      className={`group absolute bottom-[6%] left-[4%] z-10 hidden w-[8vw] min-w-[86px] max-w-[132px] rotate-[8deg] transition-transform hover:-translate-y-1 hover:rotate-[5deg] ${open ? "xl:block" : "lg:block"}`}
    >
      <div className="relative aspect-[3/4] shadow-[10px_16px_22px_rgba(20,8,0,0.55)]">
        <DuKyCover name={cover.name} color={cover.color} />
      </div>
      {/* on a dark pill: the slanted hand on the flowered cloth was easy to miss (#115) */}
      <span className="font-hand mx-auto mt-2 block w-max rounded-full bg-[#140c07]/75 px-3 py-0.5 shadow-[0_2px_6px_rgba(0,0,0,0.4)] text-center text-[1.05rem] text-[#F3EAD7] group-hover:bg-[#140c07]/80">
        Du Ký của con{pages.length ? ` · ${pages.length}` : ""}
      </span>
    </a>
  );
}

/** Dust motes drifting slowly through the window light. */
function SunDust() {
  const motes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: 8 + ((i * 37) % 46),
        y: 6 + ((i * 53) % 58),
        s: 1.5 + (i % 3),
        d: 9 + (i % 5) * 2.2,
        delay: -(i * 1.3),
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {motes.map((m, i) => (
        <span
          key={i}
          className="sun-mote"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.s,
            height: m.s,
            animationDuration: `${m.d}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
