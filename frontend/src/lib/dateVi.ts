// One way to write a date in Du Ký (#145): d/m/yyyy, as the convention of #114 and as page titles show it. A native
// date field showed "dd/mm/yyyy" or "17/02/2026" depending on the browser, next to a title saying "17/2/2026".

/** "2026-02-17" → "17/2/2026"; "" for nothing. */
export function formatDateVi(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

/** "17/2/2026" (or with - or .) → "2026-02-17"; null when it is not a real day. */
export function parseDateVi(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
