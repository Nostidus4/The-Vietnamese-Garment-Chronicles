"use client";

import dynamic from "next/dynamic";

// Du Ký lives in localStorage and IndexedDB, so render it in the browser only
const DuKyNotebook = dynamic(() => import("@/components/duky/DuKyNotebook"), { ssr: false });

export default function DuKyPage() {
  return <DuKyNotebook />;
}
