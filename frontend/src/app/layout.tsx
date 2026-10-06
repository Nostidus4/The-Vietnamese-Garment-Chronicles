import type { Metadata, Viewport } from "next";
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

const DESCRIPTION =
  "Cuốn sổ của Bà đưa bạn đi qua trang phục truyền thống từng vùng: đọc nhật ký, phối áo cùng Compass văn hóa, thử với ảnh của mình và ghi Du Ký những lần mặc.";

// what a link shows when it is pasted into Zalo, Messenger or Facebook (#54); the icons and the share picture are
// the files icon.png, apple-icon.png, opengraph-image.jpg and twitter-image.jpg in this folder
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://nostidus4.github.io"),
  title: { default: "Việt Phục Du Ký", template: "%s · Việt Phục Du Ký" },
  description: DESCRIPTION,
  applicationName: "Việt Phục Du Ký",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Việt Phục Du Ký",
    title: "Việt Phục Du Ký – Hiểu để mặc đúng, sáng tạo để mặc theo cách của mình",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Việt Phục Du Ký",
    description: DESCRIPTION,
  },
};

// the colour of the browser bar on phones, and the page under the iPhone's home bar (safe-area insets)
export const viewport: Viewport = { themeColor: "#3b2615", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${hand.variable} h-full antialiased`}>
      <body className="min-h-full">
        <nav className="site-nav absolute right-4 top-3 z-30 flex gap-4 text-sm sm:fixed">
          {/* a full load on purpose: pressed while Bà's book is open, it puts the book back on the table (#65) */}
          <a href={asset("/")}>Sổ của Bà</a>
          <Link href="/du-ky">Du Ký của con</Link>
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
