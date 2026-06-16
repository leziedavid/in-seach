import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Active les vérifications React supplémentaires en développement.
   * Recommandé par Next.js.
   */
  reactStrictMode: true,

  /**
   * Compression Gzip/Brotli des réponses HTTP.
   */
  compress: true,

  /**
   * Configuration des images.
   */
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

    /**
     * Conserver l'optimisation native Next.js :
     * - WebP automatique
     * - AVIF automatique
     * - Responsive Images
     * - Lazy Loading
     * - Redimensionnement
     */
    unoptimized: false,
  },

  /**
   * Optimisations du compilateur.
   */
  compiler: {
    /**
     * Supprime les console.log en production
     * tout en conservant les erreurs et warnings.
     */
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
          exclude: ["error", "warn"],
        }
        : false,
  },

  /**
   * Autorise les accès réseau locaux pendant le développement.
   */
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://localhost:4000",
    "http://192.168.1.111:3000",
  ],

  /**
   * Optimisation du chargement de certaines librairies.
   * Vérifier la compatibilité selon les packages utilisés.
   */
  // experimental: {
  //   optimizePackageImports: [
  //     "@iconify/react",
  //     "lucide-react",
  //     "@tanstack/react-query",
  //   ],
  // },
};

export default nextConfig;