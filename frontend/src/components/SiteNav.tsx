"use client";

// The links at the top of every page. On a shared Du Ký page the reader is usually someone else, who has not met Bà
// and whose own Du Ký is empty: the links say where they lead for them (#97).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AmbientSound } from "./AmbientSound";
import { asset } from "@/lib/base";

export function SiteNav() {
  // only the shared page itself (/du-ky/p/?id=…): any deeper address is a 404, prebuilt with the usual links, and
  // switching them on in the browser broke the hydration of that page (React #418, #118)
  const shared = /^\/du-ky\/p\/?$/.test(usePathname() ?? "");
  return (
    <nav className="site-nav absolute right-4 top-3 z-30 flex gap-4 text-sm sm:fixed">
      {shared ? (
        <>
          <a href={asset("/")}>Mở Việt Phục Du Ký</a>
          <Link href="/du-ky">Viết Du Ký của mình</Link>
        </>
      ) : (
        <>
          {/* a full load on purpose: pressed while Bà's book is open, it puts the book back on the table (#65) */}
          <a href={asset("/")}>Sổ của Bà</a>
          <Link href="/du-ky">Du Ký của con</Link>
          {/* full reload on purpose so the opening restarts from the first screen */}
          <a href={asset("/?opening=1")}>Xem lại mở đầu</a>
        </>
      )}
      <AmbientSound />
    </nav>
  );
}
