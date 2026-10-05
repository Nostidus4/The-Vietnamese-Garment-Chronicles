"use client";

// Two overlays of the wardrobe room: Bà's "Con sắp đi đâu?" and the side sheet where the garment's story, Hỏi Tèo,
// the quiz and the shops wait until the reader wants them.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import type { Bootstrap, Garment } from "@/lib/types";
import { AskTeo } from "../chapter/AskTeo";
import { ChapterQuiz } from "../chapter/ChapterQuiz";
import { ShopList } from "../chapter/ShopList";
import { StoryCard } from "../chapter/StoryCard";

/* ---------- "Con sắp đi đâu?" ---------- */

export function EventPicker({ data, onPick }: { data: Bootstrap; onPick: (occasion: string | null) => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#140c07]/70 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Con sắp đi đâu?" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="paper w-full max-w-md rounded-xl p-6 shadow-2xl" initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }}>
        <p className="m-0 text-[0.65rem] uppercase tracking-[0.25em] text-stone-500">Phòng thử đồ của Bà</p>
        <p className="font-hand m-0 mt-1 text-[1.6rem] leading-tight text-[#8a4b2a]">Con sắp đi đâu? Bà lấy áo cho hợp.</p>
        <div className="mt-4 grid gap-2">
          {data.occasions.map((o) => (
            <button key={o.id} type="button" onClick={() => onPick(o.id)} className="rounded-lg border border-stone-400/70 bg-white/50 px-4 py-2.5 text-left hover:border-[#27354f] hover:bg-white">
              {o.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onPick(null)} className="mt-3 text-sm text-stone-600 underline">
          Chưa biết, cho con xem hết
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ---------- the side sheet ---------- */

export type SheetTab = "story" | "teo" | "quiz-pre" | "quiz-post" | "shops";
const SHEET_TABS: { id: SheetTab; name: string }[] = [
  { id: "story", name: "Bộ áo" },
  { id: "teo", name: "Hỏi Tèo" },
  { id: "quiz-pre", name: "Việt hay không?" },
  { id: "shops", name: "Thuê / may" },
];

export function AboutSheet({
  tab,
  onTab,
  onClose,
  garment,
  data,
  regionId,
}: {
  tab: SheetTab | null; // null: closed
  onTab: (t: SheetTab) => void;
  onClose: () => void;
  garment: Garment;
  data: Bootstrap;
  regionId: string;
}) {
  useEffect(() => {
    if (!tab) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, onClose]);
  const body: Record<SheetTab, ReactNode> = {
    story: <StoryCard garment={garment} sources={data.sources} />,
    teo: <AskTeo key={garment.id} garment={garment} data={data} />,
    "quiz-pre": <ChapterQuiz regionId={regionId} phase="pre" />,
    "quiz-post": <ChapterQuiz regionId={regionId} phase="post" />,
    shops: <ShopList garmentId={garment.id} garmentName={garment.name_vi} />,
  };
  return (
    <AnimatePresence>
      {tab && (
        <motion.div key="sheet" className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Hiểu bộ áo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-[#140c07]/50" />
          <motion.aside
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-[var(--paper)] p-4 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[32rem] sm:rounded-none sm:rounded-l-2xl"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <div role="tablist" className="flex flex-wrap gap-1">
                {SHEET_TABS.map((t) => {
                  const on = tab === t.id || (t.id === "quiz-pre" && tab === "quiz-post");
                  return (
                    <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => onTab(t.id)} className={`rounded-full px-3 py-1 text-sm ${on ? "bg-[#27354f] text-amber-50" : "border border-stone-400/70"}`}>
                      {t.name}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={onClose} className="ml-auto text-sm underline">
                Đóng
              </button>
            </div>
            {body[tab]}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
