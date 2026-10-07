// What "Ai mặc?" asks: Nữ · Nam · Con. No hooks and no motion, so the page can also put it in its static HTML for a
// first visit (RoomShell, #120); WhoPicker (Wardrobe) is the same box once the page runs.

import { HAS_API } from "@/lib/api";

export type Who = "nu" | "nam" | "con";

const WHO: { id: Who; name: string; note: string; soon?: boolean }[] = [
  { id: "nu", name: "Nữ", note: "búp bê giấy" },
  { id: "nam", name: "Nam", note: "búp bê giấy" },
  // a build without the server (GitHub Pages before the backend is up, a fork) has no room to dress a photo in (#48)
  { id: "con", name: "Con", note: HAS_API ? "ảnh của con" : "bản đầy đủ", soon: !HAS_API },
];

export const WHO_BACKDROP = "fixed inset-0 z-50 grid place-items-center bg-[#140c07]/70 p-4 backdrop-blur-[2px]";
export const WHO_BOX = "paper w-full max-w-lg rounded-xl px-4 py-6 text-center shadow-2xl sm:px-6";

/** `onPick` left out: the static copy, shown until the page runs. */
export function WhoChoices({ value, onPick }: { value: Who | null; onPick?: (w: Who) => void }) {
  return (
    <>
      <p className="m-0 text-[0.75rem] uppercase tracking-[0.28em] text-stone-600">Tủ áo của Bà</p>
      <p className="font-hand m-0 mt-1 text-[1.6rem] leading-tight text-[#8a4b2a]">Hôm nay ai mặc đây con?</p>
      <div className="mx-auto mt-5 grid max-w-[21rem] grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Người mặc">
        {WHO.map((w) => (
          <button
            key={w.id}
            type="button"
            role="radio"
            aria-checked={value === w.id}
            disabled={w.soon}
            aria-describedby={w.soon ? "who-soon" : undefined}
            onClick={onPick && (() => onPick(w.id))}
            className={`who-card ${value === w.id ? "who-card-on" : ""}`}
          >
            <WhoFigure who={w.id} />
            <span className="block text-[0.95rem] font-semibold">{w.name}</span>
            <span className="block text-[0.75rem] text-stone-600">{w.note}</span>
          </button>
        ))}
      </div>
      {!HAS_API && (
        <p id="who-soon" className="font-hand m-0 mt-4 text-[1.05rem] leading-snug text-stone-700">
          Bản đọc thử chưa có phòng chụp, con ạ. Con mặc cho búp bê giấy trước, mở bản đầy đủ thì thử được với ảnh của con.
        </p>
      )}
    </>
  );
}

function WhoFigure({ who }: { who: Who }) {
  if (who === "con") return <span className="grid h-16 place-items-center text-[1.9rem]" aria-hidden>📷</span>;
  return (
    <svg className="mx-auto h-16" viewBox="0 0 34 64" aria-hidden>
      <circle cx="17" cy="10" r="8" fill="#efcfae" stroke="#2b2118" strokeWidth="1.2" />
      <path d={who === "nu" ? "M8 20h18l5 40H3z" : "M8 20h18l2 40H6z"} fill={who === "nu" ? "#7ec8e3" : "#27354f"} stroke="#2b2118" strokeWidth="1.2" />
    </svg>
  );
}
