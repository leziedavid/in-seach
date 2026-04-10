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
  title: "In Search - Trouvez un professionnel près de chez vous",
  description: "Trouvez un professionnel près de chez vous en quelques clics.",
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="fr" suppressHydrationWarning>


      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b07b5e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="In Search" />
      </head>
      {/* <body className={inter.className}> */}
      <body className={`${jost.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange >
          <NotificationProvider>

            <QueryProvider>
              <SocketProvider>
                <CartProvider>
                  <BackgroundDecoration />
                  <ClientLayout>
                    {children}
                  </ClientLayout>
                </CartProvider>
              </SocketProvider>
            </QueryProvider>

          </NotificationProvider>
        </ThemeProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
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

