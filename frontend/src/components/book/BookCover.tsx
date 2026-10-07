import Image from "next/image";
import { asset } from "@/lib/base";

const LOGO = "/page/logo-mark-560.webp"; // LogoIntro's LOGO_SMALL, named here so this file stays free of the client module

// The label of public/page/title-page.webp occupies 20.8–88.3% × 27.5–49% of the cover.
export const COVER_ASPECT = 1086 / 1448;

/** Bà's notebook cover with the real title set into its embroidered label. Fills its parent. */
// Always loaded eagerly: Chrome counts the cover as the largest picture on the desk and even as Du Ký's small corner
// thumbnail (the desk photo behind it does not count), and the opening's last move needs it ready.
export function BookCover({ sizes = "560px" }: { sizes?: string }) {
  return (
    <div className="absolute inset-0 [container-type:inline-size]">
      <Image src={asset("/page/title-page.webp")} alt="Bìa sổ Việt Phục Du Ký" fill loading="eager" sizes={sizes} className="select-none object-cover" draggable={false} />
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ left: "20.8%", top: "27.5%", width: "67.5%", height: "21.5%" }}>
        <p className="m-0 text-[2.6cqw] font-semibold tracking-[0.3em] text-[#2F4A6D]">SỔ TAY CỦA BÀ</p>
        {/* the name in the logo's own lettering (the opening showed it a moment ago), not bold sans (#115): the words of
            logo-mark-560.webp, cut out of the picture (they sit 285–368px down a 560px-wide image) */}
        <h1 className="m-0 mt-[1cqw] w-[86%]">
          <span className="sr-only">Việt Phục Du Ký</span>
          <span className="relative block overflow-hidden" style={{ aspectRatio: "560 / 83" }} aria-hidden>
            <Image src={asset(LOGO)} alt="" width={560} height={402} unoptimized className="absolute left-0 w-full max-w-none" style={{ top: `${(-285 / 83) * 100}%` }} draggable={false} />
          </span>
        </h1>
      </div>
    </div>
  );
}
