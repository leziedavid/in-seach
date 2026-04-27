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
  title: "Djamko - L'écosystème tout-en-un pour vos services, vos biens et vos échanges globaux",
  description: "Simplifiez votre quotidien avec Djamko : services à la demande, marketplace sécurisée et solutions logistiques internationales.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/favicon.png" },
    ],
  },
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="fr" suppressHydrationWarning>


      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b07b5e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Djamko" />
      </head>
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

