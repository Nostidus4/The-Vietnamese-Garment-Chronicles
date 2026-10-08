import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cited, sourceOf } from "./sources";

const SRC = join(__dirname, "..");
const CONTENT = join(__dirname, "../../../backend/content");

function walk(dir: string, ext: RegExp, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (ext.test(f) && !/\.test\./.test(f)) out.push(p);
  }
  return out;
}
const read = (p: string) => readFileSync(p, "utf8");

describe("wording (#152)", () => {
  it("writes the tagline in one form only", () => {
    const old = /Hiểu để mặc đúng\s*[–-]\s*Sáng tạo/;
    const bad = walk(SRC, /\.(tsx?|json)$/).filter((p) => old.test(read(p)));
    expect(bad).toEqual([]);
  });

  it("has Tèo and Tí call the reader con, not bạn, in the app and in Tèo chấm", () => {
    // "bạn" as a pronoun for the reader; not "người bạn", "bạn bè", "bạn trẻ", "bạn Tí", "giã bạn", "một bạn"
    const verbs = "thử|cân|đang|đổi|nhờ|vẫn|có thể|hỏi|muốn|chọn";
    const pronoun = new RegExp(`(?<![\\p{L}])(?:Bạn (?:${verbs})|bạn (?:${verbs})|(?:cho|với|chỉ|mách) bạn(?![\\p{L}])|phần bạn muốn|dịp bạn chọn|Bạn:)`, "u");
    const files = [...walk(SRC, /\.tsx?$/), join(CONTENT, "rules.json")];
    const bad = files.flatMap((p) =>
      read(p)
        .split("\n")
        .map((l, i) => ({ p, i, l }))
        .filter((x) => pronoun.test(x.l))
        .map((x) => `${x.p}:${x.i + 1}`),
    );
    expect(bad).toEqual([]);
  });

  it("does not show the placeholder year of a source", () => {
    const data = { sources: { a: { id: "a", title: "Wikipedia tiếng Việt (không rõ năm). Mùa nước nổi", url: null } } };
    expect(cited(data, ["a"])[0].title).toBe("Wikipedia tiếng Việt. Mùa nước nổi");
    expect(sourceOf(data, "a").title).toBe("Wikipedia tiếng Việt. Mùa nước nổi");
  });
});
