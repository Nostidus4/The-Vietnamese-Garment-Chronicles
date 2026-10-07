"use client";

// The ⛔ fork of the wardrobe room: a look the Compass refuses is never rendered nor carded; this says what the
// Compass would swap, and the room offers "Mặc theo gợi ý của Tèo" or "Tự sửa lại". The swap is a lookup, no AI, so
// it promises nothing a static build without a server cannot do (#114).

import { swaps } from "@/lib/lookSwaps";
import type { Bootstrap, CompassResult, Selection } from "@/lib/types";
import { STATE } from "./CompassPanel";

/** ⛔: what will be swapped before rendering (the reasons are in the verdict above) and how the swapped look scores. */
export function Fork({ data, selection, verdict }: { data: Bootstrap; selection: Selection; verdict: CompassResult }) {
  const changes = verdict.alternative ? swaps(data, selection, verdict.alternative) : [];
  const after = verdict.alternative_state;
  return (
    <div className="space-y-2 rounded-lg border-2 border-red-300 bg-red-50/60 p-4 text-sm">
      <p className="m-0 font-semibold">⛔ Bộ phối này lẫn chi tiết làm sai bộ áo. Tèo gợi ý:</p>
      <ul className="m-0 list-disc pl-5">
        {(changes.length ? changes : ["Bỏ chi tiết gây sai lệch"]).map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      {after && (
        <p className="m-0 text-stone-600">
          Đổi xong, Tèo chấm: {STATE[after].icon} <b>{STATE[after].name}</b>
        </p>
      )}
      <p className="m-0 text-stone-700">Con muốn tự sửa lại, hay mặc theo gợi ý của Tèo?</p>
    </div>
  );
}
