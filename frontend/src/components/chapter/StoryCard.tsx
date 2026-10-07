import { media } from "@/lib/api";
import { cited } from "@/lib/sources";
import type { Bootstrap, Garment } from "@/lib/types";

const ZONE_STYLE = {
  keep: "bg-red-100 text-red-800 border-red-300",
  caution: "bg-amber-100 text-amber-800 border-amber-300",
  free: "bg-emerald-100 text-emerald-800 border-emerald-300",
};
const ZONE_LABEL = { keep: "Giữ", caution: "Cân nhắc", free: "Được đổi" }; // the same words as the Mặc page (#59)
const ZONE_ICON = { keep: "🔒", caution: "⚖️", free: "🎨" };

export function StoryCard({ garment, sources }: { garment: Garment; sources: Bootstrap["sources"] }) {
  // the vetted sources, numbered in the order the facts cite them, then the garment's other ones
  const notes = [...new Set([...garment.facts.flatMap((f) => f.sources), ...garment.sources])].filter((id) => cited({ sources }, [id]).length);
  return (
    <section className="paper rounded-lg p-5">
      <h2 className="font-hand text-3xl">{garment.name_vi}</h2>
      <p className="mb-3 text-sm text-stone-600">{garment.period}</p>
      <p className="mb-3 leading-relaxed">{garment.summary}</p>
      <ul className="mb-2 list-disc space-y-1 pl-5">
        {garment.facts.map((f) => (
          <li key={f.text} className="leading-relaxed">
            {f.text}{" "}
            {cited({ sources }, f.sources).map((src) => (
              // in brackets: two notes side by side read as [1][3], not as the number 13 (#114)
              <sup key={src.id} className="text-stone-600">
                [{notes.indexOf(src.id) + 1}]
              </sup>
            ))}
          </li>
        ))}
      </ul>

      {/* F3 Style Freedom Map: three lanes, from "keep" to "free", so the rule reads at a glance */}
      <h3 className="mt-4 mb-2 font-semibold">Phần nào được đổi?</h3>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {(["keep", "caution", "free"] as const).map((lv) => {
          const parts = garment.zones.filter((z) => z.level === lv);
          return (
            <div key={lv} className={`rounded-lg border-2 p-2 ${ZONE_STYLE[lv]}`}>
              <p className="m-0 flex items-center gap-1 font-semibold">
                <span aria-hidden>{ZONE_ICON[lv]}</span> {ZONE_LABEL[lv]}
              </p>
              <ul className="m-0 mt-1 list-none space-y-1 p-0">
                {parts.length ? (
                  parts.map((z) => (
                    <li key={z.part} title={z.note ?? undefined}>
                      {z.part}
                      {z.note && <span className="block opacity-75">{z.note}</span>}
                    </li>
                  ))
                ) : (
                  <li className="opacity-60">—</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="m-0 mt-1 text-[11px] text-stone-600">Giữ phần đỏ, cân nhắc phần vàng, còn phần xanh cứ phối theo cách của con.</p>

      {/* F6 how to wear it, step by step (hidden until the team has written the steps) */}
      {garment.wearing_steps.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">Cách mặc từng bước ({garment.wearing_steps.length})</summary>
          <ol className="m-0 mt-2 space-y-2 pl-5 text-sm">
            {garment.wearing_steps.map((st) => (
              <li key={st.title}>
                <b>{st.title}.</b> {st.detail}
                {st.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- step images live on the backend
                  <img src={media(st.image)} alt={st.title} className="mt-1 max-h-40 rounded" />
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
      <details className="mt-3 text-xs text-stone-600">
        <summary className="cursor-pointer">Nguồn ({notes.length})</summary>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          {notes.map((id) => (
            <li key={id}>
              {sources[id]?.url ? (
                <a href={sources[id].url!} target="_blank" rel="noreferrer" className="underline">{sources[id].title}</a>
              ) : (
                sources[id]?.title
              )}
            </li>
          ))}
        </ol>
      </details>
      {!garment.verified && <p className="mt-2 text-xs text-stone-600">Tèo còn đang đối chiếu thêm nguồn cho vài chi tiết của bộ áo này.</p>}
    </section>
  );
}
