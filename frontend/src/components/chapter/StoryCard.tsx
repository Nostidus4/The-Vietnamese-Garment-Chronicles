import type { Bootstrap, Garment } from "@/lib/types";

const ZONE_STYLE = {
  keep: "bg-red-100 text-red-800 border-red-300",
  caution: "bg-amber-100 text-amber-800 border-amber-300",
  free: "bg-emerald-100 text-emerald-800 border-emerald-300",
};
const ZONE_LABEL = { keep: "Nên giữ", caution: "Cân nhắc", free: "Tự do đổi" };

export function StoryCard({ garment, sources }: { garment: Garment; sources: Bootstrap["sources"] }) {
  return (
    <section className="paper rounded-lg p-5">
      <h2 className="font-hand text-3xl">{garment.name_vi}</h2>
      <p className="mb-3 text-sm text-stone-500">{garment.period}</p>
      <p className="mb-3 leading-relaxed">{garment.summary}</p>
      <ul className="mb-2 list-disc space-y-1 pl-5">
        {garment.facts.map((f) => (
          <li key={f.text} className="leading-relaxed">
            {f.text} <sup className="text-stone-400">[{f.sources.join(", ")}]</sup>
          </li>
        ))}
      </ul>

      {/* F3 Style Freedom Map (P1) */}
      <h3 className="mt-4 mb-2 font-semibold">Phần nào được đổi?</h3>
      <div className="flex flex-wrap gap-2">
        {garment.zones.map((z) => (
          <span key={z.part} className={`rounded-full border px-3 py-1 text-xs ${ZONE_STYLE[z.level]}`}>
            {ZONE_LABEL[z.level]}: {z.part}
          </span>
        ))}
      </div>
      <details className="mt-3 text-xs text-stone-500">
        <summary className="cursor-pointer">Nguồn ({garment.sources.length})</summary>
        <ul className="mt-1 space-y-1">
          {garment.sources.map((id) => (
            <li key={id}>
              [{id}]{" "}
              {sources[id]?.url ? (
                <a href={sources[id].url!} target="_blank" rel="noreferrer" className="underline">{sources[id].title}</a>
              ) : (
                sources[id]?.title
              )}
            </li>
          ))}
        </ul>
      </details>
      {!garment.verified && <p className="mt-2 text-xs text-amber-700">Nội dung đang chờ kiểm chứng.</p>}
    </section>
  );
}
