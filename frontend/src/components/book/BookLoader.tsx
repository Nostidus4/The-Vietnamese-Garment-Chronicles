"use client";

import dynamic from "next/dynamic";

// react-pageflip touches `window`, so it only renders in the browser
const Flipbook = dynamic(() => import("./Flipbook"), {
  ssr: false,
  loading: () => <p className="text-stone-500">Đang mở sách…</p>,
});

export function BookLoader() {
  return <Flipbook />;
}
