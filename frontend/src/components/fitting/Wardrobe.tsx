"use client";

// The pieces of Bà's wardrobe room: who wears (Nữ · Nam · Con), the wardrobe with its drawers, the "Đang mặc" list,
// and the card that drops from the top when the look is done. The room itself (state, Compass, saving) lives in
// ChapterView; everything here only shows and reports.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { asset } from "@/lib/base";
import type { Bootstrap, CompassResult, CompassState, Garment, WardrobeItem, WardrobeSlot } from "@/lib/types";
import type { PieceState } from "@/lib/wardrobe";
import { pickOption, pickedOption, zoneControl } from "@/lib/zones";
import { ArtThumb, DRAWN } from "./PaperDoll";
import type { Selection } from "@/lib/types";
import { useDialog } from "@/lib/useDialog";
import { WHO_BACKDROP, WHO_BOX, WhoChoices, type Who } from "./WhoChoices";
import { keptSaid, lowerFirst } from "@/lib/text";

export type { Who } from "./WhoChoices";

/* ---------- who wears ---------- */

export function WhoPicker({ value, onPick, onClose }: { value: Who | null; onPick: (w: Who) => void; onClose?: () => void }) {
  const reduced = !!useReducedMotion();
  // Esc keeps who was wearing; on the first visit there is no one yet, so it takes the first choice, Nữ (#109)
  const box = useDialog<HTMLDivElement>(onClose ?? (() => onPick("nu")));
  return (
    <motion.div className={WHO_BACKDROP} role="dialog" aria-modal="true" aria-label="Ai mặc?" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div ref={box} className={WHO_BOX} initial={reduced ? false : { y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }}>
        <WhoChoices value={value} onPick={onPick} />
        {onClose && value && (
          <button type="button" onClick={onClose} className="mt-4 text-sm text-stone-600 underline">
            Giữ nguyên
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---------- the wardrobe ---------- */

export type Drawer = "set" | "head" | "acc" | "feet" | "style";
export const DRAWERS: { id: Drawer; name: string; slots: WardrobeSlot[] }[] = [
  { id: "set", name: "Bộ áo", slots: ["set"] },
  { id: "head", name: "Khăn & nón", slots: ["head", "neck"] },
  { id: "acc", name: "Phụ kiện", slots: ["hand", "face", "waist", "chest"] },
  { id: "feet", name: "Giày dép", slots: ["feet"] },
  { id: "style", name: "Màu & phần áo", slots: [] },
];


export function WardrobePanel({
  data,
  items,
  stateOf,
  noteOf,
  whyOf,
  onToggle,
  why,
  onWhyClose,
  garment,
  selection,
  onSelection,
  occasion,
  open,
  onOpen,
  onLookPreview,
}: {
  data: Bootstrap;
  items: WardrobeItem[];
  stateOf: (it: WardrobeItem) => PieceState;
  noteOf: (it: WardrobeItem) => string;
  whyOf?: (it: WardrobeItem) => string; // the label in a sentence, for the tooltip
  onToggle: (it: WardrobeItem) => void;
  why?: { id: string; text: string } | null; // why the piece just tapped cannot be worn
  onWhyClose?: () => void;
  garment: Garment | null;
  selection: Selection | null;
  onSelection: (s: Selection) => void;
  occasion: string;
  open: Drawer;
  onOpen: (d: Drawer) => void;
  onLookPreview: (garmentId: string) => void;
}) {
  const reduced = !!useReducedMotion();
  const drawer = DRAWERS.find((d) => d.id === open)!;
  const shown = items.filter((it) => drawer.slots.includes(it.slot));
  const badIn = (d: (typeof DRAWERS)[number]) => items.some((it) => d.slots.includes(it.slot) && stateOf(it) === "bad");
  return (
    <section className="wardrobe" aria-label="Tủ áo">
      <div className="wardrobe-doors" aria-hidden />
      <div role="tablist" aria-label="Ngăn tủ" className="wardrobe-tabs">
        {DRAWERS.map((d) => (
          <button key={d.id} type="button" role="tab" aria-selected={open === d.id} onClick={() => onOpen(d.id)} className={`wardrobe-tab ${open === d.id ? "wardrobe-tab-on" : ""}`}>
            {d.name}
            {badIn(d) && <span className="ml-1 text-[#b5452e]">●</span>}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={open}
          role="tabpanel"
          className="wardrobe-body"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
          transition={{ duration: reduced ? 0.12 : 0.24 }}
        >
          {open === "style" ? (
            <StyleDrawer data={data} garment={garment} selection={selection} onSelection={onSelection} />
          ) : (
            <ul className="wardrobe-grid">
              {shown.map((it, i) => {
                const st = stateOf(it);
                const name = it.garment ? data.garments.find((g) => g.id === it.garment)?.name_vi : data.accessories[it.accessory!]?.name_vi;
                return (
                  <motion.li key={it.id} className="relative" initial={reduced ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : i * 0.03 }}>
                    <button
                      type="button"
                      aria-pressed={st === "worn"}
                      // no aria-label: the name and the note printed on the piece are its name (#58)
                      aria-disabled={st === "off" || st === "lock"}
                      onClick={() => onToggle(it)}
                      className={`w-item w-item-${st}`}
                      title={whyOf?.(it) ?? noteOf(it)}
                    >
                      <span className="w-hanger" aria-hidden />
                      <ItemPicture item={it} />
                      <span className="block text-[0.75rem] font-semibold leading-tight">{name}</span>
                      <span className="block text-[0.75rem] leading-tight text-stone-600">{noteOf(it)}</span>
                    </button>
                    {it.garment && (
                      <button type="button" onClick={() => onLookPreview(it.garment!)} className="tap mt-0.5 flex w-full items-center justify-center text-[0.75rem] text-[#27354f] underline">
                        Xem ảnh mẫu
                      </button>
                    )}
                    {/* the reason, pinned under the piece that was tapped, not at the foot of the screen (#116) */}
                    {why?.id === it.id && (
                      <span
                        role="status"
                        className={`absolute top-full z-10 mt-1 flex w-[13.5rem] max-w-[calc(300%+1.1rem)] items-start gap-2 rounded-lg bg-[#27354f] px-3 py-2 text-left text-[0.8rem] leading-snug text-amber-50 shadow-lg ${["left-0", "left-1/2 -translate-x-1/2", "right-0"][i % 3]}`}
                      >
                        <span className="min-w-0 flex-1">{why.text}</span>
                        <button type="button" aria-label="Đóng" onClick={onWhyClose} className="shrink-0 text-amber-50/80">
                          ✕
                        </button>
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>
      <p className="m-0 px-3 pb-2 text-[0.75rem] text-stone-600">Dịp: {data.occasions.find((o) => o.id === occasion)?.name}</p>
    </section>
  );
}

/** The picture on a wardrobe card: the garment's reference plate, or a small drawing of the accessory. */
function ItemPicture({ item }: { item: WardrobeItem }) {
  const [broken, setBroken] = useState(false);
  if (item.garment && !broken)
    // eslint-disable-next-line @next/next/no-img-element -- static export; the 240 px copy (scripts/optimize-images.mjs, #120)
    return <img src={asset(`/garments/thumb/${item.garment}.webp`)} alt="" className="mx-auto h-16 w-full object-contain" loading="lazy" onError={() => setBroken(true)} />;
  if (DRAWN.has(item.art)) return <ArtThumb art={item.art} className="mx-auto block h-16 w-full" />;
  return <span className="mx-auto grid h-16 place-items-center text-[1.7rem]" aria-hidden>🧵</span>;
}

/** Colours (max 2: the main cloth, then the second piece) and the zone options of the garment. */
function StyleDrawer({ data, garment, selection, onSelection }: { data: Bootstrap; garment: Garment | null; selection: Selection | null; onSelection: (s: Selection) => void }) {
  if (!garment || !selection) return <p className="m-0 p-2 text-sm text-stone-600">Chọn một bộ áo trước, rồi mở ngăn này để đổi màu và các phần của áo.</p>;
  const toggle = (c: string) => {
    const on = selection.colors.includes(c);
    const colors = on ? selection.colors.filter((x) => x !== c) : selection.colors.length >= 2 ? [selection.colors[1], c] : [...selection.colors, c];
    onSelection({ ...selection, colors });
  };
  return (
    <div className="space-y-4 p-1">
      <div>
        <p className="m-0 mb-1.5 text-sm font-semibold text-[#27354f]">Màu vải <span className="font-normal text-stone-600">· tối đa 2: vải chính, rồi phần phối</span></p>
        <div className="flex flex-wrap gap-2.5">
          {garment.colors.map((c) => {
            const i = selection.colors.indexOf(c);
            return (
              // the colour's name under the cloth: a tooltip alone never shows on a phone (#62)
              <button key={c} type="button" onClick={() => toggle(c)} aria-pressed={i >= 0} className="flex w-14 flex-col items-center gap-1">
                <span className={`fabric ${i >= 0 ? "fabric-on" : ""}`} style={{ backgroundColor: data.colors[c]?.hex }}>
                  {i >= 0 && <span className="fabric-n">{i + 1}</span>}
                </span>
                <span className="text-center text-[0.75rem] leading-tight text-stone-600">{data.colors[c]?.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      {garment.zones
        .filter((z) => zoneControl(z) === "options")
        .map((z) => {
          const picked = pickedOption(selection, z.part);
          return (
            <div key={z.part}>
              <p className="m-0 mb-1.5 text-sm font-semibold text-[#27354f]">{z.part}</p>
              <div className="flex flex-wrap gap-1.5">
                {z.options.map((o) => (
                  <button key={o.id} type="button" aria-pressed={picked === o.id} onClick={() => onSelection(pickOption(selection, z.part, o.id))} className={`chip-paper ${picked === o.id ? "chip-paper-on" : ""}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      {garment.zones.some((z) => zoneControl(z) === "locked") && (
        <p className="m-0 text-[0.75rem] text-stone-600">🔒 Giữ nguyên: {garment.zones.filter((z) => zoneControl(z) === "locked").map((z) => z.part).join(" · ")}</p>
      )}
    </div>
  );
}

/* ---------- Đang mặc ---------- */

export function OutfitList({
  data,
  worn,
  bad,
  occasion,
  onOccasion,
  onTakeOff,
}: {
  data: Bootstrap;
  worn: WardrobeItem[];
  bad: Set<string>;
  occasion: string;
  onOccasion: (id: string) => void;
  onTakeOff: (it: WardrobeItem) => void;
}) {
  const nameOf = (it: WardrobeItem) => (it.garment ? data.garments.find((g) => g.id === it.garment)?.name_vi : data.accessories[it.accessory!]?.name_vi) ?? it.id;
  const order: WardrobeSlot[] = ["head", "face", "neck", "chest", "set", "waist", "hand", "feet"];
  const list = [...worn].sort((a, b) => Number(bad.has(b.accessory ?? "")) - Number(bad.has(a.accessory ?? "")) || order.indexOf(a.slot) - order.indexOf(b.slot));
  return (
    <section className="outfit" aria-label="Đang mặc">
      <p className="outfit-title">Đang mặc</p>
      {list.length === 0 ? (
        <p className="m-0 text-sm text-stone-600">Chưa mặc gì. Mở tủ, bấm một bộ áo.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          <AnimatePresence initial={false}>
            {list.map((it) => {
              const isBad = bad.has(it.accessory ?? "");
              return (
                <motion.li key={it.id} layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className={`outfit-chip ${isBad ? "outfit-chip-bad" : ""}`}>
                  <span className="min-w-0 flex-1 truncate">{isBad && "⛔ "}{nameOf(it)}</span>
                  <button type="button" onClick={() => onTakeOff(it)} aria-label={`Cởi ${nameOf(it)}`} className="outfit-x">
                    ✕
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
      <label className="mt-3 block text-[0.75rem] text-stone-600">
        Dịp
        <select value={occasion} onChange={(e) => onOccasion(e.target.value)} className="tap mt-0.5 block w-full rounded-md border border-stone-300 bg-white/80 px-2 py-1 text-sm text-[#27354f]">
          {data.occasions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

/* ---------- the card ---------- */

export const STAMP: Record<CompassState, { word: string; icon: string }> = {
  fit: { word: "ĐÚNG CHUẨN", icon: "✅" },
  adapted: { word: "CÁCH TÂN", icon: "✨" },
  review: { word: "LẤY CẢM HỨNG", icon: "⚠️" },
  distorted: { word: "", icon: "⛔" },
};
/** The stamp judges the look picked, not the picture: an AI render can still get a detail wrong (#52). */
export const AI_LABEL = "Tranh minh họa (AI) · có thể sai chi tiết";

export type CardFace = {
  image: string;
  title: string;
  place: string;
  date: string;
  number: number;
  state: CompassState;
  note: string[];
  items: string[];
  isAI: boolean;
  checking: boolean; // a piece Tèo is still checking (verified: false): the stamp is pressed lighter
  fact: { text: string; source: string } | null; // one sourced line of Tèo's for the back (#62)
};

export function LookCard({
  face,
  saving,
  error,
  onSave,
  onClose,
  onRedo,
  onDownload,
}: {
  face: CardFace;
  saving: "idle" | "saving" | "saved";
  error: string | null;
  onSave: (el: HTMLElement) => void;
  onClose: () => void;
  onRedo?: () => void;
  onDownload: () => void; // the whole card, framed and stamped, not the bare picture
}) {
  const reduced = !!useReducedMotion();
  const [back, setBack] = useState(false);
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null);
  const box = useDialog<HTMLDivElement>(onClose);
  const stamp = STAMP[face.state];
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#140c07]/60 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Thẻ Việt phục của con" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div ref={box} className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <motion.div
          ref={setCardEl}
          className="look-card-wrap"
          initial={reduced ? { opacity: 0 } : { y: "-115vh", rotate: -4 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 220, damping: 18 }}
        >
          <motion.div className="look-card-inner" animate={{ rotateY: back ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.6, ease: [0.4, 0, 0.2, 1] }}>
            {/* front: the reader in the look, the Compass stamp, what and where */}
            <button type="button" className="look-card look-card-front" onClick={() => setBack(true)} aria-label="Lật thẻ">
              <span className="look-card-art">
                {/* eslint-disable-next-line @next/next/no-img-element -- a data/blob URL made in the browser */}
                <img src={face.image} alt="" className="h-full w-full object-contain" />
                {face.isAI && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[0.75rem] font-semibold text-white">{AI_LABEL}</span>
                )}
              </span>
              <motion.span
                className="look-stamp"
                initial={reduced ? false : { scale: 1.5, opacity: 0, rotate: -30 }}
                // lighter while Tèo still checks a piece; set here, as framer's inline opacity would beat a class
                animate={{ scale: 1, opacity: face.checking ? 0.5 : 1, rotate: -12 }}
                transition={{ delay: reduced ? 0 : 0.55, type: "spring", stiffness: 380, damping: 14 }}
              >
                {stamp.word}
                <br />
                {stamp.icon}
              </motion.span>
              <span className="font-hand look-card-title">{face.title}</span>
              <span className="look-card-meta">
                <span>
                  {face.place} · {face.date}
                </span>
                <span>Thẻ số {face.number}</span>
              </span>
            </button>
            {/* back: Bà's note in her ink on ruled paper */}
            <button type="button" className="look-card look-card-back" onClick={() => setBack(false)} aria-label="Lật lại mặt trước">
              <span className="look-card-lines">
                {face.note.map((l, i) => (
                  <span key={i} className="font-hand block">
                    {l}
                  </span>
                ))}
              </span>
              {/* what was worn, piece by piece: the back holds the look instead of empty ruled lines (#116) */}
              {face.items.length > 0 && (
                <span className="look-card-items">
                  <span className="look-card-items-head">Con mặc</span>
                  {face.items.map((it) => (
                    <span key={it} className="look-card-item">
                      {it}
                    </span>
                  ))}
                </span>
              )}
              {face.fact && (
                <span className="mb-2 block rotate-[-0.6deg] bg-[#fbe99a] px-2 py-1.5 text-[0.75rem] leading-snug text-[#1f3a78] shadow-[1px_3px_6px_rgba(60,40,0,0.2)]">
                  {face.fact.text}
                  <span className="mt-0.5 block text-[0.75rem] opacity-80">Tèo chép từ: {face.fact.source}</span>
                </span>
              )}
              <span className="look-card-meta mt-auto">
                <span>Thẻ số {face.number}</span>
                <span className="shrink-0">
                  {face.place} · {face.date}
                </span>
              </span>
            </button>
          </motion.div>
        </motion.div>
        <p className="m-0 text-center text-xs text-amber-50/80">
          {face.checking ? "Dấu nhạt: Tèo còn đang kiểm tra nguồn cho vài món · " : ""}Bấm vào thẻ để lật
        </p>
        {error && <p className="m-0 rounded bg-red-50/95 px-3 py-1 text-sm text-red-800" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={saving !== "idle"} onClick={() => cardEl && onSave(cardEl)} className="page-turn page-turn-main">
            {saving === "saved" ? "Đã lưu vào Du Ký ✓" : saving === "saving" ? "Đang dán vào sổ…" : "Lưu vào Du Ký"}
          </button>
          {onRedo && (
            <button type="button" onClick={onRedo} className="page-turn">
              ↻ Dựng lại
            </button>
          )}
          <button type="button" onClick={onDownload} className="page-turn">
            Tải thẻ
          </button>
          <button type="button" onClick={onClose} className="page-turn">
            Thử bộ khác
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/** "a, b và c" */
const listVi = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} và ${xs.at(-1)}`);

/** Bà's lines on the back of the card, from what the reader picked (no AI: the words are put together here). */
export function baNote(data: Bootstrap, garment: Garment, sel: Selection, verdict: CompassResult | null): string[] {
  const color = sel.colors[0] ? lowerFirst(data.colors[sel.colors[0]]?.name ?? "") || null : null;
  const acc = sel.accessories.map((a) => lowerFirst(data.accessories[a]?.name_vi ?? "")).filter(Boolean);
  const kept = garment.zones.filter((z) => z.level === "keep").map((z) => z.part);
  const lines = [`Con mặc ${lowerFirst(garment.name_vi)}${color ? ` màu ${color}` : ""}${acc.length ? `, ${acc.join(", ")}` : ""}.`];
  // "Con giữ đủ 5 thân áo và cổ áo", not the zone names pasted in a form ("Phần số thân áo (5 thân), cổ áo…", #116)
  if (kept.length) lines.push(`Con giữ đủ ${listVi(kept.map(keptSaid))}, đúng như Bà dặn.`);
  if (verdict?.state === "adapted") lines.push("Có chỗ con đổi cho hợp ngày nay, mà vẫn ra áo của mình.");
  if (verdict?.state === "review") lines.push("Có món Bà thấy chưa hợp dịp lắm, lần sau con xem lại nhé.");
  lines.push("— Bà");
  return lines;
}
