import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },

  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.1.111:3000",
  ],

  reactStrictMode: true,
};

export default nextConfig;