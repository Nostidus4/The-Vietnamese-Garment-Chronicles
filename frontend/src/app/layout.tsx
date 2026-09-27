import type { Metadata } from "next";
import { Be_Vietnam_Pro, Patrick_Hand, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const body = Be_Vietnam_Pro({ variable: "--font-body", subsets: ["vietnamese", "latin"], weight: ["400", "600"] });
const hand = Patrick_Hand({ variable: "--font-hand", subsets: ["vietnamese", "latin"], weight: "400" });
const display = Playfair_Display({ variable: "--font-display", subsets: ["vietnamese", "latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Việt Phục Du Ký",
  description: "Hiểu để mặc đúng – Sáng tạo để mặc theo cách của mình.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${hand.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        <nav className="flex justify-end gap-4 p-4 text-sm">
          <Link href="/">Sách</Link>
          <Link href="/du-ky">Du Ký của tôi</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
