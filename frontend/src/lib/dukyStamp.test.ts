import { describe, expect, it } from "vitest";
import { coverCount, stampLabel } from "./dukyStamp";

const real = { id: "a", kind: "real" as const, sample: false };
const ai = { id: "b", kind: "ai" as const, sample: false };

describe("stampLabel (#144)", () => {
  it("names every state of a page the same way in the book and on the exported card", () => {
    expect(stampLabel({ status: "planned", photos: [] })).toBe("SẮP ĐI");
    expect(stampLabel({ status: "planned", photos: [ai] })).toBe("ĐÃ THỬ");
    expect(stampLabel({ status: "planned", photos: [real] })).toBe("ĐÃ MẶC");
    expect(stampLabel({ status: "worn", photos: [] })).toBe("ĐÃ MẶC");
    expect(stampLabel({ status: "worn", photos: [ai] })).toBe("ĐÃ MẶC");
  });
});

describe("coverCount (#144)", () => {
  it("never counts a page still to come as a time worn", () => {
    expect(coverCount([])).toBe("");
    expect(coverCount([{ status: "planned", photos: [] }])).toBe("1 trang sắp đi");
    expect(coverCount([{ status: "worn", photos: [] }, { status: "planned", photos: [] }])).toBe("2 trang · 1 lần mặc");
    expect(coverCount([{ status: "worn", photos: [real] }, { status: "worn", photos: [] }])).toBe("2 lần mặc");
  });
});
