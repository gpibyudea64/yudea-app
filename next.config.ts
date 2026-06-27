import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize image handling
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // Improve build performance via package import optimization
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
    ],
  },

  // Compress responses
  compress: true,
};

export default nextConfig;
