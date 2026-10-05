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
import { useDuKy } from "@/lib/dukyBook";
import { DuKyCover } from "../duky/DuKyCover";
import { asset } from "@/lib/base";

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
    return { region, page: q.get("page") === "wear" ? "wear" : "own" };
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
      reduced ? 300 : landing === "flash" ? 1900 : 1000,
    );
    return () => clearTimeout(t);
  }, [landing, reduced]);

  useEffect(() => {
    if (phase !== "closed") return;
    const t = setTimeout(() => setPrepared(true), 450);
    return () => clearTimeout(t);
  }, [phase]);

  async function open() {
    if (phase !== "closed") return;
    if (!prepared) {
      setPrepared(true); // tapped very early: build now, start moving on the next frames
      await sleep(120);
    }
    setPhase("opening");
    const shift = size.portrait ? 0 : size.w / 2;
    if (!reduced && bookRef.current && underRef.current) {
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
    const t = setTimeout(open, 350);
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
      <Image
        src={asset("/page/Desk.webp")}
        alt=""
        fill
        priority
        quality={88}
        sizes="100vw"
        className="desk-bg object-cover"
      />
      <div
        className="desk-light pointer-events-none absolute inset-0"
        aria-hidden
      />
      {!reduced && <SunDust />}
      <DeskProps />
      <DuKyOnDesk />

      {/* the real flipbook, mounted as soon as the cover starts moving so it is fully laid out before the hand-over */}
      {(prepared || phase === "open") && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${phase === "open" ? "" : "pointer-events-none opacity-0"}`}
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
                {prepared ? <div className="flex h-full w-full flex-col p-[8%]">{underPage}</div> : null}
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
                onClick={open}
                role="button"
                aria-label="Mở cuốn Việt Phục Du Ký"
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
                  <BookCover priority sizes={`${size.w}px`} />
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
                  className="font-hand absolute -bottom-16 left-0 right-0 text-center text-xl text-[#F3EAD7]/85"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: [0, 1, 0.65, 1] }}
                  transition={{
                    duration: 3.2,
                    delay: 0.9,
                    times: [0, 0.3, 0.65, 1],
                    repeat: Infinity,
                    repeatType: "mirror",
                  }}
                >
                  Chạm để mở sách
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

/** The table photo already holds the sewing things; we only tuck Bà's old photo into the sunlight. */
function DeskProps() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="desk-photo absolute left-[3%] top-[42%] hidden w-[12vw] min-w-[130px] max-w-[190px] rotate-[-7deg] md:block">
        <Image
          src={asset("/opening/s06.webp")}
          alt=""
          width={420}
          height={236}
          sizes="14vw"
          className="block h-auto w-full sepia-[.55]"
        />
      </div>
    </div>
  );
}

/** The reader's own notebook lies on the table too, in the colour they chose: a way to /du-ky. */
function DuKyOnDesk() {
  const { cover, pages } = useDuKy();
  return (
    <a
      href={asset("/du-ky")}
      className="group absolute bottom-[6%] left-[4%] z-10 hidden w-[8vw] min-w-[86px] max-w-[132px] rotate-[8deg] transition-transform hover:-translate-y-1 hover:rotate-[5deg] lg:block"
      aria-label="Mở Du Ký của con"
    >
      <div className="relative aspect-[3/4] shadow-[10px_16px_22px_rgba(20,8,0,0.55)]">
        <DuKyCover name={cover.name} color={cover.color} />
      </div>
      <span className="font-hand mt-2 block text-center text-[#F3EAD7]/85 group-hover:text-[#F3EAD7]">
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
