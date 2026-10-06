import { describe, expect, it } from "vitest";
import { labelVi, lowerFirst } from "./text";

describe("wording helpers (#59)", () => {
  it("keeps proper names inside a sentence", () => {
    expect(lowerFirst("Thổ cẩm Ê Đê")).toBe("thổ cẩm Ê Đê");
    expect(lowerFirst("Obi (Nhật Bản)")).toBe("obi (Nhật Bản)");
    expect(lowerFirst("Tím Huế")).toBe("tím Huế");
  });
  it("shows the Compass's labels in Vietnamese", () => {
    expect(labelVi("Authentic")).toBe("Đúng chuẩn");
    expect(labelVi("Inspired")).toBe("Lấy cảm hứng");
    expect(labelVi(null)).toBe("");
  });
});
