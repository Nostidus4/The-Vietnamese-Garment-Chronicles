"use client";

import dynamic from "next/dynamic";

// The opening and the desk are browser-only (viewport maths, localStorage, react-pageflip)
const Home = dynamic(() => import("@/components/home/Home"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#140c07]" />,
});

export default function Page() {
  return <Home />;
}
