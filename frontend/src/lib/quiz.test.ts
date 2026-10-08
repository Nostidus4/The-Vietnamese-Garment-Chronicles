import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { choiceOrder, isUnderstood, pickStaticQuiz, shownQuestions, staticAnswer, type StaticQuiz } from "./quiz";
import type { CheckQuestion } from "./types";

describe("shownQuestions (#49)", () => {
  const items = [
    { id: "a", image: "/media/quiz/a.jpg" },
    { id: "b", image: "/media/quiz/b.jpg" },
    { id: "c", image: "/media/quiz/c.jpg" },
  ];
  it("keeps every question while the pictures load", () => {
    expect(shownQuestions(items, {}).map((q) => q.id)).toEqual(["a", "b", "c"]);
  });
  it("leaves out a question whose picture is broken, keeping the order", () => {
    expect(shownQuestions(items, { b: true }).map((q) => q.id)).toEqual(["a", "c"]);
  });
});

describe("choiceOrder (#107)", () => {
  const dir = join(__dirname, "../../../backend/content/regions");
  const questions: CheckQuestion[] = readdirSync(dir).flatMap((f) => {
    const check = JSON.parse(readFileSync(join(dir, f), "utf8")).check;
    return [check.pre, ...check.post];
  });

  it("shows every choice once", () => {
    for (const q of questions) expect([...choiceOrder(q.id, q.choices.length)].sort()).toEqual(q.choices.map((_, i) => i));
  });
  it("gives the same order on every render", () => {
    for (const q of questions) expect(choiceOrder(q.id, q.choices.length)).toEqual(choiceOrder(q.id, q.choices.length));
  });
  it("puts the right answer (the content keeps it first) in every position, never mostly in one", () => {
    const where = questions.map((q) => choiceOrder(q.id, q.choices.length).indexOf(q.answer));
    for (const pos of [0, 1, 2]) {
      const n = where.filter((w) => w === pos).length;
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThanOrEqual(questions.length / 2);
    }
  });
});

// #151: "choose the longest answer" must not be a way to pass
describe("the length of the choices", () => {
  const dir = join(__dirname, "../../../backend/content/regions");
  const questions: CheckQuestion[] = readdirSync(dir).flatMap((f) => {
    const check = JSON.parse(readFileSync(join(dir, f), "utf8")).check;
    return [check.pre, ...check.post];
  });
  // names and years ("Năm thân", "2013") are as short as each other by nature; only sentences can give the answer away
  const sentences = questions.filter((q) => Math.max(...q.choices.map((c) => c.length)) >= 20);
  const longest = (q: CheckQuestion) => {
    const len = q.choices.map((c) => c.length);
    return len[q.answer] === Math.max(...len) && len.filter((n) => n === len[q.answer]).length === 1;
  };

  it("has sentences to check", () => {
    expect(sentences.length).toBeGreaterThanOrEqual(10);
  });
  it("makes the right answer the strictly longest in no more than a third of the sentence questions (chance with 3 choices)", () => {
    const n = sentences.filter(longest).length;
    expect(n, sentences.filter(longest).map((q) => q.id).join(", ")).toBeLessThanOrEqual(Math.floor(sentences.length / 3));
  });
  it("keeps the shortest choice within 25% of the longest, so no choice stands out by length", () => {
    for (const q of sentences) {
      const len = q.choices.map((c) => c.length);
      const gap = (Math.max(...len) - Math.min(...len)) / Math.max(...len);
      expect(gap, `${q.id} ${len.join("/")}`).toBeLessThanOrEqual(0.25);
    }
  });
  it("does not make the right answer the longest one in the Bữa cơm cup step either", () => {
    const hue = JSON.parse(readFileSync(join(dir, "hue.json"), "utf8"));
    const game = hue.stops.map((s: { game?: { kind: string; rounds: { choices: string[]; answer: number | null }[] } }) => s.game).find((g: { kind: string } | undefined) => g?.kind === "mam-com");
    const cup = game.rounds[2];
    const len = cup.choices.map((c: string) => c.length);
    expect(len[cup.answer]).toBeLessThan(Math.max(...len));
    expect((Math.max(...len) - Math.min(...len)) / Math.max(...len)).toBeLessThanOrEqual(0.25);
  });
});

describe("the ĐÃ HIỂU stamp (#151)", () => {
  it("needs at least 2 right out of 3", () => {
    expect(isUnderstood(0, 3)).toBe(false);
    expect(isUnderstood(1, 3)).toBe(false);
    expect(isUnderstood(2, 3)).toBe(true);
    expect(isUnderstood(3, 3)).toBe(true);
  });
  it("scales to other counts: two thirds, rounded up", () => {
    expect(isUnderstood(1, 2)).toBe(false);
    expect(isUnderstood(2, 2)).toBe(true);
    expect(isUnderstood(3, 4)).toBe(true);
    expect(isUnderstood(2, 4)).toBe(false);
  });
  it("never stamps when there was nothing to answer", () => {
    expect(isUnderstood(0, 0)).toBe(false);
  });
});

describe("Việt hay không? without a server (#151)", () => {
  const quiz: StaticQuiz = {
    choices: { viet: "Việt phục", hanbok: "Hanbok (Hàn Quốc)" },
    items: [
      { id: "a", image: "/media/quiz/a.jpg", photo: null, answer: "viet", answer_name: "Việt phục", explanation: "Vì a", sources: ["s1"] },
      { id: "b", image: "/media/quiz/b.jpg", photo: null, answer: "hanbok", answer_name: "Hanbok (Hàn Quốc)", explanation: "Vì b", sources: [] },
      { id: "c", image: "/media/quiz/c.jpg", photo: null, answer: "viet", answer_name: "Việt phục", explanation: "Vì c", sources: [] },
    ],
  };
  it("hands out questions without their answers", () => {
    const got = pickStaticQuiz(quiz, 2, () => 0.5);
    expect(got.items).toHaveLength(2);
    expect(JSON.stringify(got.items)).not.toContain("explanation");
    expect(got.items[0]).toEqual({ id: expect.any(String), image: expect.stringMatching(/^\/media\/quiz\//), photo: null });
    expect(got.choices).toEqual(quiz.choices);
  });
  it("never asks for more questions than there are, and no question twice", () => {
    const ids = pickStaticQuiz(quiz, 20, Math.random).items.map((i) => i.id);
    expect([...ids].sort()).toEqual(["a", "b", "c"]);
  });
  it("judges an answer like the server does", () => {
    expect(staticAnswer(quiz, "b", "hanbok")).toMatchObject({ correct: true, answer_name: "Hanbok (Hàn Quốc)", explanation: "Vì b" });
    expect(staticAnswer(quiz, "b", "viet")).toMatchObject({ correct: false, answer_name: "Hanbok (Hàn Quốc)" });
  });
  it("refuses an unknown question", () => {
    expect(() => staticAnswer(quiz, "zzz", "viet")).toThrow();
  });
});
