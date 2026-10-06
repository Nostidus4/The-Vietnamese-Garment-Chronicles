// Small wording helpers shared by the screens (#59).

/** A name inside a sentence: only its first letter lowered, so "Thổ cẩm Ê Đê" stays "thổ cẩm Ê Đê", not "ê đê". */
export const lowerFirst = (s: string) => s.slice(0, 1).toLowerCase() + s.slice(1);

/** The Compass's labels are stored in English (Authentic / Adapted / Inspired); the reader sees them in Vietnamese. */
const LABEL_VI: Record<string, string> = { Authentic: "Đúng chuẩn", Adapted: "Cách tân", Inspired: "Lấy cảm hứng" };
export const labelVi = (label: string | null | undefined) => (label ? (LABEL_VI[label] ?? label) : "");
