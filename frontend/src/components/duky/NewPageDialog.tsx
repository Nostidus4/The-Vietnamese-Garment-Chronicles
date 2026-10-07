"use client";

// A new page of the Du Ký (#20): "Chuẩn bị đi sự kiện" (Sắp đi) or "Trang đã mặc" (with a real photo).

import { useState } from "react";
import { addPage, addPhoto, ensureMigrated, newPage, type DuKyPage } from "@/lib/dukyBook";
import { track } from "@/lib/track";
import type { Bootstrap } from "@/lib/types";
import { useDialog } from "@/lib/useDialog";

export type NewPreset = { status: "planned" | "worn"; region?: string };

export function NewPageDialog({
  data,
  preset,
  onClose,
  onCreated,
}: {
  data: Bootstrap;
  preset: NewPreset;
  onClose: () => void;
  onCreated: (p: DuKyPage) => void;
}) {
  // regions with garments the reader can wear to an event (their chapter is readable)
  const regions = data.regions.filter((r) => r.garments.length && (r.status === "open" || r.chapters.some((c) => c.status === "open")));
  const [status, setStatus] = useState(preset.status);
  const [region, setRegion] = useState(regions.find((r) => r.id === preset.region)?.id ?? regions[0]?.id ?? "");
  const garments = (regions.find((r) => r.id === region)?.garments ?? []).map((id) => data.garments.find((g) => g.id === id)!).filter(Boolean);
  const [garment, setGarment] = useState(garments[0]?.id ?? "");
  const g = garments.find((x) => x.id === garment) ?? garments[0];
  const occasions = data.occasions.filter((o) => g?.occasions.includes(o.id));
  const [occasion, setOccasion] = useState(occasions[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  // Esc or a click outside with something already written asks first, instead of losing it (#58)
  const [asking, setAsking] = useState(false);
  const dirty = !!(date || place.trim() || note.trim() || file);
  const requestClose = () => (dirty ? setAsking(true) : onClose());
  const box = useDialog<HTMLFormElement>(requestClose);

  const pickRegion = (id: string) => {
    setRegion(id);
    const first = data.garments.find((x) => x.id === regions.find((r) => r.id === id)?.garments[0]);
    setGarment(first?.id ?? "");
    setOccasion(data.occasions.find((o) => first?.occasions.includes(o.id))?.id ?? "");
  };
  const pickGarment = (id: string) => {
    setGarment(id);
    const gg = data.garments.find((x) => x.id === id);
    if (!gg?.occasions.includes(occasion)) setOccasion(gg?.occasions[0] ?? "");
  };

  async function save() {
    if (!g || !occasion) return;
    setBusy(true);
    await ensureMigrated(data.garments);
    const page = addPage(
      newPage({ status, region_id: region, garment_id: g.id, occasion_id: occasion, date: date || null, place: place.trim(), note: note.trim() }),
    );
    if (file) {
      await addPhoto(page.id, file, "real");
      track("duky_save", { kind: "real", garment_id: g.id });
    }
    setBusy(false);
    onCreated(page);
  }

  const field = "mt-0.5 w-full rounded border border-stone-300 bg-white/70 px-2 py-1.5 text-sm";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal aria-label="Trang mới" onClick={requestClose}>
      <form
        ref={box}
        className="paper max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg p-5 text-stone-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h2 className="font-display m-0 text-xl text-[#27354f]">Trang mới</h2>
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Loại trang">
          {(["planned", "worn"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={status === s}
              onClick={() => setStatus(s)}
              className={`flex-1 rounded-full border px-3 py-1.5 text-sm ${status === s ? "border-[#27354f] bg-[#27354f] text-amber-50" : "border-stone-400"}`}
            >
              {s === "planned" ? "Chuẩn bị đi sự kiện" : "Đã mặc rồi"}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <label>
            Vùng
            <select value={region} onChange={(e) => pickRegion(e.target.value)} className={field}>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trang phục
            <select value={g?.id ?? ""} onChange={(e) => pickGarment(e.target.value)} className={field}>
              {garments.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name_vi}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dịp
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={field}>
              {occasions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {status === "planned" ? "Ngày đi" : "Ngày mặc"}
            <input type="date" lang="vi" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <label className="col-span-2">
            Ở đâu (không bắt buộc)
            <input value={place} onChange={(e) => setPlace(e.target.value.slice(0, 60))} placeholder="Đại Nội Huế, nhà ngoại…" className={field} />
          </label>
          <label className="col-span-2">
            Một dòng của con
            {/* lines that can be read back while writing, not one line that hides the start (#117) */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={2}
              className={`${field} font-hand max-h-[7.5em] resize-none text-base leading-snug [field-sizing:content]`}
            />
            {note.length >= 160 && <span className="block text-right text-[0.75rem] text-stone-600">{note.length}/200 chữ</span>}
          </label>
          {status === "worn" && (
            <label className="col-span-2">
              Ảnh mặc thật (thu nhỏ và chỉ lưu trên máy này)
              {/* the browser's own "Choose File / No file chosen" is English: a button of ours instead (#63) */}
              <span className="mt-1 flex items-center gap-2">
                <span className="cursor-pointer rounded-full border border-[#27354f] px-3 py-1 text-xs text-[#27354f] hover:bg-[#27354f]/10">📷 Chọn ảnh</span>
                <span className="min-w-0 truncate text-xs text-stone-600">{file ? file.name : "chưa chọn ảnh nào"}</span>
              </span>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
            </label>
          )}
        </div>
        {asking && (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-[#f7e4c8] px-3 py-2 text-sm">
            <span className="min-w-0 flex-1">Bỏ trang đang viết dở?</span>
            <button type="button" onClick={onClose} className="rounded-full bg-[#B5452E] px-3 py-1 text-amber-50">
              Bỏ
            </button>
            <button type="button" data-autofocus onClick={() => setAsking(false)} className="rounded-full border border-stone-500 px-3 py-1">
              Viết tiếp
            </button>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          {/* the same question as Esc and a click outside: never drop what is written without asking (#117) */}
          <button type="button" onClick={requestClose} className="px-3 py-1.5 text-sm underline">
            Thôi
          </button>
          <button type="submit" disabled={busy || !occasion} className="rounded-full bg-[#27354f] px-5 py-1.5 text-sm text-amber-50 disabled:opacity-50">
            {busy ? "Đang dán…" : "Dán vào sổ"}
          </button>
        </div>
      </form>
    </div>
  );
}
