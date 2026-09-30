"use client";

// Tèo's pop-up notes for hard words. Diary texts mark a word with [[shown words|term-id]] (content/glossary.json):
// the word gets a dotted yellow underline; hover (or tap, or Enter) shows Tèo's sticky note with its source.
// The note is portalled to <body> so the page's overflow never clips it, and it never starts a page turn.

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Bootstrap, GlossaryTerm } from "@/lib/types";

type Ctx = { terms: Record<string, GlossaryTerm>; sources: Bootstrap["sources"]; draft: boolean };
const GlossaryContext = createContext<Ctx | null>(null);

export function GlossaryProvider({ data, draft, children }: { data: Bootstrap; draft: boolean; children: ReactNode }) {
  return <GlossaryContext.Provider value={{ terms: data.glossary ?? {}, sources: data.sources, draft }}>{children}</GlossaryContext.Provider>;
}

const MARK = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;

/** Plain text of a marked string, e.g. for alt text or exports. */
export const plain = (text: string) => text.replace(MARK, "$1");

/** A diary string with its [[word|term]] marks turned into Tèo's pop-up words. */
export function RichText({ text }: { text: string }) {
  const ctx = useContext(GlossaryContext);
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MARK)) {
    out.push(text.slice(last, m.index));
    const term = ctx?.terms[m[2]];
    out.push(term && (term.verified || ctx?.draft) ? <Word key={m.index} shown={m[1]} term={term} /> : m[1]);
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

function Word({ shown, term }: { shown: string; term: GlossaryTerm }) {
  const ctx = useContext(GlossaryContext)!;
  const ref = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<{ x: number; y: number; below: boolean } | null>(null);
  const hover = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const below = r.top < 190; // near the top of the screen: open under the word
    setAt({ x: Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130), y: below ? r.bottom + 8 : r.top - 8, below });
  };
  const hide = () => setAt(null);

  useEffect(() => {
    if (!at) return;
    const away = (e: Event) => {
      if (!(e.target instanceof Node) || !ref.current?.contains(e.target)) hide();
    };
    const esc = (e: KeyboardEvent) => e.key !== "Tab" && hide(); // Esc, or the arrows turning the page
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    // the page under the word turns away (bookmark, arrows, drag): its word is no longer on screen
    const gone = setInterval(() => {
      const r = ref.current?.getBoundingClientRect();
      if (!r || !r.width || !ref.current?.checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) hide();
    }, 250);
    return () => {
      clearInterval(gone);
      window.removeEventListener("resize", hide);
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", hide, true);
    };
  }, [at]);
  useEffect(() => () => clearTimeout(hover.current), []);

  const src = term.sources.map((s) => ctx.sources[s]).find(Boolean);
  return (
    <>
      <button
        ref={ref}
        type="button"
        className="glossary-word"
        aria-describedby={at ? id : undefined}
        aria-expanded={!!at}
        // the flipbook starts a drag on mousedown: keep it on the word
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (at) hide();
          else show();
        }}
        onMouseEnter={() => {
          clearTimeout(hover.current);
          hover.current = setTimeout(show, 180);
        }}
        onMouseLeave={() => {
          clearTimeout(hover.current);
          hover.current = setTimeout(hide, 220);
        }}
      >
        {shown}
      </button>
      {at &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="glossary-note fixed z-[70] w-[15rem] bg-[#fbe99a] px-3 pb-2 pt-3 text-[0.8rem] leading-snug text-[#1f3a78] shadow-[2px_6px_14px_rgba(60,40,0,0.3)]"
            style={{ left: at.x, top: at.y, transform: `translate(-50%, ${at.below ? "0" : "-100%"}) rotate(-1.2deg)` }}
            onMouseEnter={() => clearTimeout(hover.current)}
            onMouseLeave={() => {
              hover.current = setTimeout(hide, 220);
            }}
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-9 -translate-x-1/2 bg-white/55" aria-hidden />
            <b className="font-display block text-[0.85rem]">{term.term}</b>
            {term.text}
            <span className="mt-1 block truncate text-[0.62rem] opacity-80">
              {src ? (src.url ? <a href={src.url} target="_blank" rel="noreferrer" className="underline">nguồn: {src.title}</a> : `nguồn: ${src.title}`) : "chưa có nguồn"}
            </span>
            <span className="block text-right text-[0.62rem] italic opacity-80">– Tèo{term.verified ? "" : ", đang kiểm tra"}</span>
          </div>,
          document.body,
        )}
    </>
  );
}
