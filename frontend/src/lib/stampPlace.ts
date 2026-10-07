// Not a client module: the chapter page's metadata (a server file) names the room with it too.
import type { Region } from "./types";

/**
 * The place a region's stamps are named after: its open chapter (Huế), else the region. Every stamp says it the same
 * way, in the chapter, the toast, the Tủ tem, the Du Ký page and its card, so "đã hiểu Huế" is never "đã hiểu Trung Bộ"
 * elsewhere (#114). Takes the bits it needs so the build-time regions.json fits too.
 */
export const stampPlace = (r: Pick<Region, "name"> & { chapters?: Region["chapters"] }) =>
  r.chapters?.find((c) => c.status === "open")?.province ?? r.name.split("/")[0].trim();

/** The same for a region id (a Du Ký page stores only that); "" when the id is unknown. */
export const stampPlaceOf = (regions: Region[], id: string) => {
  const r = regions.find((x) => x.id === id);
  return r ? stampPlace(r) : "";
};
