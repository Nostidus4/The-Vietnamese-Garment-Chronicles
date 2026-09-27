import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // 88 is used for the full-screen opening artwork
    qualities: [75, 88],
  },
};

export default nextConfig;
