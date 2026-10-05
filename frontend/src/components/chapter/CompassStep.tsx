"use client";

// The ⛔ fork of the wardrobe room: a look the Compass refuses is never rendered nor carded; this says what the
// Compass would swap, and the room offers "Mặc phương án thay thế" or "Tự sửa lại".

import { swaps } from "@/lib/lookSwaps";
import type { Bootstrap, CompassResult, Selection } from "@/lib/types";
import { STATE } from "./CompassPanel";

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
