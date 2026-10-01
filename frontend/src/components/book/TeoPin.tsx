"use client";

// Tèo's notes as a pin stuck in the corner of the page. The page keeps all its room for Bà's words;
// a click on the pin opens Tèo's sticky notes in the middle of the screen, like one of Bà's letters.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Bootstrap } from "@/lib/types";

export type TeoNoteView = {
  title?: string;
  text: string;
  unesco?: number | null;
  sources: string[];
  verified: boolean;
  steps?: string[]; // a how-to (game rules): numbered steps, no source line
};

/** The red pushpin; `corner` puts it in the page padding (bottom right) so it never covers text. */
export function TeoPin({
  notes,
  data,
  corner = true,
  label,
  badge,
}: {
  notes: TeoNoteView[];
  data: Pick<Bootstrap, "sources">;
  corner?: boolean;
  label?: string;
  badge?: string; // text on the pin instead of the number of notes, e.g. "Cách chơi"
}) {
  const [open, setOpen] = useState(false);
  if (!notes.length) return null;
  const unesco = notes.some((n) => n.unesco);
  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`teo-pin group z-10 flex items-center gap-1 ${corner ? "absolute -bottom-[1.9rem] -right-[1.6rem]" : "relative"}`}
        aria-label={label ?? `Tèo ghim ${notes.length} ghi chú${unesco ? ", có di sản UNESCO" : ""}`}
        title="Tèo ghim ghi chú ở đây"
      >
        <PinSvg />
        <span className="rounded-full bg-[#fbe99a] px-1.5 text-[0.62rem] font-semibold leading-4 text-[#1f3a78] shadow-[1px_1px_3px_rgba(60,40,0,0.3)] transition-transform group-hover:scale-110">
          {badge ?? notes.length}
          {!badge && unesco ? " · UNESCO" : ""}
        </span>
      </button>
      <TeoModal open={open} onClose={() => setOpen(false)} notes={notes} data={data} heading={badge ? "Tèo chỉ con" : undefined} />
    </>
  );
}

function PinSvg() {
  return (
    <svg viewBox="0 0 24 30" className="h-7 w-6 -rotate-12 drop-shadow-[1px_2px_1.5px_rgba(40,20,0,0.35)] transition-transform group-hover:-translate-y-0.5 group-hover:rotate-0" aria-hidden>
      <path d="M12 17 L12 29" stroke="#9aa0a6" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 15 h12 l-2 -5 h-8 z" fill="#8e2a1c" />
      <circle cx="12" cy="8" r="7" fill="#c0392b" />
      <circle cx="9.5" cy="5.5" r="2.2" fill="#fff" opacity=".45" />
    </svg>
  );
}

/** Tèo's notes in the middle of the screen: a stack of sticky notes pinned to a sheet, closed by Esc or a click outside. */
export function TeoModal({ open, onClose, notes, data, heading = "Tèo tra lại" }: { open: boolean; onClose: () => void; notes: TeoNoteView[]; data: Pick<Bootstrap, "sources">; heading?: string }) {
  const reduced = !!useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="teo"
          data-anchored
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#140c07]/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal
          aria-label="Ghi chú của Tèo"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-[26rem]"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? { opacity: 0 } : { scale: 0.4, rotate: -14, y: 120, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { scale: 0.6, rotate: 8, y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
          >
            {/* the pin holding the stack */}
            <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
              <PinSvg />
            </div>
            <div className="flex flex-col gap-3">
              {notes.map((n, i) => (
                <StickyNote key={i} i={i} note={n} data={data} heading={i === 0 ? heading : undefined} />
              ))}
            </div>
            <button type="button" onClick={onClose} className="mx-auto mt-4 block rounded-full bg-amber-50 px-4 py-1.5 text-sm text-[#27354f]">
              Gỡ ghim, đọc tiếp
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function StickyNote({ note, i, data, heading }: { note: TeoNoteView; i: number; data: Pick<Bootstrap, "sources">; heading?: ReactNode }) {
  const src = note.sources.map((id) => data.sources[id]).find(Boolean);
  return (
    <motion.div
      className="relative bg-[#fbe99a] px-5 pb-3 pt-5 text-[0.95rem] leading-relaxed text-[#1f3a78] shadow-[3px_8px_18px_rgba(40,25,0,0.35)]"
      style={{ rotate: `${[-1.2, 1.4, -0.6, 0.9][i % 4]}deg`, backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.25), transparent 30%)" }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + i * 0.08 }}
    >
      {heading && <p className="font-hand m-0 mb-1 text-[1.15rem] text-[#8a4b2a]">{heading}</p>}
      {note.title && <b className="font-display block text-[1.05rem]">{note.title}</b>}
      {note.unesco && <b className="mr-1.5 rounded-sm bg-[#1f3a78] px-1.5 py-0.5 text-[0.7rem] text-[#fbe99a]">UNESCO {note.unesco}</b>}
      {note.text}
      {note.steps && (
        <ol className="m-0 mt-2 list-none space-y-1.5 p-0">
          {note.steps.map((s, k) => (
            <li key={k} className="flex gap-2">
              <span className="font-display flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f3a78] text-[0.7rem] text-[#fbe99a]">{k + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
      {!note.steps && (
      <span className="mt-2 block text-[0.72rem] opacity-80">
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
      )}
      <span className="font-hand block text-right text-[0.95rem] opacity-90">– Tèo{note.verified ? "" : ", đang kiểm tra"}</span>
    </motion.div>
  );
}
