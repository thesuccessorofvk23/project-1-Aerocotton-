import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fraunces, poppins } from "./fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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

/**
 * Arms the homepage opening curtain before first paint, so the doors are
 * already closed when the hero would otherwise flash (see
 * `CinematicLoadingScreen` and the `.cinematic-intro` block in globals.css).
 *
 * Three class hand-offs drive it, on two timers that cannot be blocked by a
 * dropped frame: `intro-locked` is released the moment the doors start to
 * move (20 ms of slack before the 2.15 s slide) while `intro-armed` keeps the
 * curtain on screen for the whole slide, and `intro-done` retires it once the
 * doors have finished. Nothing here can hold the page hostage — a visitor
 * without JavaScript, with reduced motion, or arriving on any other route
 * simply never gets the classes and never sees the overlay.
 */
const introArmer = `(function () {
  var root = document.documentElement;
  var key = "aero-cotton-intro-seen";
  var motionOK = !window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var path = window.location.pathname.replace(/index\\.html?$/i, "");
  var home = path === "/" || path === "";
  var forced = /[?&]intro(=|&|$)/.test(window.location.search);  // ?intro replays it for review
  if (!home || !motionOK) return;
  try {
    if (!forced && window.sessionStorage.getItem(key) === "1") return;
    window.sessionStorage.setItem(key, "1");
  } catch (error) {}
  root.classList.add("intro-armed", "intro-locked");
  root.dataset.introStart = String(window.performance ? performance.now() : Date.now());
  window.setTimeout(function () { root.classList.remove("intro-locked"); }, 2200);
  window.setTimeout(function () {
    root.classList.remove("intro-armed");
    root.classList.add("intro-done");
  }, 3100);
})();`;

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
        <script dangerouslySetInnerHTML={{ __html: introArmer }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
