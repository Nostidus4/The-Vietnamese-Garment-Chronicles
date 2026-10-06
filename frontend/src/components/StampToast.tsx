"use client";

// A new stamp in the Tủ tem used to arrive without a word (#63): it is now pressed on screen for a moment, like a
// post-office stamp, and says where it went.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { NEW_STAMP } from "@/lib/stamps";
import { useBootstrap } from "@/lib/useBootstrap";

const WORD = { arrived: { label: "ĐÃ ĐẾN", color: "#B5452E" }, understood: { label: "ĐÃ HIỂU", color: "#5E7F4A" } } as const;
type Got = { kind: keyof typeof WORD; id: string; at: number };

export function StampToast() {
  const { data } = useBootstrap();
  const reduced = !!useReducedMotion();
  const [got, setGot] = useState<Got | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ kind: keyof typeof WORD; id: string }>).detail;
      if (WORD[d.kind]) setGot({ ...d, at: Date.now() });
    };
    window.addEventListener(NEW_STAMP, on);
    return () => window.removeEventListener(NEW_STAMP, on);
  }, []);
  useEffect(() => {
    if (!got) return;
    const t = setTimeout(() => setGot(null), 3800);
    return () => clearTimeout(t);
  }, [got]);
  const place = got && data?.regions.find((r) => r.id === got.id)?.name.split("/")[0].trim();
  const w = got && WORD[got.kind];
  return (
    <AnimatePresence>
      {got && w && (
        <motion.div
          key={got.at}
          role="status"
          className="pointer-events-none fixed bottom-24 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-[#fbf6ea] px-4 py-2.5 text-sm text-[#27354f] shadow-[0_10px_24px_rgba(20,8,0,0.35)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-[2.5px] text-center"
            style={{ borderColor: w.color, color: w.color }}
            initial={reduced ? false : { scale: 1.8, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: -10, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.15 }}
            aria-hidden
          >
            <span className="text-[0.45rem] tracking-[0.14em]">{w.label}</span>
            <span className="font-display px-0.5 text-[0.55rem] leading-tight">{place}</span>
          </motion.span>
          <span>
            <b>Tem mới:</b> {w.label === "ĐÃ ĐẾN" ? "đã đến" : "đã hiểu"} {place}.
            <span className="block text-xs text-stone-600">Đã dán vào Tủ tem trong Du Ký của con.</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
