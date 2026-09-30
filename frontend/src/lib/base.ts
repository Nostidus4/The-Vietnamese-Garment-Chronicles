// The site can live under a sub-path (GitHub Pages: /The-Vietnamese-Garment-Chronicles). Next adds it to <Link>
// and router.push, but not to plain <a href>, <img src>, CSS url() or fetch(): those go through asset().
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** "/page/Desk.png" → "/The-Vietnamese-Garment-Chronicles/page/Desk.png" on GitHub Pages; unchanged elsewhere. */
export function asset<T extends string | null | undefined>(path: T): T {
  if (!BASE || !path || !path.startsWith("/") || path.startsWith("//") || path.startsWith(BASE + "/")) return path;
  return (BASE + path) as T;
}
