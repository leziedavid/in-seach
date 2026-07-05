import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import ClientLayout from "@/components/layout/ClientLayout";
import { Jost, Montserrat, Plus_Jakarta_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { WebPushManager } from "@/components/notifications/webPush";
import { I18nProvider } from "@/utils/langue/provider";
import VideoModal from "@/components/modals/VideoModal";

// [PERF] Police principale uniquement, display:swap pour éviter le FOIT
const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
  preload: true,
})

// [PERF] Montserrat : weights réduits à l'essentiel, display:swap
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
  preload: false,
})

// Police principale — Plus Jakarta Sans (proche de Circular/Satoshi, déjà chargée)
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Djamko - L'écosystème tout-en-un pour vos services",
    template: "%s | Djamko"
  },
  description: "Simplifiez votre quotidien avec Djamko : services à la demande, marketplace sécurisée et solutions logistiques internationales.",
  keywords: ["logistique", "marketplace", "services", "Djamko", "Afrique", "livraison", "commerce en ligne"],
  authors: [{ name: "Djamko Team" }],
  creator: "Djamko",
  publisher: "Djamko",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.djamko.com"), // À remplacer par l'URL de production en déploiement
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Djamko - L'écosystème tout-en-un",
    description: "Pour simplifier vos échanges globaux.",
    url: "/",
    siteName: "Djamko",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Djamko - Plateforme de mise en relation ",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Djamko - L'écosystème tout-en-un",
    description: "Simplifiez votre quotidien avec nos solutions de services et logistique.",
    images: ["/og-image.png"],
    creator: "@djamko",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/pwa/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icons/pwa/apple-touch-icon-167.png", sizes: "167x167" },
      { url: "/icons/pwa/apple-touch-icon-152.png", sizes: "152x152" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Djamko",
    startupImage: [
      // iPhone SE (1st gen) — 640×1136
      { url: "/icons/pwa/splash-iphone-se.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPhone 6/7/8 — 750×1334
      { url: "/icons/pwa/splash-iphone-8.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPhone 6+/7+/8+ — 1242×2208
      { url: "/icons/pwa/splash-iphone-8plus.png", media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone X/XS/11 Pro — 1125×2436
      { url: "/icons/pwa/splash-iphone-x.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone XS Max/11 Pro Max — 1242×2688
      { url: "/icons/pwa/splash-iphone-xsmax.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone XR/11 — 828×1792
      { url: "/icons/pwa/splash-iphone-xr.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPhone 12/13/14 — 1170×2532
      { url: "/icons/pwa/splash-iphone-12.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone 12/13/14 Pro Max — 1284×2778
      { url: "/icons/pwa/splash-iphone-12max.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone 14/15 Pro — 1179×2556
      { url: "/icons/pwa/splash-iphone-14pro.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone 14/15 Pro Max — 1290×2796
      { url: "/icons/pwa/splash-iphone-14promax.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPad (2x) — 1536×2048
      { url: "/icons/pwa/splash-ipad.png", media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPad Pro 11" — 1668×2388
      { url: "/icons/pwa/splash-ipad-pro-11.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPad Pro 12.9" — 2048×2732
      { url: "/icons/pwa/splash-ipad-pro-129.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
    ],
  },
};

export const viewport = {
  themeColor: "#b07b5e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      {/* <body className={inter.className}> */}
      <body className={`${jost.variable} ${montserrat.variable} ${plusJakartaSans.variable} antialiased`} style={{ fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif' }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange >
          <I18nProvider>
            <NotificationProvider>
              <WebPushManager />

              <QueryProvider>
                <SocketProvider>
                  <CartProvider>

                    <ClientLayout>
                      {children}
                      {/* <VideoModal /> */}
                    </ClientLayout>
                  </CartProvider>
                </SocketProvider>
              </QueryProvider>

            </NotificationProvider>
          </I18nProvider>
        </ThemeProvider>

        {/* PWA & Firebase Messaging Service Worker Registration.
            Ne pas attendre l'évènement 'load' : avec Next.js (Script strategy="afterInteractive"),
            ce script s'exécute après l'hydratation — 'load' a donc déjà été déclenché la plupart
            du temps, et le listener ci-dessous ne se déclenchait jamais (SW jamais enregistré,
            navigator.serviceWorker.ready restait en attente indéfiniment). On enregistre
            immédiatement, avec 'load' seulement en repli si le document n'est pas encore prêt. */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            function registerFirebaseSW() {
              navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function(registration) {
                console.log('Firebase ServiceWorker registration successful with scope: ', registration.scope);
              }, function(err) {
                console.log('Firebase ServiceWorker registration failed: ', err);
              });
            }
            if (document.readyState === 'complete') {
              registerFirebaseSW();
            } else {
              window.addEventListener('load', registerFirebaseSW);
            }
          }
        `}</Script>
      </body>
    </html>
  );
}

