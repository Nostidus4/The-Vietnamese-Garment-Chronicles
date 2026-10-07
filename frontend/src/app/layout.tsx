import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Patrick_Hand } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import { StampToast } from "@/components/StampToast";
import { ServerWake } from "@/components/ServerWake";
import "./globals.css";

// two typefaces only: Be Vietnam Pro for everything printed, Patrick Hand for what Bà, Tí and Tèo write by hand.
// Be Vietnam Pro is not preloaded: preloading fetched all 8 files (3 weights × 2 subsets + 2) before the logo could show, and most pages
// use only a few of them ("preloaded but not used" warnings, #64); text shows in the fallback font until they arrive.
// Patrick Hand is (two small files): without it the handwritten lines showed in a plain sans for a second or more on
// some screens, and the tagline looked different from one window size to the next.
const body = Be_Vietnam_Pro({ variable: "--font-body", subsets: ["vietnamese", "latin"], weight: ["400", "600", "700"], preload: false });
const hand = Patrick_Hand({ variable: "--font-hand", subsets: ["vietnamese", "latin"], weight: "400" });

const DESCRIPTION =
  "Cuốn sổ của Bà đưa con đi qua trang phục truyền thống từng vùng: đọc nhật ký, phối áo để Tèo chấm, thử với ảnh của mình và ghi Du Ký những lần mặc.";

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

// Runs while the HTML is parsed, before the first paint: a returning visitor goes straight to the desk (Home), so the
// home page's static shell stays dark for them instead of showing the logo of an opening that will not play (#110).
// A link to a page of the book (?region=…) skips the opening too, on any visit (Home's initialState, #111).
const SEEN_SCRIPT = `try{var q=new URLSearchParams(location.search);if((q.has("region")||localStorage.getItem("vpdk-opening-seen")==="1")&&q.get("opening")!=="1")document.documentElement.dataset.seen="1"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${hand.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SEEN_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <SiteNav />
        <div className="h-10" />
        {children}
        <ServerWake />
        <StampToast />
      </body>
    </html>
  );
}
