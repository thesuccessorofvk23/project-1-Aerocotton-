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
 * It arms once per tab session: the first full load of the homepage raises
 * the curtain and drops a `sessionStorage` flag, so every reload or refresh
 * in that tab lands straight on the hero with no replay. `?intro` replays the
 * opening for review, `?intro=0` always skips it, and a client-side
 * navigation back to `/` never re-runs this script anyway.
 *
 * Three class hand-offs drive it, on two timers that cannot be blocked by a
 * dropped frame: `intro-locked` is released the moment the doors start to
 * move (50 ms of slack before the 2.15 s slide) while `intro-armed` keeps the
 * curtain on screen for the whole slide, and `intro-done` retires it once the
 * doors have finished. Visitors who have asked for no motion get a still
 * splash instead (`intro-static`), held briefly and retired by the same kind
 * of timer.
 *
 * Nothing here can hold the page hostage — a visitor without JavaScript, or
 * arriving on any other route, simply never gets the classes and never sees
 * the overlay. The timers hang off `window.__aeroIntro` so the component can
 * cancel them when it has to drive the same beats itself on a host whose
 * animation clock never ticks.
 */
const introArmer = `(function () {
  var root = document.documentElement;
  var path = window.location.pathname.replace(/index\\.html?$/i, "");
  if (path !== "/" && path !== "") return;
  var replay = /[?&]intro(=|&|$)/.test(window.location.search);
  if (/[?&]intro=(0|off|false)(&|$)/.test(window.location.search)) return;
  try {
    if (!replay && window.sessionStorage.getItem("aero-cotton-intro-seen")) return;
  } catch (error) {}

  var reduced = false;
  try {
    reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (error) {}

  var start = window.performance && window.performance.now ? window.performance.now() : Date.now();
  // The animated opening, or a still splash held for the reduced-motion case.
  var release = reduced ? 900 : 2200;
  var hold = reduced ? 900 : 3100;

  var intro = {
    start: start,
    reduced: reduced,
    retired: false,
    releaseTimer: 0,
    retireTimer: 0,
    retire: function () {
      if (intro.retired) return;
      intro.retired = true;
      root.classList.remove("intro-armed", "intro-locked");
      root.classList.add("intro-done");
    },
    /** The component is driving the beats now and owns the ending; the scroll
     *  lock is released on the original schedule either way. */
    handOff: function () {
      window.clearTimeout(intro.retireTimer);
      intro.retireTimer = 0;
    },
  };
  window.__aeroIntro = intro;

  root.classList.add("intro-armed", "intro-locked");
  if (reduced) root.classList.add("intro-static");
  root.dataset.introStart = String(start);
  try {
    window.sessionStorage.setItem("aero-cotton-intro-seen", "1");
  } catch (error) {}

  intro.releaseTimer = window.setTimeout(function () { root.classList.remove("intro-locked"); }, release);
  intro.retireTimer = window.setTimeout(intro.retire, hold);
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
