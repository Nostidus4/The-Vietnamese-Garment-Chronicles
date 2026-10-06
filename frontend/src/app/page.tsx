"use client";

import dynamic from "next/dynamic";

// The opening and the desk are browser-only (viewport maths, localStorage, react-pageflip)
const Home = dynamic(() => import("@/components/home/Home"), {
  ssr: false,
  // above the menu (z-30), like the loading screen in Home, so the links do not show over an empty page
  loading: () => <div className="fixed inset-0 z-40 bg-[#140c07]" />,
});

export default function Page() {
  return <Home />;
}
