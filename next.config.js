/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {

  allowedDevOrigins: ["192.168.4.35"],

  // Required by Dockerfile - it copies .next/standalone, which only exists
  // with this output mode. Must stay OFF on Vercel: Vercel packages its own
  // serverless output and this mode makes its build step look for a
  // next-server.js.nft.json that standalone output doesn't produce the same
  // way, failing with ENOENT right after "Finalizing page optimization".
  // Vercel sets process.env.VERCEL during its builds, so this only applies
  // for the Docker build.
  output: process.env.VERCEL ? undefined : "standalone",

  // ─── Stabilité & DX ───────────────────────────────────────────────
  reactStrictMode: true,


  // ─── TypeScript — les erreurs TS bloquent toujours le build ──────────
  typescript: {
    ignoreBuildErrors: false,
  },


  // ─── Headers de sécurité ──────────────────────────────────────────
  async headers() {
    const csp = [
      "default-src 'self'",

      // Scripts — unsafe-eval + unsafe-inline actifs partout (Next.js + Firebase SW)
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' cdnjs.cloudflare.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com",

      // Styles (unsafe-inline requis par Tailwind/CSS-in-JS)
      "style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com",

      // Images
      [
        "img-src 'self' data: blob:",
        "https://api.djamko.com",
        "https://static.vagueapp.com",
        "https://images.unsplash.com",
        "https://cdnjs.cloudflare.com",
        "https://i.pravatar.cc",
        "https://img.youtube.com",
        "https://i.ytimg.com",         // thumbnails YouTube dans iframes
        "https://w0.peakpx.com",
        "https://tile.openstreetmap.org",
        "https://server.arcgisonline.com",  // tuiles satellite Esri
        "https://www.gstatic.com",     // Firebase / Google icons
      ].join(" "),

      // Fonts — next/font/google sert les fonts depuis /_next/static/ (pas besoin de googleapis)
      "font-src 'self' data:",

      // Connexions réseau
      [
        "connect-src 'self'",
        "https://api.djamko.com",
        "wss://api.djamko.com",                          // Socket.IO WebSocket
        "https://nominatim.openstreetmap.org",            // reverse geocoding
        "https://tile.openstreetmap.org",                 // tuiles Leaflet
        "https://fcm.googleapis.com",                     // Firebase Cloud Messaging (legacy send)
        "https://fcmregistrations.googleapis.com",        // FCM Web Push : endpoint réel de getToken()/abonnement
        "https://firebaseinstallations.googleapis.com",   // Firebase Installations
        "https://firebase.googleapis.com",                // Firebase Remote Config (Analytics)
        "https://www.google-analytics.com",               // Firebase Analytics / GA4
        "https://www.googletagmanager.com",               // Google Tag Manager (config fetch)
        "https://analytics.google.com",                   // Firebase Analytics
        "https://region1.google-analytics.com",           // Firebase Analytics (région)
        "https://overpass-api.de",                        // Overpass POIs temps réel
        "https://api.iconify.design",                     // Iconify icons fetch
        "https://api.simplesvg.com",                      // Iconify fallback CDN
        "https://api.unisvg.com",                         // Iconify fallback CDN
        "ws://localhost:* http://localhost:*",  // dev HMR + prod docker/local
      ].join(" "),

      // Médias — audio messages + mixkit
      "media-src 'self' https://assets.mixkit.co https://api.djamko.com",

      // Iframes : Facebook video embeds + YouTube + TikTok + Firebase Auth popup
      [
        "frame-src 'self'",
        "https://www.facebook.com",
        "https://www.youtube.com",       // vidéos LivePlayer + VideoModal
        "https://www.tiktok.com",        // lives TikTok
        "https://djamko.firebaseapp.com", // Firebase Auth popup
      ].join(" "),

      // Workers — Service Worker Firebase messaging
      "worker-src 'self' blob:",

      // Bloque l'intégration dans un iframe tiers
      "frame-ancestors 'none'",

      // upgrade-insecure-requests retiré — bloque les ressources HTTP légitimes en dev/prod mixte
    ].filter(Boolean).join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restreint caméra/micro/géoloc à ton origine uniquement
          { key: "Permissions-Policy", value: "camera=*, microphone=*, geolocation=*" },
        ],
      },
      {
        // Le service worker Firebase ne doit jamais être servi depuis un cache HTTP
        // intermédiaire (navigateur/CDN) : sinon une mise à jour du SW peut ne jamais être
        // récupérée par certains navigateurs, cassant silencieusement la réception en
        // arrière-plan / application fermée.
        source: "/firebase-messaging-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        // Digital Asset Links (Android App Links / TWA) — doit être servi en JSON
        // et rester accessible sans redirection pour que le vérificateur Android le lise.
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        // Apple App Site Association (Universal Links) — fichier sans extension,
        // doit être servi en JSON pour être validé par le CDN d'Apple.
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },

  // ─── Images ───────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.djamko.com" },
      { protocol: "https", hostname: "static.vagueapp.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "w0.peakpx.com" },
      { protocol: "https", hostname: "tile.openstreetmap.org" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "maps.gstatic.com" },
      { protocol: "https", hostname: "server.arcgisonline.com" },
      // localhost uniquement en développement avec port
      ...(isDev ? [{ protocol: "http", hostname: "localhost" }] : []),
      ...(isDev ? [{ protocol: "http", hostname: "localhost:4000" }] : []),
    ],
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 604800, // 7 jours
  },

  // ─── Compilateur ──────────────────────────────────────────────────
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },



  // ─── Bundle & optimisations ───────────────────────────────────────
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "lodash",
    ],
  },

};

module.exports = nextConfig;