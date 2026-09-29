import type { Bootstrap } from "./types";

export type SourceRef = { id: string; title: string; url: string | null };

/** Title and link of a source id from the bootstrap; an unknown id is shown as-is instead of crashing. */
export function sourceOf(data: Pick<Bootstrap, "sources">, id: string): SourceRef {
  return data.sources[id] ?? { id, title: id, url: null };
}
