import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";

const fraunces = localFont({
  src: "./fonts/fraunces-var.woff2",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
  fallback: ["Georgia", "Times New Roman", "serif"],
  preload: true,
});

const inter = localFont({
  src: "./fonts/inter-var.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
  preload: true,
});

const jetbrains = localFont({
  src: "./fonts/jetbrains-mono-var.woff2",
  variable: "--font-jetbrains",
  display: "swap",
  weight: "100 800",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.siteUrl),
  title: {
    default: "CulturalDNA Matchmaker — cultural due diligence for brand deals",
    template: "%s · CulturalDNA Matchmaker",
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: "CulturalDNA Matchmaker" }],
  keywords: [
    "Qloo",
    "brand partnerships",
    "cultural intelligence",
    "taste graph",
    "agentic AI",
    "audience overlap",
    "cultural fit",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: "Two brands. One culture map.",
    description: SITE.description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "CulturalDNA Matchmaker — two brands, one culture map. A worked case shows Patagonia × Whole Foods Market at 79/100.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Two brands. One culture map.",
    description: SITE.description,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f1ece0",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-ink focus:bg-lime focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
