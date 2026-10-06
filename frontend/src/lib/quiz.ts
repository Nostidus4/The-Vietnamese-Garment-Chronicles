// "Việt hay không?" (#49): a question is only a question with its picture. One whose picture fails to load is left
// out, not shown with "(ảnh đang được cập nhật)" and answer buttons to guess blind.

export type QuizQuestion = { id: string; image: string };

/** The questions to show, in order, without the ones whose picture is broken. */
export function shownQuestions<T extends QuizQuestion>(items: T[], broken: Record<string, boolean>): T[] {
  return items.filter((q) => !broken[q.id]);
}
