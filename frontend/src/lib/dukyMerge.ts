// Bringing the cloud copy of the Du Ký onto this device (#80). It used to replace the book on the device, so a page
// written here since the last upload was lost. Now the two are put together: every page of either, once.

import type { DuKyBook, DuKyPage } from "./dukyBook";

/**
 * The book on this device and the one from the cloud, together. A page in both keeps this device's words (the most
 * recent edits are made here) with the photos of both; the cover keeps this device's name unless it has none.
 */
export function mergeBooks(local: DuKyBook, cloud: DuKyBook): DuKyBook {
  const byId = new Map<string, DuKyPage>(cloud.pages.map((p) => [p.id, p]));
  for (const p of local.pages) {
    const c = byId.get(p.id);
    if (!c) {
      byId.set(p.id, p);
      continue;
    }
    const photos = [...p.photos, ...c.photos.filter((ph) => !p.photos.some((x) => x.id === ph.id))].slice(0, 3);
    byId.set(p.id, { ...p, photos, share: p.share ?? c.share });
  }
  return {
    cover: { name: local.cover.name || cloud.cover.name, color: local.cover.name ? local.cover.color : cloud.cover.color },
    pages: [...byId.values()],
  };
}
