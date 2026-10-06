import Link from "next/link";

// A page that is not in the book, in Bà's words rather than Next's "This page could not be found." (#54)
export const metadata = { title: "Không có trang này" };

export default function NotFound() {
  return (
    <main className="desk grid min-h-screen place-items-center px-4 py-10">
      <div className="paper w-full max-w-md rounded-md p-7 text-center text-[#27354f] shadow-[0_10px_24px_rgba(20,8,0,0.45)]">
        <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-500">TRANG NÀY KHÔNG CÓ TRONG SỔ</p>
        <p className="font-hand m-0 mt-2 text-[1.6rem] leading-snug text-[#8a4b2a]">Con lật nhầm trang rồi. Sổ của Bà không có trang này.</p>
        <p className="m-0 mt-2 text-sm text-stone-600">Có thể đường link bị gõ sai, hoặc trang đã được gỡ.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/" className="rounded-full bg-[#27354f] px-5 py-2 text-sm text-amber-50">
            Về sổ của Bà
          </Link>
          <Link href="/du-ky" className="rounded-full border border-[#27354f] px-5 py-2 text-sm">
            Mở Du Ký của con
          </Link>
        </div>
      </div>
    </main>
  );
}
