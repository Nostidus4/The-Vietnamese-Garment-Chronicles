import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Một trang Du Ký",
  description: "Một lần mặc Việt phục được chia sẻ từ Việt Phục Du Ký, cuốn sổ đưa bạn đi qua trang phục truyền thống các vùng.",
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
