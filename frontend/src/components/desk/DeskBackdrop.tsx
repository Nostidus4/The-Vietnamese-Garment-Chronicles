import Image from "next/image";
import { asset } from "@/lib/base";
import { placeholder } from "@/lib/placeholders";

/** Screens no wider than 3:5 (phones held upright) only see a strip of the desk; globals.css centres it for them. */
export const DESK_STRIP_MEDIA = "(max-aspect-ratio: 3/5)";

/** The wooden desk behind Bà's notebook and Du Ký. Fills the screen. */
// Phones held upright get Desk-portrait.webp, the strip of the photo they show (scripts/optimize-images.mjs, #120): the
// static site has no image server, so the <source> picks the file instead of next/image.
export function DeskBackdrop() {
  return (
    <picture className="absolute inset-0">
      <source media={DESK_STRIP_MEDIA} srcSet={asset("/page/Desk-portrait.webp")} />
      <Image src={asset("/page/Desk.webp")} alt="" fill loading="eager" placeholder={placeholder("/page/Desk.webp")} quality={88} sizes="100vw" className="desk-bg object-cover" />
    </picture>
  );
}
