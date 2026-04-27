import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import ClientLayout from "@/components/layout/ClientLayout";
import { Jost } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/toast/NotificationProvider";
import { WebPushManager } from "@/components/toast/webPush";
import { Plus_Jakarta_Sans } from "next/font/google";
import InstallPWA from "@/components/pwa/InstallPWA";
import BackgroundDecoration from "@/components/layout/BackgroundDecoration";

const inter = Inter({ subsets: ["latin"] });

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
})

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
    title: "Djamko - Services, Biens et Logistique Globale",
    description: "L'écosystème tout-en-un pour simplifier vos échanges globaux.",
    url: "/",
    siteName: "Djamko",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Djamko - Plateforme de Services et Logistique",
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
      { url: "/favicon.png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Djamko",
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
      <body className={`${jost.variable} font-sans antialiased`}>
        <BackgroundDecoration />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange >
          <NotificationProvider>
            <WebPushManager />

            <QueryProvider>
              <SocketProvider>
                <CartProvider>

                  <ClientLayout>
                    {children}
                  </ClientLayout>
                </CartProvider>
              </SocketProvider>
            </QueryProvider>

          </NotificationProvider>
        </ThemeProvider>

        {/* PWA & Firebase Messaging Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function(registration) {
                    console.log('Firebase ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('Firebase ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

