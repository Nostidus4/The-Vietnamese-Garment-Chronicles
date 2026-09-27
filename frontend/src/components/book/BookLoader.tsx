"use client";

import dynamic from "next/dynamic";
import { useBootstrap } from "@/lib/useBootstrap";

// react-pageflip touches `window`, so it only renders in the browser
const Flipbook = dynamic(() => import("./Flipbook"), {
  ssr: false,
  loading: () => <p className="text-stone-500">Đang mở sách…</p>,
});

export function BookLoader() {
  const { data, error } = useBootstrap();
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <p className="text-stone-500">Đang mở sách…</p>;
  return <Flipbook data={data} />;
}
