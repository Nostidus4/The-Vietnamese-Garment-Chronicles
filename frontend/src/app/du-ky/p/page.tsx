"use client";

import dynamic from "next/dynamic";

// A shared Du Ký page: /du-ky/p/?id=… (the id is read in the browser, so the page can be prebuilt)
const SharedFromQuery = dynamic(() => import("@/components/duky/SharedView").then((m) => m.SharedFromQuery), { ssr: false });

export default function SharedPage() {
  return <SharedFromQuery />;
}
