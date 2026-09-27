import type { CompassResult, CompassState } from "@/lib/types";

const STATE: Record<CompassState, { icon: string; name: string; tone: string }> = {
  fit: { icon: "✅", name: "Phù hợp", tone: "border-emerald-400 bg-emerald-50" },
  adapted: { icon: "✨", name: "Cách tân có chủ đích", tone: "border-sky-400 bg-sky-50" },
  review: { icon: "⚠️", name: "Cần xem lại bối cảnh", tone: "border-amber-400 bg-amber-50" },
  distorted: { icon: "⛔", name: "Sai lệch – không nên", tone: "border-red-400 bg-red-50" },
};

export function CompassPanel({ result }: { result: CompassResult | null }) {
  if (!result) return null;
  const s = STATE[result.state];
  // The API sorts triggers most severe first
  const main = result.triggers[0];

  return (
    <section className={`rounded-lg border-2 p-5 ${s.tone}`}>
      <p className="text-lg font-semibold">
        {s.icon} {s.name} {result.label && <span className="ml-2 text-sm font-normal text-stone-500">· {result.label}</span>}
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
      {result.state === "distorted" && result.alternative && (
        <p className="mt-3 text-sm">Gợi ý: bỏ món gây sai lệch. Khi thử lên người, hệ thống sẽ dựng phương án thay thế.</p>
      )}
      {result.harmony_notes.map((n) => (
        <p key={n} className="mt-2 text-sm"><b>Tí (màu sắc):</b> {n}</p>
      ))}
    </section>
  );
}
