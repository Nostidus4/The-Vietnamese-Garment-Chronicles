import { cited, sourceOf } from "@/lib/sources";
import type { Bootstrap, CompassResult, CompassState, Garment, Trigger } from "@/lib/types";

export const STATE: Record<CompassState, { icon: string; name: string; tone: string }> = {
  fit: { icon: "✅", name: "Phù hợp", tone: "border-emerald-400 bg-emerald-50" },
  adapted: { icon: "✨", name: "Cách tân có chủ đích", tone: "border-sky-400 bg-sky-50" },
  review: { icon: "⚠️", name: "Cần xem lại bối cảnh", tone: "border-amber-400 bg-amber-50" },
  distorted: { icon: "⛔", name: "Sai lệch – không nên", tone: "border-red-400 bg-red-50" },
};

// rule types of backend/content/rules.json, in the words a viewer understands
const RULE: Record<string, string> = {
  fusion: "Pha trộn với trang phục nước khác",
  restricted: "Chi tiết dành riêng, không dùng tùy tiện",
  core: "Đổi cấu trúc cốt lõi của áo",
  caution: "Chi tiết cần cân nhắc",
  occasion: "Chưa hợp với dịp mặc",
  flexible: "Đổi phần linh hoạt (màu, chất liệu, phụ kiện)",
};
const RANK: Record<CompassState, number> = { distorted: 3, review: 2, adapted: 1, fit: 0 };

export function CompassPanel({ result, sources, garment }: { result: CompassResult | null; sources: Bootstrap["sources"]; garment?: Garment | null }) {
  if (!result) return null;
  const s = STATE[result.state];
  // The API sorts triggers most severe first
  const main = result.triggers[0];

  return (
    <section className={`rounded-lg border-2 p-5 ${s.tone}`}>
      <p className="text-lg font-semibold">
        {s.icon} {s.name} {result.label && <span className="ml-2 text-sm font-normal text-stone-600">· {result.label}</span>}
      </p>
      {main && (
        <div className="mt-3 space-y-2">
          <p><b>Tí:</b> {main.ti}</p>
          <p><b>Tèo:</b> {main.teo}</p>
          {(result.state === "review" || result.state === "distorted") && (
            <p className="text-sm text-stone-600"><b>Vì sao:</b> {main.why}</p>
          )}
        </div>
      )}
      {result.state === "fit" && garment && <WhyRight garment={garment} sources={sources} />}
      {result.harmony_notes.map((n) => (
        <p key={n} className="mt-2 text-sm"><b>Tí (màu sắc):</b> {n}</p>
      ))}
      <WhyPanel triggers={result.triggers} sources={sources} />
    </section>
  );
}

/**
 * ✅ is the best moment to teach (#62): what this look kept that makes the garment itself, and one sourced fact,
 * instead of "no rule fired".
 */
function WhyRight({ garment, sources }: { garment: Garment; sources: Bootstrap["sources"] }) {
  const kept = garment.zones.filter((z) => z.level === "keep").map((z) => z.part);
  const fact = garment.facts.find((f) => cited({ sources }, f.sources).length > 0);
  return (
    <div className="mt-3 space-y-1.5">
      <p className="m-0">
        <b>Vì sao bộ này đúng:</b> {garment.name_vi} vẫn giữ {kept.length ? kept.join(", ") : "dáng áo gốc"}, những phần làm nên tên gọi của bộ áo. Đổi màu,
        thêm phụ kiện hợp dịp vẫn giữ được điều đó.
      </p>
      {fact && (
        <div className="text-sm text-stone-700">
          <b>Tèo:</b> {fact.text}
          <Sources ids={fact.sources} sources={sources} />
        </div>
      )}
    </div>
  );
}

/** "Vì sao?": every rule that fired, most severe first, with its sources, and who decided (rules, not Gemini). */
function WhyPanel({ triggers, sources }: { triggers: Trigger[]; sources: Bootstrap["sources"] }) {
  const sorted = [...triggers].sort((a, b) => RANK[b.state] - RANK[a.state]);
  return (
    <details className="mt-4 rounded-md bg-white/60 px-3 py-2 text-sm">
      <summary className="cursor-pointer font-semibold">Vì sao? {sorted.length > 0 && <span className="font-normal text-stone-600">({sorted.length} luật)</span>}</summary>
      {sorted.length === 0 ? (
        <p className="m-0 mt-2">Không có gì phải sửa: bộ này giữ đúng những phần cốt lõi của trang phục.</p>
      ) : (
        <ul className="m-0 mt-2 list-none space-y-3 p-0">
          {sorted.map((t) => (
            <li key={`${t.type}-${t.target}`}>
              <p className="m-0">
                {STATE[t.state].icon} <b>{RULE[t.type] ?? t.type}</b> · {t.target_name}
              </p>
              <p className="m-0 mt-0.5 text-stone-700">{t.why}</p>
              <Sources ids={t.sources} sources={sources} />
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 mt-3 border-t border-stone-300 pt-2 text-xs text-stone-600">
        Kết quả do bộ luật văn hóa quyết định, Gemini không tham gia phán xét. Gemini chỉ dựng ảnh minh họa.
      </p>
    </details>
  );
}

/** "Nguồn: A · B", linked where the source has a URL. */
export function Sources({ ids: all, sources }: { ids: string[]; sources: Bootstrap["sources"] }) {
  const ids = cited({ sources }, all).map((s) => s.id);
  if (ids.length === 0) return null;
  return (
    <p className="m-0 mt-0.5 text-xs text-stone-600">
      Nguồn:{" "}
      {ids.map((id, i) => {
        const s = sourceOf({ sources }, id);
        return (
          <span key={id}>
            {i > 0 && " · "}
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                {s.title}
              </a>
            ) : (
              s.title
            )}
          </span>
        );
      })}
    </p>
  );
}
