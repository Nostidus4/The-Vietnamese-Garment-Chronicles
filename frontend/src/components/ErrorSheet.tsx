import type { ReactNode } from "react";
import { asset } from "@/lib/base";

// Every page that is not a page (#118): the 404, a shared Du Ký link that is cut short or gone. One sheet of Bà's
// paper on the desk, a title, a line of help and one way on. The desk runs up under the links at the top.

// `art`: Bà's old photo on the sheet, for a page a stranger lands on (a shared link): a bare card looked empty (#145)
export function ErrorSheet({ kicker, title, children, action, art = false }: { kicker: string; title: string; children?: ReactNode; action: ReactNode; art?: boolean }) {
  return (
    <main className="desk -mt-10 grid min-h-screen place-items-center px-4 pb-10 pt-20">
      <div className="paper w-full max-w-md rounded-md p-7 text-center text-[#27354f] shadow-[0_10px_24px_rgba(20,8,0,0.45)]">
        {art && (
          // eslint-disable-next-line @next/next/no-img-element -- static export: the small copy of the opening's picture
          <img src={asset("/page/desk-photo.webp")} alt="" width={400} height={225} className="mx-auto mb-4 block w-[70%] rotate-[-2deg] bg-[#b39c78] p-1.5 pb-4 shadow-[0_6px_14px_rgba(60,35,10,0.3)] sepia-[.4]" style={{ background: "#f6efe0" }} />
        )}
        <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-600">{kicker}</p>
        <h1 className="font-hand m-0 mt-2 text-[1.6rem] font-normal leading-snug text-[#8a4b2a]">{title}</h1>
        {children && <div className="m-0 mt-2 text-sm text-stone-700">{children}</div>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>
      </div>
    </main>
  );
}

export const CTA = "tap inline-flex items-center justify-center rounded-full bg-[#27354f] px-5 py-2 text-sm text-amber-50";
export const CTA_SECOND = "tap inline-flex items-center justify-center rounded-full border border-[#27354f] px-5 py-2 text-sm";
