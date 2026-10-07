import type { ReactNode } from "react";

// Every page that is not a page (#118): the 404, a shared Du Ký link that is cut short or gone. One sheet of Bà's
// paper on the desk, a title, a line of help and one way on. The desk runs up under the links at the top.

export function ErrorSheet({ kicker, title, children, action }: { kicker: string; title: string; children?: ReactNode; action: ReactNode }) {
  return (
    <main className="desk -mt-10 grid min-h-screen place-items-center px-4 pb-10 pt-20">
      <div className="paper w-full max-w-md rounded-md p-7 text-center text-[#27354f] shadow-[0_10px_24px_rgba(20,8,0,0.45)]">
        <p className="m-0 text-[0.75rem] tracking-[0.3em] text-stone-600">{kicker}</p>
        <h1 className="font-hand m-0 mt-2 text-[1.6rem] font-normal leading-snug text-[#8a4b2a]">{title}</h1>
        {children && <div className="m-0 mt-2 text-sm text-stone-700">{children}</div>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>
      </div>
    </main>
  );
}

export const CTA = "rounded-full bg-[#27354f] px-5 py-2 text-sm text-amber-50";
export const CTA_SECOND = "rounded-full border border-[#27354f] px-5 py-2 text-sm";
