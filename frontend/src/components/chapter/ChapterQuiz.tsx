"use client";

// "Việt hay không?" at the start (pre) and the end (post) of a chapter, with the same questions in the same order,
// so the Impact report can compare what a visitor knew before and after the chapter.

import { useEffect, useRef, useState } from "react";
import { answerQuiz, API_URL, getQuiz } from "@/lib/api";
import { shownQuestions } from "@/lib/quiz";
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
  const [picked, setPicked] = useState<Record<string, string>>({}); // the reader's answer, marked on its button
  const [open, setOpen] = useState(phase === "pre");
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState(false); // the server did not answer: say so instead of an empty tab (#48)
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
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [regionId]);

  if (failed) return <p className="paper m-0 rounded-lg p-5 text-sm text-stone-600">Chưa lấy được câu đố lúc này, con mở lại sau chút nhé.</p>;
  if (!items || items.length === 0) return null;
  const shown = shownQuestions(items, broken);
  if (shown.length === 0) return null;
  const done = shown.filter((i) => results[i.id]).length;
  const correct = shown.filter((i) => results[i.id]?.correct).length;

  async function answer(id: string, key: string) {
    if (answered.current.has(id)) return;
    answered.current.add(id);
    setPicked((x) => ({ ...x, [id]: key }));
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
          <span className="ml-2 text-sm font-normal text-stone-600">
            {done}/{shown.length} câu{done === shown.length ? ` · đúng ${correct}` : ""}
          </span>
        </span>
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          <p className="m-0 text-sm text-stone-600">
            {phase === "pre" ? "Đoán trước khi đọc chương, sai cũng không sao." : "Cùng những câu lúc đầu. Xem con đã khác chưa?"}
          </p>
          {shown.map((it, n) => {
            const r = results[it.id];
            const mine = picked[it.id];
            return (
              <div key={it.id} className={`rounded-md border-2 bg-white/60 p-3 ${!r ? "border-transparent" : r.correct ? "border-emerald-300" : "border-amber-300"}`}>
                <p className="m-0 text-sm font-semibold">Câu {n + 1}: Trang phục này của nước nào?</p>
                <figure className="relative m-0 mt-2 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- quiz images live on the backend */}
                  <img
                    src={`${API_URL}${it.image}`}
                    alt={`Ảnh câu hỏi ${n + 1}`}
                    className="max-h-56 rounded bg-stone-100"
                    onError={() => setBroken((x) => ({ ...x, [it.id]: true }))}
                  />
                  <figcaption className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[0.75rem] text-white">Ảnh minh họa AI</figcaption>
                </figure>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(choices).map(([key, name]) => {
                    const right = r && r.answer_name === name;
                    const chosen = mine === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!!r}
                        aria-pressed={chosen}
                        onClick={() => answer(it.id, key)}
                        className={`rounded-full border px-3 py-1 text-sm ${
                          right ? "border-emerald-600 bg-emerald-50 text-emerald-800" : chosen && r ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-500"
                        } ${r && !right && !chosen ? "opacity-50" : ""}`}
                      >
                        {chosen && r ? (r.correct ? "✓ " : "Con chọn: ") : ""}
                        {name}
                      </button>
                    );
                  })}
                </div>
                {r && (
                  <p role="status" className="m-0 mt-2 text-sm text-stone-700">
                    <b className={r.correct ? "text-emerald-700" : "text-amber-800"}>{r.correct ? "Đúng rồi!" : `Chưa trúng, đây là ${r.answer_name}.`}</b> {r.explanation}
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
