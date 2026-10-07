"use client";

// F8 Hỏi Tèo: Tèo answers only from the garment data cards and always shows his sources; without a source he says so.
// Styled as Tèo's yellow sticky note, the same voice that carries the facts in Bà's diary.

import { useState } from "react";
import { askTeo, type AskResponse } from "@/lib/api";
import { cited, plainAnswer } from "@/lib/sources";
import type { Bootstrap, Garment } from "@/lib/types";
import { friendlyError } from "@/lib/errors";

type Answer = AskResponse & { q: string };

export function AskTeo({ garment, data }: { garment: Garment; data: Bootstrap }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Answer[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    const text = question.trim();
    if (text.length < 2 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await askTeo(garment.id, text);
      setHistory((h) => [{ q: text, ...r }, ...h].slice(0, 5));
      setQ("");
    } catch (e) {
      setError(friendlyError(e, "Tớ chưa nghe rõ, bạn hỏi lại nhé."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rotate-[-0.4deg] bg-[#fbe99a] p-5 text-[#1f3a78] shadow-[2px_5px_12px_rgba(60,40,0,0.22)]">
      <h3 className="m-0 font-semibold">Hỏi Tèo</h3>
      <p className="m-0 mt-1 text-xs opacity-80">
        Tèo chỉ trả lời từ dữ liệu đã có nguồn của Việt Phục Du Ký. Không có nguồn thì Tèo nói thẳng là chưa biết.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, 300))}
          placeholder={`Hỏi về ${garment.name_vi}…`}
          className="min-w-0 flex-1 rounded border border-[#1f3a78]/30 bg-white/70 px-3 py-2 text-sm text-stone-800 outline-none focus:border-[#1f3a78]"
          aria-label="Câu hỏi cho Tèo"
        />
        <button type="submit" disabled={busy || q.trim().length < 2} className="rounded-full bg-[#1f3a78] px-4 py-2 text-sm text-white disabled:opacity-50">
          {busy ? (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Tèo đang tra…
            </span>
          ) : (
            "Hỏi"
          )}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {garment.ask_suggest.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => ask(s)} className="rounded-full border border-[#1f3a78]/40 px-2.5 py-0.5 text-xs hover:bg-white/50 disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
      {error && <p className="m-0 mt-2 text-sm text-[#B5452E]">{error}</p>}
      <ul className="m-0 mt-3 list-none space-y-3 p-0" aria-live="polite" aria-busy={busy}>
        {history.map((a, i) => (
          <li key={`${a.q}-${i}`} className="rounded bg-white/55 p-3 text-sm">
            <p className="m-0 text-xs font-semibold opacity-70">Bạn: {a.q}</p>
            <p className={`m-0 mt-1 text-stone-800 ${a.grounded ? "" : "italic"}`}>
              <b className="text-[#1f3a78]">Tèo:</b> {plainAnswer(a.answer)}
            </p>
            {a.grounded && cited(data, a.sources).length > 0 && (
              <p className="m-0 mt-1 text-xs">
                Nguồn:{" "}
                {cited(data, a.sources).map((s, n) => (
                  <span key={s.id}>
                    {n > 0 && " · "}
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
