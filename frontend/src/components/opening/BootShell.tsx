import { asset } from "@/lib/base";

// What the home page shows before its JavaScript has run. It is in the static HTML, so a first visit sees the cream
// page and the logo at once instead of 2–3 s of an empty page with only the faint menu (#110). LogoIntro then takes
// over with the logo in the same place. A returning visitor goes straight to the desk: the inline script in
// app/layout.tsx marks the page, and the shell stays the dark loading screen it was before.

/** The logo at 560 px wide (scripts/optimize-images.mjs). */
export const LOGO_SMALL = "/page/logo-mark-560.webp";
/** Phones get the 560 px copy, which the logo above the first question also uses, so a phone downloads one file. */
export const logoImg = () => ({
  src: asset(LOGO_SMALL),
  srcSet: `${asset(LOGO_SMALL)} 560w, ${asset("/page/logo-mark.webp")} 1118w`,
  sizes: "min(72vw, 520px)",
  width: 1118,
  height: 802,
});
export const TAGLINE = "Hiểu để mặc đúng – Sáng tạo để mặc theo cách của mình.";

export function BootShell() {
  return (
    <div className="boot-shell paper fixed inset-0 z-[45] flex flex-col items-center justify-center px-6" aria-hidden>
      <div className="boot-shell__logo w-[min(72vw,520px)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- a hand-made srcSet: the static site has no image server */}
        <img {...logoImg()} alt="" fetchPriority="high" className="h-auto w-full" />
      </div>
      {/* takes the room of LogoIntro's line of text, so the logo does not move when LogoIntro takes over */}
      <p className="font-hand m-0 mt-2 text-center text-lg opacity-0 sm:text-xl">{TAGLINE}</p>
    </div>
  );
}
