import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex } from "next/font/google";
import Script from "next/script";
import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { MOTION_BOOT_SCRIPT } from "@/lib/motion";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const sans = Google_Sans_Flex({
  subsets: ["latin", "latin-ext"],
  axes: ["ROND", "opsz", "wdth", "GRAD"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "gGrid",
  description: "gGrid — Game. Manage. Learn.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#151217" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${sans.variable} ${sans.className} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <Script id="motion-boot" strategy="beforeInteractive">
          {MOTION_BOOT_SCRIPT}
        </Script>
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
        <MotionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
