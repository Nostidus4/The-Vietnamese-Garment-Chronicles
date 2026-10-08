// "Việt hay không?" (#49): a question is only a question with its picture. One whose picture fails to load is left
// out, not shown with "(ảnh đang được cập nhật)" and answer buttons to guess blind.

import type { QuizItem } from "./types";

export type QuizQuestion = { id: string; image: string };

// "Bà hỏi con" (#151): the ĐÃ HIỂU stamp says the reader understood, so it needs at least two thirds right (2 of 3).
export function isUnderstood(correct: number, total: number): boolean {
  return total > 0 && correct * 3 >= total * 2;
}

// "Việt hay không?" without a server (#151): the book ships the questions and their answers as JSON, and the browser
// draws and judges them like GET /quiz and POST /quiz/answer do.
export type StaticQuizItem = QuizItem & { answer: string; answer_name: string; explanation: string; sources: string[] };
export type StaticQuiz = { choices: Record<string, string>; items: StaticQuizItem[] };

/** `count` different questions in a random order, without their answers. */
export function pickStaticQuiz(quiz: StaticQuiz, count: number, rand: () => number = Math.random) {
  const pool = [...quiz.items];
  for (let i = pool.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    [pool[i], pool[k]] = [pool[k], pool[i]];
  }
  const items: QuizItem[] = pool.slice(0, count).map((q) => ({ id: q.id, image: q.image, photo: q.photo }));
  return { choices: quiz.choices, items };
}

export function staticAnswer(quiz: StaticQuiz, id: string, answer: string) {
  const q = quiz.items.find((i) => i.id === id);
  if (!q) throw new Error(`Không có câu hỏi '${id}'`);
  return { correct: answer === q.answer, answer_name: q.answer_name, explanation: q.explanation, sources: q.sources };
}

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
