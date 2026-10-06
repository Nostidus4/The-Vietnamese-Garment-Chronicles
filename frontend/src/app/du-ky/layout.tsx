import type { Metadata } from "next";

// the page itself is browser-only ("use client"), so its title lives here (#54)
export const metadata: Metadata = {
  // a template again: a plain string here would drop the app's name from the pages under it (/du-ky/p)
  title: { default: "Du Ký của con", template: "%s · Việt Phục Du Ký" },
  description: "Cuốn sổ của riêng bạn: những lần mặc Việt phục, ảnh thật, tem từng vùng và hộp thư của Bà.",
};

export default function DuKyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
