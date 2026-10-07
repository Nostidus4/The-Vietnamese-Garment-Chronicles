import Image from "next/image";
import { asset } from "@/lib/base";

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
      <Image src={asset("/page/title-page.webp")} alt="Bìa sổ Việt Phục Du Ký" fill loading="eager" sizes={sizes} className="select-none object-cover" draggable={false} />
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ left: "20.8%", top: "27.5%", width: "67.5%", height: "21.5%" }}>
        <p className="m-0 text-[2.6cqw] font-semibold tracking-[0.3em] text-[#2F4A6D]">SỔ TAY CỦA BÀ</p>
        <Title className="font-display m-0 text-[7.6cqw] leading-tight text-[#2F4A6D]">Việt Phục Du Ký</Title>
      </div>
    </div>
  );
}
