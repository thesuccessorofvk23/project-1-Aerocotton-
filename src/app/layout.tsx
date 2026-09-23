import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fraunces, poppins } from "./fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://aerocotton.in"
  ),
  title: {
    default: "Aero Cotton — Premium Cotton Home Textiles from Karur, India",
    template: "%s — Aero Cotton",
  },
  description:
    "Established in 2010, Aerocotton is a family-run manufacturer and exporter of premium home textile products based in Karur, Tamil Nadu, India.",
  openGraph: {
    type: "website",
    siteName: "Aero Cotton",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f0e8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = organizationJsonLd();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${poppins.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
