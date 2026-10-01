import Image from "next/image";
import { asset } from "@/lib/base";

// The label of public/page/title-page.png occupies 20.8–88.3% × 27.5–49% of the cover.
export const COVER_ASPECT = 1086 / 1448;

/** Bà's notebook cover with the real title set into its embroidered label. Fills its parent. */
export function BookCover({ priority = false, sizes = "560px" }: { priority?: boolean; sizes?: string }) {
  return (
    <div className="absolute inset-0 [container-type:inline-size]">
      <Image src={asset("/page/title-page.png")} alt="Bìa sổ Việt Phục Du Ký" fill priority={priority} sizes={sizes} className="select-none object-cover" draggable={false} />
      <div className="absolute flex flex-col items-center justify-center text-center" style={{ left: "20.8%", top: "27.5%", width: "67.5%", height: "21.5%" }}>
        <p className="m-0 text-[2.1cqw] tracking-[0.35em] text-[#2F4A6D]/70">SỔ TAY CỦA BÀ</p>
        <h1 className="font-display m-0 text-[7.6cqw] leading-tight text-[#2F4A6D]">Việt Phục Du Ký</h1>
      </div>
    </div>
  );
}
