"use client";

import dynamic from "next/dynamic";
import { BootShell } from "@/components/opening/BootShell";

// The opening and the desk are browser-only (viewport maths, localStorage, react-pageflip)
const Home = dynamic(() => import("@/components/home/Home"), {
  ssr: false,
  // above the menu (z-30), so the links do not show over an empty page; it is in the static HTML (#110)
  loading: () => <BootShell />,
});

export default function Page() {
  return <Home />;
}
