// "Việt hay không?" (#49): a question is only a question with its picture. One whose picture fails to load is left
// out, not shown with "(ảnh đang được cập nhật)" and answer buttons to guess blind.

export type QuizQuestion = { id: string; image: string };

/** The questions to show, in order, without the ones whose picture is broken. */
export function shownQuestions<T extends QuizQuestion>(items: T[], broken: Record<string, boolean>): T[] {
  return items.filter((q) => !broken[q.id]);
}

// "Bà hỏi con" (#107): the content keeps the right answer first, so the choices are shuffled. The order comes from the
// question's id: the same on every render and reload, different from one question to the next.

/** FNV-1a: a 32-bit number from a string. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** mulberry32: a small random number generator that gives the same numbers for the same seed. */
function random(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The order to show the choices in, as indexes into `choices` (Fisher–Yates seeded by the id). */
export function choiceOrder(id: string, count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  const next = random(hash(id));
  for (let i = count - 1; i > 0; i--) {
    const k = Math.floor(next() * (i + 1));
    [order[i], order[k]] = [order[k], order[i]];
  }
  return order;
}
