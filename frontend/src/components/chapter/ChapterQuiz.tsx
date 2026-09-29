"use client";

// "Việt hay không?" at the start (pre) and the end (post) of a chapter, with the same questions in the same order,
// so the Impact report can compare what a visitor knew before and after the chapter.

import { useEffect, useRef, useState } from "react";
import { answerQuiz, API_URL, getQuiz } from "@/lib/api";
import { track } from "@/lib/track";

type Item = { id: string; image: string };
type Result = { correct: boolean; answer_name: string; explanation: string };

const ORDER_KEY = (region: string) => `vpdk-quiz-${region}`;

function savedOrder(region: string): string[] | null {
  try {
    return JSON.parse(sessionStorage.getItem(ORDER_KEY(region)) ?? "null");
  } catch {
    return null;
  }
}

export function ChapterQuiz({ regionId, phase }: { regionId: string; phase: "pre" | "post" }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [open, setOpen] = useState(phase === "pre");
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const answered = useRef(new Set<string>()); // one answer per question, even on a fast double click

  useEffect(() => {
    let alive = true;
    getQuiz(20)
      .then((q) => {
        if (!alive) return;
        // the post quiz reuses the pre quiz's questions and order
        const order = savedOrder(regionId);
        const list = order ? order.map((id) => q.items.find((i) => i.id === id)).filter((i): i is Item => !!i) : q.items;
        if (!order) {
          try {
            sessionStorage.setItem(ORDER_KEY(regionId), JSON.stringify(list.map((i) => i.id)));
          } catch {
            // private mode: the post quiz will simply draw its own order
          }
        }
        setChoices(q.choices);
        setItems(list.length ? list : q.items);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [regionId]);

  if (!items || items.length === 0) return null;
  const done = items.filter((i) => results[i.id]).length;
  const correct = items.filter((i) => results[i.id]?.correct).length;

  async function answer(id: string, key: string) {
    if (answered.current.has(id)) return;
    answered.current.add(id);
    const r = await answerQuiz(id, key).catch(() => {
      answered.current.delete(id); // network hiccup: let the visitor try again
      return null;
    });
    if (!r) return;
    setResults((x) => ({ ...x, [id]: r }));
    track("quiz_answer", { phase, item_id: id, correct: r.correct, region_id: regionId });
  }

  return (
    <section className="paper rounded-lg p-5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="font-semibold">
          {phase === "pre" ? "Khởi động: Việt hay không?" : "Giờ thử lại nhé: Việt hay không?"}
          <span className="ml-2 text-sm font-normal text-stone-500">
            {done}/{items.length} câu{done === items.length ? ` · đúng ${correct}` : ""}
          </span>
        </span>
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          <p className="m-0 text-sm text-stone-600">
            {phase === "pre" ? "Đoán trước khi đọc chương, sai cũng không sao." : "Cùng những câu lúc đầu. Xem bạn đã khác chưa?"}
          </p>
          {items.map((it, n) => {
            const r = results[it.id];
            return (
              <div key={it.id} className="rounded-md bg-white/60 p-3">
                <p className="m-0 text-sm font-semibold">Câu {n + 1}: Trang phục này của nước nào?</p>
                {broken[it.id] ? (
                  <p className="m-0 mt-2 text-xs italic text-stone-500">(Ảnh câu hỏi đang được cập nhật)</p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- quiz images live on the backend
                  <img
                    src={`${API_URL}${it.image}`}
                    alt={`Ảnh câu hỏi ${n + 1}`}
                    className="mt-2 max-h-56 rounded bg-stone-100"
                    onError={() => setBroken((x) => ({ ...x, [it.id]: true }))}
                  />
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(choices).map(([key, name]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={!!r}
                      onClick={() => answer(it.id, key)}
                      className="rounded-full border border-stone-500 px-3 py-1 text-sm disabled:opacity-60"
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {r && (
                  <p className={`m-0 mt-2 text-sm ${r.correct ? "text-emerald-700" : "text-[#B5452E]"}`}>
                    {r.correct ? "✅ Đúng" : `❌ Chưa đúng, đáp án: ${r.answer_name}`}. {r.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
