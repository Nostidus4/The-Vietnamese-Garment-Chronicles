import type { NextConfig } from "next";

// GITHUB_PAGES=1 builds a static site into out/ (no Node server): images are served as they are and the site
// lives under NEXT_PUBLIC_BASE_PATH (e.g. /The-Vietnamese-Garment-Chronicles). Otherwise: the standalone server
// used by Docker and Render.
const pages = process.env.GITHUB_PAGES === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: pages ? "export" : "standalone",
  basePath: pages ? basePath : undefined,
  trailingSlash: pages,
  images: {
    unoptimized: pages,
    // 88 is used for the full-screen opening artwork
    qualities: [75, 88],
  },
};

export default nextConfig;
