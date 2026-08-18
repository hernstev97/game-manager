import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const sans = Google_Sans_Flex({
  subsets: ["latin", "latin-ext"],
  axes: ["ROND", "opsz", "wdth", "GRAD"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bibliothek",
  description: "Persönliche Spielfbibliothek — Filter, Bewertung, Priorität.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${sans.variable} ${sans.className} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
