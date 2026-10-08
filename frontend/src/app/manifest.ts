import type { MetadataRoute } from "next";
import { asset } from "@/lib/base";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Việt Phục Du Ký",
    short_name: "Việt Phục",
    description: "Hiểu để mặc đúng, sáng tạo để mặc theo cách của mình.",
    start_url: asset("/"),
    scope: asset("/"),
    display: "standalone",
    background_color: "#f0e6d2",
    theme_color: "#2f4a6d",
    icons: [{ src: asset("/icon.png"), sizes: "any", type: "image/png" }],
  };
}
