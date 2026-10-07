import Link from "next/link";
import { CTA, CTA_SECOND, ErrorSheet } from "@/components/ErrorSheet";

// A page that is not in the book, in Bà's words rather than Next's "This page could not be found." (#54)
export const metadata = { title: "Không có trang này" };

export default function NotFound() {
  return (
    <ErrorSheet
      kicker="TRANG NÀY KHÔNG CÓ TRONG SỔ"
      title="Con lật nhầm trang rồi. Sổ của Bà không có trang này."
      action={
        <>
          <Link href="/" className={CTA}>
            Về sổ của Bà
          </Link>
          <Link href="/du-ky" className={CTA_SECOND}>
            Mở Du Ký của con
          </Link>
        </>
      }
    >
      Có thể đường link bị gõ sai, hoặc trang đã được gỡ.
    </ErrorSheet>
  );
}
