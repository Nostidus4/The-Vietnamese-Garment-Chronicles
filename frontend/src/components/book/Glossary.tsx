"use client";

// Tèo's pop-up notes for hard words. Diary texts mark a word with [[shown words|term-id]] (content/glossary.json):
// the word gets a dotted yellow underline; hover (or tap, or Enter) shows Tèo's sticky note with its source.
// The note is portalled to <body> so the page's overflow never clips it, and it never starts a page turn.

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Bootstrap, GlossaryTerm } from "@/lib/types";
import { TeoModal } from "./TeoPin";

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

/** A hard word: a dotted underline; a click opens Tèo's note about it, like his pinned notes. */
function Word({ shown, term }: { shown: string; term: GlossaryTerm }) {
  const ctx = useContext(GlossaryContext)!;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="glossary-word"
        aria-haspopup="dialog"
        aria-expanded={open}
        // the flipbook starts a drag on mousedown: keep it on the word
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {shown}
      </button>
      <TeoModal
        open={open}
        onClose={() => setOpen(false)}
        data={{ sources: ctx.sources }}
        heading="Tèo giải thích"
        notes={[{ title: term.term, text: term.text, sources: term.sources, verified: term.verified }]}
      />
    </>
  );
}
