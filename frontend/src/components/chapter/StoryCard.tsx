import type { Garment } from "@/lib/types";

const ZONE_STYLE = {
  keep: "bg-red-100 text-red-800 border-red-300",
  caution: "bg-amber-100 text-amber-800 border-amber-300",
  free: "bg-emerald-100 text-emerald-800 border-emerald-300",
};
const ZONE_LABEL = { keep: "Nên giữ", caution: "Cân nhắc", free: "Tự do đổi" };

export function StoryCard({ garment }: { garment: Garment }) {
  return (
    <section className="paper rounded-lg p-5">
      <h2 className="font-hand text-3xl">{garment.name_vi}</h2>
      <p className="mb-3 text-sm text-stone-500">{garment.period}</p>
      {garment.story.map((s) => (
        <p key={s} className="mb-2 leading-relaxed">
          {s}
        </p>
      ))}

      {/* F3 Style Freedom Map (P1) */}
      <h3 className="mt-4 mb-2 font-semibold">Phần nào được đổi?</h3>
      <div className="flex flex-wrap gap-2">
        {garment.zones.map((z) => (
          <span key={z.part} className={`rounded-full border px-3 py-1 text-xs ${ZONE_STYLE[z.level]}`}>
            {ZONE_LABEL[z.level]}: {z.part}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-400">Nguồn: {garment.sources.join(", ")}</p>
    </section>
  );
}
