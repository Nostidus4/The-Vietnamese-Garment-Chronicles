"use client";

// "Hộp thư của Bà": reading a kept postcard again. The envelope opens, the card slides out and turns over,
// and Bà's words write themselves in ink, letter by letter. "Lật mặt" shows the picture side.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Region } from "@/lib/types";
import { AiLabel } from "../book/Diary";
import { plain } from "../book/Glossary";
import { asset } from "@/lib/base";
import { useDialog } from "@/lib/useDialog";

const place = (r: Region) => r.chapters?.find((c) => c.status === "open")?.province ?? r.name;
const CHAR_MS = 32;

/** Bà's last letter, opened once every open chapter's postcard is in the mailbox. */
export const FINAL_LETTER = {
  text: "Con à, vậy là con đã đi hết những nơi Bà từng đi. Bà để trống những trang cuối không phải vì Bà quên, mà vì Bà muốn con viết tiếp. Áo thì con cứ mặc theo cách của con, miễn là con hiểu nó đến từ đâu. Giờ đến lượt con: mở Du Ký ra, và viết chương của riêng con.",
  image: null as string | null,
};

export function PostcardViewer({
  region,
  letter: given,
  title,
  onClose,
}: {
  region?: Region;
  letter?: { text: string; image: string | null; signed?: string | null };
  title?: string;
  onClose: () => void;
}) {
  const reduced = !!useReducedMotion();
  const letter = given ?? region?.journey?.letter;
  const [stage, setStage] = useState<"envelope" | "out" | "back">(reduced ? "back" : "envelope");
  const [front, setFront] = useState(false);
  const [imgOk, setImgOk] = useState(!!letter?.image);
  const where = title ?? (region ? place(region) : "Gửi con");

  useEffect(() => {
    if (reduced) return;
    const a = setTimeout(() => setStage("out"), 900);
    const b = setTimeout(() => setStage("back"), 1900);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [reduced]);
  const box = useDialog<HTMLDivElement>(onClose);

  if (!letter) return null;
  const text = plain(letter.text);
  let n = 0; // running character index for the ink delay

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#140c07]/70 p-4 backdrop-blur-[2px]" role="dialog" aria-modal aria-label={`Bưu thiếp ${where}`} onClick={onClose}>
      <div ref={box} className="relative w-full max-w-[34rem] [perspective:1600px]" onClick={(e) => e.stopPropagation()}>
        {/* the envelope, opening and sliding away */}
        <AnimatePresence>
          {stage !== "back" && (
            <motion.div
              key="envelope"
              className="absolute inset-x-[6%] top-[18%] aspect-[3/2] bg-[#e9dcc0] shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: stage === "out" ? 90 : 0 }}
              exit={{ opacity: 0, y: 160 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              aria-hidden
            >
              <motion.span
                className="absolute inset-x-0 top-0 h-1/2 origin-top bg-[#dccca9]"
                style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                animate={{ rotateX: stage === "out" ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              />
              <span className="absolute left-1/2 top-[42%] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-[#B5452E] text-xs text-amber-50 shadow">
                Bà
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the card: front = picture, back = Bà's handwriting */}
        <motion.div
          className="relative aspect-[3/2] w-full [transform-style:preserve-3d]"
          initial={reduced ? false : { y: 60, scale: 0.8, opacity: 0 }}
          animate={{
            y: stage === "envelope" ? 60 : 0,
            scale: stage === "envelope" ? 0.8 : 1,
            opacity: stage === "envelope" ? 0 : 1,
            rotateY: stage === "back" && !front ? 180 : 0,
          }}
          transition={{ duration: reduced ? 0 : 0.8, ease: [0.3, 0.7, 0.2, 1] }}
        >
          <div className="absolute inset-0 overflow-hidden bg-white p-2 shadow-[0_18px_40px_rgba(0,0,0,0.45)] [backface-visibility:hidden]">
            {imgOk ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- postcard art may not exist yet */}
                <img src={asset(letter.image!)} alt={`Bưu thiếp ${where}`} className="h-full w-full object-cover" onError={() => setImgOk(false)} />
                <AiLabel className="absolute bottom-3 right-3 bg-white/85 px-1" />
              </>
            ) : (
              <div className="flex h-full w-full items-end justify-center" style={{ background: "linear-gradient(180deg, #f2b27a 0%, #e98f6f 38%, #7c8fb3 70%, #4f6d8f 100%)" }}>
                <span className="font-display mb-3 text-2xl text-white/90 drop-shadow">{where}</span>
              </div>
            )}
          </div>
          <div className="paper absolute inset-0 flex p-5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="min-w-0 flex-[3] pr-4">
              <p className="font-hand m-0 text-[clamp(1.1rem,3.2vw,1.45rem)] leading-snug text-[#8a4b2a]">
                {stage === "back" &&
                  text.split(/(\s+)/).map((w, wi) =>
                    /^\s+$/.test(w) ? (
                      w
                    ) : (
                      <span key={wi} className="inline-block whitespace-nowrap">
                        {[...w].map((ch, ci) => (
                          <span key={ci} className="ink-in" style={{ animationDelay: `${reduced ? 0 : 600 + n++ * CHAR_MS}ms` }}>
                            {ch}
                          </span>
                        ))}
                      </span>
                    ),
                  )}
              </p>
              <p className="font-hand m-0 mt-2 text-right text-lg text-[#8a4b2a]">— {letter.signed ?? "Bà"}</p>
            </div>
            <div className="flex flex-[1.2] flex-col items-end border-l border-dashed border-stone-400/70 pl-3">
              <div className="flex h-16 w-14 rotate-[3deg] flex-col items-center justify-center border-2 border-dotted border-[#B5452E]/70 bg-[#f7e4c8] text-center text-[#B5452E]">
                <span className="text-[0.5rem] tracking-[0.2em]">VIỆT NAM</span>
                <span className="font-display text-[0.75rem] leading-tight">{where}</span>
              </div>
              {/* the place may take two lines: "BẮC NINH" in one line ran out of the ring (#61) */}
              <div className="mt-2 flex h-12 w-12 rotate-[-14deg] items-center justify-center overflow-hidden rounded-full border-2 border-[#2F4A6D]/50 px-1 text-center text-[0.5rem] leading-tight tracking-[0.12em] text-[#2F4A6D]/70">
                {where.toUpperCase()}
              </div>
              <p className="font-hand m-0 mt-auto text-right text-sm text-[#27354f]">Gửi con</p>
            </div>
          </div>
        </motion.div>

        {stage === "back" && (
          <div className="mt-4 flex justify-center gap-3">
            <button type="button" onClick={() => setFront((v) => !v)} className="rounded-full border border-amber-50/60 px-4 py-1.5 text-sm text-amber-50">
              {front ? "Xem lời Bà" : "Lật mặt ảnh"}
            </button>
            <button type="button" onClick={onClose} className="rounded-full bg-amber-50 px-4 py-1.5 text-sm text-[#27354f]">
              Cất lại vào hộp
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
