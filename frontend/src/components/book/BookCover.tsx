import Image from "next/image";
import { asset } from "@/lib/base";

const COVER = "/page/title-page.webp";
const COVER_SMALL = "/page/title-page-560.webp"; // scripts/optimize-images.mjs
const LOGO = "/page/logo-mark-560.webp"; // LogoIntro's LOGO_SMALL, named here so this file stays free of the client module

// The label of public/page/title-page.webp occupies 20.8–88.3% × 27.5–49% of the cover.
export const COVER_ASPECT = 1086 / 1448;

/** Bà's notebook cover with the real title set into its embroidered label. Fills its parent. */
// Always loaded eagerly: Chrome counts the cover as the largest picture on the desk and even as Du Ký's small corner
// thumbnail (the desk photo behind it does not count), and the opening's last move needs it ready.
// `heading`: the title is the page's <h1> only on the desk; elsewhere the cover is a picture of the book (#118)
export function BookCover({ sizes = "560px", heading = false }: { sizes?: string; heading?: boolean }) {
  const Title = heading ? "h1" : "p";
  return (
    <div className="absolute inset-0 [container-type:inline-size]">
      {/* the static site has no image server: the <source> offers the 560 px copy for phones and Du Ký's corner (#120) */}
      <picture className="absolute inset-0">
        <source srcSet={`${asset(COVER_SMALL)} 560w, ${asset(COVER)} 1086w`} sizes={sizes} />
        <Image src={asset(COVER)} alt="Bìa sổ Việt Phục Du Ký" fill loading="eager" sizes={sizes} className="select-none object-cover" draggable={false} />
      </picture>
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ left: "20.8%", top: "27.5%", width: "67.5%", height: "21.5%" }}>
        <p className="m-0 text-[max(12px,2.6cqw)] font-semibold tracking-[min(0.3em,1cqw)] text-[#2F4A6D]">SỔ CỦA BÀ</p>
        {/* the name in the logo's own lettering (the opening showed it a moment ago), not bold sans (#115): the words of
            logo-mark-560.webp, cut out of the picture (they sit 285–368px down a 560px-wide image) */}
        <Title className="m-0 mt-[1cqw] w-[86%]">
          <span className="sr-only">Việt Phục Du Ký</span>
          <span className="relative block overflow-hidden" style={{ aspectRatio: "560 / 83" }} aria-hidden>
            <Image src={asset(LOGO)} alt="" width={560} height={402} unoptimized className="absolute left-0 w-full max-w-none" style={{ top: `${(-285 / 83) * 100}%` }} draggable={false} />
          </span>
        </Title>
      </div>
    </div>
  );
}
