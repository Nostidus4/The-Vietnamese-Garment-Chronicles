"use client";

// The first thing anyone sees: the logo rises out of the blank cream page, a golden light passes over it,
// then it dissolves back into the page and the story rises from that same page (OpeningPlayer's paper).

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/base";

const EASE = [0.22, 1, 0.36, 1] as const;

export function LogoIntro({ ready, onLeave, onDone }: { ready: boolean; onLeave: () => void; onDone: () => void }) {
  const reduced = !!useReducedMotion();
  const [shown, setShown] = useState(false); // logo image decoded
  const [minTime, setMinTime] = useState(false); // the logo has had its moment
  const [skippable, setSkippable] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const left = useRef(false);

  useEffect(() => {
    const a = setTimeout(() => setSkippable(true), 700);
    const b = setTimeout(() => setMinTime(true), reduced ? 1400 : 2700);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [reduced]);

  // leave once the logo has been seen and the story is ready behind it (or the viewer taps)
  const leave = () => {
    if (left.current) return;
    left.current = true;
    setLeaving(true);
    onLeave(); // the story's page starts fading in underneath at the same moment
    setTimeout(onDone, reduced ? 400 : 900);
  };
  useEffect(() => {
    if (minTime && ready && shown) leave();
  });

  return (
    <motion.div
      className="paper fixed inset-0 z-[45] flex cursor-pointer flex-col items-center justify-center px-6"
      onClick={() => skippable && ready && leave()}
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? (reduced ? 0.4 : 0.9) : 0.6, ease: [0.4, 0, 0.2, 1] }}
      role="img"
      aria-label="Việt Phục Du Ký – Hiểu để mặc đúng, sáng tạo để mặc theo cách của mình"
    >
      <motion.div
        className="relative w-[min(72vw,520px)]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10, filter: "blur(6px)" }}
        animate={
          !shown
            ? {}
            : leaving
              ? reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.03, y: -14, filter: "blur(4px)" }
              : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
        }
        transition={{ duration: leaving ? 0.9 : 1.2, ease: EASE, delay: leaving ? 0 : 0.25 }}
      >
        {/* logo-mark.png: Logo.png with its cream background made transparent, so it sits on the page with no frame */}
        <Image
          src={asset("/page/logo-mark.png")}
          alt=""
          width={1118}
          height={802}
          priority
          sizes="(max-width: 720px) 78vw, 560px"
          className="h-auto w-full"
          onLoad={() => setShown(true)}
        />
        {/* a golden light passing over the logo once, like light on gold thread */}
        {!reduced && shown && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{
              background: "linear-gradient(105deg, transparent 35%, rgba(255,220,140,0.85) 50%, transparent 65%)",
              backgroundSize: "300% 100%",
              // the light only touches the drawing itself, never the empty page around it
              maskImage: `url(${asset("/page/logo-mark.png")})`,
              WebkitMaskImage: `url(${asset("/page/logo-mark.png")})`,
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
            initial={{ backgroundPositionX: "100%", opacity: 0 }}
            animate={{ backgroundPositionX: "0%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, delay: 1.1, ease: "easeInOut" }}
          />
        )}
      </motion.div>
      <motion.p
        className="font-hand m-0 mt-2 text-center text-lg text-[#2F4A6D]/80 sm:text-xl"
        initial={{ opacity: 0, y: 6 }}
        animate={shown && !leaving ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: leaving ? 0 : 1.0, ease: EASE }}
      >
        Hiểu để mặc đúng – Sáng tạo để mặc theo cách của mình.
      </motion.p>
    </motion.div>
  );
}
