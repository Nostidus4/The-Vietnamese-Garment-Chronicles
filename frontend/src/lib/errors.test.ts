import { describe, expect, it } from "vitest";
import { friendlyError } from "./errors";

describe("friendlyError", () => {
  it("keeps our own Vietnamese messages", () => {
    expect(friendlyError(new Error("Ảnh quá lớn, con chọn ảnh dưới 8MB nhé."), "x")).toBe("Ảnh quá lớn, con chọn ảnh dưới 8MB nhé.");
  });
  it("turns a dropped connection into words", () => {
    expect(friendlyError(new TypeError("Failed to fetch"), "x")).toMatch(/Mạng/);
  });
  it("never shows a browser's English", () => {
    expect(friendlyError(new Error("Failed to execute 'createImageBitmap' on 'Window'"), "Chưa tạo được link.")).toBe("Chưa tạo được link.");
    expect(friendlyError(new DOMException("The operation was aborted.", "AbortError"), "Chưa xong.")).toBe("Chưa xong.");
  });
  it("says the server is busy instead of a bare status", () => {
    expect(friendlyError(new Error("Lỗi 503"), "x")).toMatch(/bận/);
    expect(friendlyError(new Error("Lỗi 404"), "Không thấy.")).toBe("Không thấy.");
  });
  it("handles things that are not errors", () => {
    expect(friendlyError("oops", "Có lỗi.")).toBe("Có lỗi.");
  });
});
