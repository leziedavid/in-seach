import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import ComingSoon from "@/components/home/ComingSoon";
import { Jost } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/toast/NotificationProvider";
import { Plus_Jakarta_Sans } from "next/font/google";

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
  title: "ServiceMarket - Dépannage Géolocalisé",
  description: "Trouvez un expert près de chez vous en quelques clics.",
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      {/* <body className={inter.className}> */}
      <body className={`${jost.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange >
          <NotificationProvider>

            <QueryProvider>
              <SocketProvider>
                <ComingSoon>
                  <div className="min-h-screen premium-bg overflow-x-hidden">
                    {children}
                  </div>
                </ComingSoon>
              </SocketProvider>
            </QueryProvider>

          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

