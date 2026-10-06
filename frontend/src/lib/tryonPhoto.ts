// The reader's photo for the try-on (#52): checked here before it is sent, and what to say when only the sample came
// back. Pure, so both are tested without a browser.

import type { FallbackReason } from "./types";

/** As backend MAX_UPLOAD_MB: a bigger photo would upload in full, only to get a 413. */
export const MAX_UPLOAD_MB = 8;

/** Why this photo cannot be sent, or null. `decode` opens the picture (createImageBitmap in the browser). */
export async function checkPhoto(file: File, decode: (f: File) => Promise<unknown>): Promise<string | null> {
  if (!file.type.startsWith("image/")) return "Đây không phải file ảnh. Con chọn ảnh JPG hoặc PNG nhé.";
  const mb = file.size / (1024 * 1024);
  if (mb > MAX_UPLOAD_MB) return `Ảnh nặng ${mb.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB, quá ${MAX_UPLOAD_MB} MB. Con chọn ảnh nhỏ hơn nhé.`;
  try {
    await decode(file);
  } catch {
    return "Không mở được ảnh này. Con thử ảnh JPG hoặc PNG khác nhé."; // e.g. HEIC outside Safari, or a broken file
  }
  return null;
}

export type SampleNotice = { title: string; hint: string };

/** What the mirror says instead of a card when the server sent only its sample picture. */
export function sampleNotice(reason: FallbackReason | null | undefined): SampleNotice {
  switch (reason) {
    case "no_person":
      return { title: "Không thấy người nào trong ảnh này.", hint: "Con chọn ảnh chụp cả người, đứng thẳng, rõ mặt nhé." };
    case "timeout":
      return { title: "AI dựng lâu quá nên đã dừng lại.", hint: "Con bấm “Dựng ảnh của con” để thử lại, hoặc chọn ảnh khác." };
    case "blocked":
      return { title: "AI không dựng ảnh này.", hint: "Con thử một ảnh khác nhé." };
    default:
      return { title: "Máy chủ AI đang bận nên chưa dựng được ảnh.", hint: "Con bấm “Dựng ảnh của con” để thử lại sau ít phút, hoặc chọn ảnh khác." };
  }
}
