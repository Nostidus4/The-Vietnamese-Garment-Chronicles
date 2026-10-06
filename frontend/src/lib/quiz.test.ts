import { describe, expect, it } from "vitest";
import { shownQuestions } from "./quiz";

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
