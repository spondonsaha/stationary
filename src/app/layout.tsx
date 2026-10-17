import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { shopConfig } from "@/lib/config";

// One sans-serif for the whole site; a classic serif reserved for the hero.
const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(shopConfig.baseUrl),
  title: {
    default: `${shopConfig.name} — ${shopConfig.university}`,
    template: `%s · ${shopConfig.name}`,
  },
  description: `Official ${shopConfig.university} bookstore. Textbooks, stationery, lab and drawing supplies, and office essentials with instant invoicing.`,
  openGraph: { type: "website", siteName: `${shopConfig.university} ${shopConfig.name}` },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
