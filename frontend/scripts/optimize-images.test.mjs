import { describe, expect, it } from "vitest";
import { existsSync, globSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { garmentPlates, LONG_EDGE, plan } from "./optimize-images.mjs";

describe("plan", () => {
  it("builds every published photo from its original", () => {
    const p = plan({ published: ["regions/hue/a.jpg"], originals: ["regions/hue/a.jpg"] });
    expect(p).toEqual({ adopt: [], build: ["regions/hue/a.jpg"], orphans: [] });
  });

  it("adopts a newly added photo as its own original", () => {
    const p = plan({ published: ["regions/hue/new.jpg"], originals: [] });
    expect(p.adopt).toEqual(["regions/hue/new.jpg"]);
    expect(p.build).toEqual(["regions/hue/new.jpg"]);
  });

  it("takes a full-size photo put over an old one as its new original", () => {
    const p = plan({ published: ["regions/hue/a.jpg"], originals: ["regions/hue/a.jpg"], fullSize: ["regions/hue/a.jpg"] });
    expect(p.adopt).toEqual(["regions/hue/a.jpg"]);
  });

  it("reports an original whose photo was removed from the site, without building it again", () => {
    const p = plan({ published: [], originals: ["regions/hue/gone.jpg"] });
    expect(p).toEqual({ adopt: [], build: [], orphans: ["regions/hue/gone.jpg"] });
  });
});

// a photo added to public/regions without running the script would be sent to every phone at full size (#64)
describe("region photos on the site", () => {
  const files = globSync("public/regions/**/*.jpg", { cwd: fileURLToPath(new URL("..", import.meta.url)) });

  it("exist", () => expect(files.length).toBeGreaterThan(0));

  it.each(files)("%s is web-sized (run `npm run images` if not)", async (f) => {
    const { width = 0, height = 0 } = await sharp(fileURLToPath(new URL(`../${f}`, import.meta.url))).metadata();
    expect(Math.max(width, height)).toBeLessThanOrEqual(LONG_EDGE);
  });
});

describe("garmentPlates", () => {
  it("leaves out the try-on previews and the bare avatar", () => {
    const files = ["garments/ao-dai.webp", "garments/ao-dai-preview.webp", "garments/avatar.webp", "garments/ao-com.webp"];
    expect(garmentPlates(files)).toEqual(["garments/ao-com.webp", "garments/ao-dai.webp"]);
  });
});

// the wardrobe card shows a plate 64 px tall; the full 598×820 plate was ~9× the pixels on a phone (#120)
describe("small copies for phones", () => {
  const pub = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));
  const plates = garmentPlates(globSync("garments/*.webp", { cwd: pub("") }));

  it.each(plates)("%s has a wardrobe thumbnail under 20 KB (run `npm run images` if not)", (g) => {
    const thumb = pub(g.replace("garments/", "garments/thumb/"));
    expect(existsSync(thumb)).toBe(true);
    expect(statSync(thumb).size).toBeLessThan(20 * 1024);
  });

  it.each(["page/title-page-560.webp", "page/Desk-portrait.webp", "page/fitting-room-portrait.webp"])("%s exists", (f) => expect(existsSync(pub(f))).toBe(true));
});
