import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { choiceOrder, shownQuestions } from "./quiz";
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
