"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

/**
 * Global smooth scrolling (Lenis) wired into GSAP ScrollTrigger, so every
 * scroll-linked animation (section reveals, word reveals, parallax) stays
 * perfectly in sync with the eased scroll position.
 *
 * Skipped entirely under `prefers-reduced-motion`: the page then scrolls
 * natively and reveal animations never engage. Also adds the `.js` class
 * that gates hidden reveal states in CSS, so no-JS users see everything.
 */
export function SmoothScroll() {
  useEffect(() => {
    document.documentElement.classList.add("js");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Anchor links should glide via Lenis too.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      const hash = anchor?.getAttribute("href");
      if (!anchor || !hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
      document.documentElement.classList.remove("js");
    };
  }, []);

  return null;
}
