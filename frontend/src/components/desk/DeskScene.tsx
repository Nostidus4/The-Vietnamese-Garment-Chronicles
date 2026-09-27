"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Bootstrap } from "@/lib/types";
import { BookCover } from "../book/BookCover";
import Flipbook from "../book/Flipbook";

type Landing = "flash" | "soft";
type Phase = "landing" | "closed" | "opening" | "open";

/** Page size that lets the open spread (two pages) fit the screen. */
function usePageSize() {
  const [vp, setVp] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const portrait = vp.w < 760;
  const h = portrait ? Math.min(vp.h * 0.7, (vp.w * 0.86) / 0.75) : Math.min(vp.h * 0.76, (vp.w * 0.46) / 0.75);
  return { w: Math.round(h * 0.75), h: Math.round(h), portrait };
}

export function DeskScene({ data, landing }: { data: Bootstrap; landing: Landing }) {
  const reduced = !!useReducedMotion();
  const size = usePageSize();
  const [phase, setPhase] = useState<Phase>("landing");
  const coverRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("closed"), reduced ? 300 : landing === "flash" ? 1900 : 1000);
    return () => clearTimeout(t);
  }, [landing, reduced]);

  async function open() {
    if (phase !== "closed") return;
    setPhase("opening");
    const shift = size.portrait ? 0 : size.w / 2;
    if (!reduced && bookRef.current && coverRef.current) {
      // slide so the spine sits in the middle, then swing the cover open like a real notebook
      await animate(bookRef.current, { x: shift }, { duration: 0.55, ease: [0.65, 0, 0.35, 1] });
      await animate(coverRef.current, { rotateY: [0, -180] }, { duration: 1.25, ease: [0.6, 0.02, 0.2, 1] });
    }
    setPhase("open");
  }

  return (
    <main className="desk fixed inset-0 overflow-hidden">
      <DeskProps />

      <div className="absolute inset-0 flex items-center justify-center">
        {phase !== "open" ? (
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
            transition={{ duration: landing === "flash" ? 1.55 : 0.95, ease: [0.2, 0.8, 0.2, 1], delay: landing === "flash" ? 0.12 : 0.1 }}
          >
            <div ref={bookRef} className="absolute inset-0 [perspective:2400px]">
              {/* contact shadow of the notebook on the table */}
              <div className="book-shadow absolute inset-[2%]" />
              {/* first page under the cover */}
              <div className="paper absolute inset-y-[2.5%] left-[3%] right-[2.5%] rounded-r-[4px]" style={{ boxShadow: "inset 8px 0 18px rgba(80,50,20,0.18)" }} />
              <motion.div
                ref={coverRef}
                className={`book-closed absolute inset-0 origin-left [transform-style:preserve-3d] ${phase === "closed" ? "cursor-pointer" : ""}`}
                whileHover={phase === "closed" && !reduced ? { y: -5 } : undefined}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                onClick={open}
                role="button"
                aria-label="Mở cuốn Việt Phục Du Ký"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
              >
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <BookCover priority sizes={`${size.w}px`} />
                  {phase === "closed" && !reduced && <span className="cover-sheen" />}
                </div>
                <div className="paper absolute inset-y-[2.5%] left-[3%] right-[2.5%] rounded-l-[4px] [backface-visibility:hidden] [transform:rotateY(180deg)]" />
              </motion.div>
            </div>

            {/* golden thread stitching itself along the bottom edge once the book has landed */}
            {phase === "closed" && (
              <svg className="pointer-events-none absolute -bottom-7 left-[-4%] h-6 w-[108%] overflow-visible" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
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
              </svg>
            )}
            {phase === "closed" && (
              <motion.p
                className="font-hand absolute -bottom-16 left-0 right-0 text-center text-xl text-[#F3EAD7]/85"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: [0, 1, 0.65, 1] }}
                transition={{ duration: 3.2, delay: 0.9, times: [0, 0.3, 0.65, 1], repeat: Infinity, repeatType: "mirror" }}
              >
                Chạm để mở sách
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <Flipbook data={data} width={size.w} height={size.h} startPage={1} portrait={size.portrait} />
          </motion.div>
        )}
      </div>

      {landing === "flash" && !reduced && <SettlingBits />}
    </main>
  );
}

/** A few paper and fabric bits from the vortex drift down and settle on the table. */
function SettlingBits() {
  const bits = useMemo(
    () =>
      [
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
          className={b.c === "paper" ? "settle-bit settle-bit--paper" : "settle-bit"}
          style={{ left: `${b.x}%`, top: `${b.y}%`, background: b.c === "paper" ? undefined : b.c }}
          initial={{ y: -260 - i * 40, rotate: b.r - 160, opacity: 0, scale: 1.4 }}
          animate={{ y: 0, rotate: b.r, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 3.6, delay: 0.35 + i * 0.12, ease: [0.2, 0.7, 0.3, 1], opacity: { duration: 4.6, times: [0, 0.1, 0.72, 1], delay: 0.35 + i * 0.12 } }}
        />
      ))}
    </div>
  );
}

/** Things on Bà's sewing table, kept to the edges so the book owns the centre. */
function DeskProps() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* an old photo of Bà (the S06 memory), tucked in the corner */}
      <div className="desk-photo absolute left-[4%] top-[7%] hidden w-[14vw] min-w-[140px] rotate-[-7deg] sm:block">
        <Image src="/opening/s06.png" alt="" width={420} height={236} sizes="16vw" className="block h-auto w-full sepia-[.55]" />
      </div>
      {/* thread spools */}
      <svg className="absolute right-[3%] top-[18%] hidden w-[15vw] min-w-[130px] rotate-[8deg] sm:block" viewBox="0 0 120 70">
        {[
          ["#B5452E", 20],
          ["#2F4A6D", 58],
          ["#D9A43B", 96],
        ].map(([c, x]) => (
          <g key={String(c)} transform={`translate(${x} 36)`}>
            <ellipse cx="0" cy="0" rx="17" ry="17" fill="#3b2616" opacity="0.35" transform="translate(3 4)" />
            <circle r="17" fill="#e7d3ad" />
            <circle r="13" fill={String(c)} />
            {Array.from({ length: 6 }, (_, i) => (
              <circle key={i} r={11 - i * 1.6} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
            ))}
            <circle r="3" fill="#6b4a2f" />
          </g>
        ))}
      </svg>
      {/* measuring tape */}
      <svg className="absolute bottom-[4%] left-[2%] w-[26vw] min-w-[220px]" viewBox="0 0 260 90">
        <path d="M5 70 C 60 20, 120 95, 180 40 S 250 30, 255 60" fill="none" stroke="#3b2616" strokeOpacity="0.3" strokeWidth="15" transform="translate(3 5)" />
        <path d="M5 70 C 60 20, 120 95, 180 40 S 250 30, 255 60" fill="none" stroke="#E8C24A" strokeWidth="13" />
        <path d="M5 70 C 60 20, 120 95, 180 40 S 250 30, 255 60" fill="none" stroke="#6b4a2f" strokeWidth="5" strokeDasharray="1 6" />
      </svg>
      {/* a pinned sky-blue silk swatch (the colour of Bà's áo dài) */}
      <div className="silk-swatch absolute bottom-[8%] right-[6%] hidden h-[16vh] w-[11vw] min-w-[100px] rotate-[9deg] sm:block" />
      {/* tailor's chalk */}
      <div className="absolute bottom-[26%] right-[14%] h-5 w-9 rotate-[-18deg] rounded-sm bg-[#f4efe4] shadow-md" style={{ clipPath: "polygon(0 0, 100% 0, 88% 100%, 12% 100%)" }} />
    </div>
  );
}
