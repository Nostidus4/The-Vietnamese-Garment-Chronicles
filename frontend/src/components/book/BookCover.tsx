import Image from "next/image";
import { asset } from "@/lib/base";

// The label of public/page/title-page.webp occupies 20.8–88.3% × 27.5–49% of the cover.
export const COVER_ASPECT = 1086 / 1448;

/** Bà's notebook cover with the real title set into its embroidered label. Fills its parent. */
// Always loaded eagerly: wherever the cover shows (desk, Du Ký, the opening's last move) it is the largest thing on screen.
export function BookCover({ sizes = "560px" }: { sizes?: string }) {
  return (
    <div className="absolute inset-0 [container-type:inline-size]">
      <Image src={asset("/page/title-page.webp")} alt="Bìa sổ Việt Phục Du Ký" fill loading="eager" sizes={sizes} className="select-none object-cover" draggable={false} />
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ left: "20.8%", top: "27.5%", width: "67.5%", height: "21.5%" }}>
        <p className="m-0 text-[2.6cqw] font-semibold tracking-[0.3em] text-[#2F4A6D]">SỔ TAY CỦA BÀ</p>
        <h1 className="font-display m-0 text-[7.6cqw] leading-tight text-[#2F4A6D]">Việt Phục Du Ký</h1>
      </div>
    </div>
  );
}
