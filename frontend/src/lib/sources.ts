import type { Bootstrap } from "./types";

export type SourceRef = { id: string; title: string; url: string | null; verified?: boolean };

/** "Bảo tàng Hà Nội (không rõ năm). Phụ nữ…" → "Bảo tàng Hà Nội. Phụ nữ…": the placeholder stays in the data, not on screen. */
const readable = (s: SourceRef): SourceRef => ({ ...s, title: s.title.replace(/\s*\(không rõ năm\)/, "") });

/** The sources the app may cite: known, and vetted (a source with verified: false is still being checked, #50). */
export function cited(data: Pick<Bootstrap, "sources">, ids: string[]): SourceRef[] {
  return ids.map((id) => data.sources[id]).filter((s): s is SourceRef => !!s && s.verified !== false).map(readable);
}

/** Tèo's answer without the codes the model sometimes copies ("[ref-03, ref-12]", "(research-6)", "(keep)", "(flexible)"):
 * the sources are listed under the answer. */
export function plainAnswer(text: string): string {
  return text
    .replace(/\s*[[(]\s*(?:ref|research)-[\w-]+(?:\s*,\s*(?:ref|research)-[\w-]+)*\s*[\])]/g, "")
    .replace(/\s*\((?:keep|caution|free|core|flexible|fusion|restricted|occasion)\)/gi, "")
    .replace(/\s+([.,!?])/g, "$1");
}

/** Title and link of a source id from the bootstrap; an unknown id is shown as-is instead of crashing. */
export function sourceOf(data: Pick<Bootstrap, "sources">, id: string): SourceRef {
  return readable(data.sources[id] ?? { id, title: id, url: null });
}
