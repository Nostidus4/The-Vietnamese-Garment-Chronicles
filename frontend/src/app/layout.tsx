import type { Metadata } from "next";
import { Be_Vietnam_Pro, Patrick_Hand } from "next/font/google";
import Link from "next/link";
import { AmbientSound } from "@/components/AmbientSound";
import { StampToast } from "@/components/StampToast";
import { ServerWake } from "@/components/ServerWake";
import "./globals.css";
import { asset } from "@/lib/base";

// two typefaces only: Be Vietnam Pro for everything printed, Patrick Hand for what Bà, Tí and Tèo write by hand
const body = Be_Vietnam_Pro({ variable: "--font-body", subsets: ["vietnamese", "latin"], weight: ["400", "600", "700"] });
const hand = Patrick_Hand({ variable: "--font-hand", subsets: ["vietnamese", "latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Việt Phục Du Ký",
  description: "Hiểu để mặc đúng – Sáng tạo để mặc theo cách của mình.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${hand.variable} h-full antialiased`}>
      <body className="min-h-full">
        <nav className="site-nav absolute right-4 top-3 z-30 flex gap-4 text-sm sm:fixed">
          <Link href="/">Sách</Link>
          <Link href="/du-ky">Du Ký của tôi</Link>
          {/* full reload on purpose so the opening restarts from the first screen */}
          <a href={asset("/?opening=1")}>Xem lại mở đầu</a>
          <AmbientSound />
        </nav>
        <div className="h-10" />
        {children}
        <ServerWake />
        <StampToast />
      </body>
    </html>
  );
}
