// Makes the pictures the static site sends smaller (#64). GitHub Pages has no image server, so what is in public/ is
// what every phone downloads.
//
//   npm run images
//
// - Region photos and memory art: the full-size JPGs live in originals/regions/ (outside public/, never deployed);
//   public/regions/ gets copies at most 1000 px on the long side (they show at 400–600 px). A JPG newly added to
//   public/regions/, or put over an old one at full size, is moved into originals/ the first time the script runs, so
//   just drop new pictures in public/.
//   Names stay the same, so the content JSON does not change.
// - Bà's old photo on the desk: a small copy of the opening's s06 picture instead of the full-screen one.
// - The logo for phones (and for the light passing over it): 560 px wide instead of 1118 px.
// - The cover (title-page) for phones and Du Ký's corner: 560 px wide instead of 1086 px (#120).
// - The desk and the fitting room for phones held upright: only the strip they show (the same pixels, #120).
// - Wardrobe cards: each garment plate 240 px tall in garments/thumb/ (the card shows it 64 px tall, #120).
// - Blur placeholder for the desk photo, shown while it loads (src/lib/placeholders.json).

import { copyFileSync, globSync, mkdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

export const LONG_EDGE = 1000;
const QUALITY = 78;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const ORIGINALS = join(ROOT, "originals");

const THUMBS = [
  { from: "opening/s06.webp", to: "page/desk-photo.webp", width: 400, quality: 75 },
  { from: "page/logo-mark.webp", to: "page/logo-mark-560.webp", width: 560, quality: 88 },
  { from: "page/title-page.webp", to: "page/title-page-560.webp", width: 560, quality: 80 },
];
/** Height of a wardrobe card picture: 64 CSS px on a 3× screen is 192, with some room. */
export const GARMENT_THUMB_HEIGHT = 240;
/**
 * The upright-phone desk: a strip of Desk.webp (1672×941) around x = 935, the middle of what a phone sees at
 * object-position 58% (.desk-bg in globals.css). Screens no wider than 3:5 see only part of it, so nothing changes on
 * screen; they show it at object-position 50%.
 */
const DESK_STRIP = { from: "page/Desk.webp", to: "page/Desk-portrait.webp", left: 935 - 282, width: 565 };
/** The fitting room (1448×1086) is centred (.fitting, 50% 42%): its middle 3:5 strip is all an upright phone shows. */
const ROOM_STRIP = { from: "page/fitting-room.webp", to: "page/fitting-room-portrait.webp", left: 724 - 326, width: 652 };
const PLACEHOLDERS = ["page/Desk.webp"];

/**
 * What to do with the region photos, given the paths (relative to public/ and originals/) on each side and the
 * published ones still larger than LONG_EDGE (a picture someone just put in, maybe over an old one).
 * adopt: published photos that become their own original; build: every published photo; orphans: originals no longer
 * on the site.
 */
export function plan({ published, originals, fullSize = [] }) {
  const have = new Set(originals);
  const shown = new Set(published);
  const fresh = new Set(fullSize);
  return {
    adopt: published.filter((p) => !have.has(p) || fresh.has(p)),
    build: [...published],
    orphans: originals.filter((o) => !shown.has(o)),
  };
}

/** The garment plates among the pictures in public/garments/ (not the try-on previews or the bare avatar). */
export const garmentPlates = (files) => files.filter((f) => !f.endsWith("-preview.webp") && !f.endsWith("/avatar.webp")).sort();

const kb = (n) => `${Math.round(n / 1024)} KB`;

async function main() {
  const list = (dir) => globSync("regions/**/*.jpg", { cwd: dir }).sort();
  const published = list(PUBLIC);
  const fullSize = [];
  for (const p of published) {
    const { width = 0, height = 0 } = await sharp(join(PUBLIC, p)).metadata();
    if (Math.max(width, height) > LONG_EDGE) fullSize.push(p);
  }
  const { adopt, build, orphans } = plan({ published, originals: list(ORIGINALS), fullSize });

  for (const p of adopt) {
    mkdirSync(dirname(join(ORIGINALS, p)), { recursive: true });
    renameSync(join(PUBLIC, p), join(ORIGINALS, p));
    console.log(`new original: ${p}`);
  }

  let before = 0;
  let after = 0;
  for (const p of build) {
    const out = join(PUBLIC, p);
    const buf = await sharp(join(ORIGINALS, p))
      .rotate()
      .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();
    const orig = statSync(join(ORIGINALS, p)).size;
    // a small original can come out bigger after re-encoding: keep it as it is
    if (buf.length < orig) writeFileSync(out, buf);
    else copyFileSync(join(ORIGINALS, p), out);
    before += orig;
    after += Math.min(buf.length, orig);
  }
  console.log(`regions: ${build.length} photos, ${kb(before)} -> ${kb(after)}`);
  for (const o of orphans) console.warn(`original no longer used on the site (delete it if so): originals/${o}`);

  for (const t of THUMBS) {
    await sharp(join(PUBLIC, t.from)).resize(t.width).webp({ quality: t.quality, effort: 6 }).toFile(join(PUBLIC, t.to));
    console.log(`thumb: ${t.to} (${kb(statSync(join(PUBLIC, t.to)).size)})`);
  }

  for (const strip of [DESK_STRIP, ROOM_STRIP]) {
    const { height = 0 } = await sharp(join(PUBLIC, strip.from)).metadata();
    await sharp(join(PUBLIC, strip.from))
      .extract({ left: strip.left, top: 0, width: strip.width, height })
      .webp({ quality: 80, effort: 6 })
      .toFile(join(PUBLIC, strip.to));
    console.log(`strip: ${strip.to} (${kb(statSync(join(PUBLIC, strip.to)).size)})`);
  }

  mkdirSync(join(PUBLIC, "garments/thumb"), { recursive: true });
  for (const g of garmentPlates(globSync("garments/*.webp", { cwd: PUBLIC }))) {
    const to = `garments/thumb/${g.slice("garments/".length)}`;
    await sharp(join(PUBLIC, g)).resize({ height: GARMENT_THUMB_HEIGHT }).webp({ quality: 78, effort: 6 }).toFile(join(PUBLIC, to));
    console.log(`thumb: ${to} (${kb(statSync(join(PUBLIC, to)).size)})`);
  }

  const blur = {};
  for (const p of PLACEHOLDERS) {
    const b = await sharp(join(PUBLIC, p)).resize(24).webp({ quality: 50 }).toBuffer();
    blur[`/${p}`] = `data:image/webp;base64,${b.toString("base64")}`;
  }
  writeFileSync(join(ROOT, "src/lib/placeholders.json"), JSON.stringify(blur, null, 2) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
