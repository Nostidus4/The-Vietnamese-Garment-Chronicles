import { describe, expect, it } from "vitest";
import { checkPhoto, MAX_UPLOAD_MB, sampleNotice } from "./tryonPhoto";

const MB = 1024 * 1024;
const file = (type: string, bytes: number, name = "anh.jpg") => new File([new Uint8Array(bytes)], name, { type });
const opens = async () => {};
const broken = async () => {
  throw new Error("cannot decode");
};

describe("checkPhoto", () => {
  it("lets a normal photo through", async () => {
    expect(await checkPhoto(file("image/jpeg", 2 * MB), opens)).toBeNull();
  });

  it("allows exactly the server's limit", async () => {
    expect(await checkPhoto(file("image/png", MAX_UPLOAD_MB * MB), opens)).toBeNull();
  });

  it("stops a photo over the limit before it is sent, saying how big it is", async () => {
    expect(await checkPhoto(file("image/jpeg", 9.5 * MB), opens)).toBe("Ảnh nặng 9,5 MB, quá 8 MB. Con chọn ảnh nhỏ hơn nhé.");
  });

  it("stops a file that is not a picture", async () => {
    expect(await checkPhoto(file("application/pdf", 1000, "don.pdf"), opens)).toBe("Đây không phải file ảnh. Con chọn ảnh JPG hoặc PNG nhé.");
  });

  it("stops a picture the browser cannot open", async () => {
    expect(await checkPhoto(file("image/heic", 1000, "anh.heic"), broken)).toBe("Không mở được ảnh này. Con thử ảnh JPG hoặc PNG khác nhé.");
  });

  it("does not try to open a file it already refused", async () => {
    let tried = false;
    await checkPhoto(file("image/jpeg", 20 * MB), async () => {
      tried = true;
    });
    expect(tried).toBe(false);
  });
});

describe("sampleNotice", () => {
  it("says there is no one in the photo, and asks for one with a person", () => {
    expect(sampleNotice("no_person")).toEqual({ title: "Không thấy người nào trong ảnh này.", hint: "Con chọn ảnh chụp cả người, đứng thẳng, rõ mặt nhé.", newPhoto: true });
  });

  it("tells the reader to try again when the AI is busy or slow", () => {
    expect(sampleNotice("busy").title).toBe("Máy chủ AI đang bận nên chưa dựng được ảnh.");
    expect(sampleNotice("busy").hint).toContain("thử lại");
    expect(sampleNotice("timeout").title).toBe("AI dựng lâu quá nên đã dừng lại.");
    expect(sampleNotice("timeout").hint).toContain("thử lại");
  });

  it("does not offer the same photo again after a refusal", () => {
    expect(sampleNotice("blocked")).toEqual({ title: "AI không dựng ảnh này.", hint: "Con thử một ảnh khác nhé.", newPhoto: true });
  });

  it("does not promise a retry, or a new photo, when the AI cannot be used at all", () => {
    const n = sampleNotice("unavailable");
    expect(n.title).toBe("Thử đồ bằng AI tạm thời chưa dùng được.");
    expect(n.hint).not.toContain("thử lại");
    expect(n.newPhoto).toBe(false);
    expect(sampleNotice("no_person").newPhoto).toBe(true);
  });

  it("treats an older server without a reason as busy", () => {
    expect(sampleNotice(null)).toEqual(sampleNotice("busy"));
    expect(sampleNotice(undefined)).toEqual(sampleNotice("busy"));
  });
});
