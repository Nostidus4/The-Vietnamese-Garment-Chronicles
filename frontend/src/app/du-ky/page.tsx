"use client";

import dynamic from "next/dynamic";

// Du Ký lives in localStorage, so render it in the browser only
const DuKyView = dynamic(() => import("@/components/duky/DuKyView"), { ssr: false });

export default function DuKyPage() {
  return <DuKyView />;
}
