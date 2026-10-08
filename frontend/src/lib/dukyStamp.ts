// What a Du Ký page's stamp says, in one place for the page in the book and the picture exported from it (#144):
// the card said "ĐÃ THỬ" for a page still "Sắp đi", and for a page marked worn without a real photo yet.
import type { DuKyPage } from "./dukyBook";

/** A real photo of the reader wearing it: the one the Tủ tem counts. */
export const hasRealPhoto = (page: Pick<DuKyPage, "photos">) => page.photos.some((p) => p.kind === "real");

/** "ĐÃ MẶC" once worn (a real photo, or marked worn), "ĐÃ THỬ" with only try-on pictures, else "SẮP ĐI". */
export function stampLabel(page: Pick<DuKyPage, "photos" | "status">): "ĐÃ MẶC" | "ĐÃ THỬ" | "SẮP ĐI" {
  if (hasRealPhoto(page) || page.status === "worn") return "ĐÃ MẶC";
  return page.photos.length ? "ĐÃ THỬ" : "SẮP ĐI";
}

/** What the closed notebook says about its pages: a page still "Sắp đi" is not a time it was worn. */
export function coverCount(pages: Pick<DuKyPage, "photos" | "status">[]): string {
  const worn = pages.filter((p) => stampLabel(p) === "ĐÃ MẶC").length;
  if (!pages.length) return "";
  if (worn === pages.length) return `${worn} lần mặc`;
  return worn ? `${pages.length} trang · ${worn} lần mặc` : `${pages.length} trang sắp đi`;
}
