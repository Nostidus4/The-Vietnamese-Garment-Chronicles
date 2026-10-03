"use client";

// Step 2 of the try-on: the Compass verdict in full. A ⛔ look stops here, before anything is rendered: why, what would
// be swapped, then the viewer picks "Sửa lại" (back to step 1) or "Thử phương án thay thế" (on to step 3).

import { swaps } from "@/lib/lookSwaps";
import type { Bootstrap, CompassResult, Selection } from "@/lib/types";
import { CompassPanel, STATE } from "./CompassPanel";

export const MAIN_BUTTON = "rounded-full bg-[#27354f] px-5 py-2 text-amber-50 hover:bg-[#1c2740] disabled:opacity-50";
export const SIDE_BUTTON = "rounded-full border border-stone-700 px-4 py-2 text-sm hover:bg-stone-800 hover:text-amber-50";

export function CompassStep({
  data,
  selection,
  verdict,
  failed,
  onRetry,
  onNext,
  onFix,
  onAlternative,
  onCompare,
}: {
  data: Bootstrap;
  selection: Selection;
  verdict: CompassResult | null; // null while the Compass is still scoring this look
  failed: boolean;
  onRetry: () => void;
  onNext: () => void;
  onFix: () => void;
  onAlternative: () => void;
  onCompare: () => void;
}) {
  if (!verdict) {
    return failed ? (
      <p className="m-0 text-sm">
        Compass chưa chấm được look này.{" "}
        <button type="button" onClick={onRetry} className="underline">
          Chấm lại
        </button>
      </p>
    ) : (
      <p className="m-0 text-sm text-stone-600">Compass đang chấm look…</p>
    );
  }

  const distorted = verdict.state === "distorted";
  return (
    <div className="space-y-4">
      <CompassPanel result={verdict} sources={data.sources} />
      {distorted && <Fork data={data} selection={selection} verdict={verdict} />}
      {(verdict.state === "review" || verdict.state === "adapted") && (
        <p className="m-0 text-sm text-stone-600">
          Look này vẫn dựng được. Ảnh sẽ kèm nhãn <b>{verdict.label}</b> để người xem biết đây không phải bản chuẩn.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {distorted ? (
          <>
            <button type="button" onClick={onAlternative} className={MAIN_BUTTON}>
              Thử phương án thay thế →
            </button>
            <button type="button" onClick={onFix} className={SIDE_BUTTON}>
              ← Sửa lại
            </button>
          </>
        ) : (
          <button type="button" onClick={onNext} className={MAIN_BUTTON}>
            Tiếp: thử lên người →
          </button>
        )}
        <button type="button" onClick={onCompare} className="ml-auto text-sm underline">
          So với bộ khác
        </button>
      </div>
    </div>
  );
}

/** ⛔: what will be swapped before rendering (the reasons are in the verdict above) and how the swapped look scores. */
export function Fork({ data, selection, verdict }: { data: Bootstrap; selection: Selection; verdict: CompassResult }) {
  const changes = verdict.alternative ? swaps(data, selection, verdict.alternative) : [];
  const after = verdict.alternative_state;
  return (
    <div className="space-y-2 rounded-lg border-2 border-red-300 bg-red-50/60 p-4 text-sm">
      <p className="m-0 font-semibold">⛔ Look này sẽ không được dựng. Nếu để Tèo dựng phương án thay thế, Tèo sẽ:</p>
      <ul className="m-0 list-disc pl-5">
        {(changes.length ? changes : ["Bỏ chi tiết gây sai lệch"]).map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      {after && (
        <p className="m-0 text-stone-600">
          Sau khi đổi, Compass đánh giá: {STATE[after].icon} <b>{STATE[after].name}</b>
        </p>
      )}
      <p className="m-0 text-stone-700">Con muốn tự sửa lại, hay để Tèo dựng phương án thay thế?</p>
    </div>
  );
}
