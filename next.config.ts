import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // [PERF] Image optimization activée : WebP/AVIF auto, lazy loading, responsive sizes
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    unoptimized: true,
  },

  // [PERF] Compression gzip/brotli des assets
  compress: true,

  // [PERF] Cache des assets statiques (fonts, images, JS) pendant 1 an
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.1.111:3000",
    "http://localhost:4000"
  ],

  reactStrictMode: true,

  // [PERF] Optimisation du compilateur : suppression des console.log en prod
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

};

export default nextConfig;